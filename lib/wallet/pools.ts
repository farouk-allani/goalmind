// GoalMind — Group Tipping Pools
// Fans pool tips together for matches. Smart splits, transparent distribution.
// Uses WDK for wallet operations.

import * as SecureStore from 'expo-secure-store';

// ---- Types ----

export interface TipPool {
  id: string;
  matchId: string;
  name: string; // e.g., "Argentina Fan Pool"
  creatorId: string;
  description: string;
  targetTeam: 'home' | 'away' | 'general';
  totalPooled: string;
  contributors: PoolContributor[];
  distribution: DistributionRule;
  status: 'active' | 'distributing' | 'completed' | 'cancelled';
  createdAt: number;
  deadline: number;
  minContribution: string;
  maxContribution: string;
}

export interface PoolContributor {
  userId: string;
  address: string;
  amount: string;
  joinedAt: number;
  share: number; // Percentage of pool (0-100)
}

export type DistributionRule =
  | { type: 'equal'; description: string }                    // Equal split among all
  | { type: 'proportional'; description: string }             // Proportional to contribution
  | { type: 'winner_take_all'; description: string }          // Random winner gets all
  | { type: 'top_three'; splits: [number, number, number]; description: string }; // 50/30/20

export interface PoolResult {
  success: boolean;
  poolId?: string;
  error?: string;
}

// ---- Constants ----

const POOLS_KEY = 'goalmind_tip_pools';

const DEFAULT_DISTRIBUTION: DistributionRule = {
  type: 'proportional',
  description: 'Distributed proportionally to contribution amount',
};

// ---- Pool Operations ----

/**
 * Create a new tipping pool.
 */
export async function createTipPool(
  matchId: string,
  name: string,
  creatorId: string,
  creatorAddress: string,
  options: {
    description?: string;
    targetTeam?: 'home' | 'away' | 'general';
    distribution?: DistributionRule;
    durationHours?: number;
    minContribution?: string;
    maxContribution?: string;
    initialContribution?: string;
  } = {}
): Promise<PoolResult> {
  const {
    description = `Fan pool for match ${matchId}`,
    targetTeam = 'general',
    distribution = DEFAULT_DISTRIBUTION,
    durationHours = 24,
    minContribution = '1.00',
    maxContribution = '100.00',
    initialContribution,
  } = options;

  const poolId = `pool_${matchId}_${Date.now()}`;
  const now = Date.now();

  const contributors: PoolContributor[] = [];

  // Creator's initial contribution
  if (initialContribution && parseFloat(initialContribution) > 0) {
    contributors.push({
      userId: creatorId,
      address: creatorAddress,
      amount: initialContribution,
      joinedAt: now,
      share: 100, // Will be recalculated
    });
  }

  const totalPooled = contributors.reduce((sum, c) => sum + parseFloat(c.amount), 0);

  // Recalculate shares
  for (const contributor of contributors) {
    contributor.share = totalPooled > 0
      ? (parseFloat(contributor.amount) / totalPooled) * 100
      : 0;
  }

  const pool: TipPool = {
    id: poolId,
    matchId,
    name,
    creatorId,
    description,
    targetTeam,
    totalPooled: totalPooled.toFixed(2),
    contributors,
    distribution,
    status: 'active',
    createdAt: now,
    deadline: now + durationHours * 60 * 60 * 1000,
    minContribution,
    maxContribution,
  };

  await savePool(pool);

  return { success: true, poolId };
}

/**
 * Contribute to a tipping pool.
 */
export async function contributeToPool(
  poolId: string,
  userId: string,
  address: string,
  amount: string
): Promise<PoolResult> {
  const pool = await getPool(poolId);
  if (!pool) {
    return { success: false, error: 'Pool not found' };
  }

  if (pool.status !== 'active') {
    return { success: false, error: 'Pool is not active' };
  }

  if (Date.now() > pool.deadline) {
    return { success: false, error: 'Pool deadline has passed' };
  }

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return { success: false, error: 'Invalid amount' };
  }

  if (numAmount < parseFloat(pool.minContribution)) {
    return { success: false, error: `Minimum contribution is ${pool.minContribution} USDt` };
  }

  if (numAmount > parseFloat(pool.maxContribution)) {
    return { success: false, error: `Maximum contribution is ${pool.maxContribution} USDt` };
  }

  // Check if user already contributed
  const existingIndex = pool.contributors.findIndex(c => c.userId === userId);
  if (existingIndex >= 0) {
    // Add to existing contribution
    const existing = pool.contributors[existingIndex];
    existing.amount = (parseFloat(existing.amount) + numAmount).toFixed(2);
  } else {
    // New contributor
    pool.contributors.push({
      userId,
      address,
      amount: amount,
      joinedAt: Date.now(),
      share: 0, // Will be recalculated
    });
  }

  // Recalculate total and shares
  pool.totalPooled = pool.contributors
    .reduce((sum, c) => sum + parseFloat(c.amount), 0)
    .toFixed(2);

  for (const contributor of pool.contributors) {
    contributor.share = (parseFloat(contributor.amount) / parseFloat(pool.totalPooled)) * 100;
  }

  await savePool(pool);

  return { success: true, poolId };
}

/**
 * Distribute pool funds based on the distribution rule.
 */
export async function distributePool(
  poolId: string
): Promise<{ success: boolean; distributions: Array<{ userId: string; amount: string }>; error?: string }> {
  const pool = await getPool(poolId);
  if (!pool) {
    return { success: false, distributions: [], error: 'Pool not found' };
  }

  if (pool.status !== 'active') {
    return { success: false, distributions: [], error: 'Pool is not active' };
  }

  const total = parseFloat(pool.totalPooled);
  if (total <= 0) {
    return { success: false, distributions: [], error: 'Pool is empty' };
  }

  pool.status = 'distributing';
  await savePool(pool);

  const distributions: Array<{ userId: string; amount: string }> = [];

  switch (pool.distribution.type) {
    case 'proportional': {
      for (const contributor of pool.contributors) {
        const payout = total * (contributor.share / 100);
        distributions.push({
          userId: contributor.userId,
          amount: payout.toFixed(2),
        });
      }
      break;
    }

    case 'equal': {
      const equalShare = total / pool.contributors.length;
      for (const contributor of pool.contributors) {
        distributions.push({
          userId: contributor.userId,
          amount: equalShare.toFixed(2),
        });
      }
      break;
    }

    case 'winner_take_all': {
      // Random winner weighted by contribution
      const random = Math.random() * total;
      let cumulative = 0;
      for (const contributor of pool.contributors) {
        cumulative += parseFloat(contributor.amount);
        if (random <= cumulative) {
          distributions.push({
            userId: contributor.userId,
            amount: total.toFixed(2),
          });
          break;
        }
      }
      break;
    }

    case 'top_three': {
      const sorted = [...pool.contributors].sort(
        (a, b) => parseFloat(b.amount) - parseFloat(a.amount)
      );
      const [first, second, third] = pool.distribution.splits;

      if (sorted[0]) {
        distributions.push({ userId: sorted[0].userId, amount: (total * first).toFixed(2) });
      }
      if (sorted[1]) {
        distributions.push({ userId: sorted[1].userId, amount: (total * second).toFixed(2) });
      }
      if (sorted[2]) {
        distributions.push({ userId: sorted[2].userId, amount: (total * third).toFixed(2) });
      }
      break;
    }
  }

  pool.status = 'completed';
  await savePool(pool);

  return { success: true, distributions };
}

// ---- Query Functions ----

export async function getPool(poolId: string): Promise<TipPool | null> {
  const pools = await loadPools();
  return pools.find(p => p.id === poolId) || null;
}

export async function getMatchPools(matchId: string): Promise<TipPool[]> {
  const pools = await loadPools();
  return pools.filter(p => p.matchId === matchId);
}

export async function getUserPools(userId: string): Promise<TipPool[]> {
  const pools = await loadPools();
  return pools.filter(p => p.contributors.some(c => c.userId === userId));
}

export async function getActivePools(): Promise<TipPool[]> {
  const pools = await loadPools();
  return pools.filter(p => p.status === 'active' && Date.now() < p.deadline);
}

// ---- Pool Analytics ----

export interface PoolAnalytics {
  totalPools: number;
  totalPooled: string;
  averagePoolSize: string;
  largestPool: string;
  mostPopularMatch: string;
}

export async function getPoolAnalytics(): Promise<PoolAnalytics> {
  const pools = await loadPools();

  if (pools.length === 0) {
    return {
      totalPools: 0,
      totalPooled: '0.00',
      averagePoolSize: '0.00',
      largestPool: '0.00',
      mostPopularMatch: 'N/A',
    };
  }

  const totalPooled = pools.reduce((sum, p) => sum + parseFloat(p.totalPooled), 0);
  const largest = Math.max(...pools.map(p => parseFloat(p.totalPooled)));

  // Find most popular match
  const matchCounts = new Map<string, number>();
  for (const pool of pools) {
    matchCounts.set(pool.matchId, (matchCounts.get(pool.matchId) || 0) + 1);
  }
  const mostPopular = [...matchCounts.entries()].reduce(
    (a, b) => a[1] > b[1] ? a : b,
    ['N/A', 0]
  );

  return {
    totalPools: pools.length,
    totalPooled: totalPooled.toFixed(2),
    averagePoolSize: (totalPooled / pools.length).toFixed(2),
    largestPool: largest.toFixed(2),
    mostPopularMatch: mostPopular[0],
  };
}

// ---- Persistence ----

async function savePool(pool: TipPool): Promise<void> {
  const pools = await loadPools();
  const index = pools.findIndex(p => p.id === pool.id);
  if (index >= 0) {
    pools[index] = pool;
  } else {
    pools.unshift(pool);
  }
  try {
    await SecureStore.setItemAsync(POOLS_KEY, JSON.stringify(pools.slice(0, 50)));
  } catch {
    // SecureStore quota
  }
}

async function loadPools(): Promise<TipPool[]> {
  try {
    const raw = await SecureStore.getItemAsync(POOLS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
