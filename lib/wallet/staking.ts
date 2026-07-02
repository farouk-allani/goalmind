// GoalMind — Prediction Staking System
// Fans stake USDt on match predictions. Escrow-based, settled on-chain.
// Uses WDK for wallet operations and smart contract interactions.

import * as SecureStore from 'expo-secure-store';
import { type ChainId, CHAINS } from './wdk';

// ---- Types ----

export interface Stake {
  id: string;
  matchId: string;
  userId: string;
  prediction: 'home' | 'draw' | 'away';
  amount: string; // USDt amount
  odds: number; // Payout multiplier (e.g., 2.5x)
  status: 'active' | 'won' | 'lost' | 'cancelled';
  placedAt: number;
  settledAt?: number;
  payout?: string;
  txHash?: string;
}

export interface PredictionPool {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  totalStaked: string;
  homeStaked: string;
  drawStaked: string;
  awayStaked: string;
  homeOdds: number;
  drawOdds: number;
  awayOdds: number;
  deadline: number; // Unix timestamp
  settled: boolean;
  result?: 'home' | 'draw' | 'away';
}

export interface StakeResult {
  success: boolean;
  stakeId?: string;
  error?: string;
  txHash?: string;
}

// ---- Constants ----

const STAKES_KEY = 'goalmind_stakes';
const POOLS_KEY = 'goalmind_pools';

// ---- Pool Management ----

/**
 * Calculate dynamic odds based on pool distribution.
 * More staked on one outcome = lower odds for that outcome.
 */
function calculateOdds(
  totalStaked: number,
  outcomeStaked: number,
  baseProbability: number
): number {
  if (outcomeStaked === 0) return 1 / baseProbability;

  const impliedProbability = outcomeStaked / Math.max(totalStaked, 1);
  // Blend with base probability (60% pool, 40% model)
  const blended = impliedProbability * 0.6 + baseProbability * 0.4;

  // Odds = 1 / probability, with a small house edge (5%)
  return Math.max(1.1, (1 / blended) * 0.95);
}

/**
 * Create or update a prediction pool for a match.
 */
export function createPool(
  matchId: string,
  homeTeam: string,
  awayTeam: string,
  prediction: { homeWin: number; draw: number; awayWin: number },
  existingPools: Map<string, PredictionPool>
): PredictionPool {
  const existing = existingPools.get(matchId);

  if (existing) {
    // Recalculate odds based on current stakes
    const total = parseFloat(existing.homeStaked) + parseFloat(existing.drawStaked) + parseFloat(existing.awayStaked);
    return {
      ...existing,
      totalStaked: total.toFixed(2),
      homeOdds: calculateOdds(total, parseFloat(existing.homeStaked), prediction.homeWin),
      drawOdds: calculateOdds(total, parseFloat(existing.drawStaked), prediction.draw),
      awayOdds: calculateOdds(total, parseFloat(existing.awayStaked), prediction.awayWin),
    };
  }

  // New pool
  const deadline = Date.now() + 1000 * 60 * 60 * 2; // 2 hours before match
  return {
    matchId,
    homeTeam,
    awayTeam,
    totalStaked: '0.00',
    homeStaked: '0.00',
    drawStaked: '0.00',
    awayStaked: '0.00',
    homeOdds: 1 / prediction.homeWin,
    drawOdds: 1 / prediction.draw,
    awayOdds: 1 / prediction.awayWin,
    deadline,
    settled: false,
  };
}

// ---- Staking Operations ----

/**
 * Place a stake on a prediction.
 */
export async function placeStake(
  userId: string,
  matchId: string,
  prediction: 'home' | 'draw' | 'away',
  amount: string,
  pool: PredictionPool
): Promise<StakeResult> {
  // Validation
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return { success: false, error: 'Invalid amount' };
  }

  if (numAmount < 0.5) {
    return { success: false, error: 'Minimum stake is 0.50 USDt' };
  }

  if (Date.now() > pool.deadline) {
    return { success: false, error: 'Staking deadline has passed' };
  }

  if (pool.settled) {
    return { success: false, error: 'Pool already settled' };
  }

  // Calculate odds at time of stake
  const total = parseFloat(pool.totalStaked);
  const outcomeStaked = parseFloat(
    prediction === 'home' ? pool.homeStaked :
    prediction === 'draw' ? pool.drawStaked :
    pool.awayStaked
  );

  const odds = calculateOdds(total, outcomeStaked,
    prediction === 'home' ? 1 / pool.homeOdds :
    prediction === 'draw' ? 1 / pool.drawOdds :
    1 / pool.awayOdds
  );

  const stakeId = `stake_${matchId}_${Date.now()}`;

  const stake: Stake = {
    id: stakeId,
    matchId,
    userId,
    prediction,
    amount,
    odds,
    status: 'active',
    placedAt: Date.now(),
  };

  // Local-ledger demo: stakes persist on-device. On-chain escrow via WDK
  // (account.transfer to an escrow contract) is the next milestone — no fake
  // tx hashes are produced here; `txHash` stays unset until stakes are real.
  await saveStake(stake);

  return {
    success: true,
    stakeId,
  };
}

/**
 * Settle a pool after match result is known.
 */
export async function settlePool(
  matchId: string,
  result: 'home' | 'draw' | 'away',
  stakes: Stake[]
): Promise<{ settled: number; totalPayout: string }> {
  const matchStakes = stakes.filter(s => s.matchId === matchId && s.status === 'active');
  let totalPayout = 0;

  for (const stake of matchStakes) {
    if (stake.prediction === result) {
      // Winner!
      const payout = parseFloat(stake.amount) * stake.odds;
      stake.status = 'won';
      stake.payout = payout.toFixed(2);
      stake.settledAt = Date.now();
      totalPayout += payout;
    } else {
      // Loser
      stake.status = 'lost';
      stake.settledAt = Date.now();
    }

    await saveStake(stake);
  }

  return {
    settled: matchStakes.length,
    totalPayout: totalPayout.toFixed(2),
  };
}

// ---- User Stats ----

export interface UserStakingStats {
  totalStaked: string;
  totalWon: string;
  totalLost: string;
  netProfit: string;
  winRate: string;
  totalBets: number;
  activeBets: number;
  bestWin: string;
}

export function calculateUserStats(stakes: Stake[], userId: string): UserStakingStats {
  const userStakes = stakes.filter(s => s.userId === userId);
  const active = userStakes.filter(s => s.status === 'active');
  const won = userStakes.filter(s => s.status === 'won');
  const lost = userStakes.filter(s => s.status === 'lost');

  const totalStaked = userStakes.reduce((sum, s) => sum + parseFloat(s.amount), 0);
  const totalWon = won.reduce((sum, s) => sum + parseFloat(s.payout || '0'), 0);
  const totalLost = lost.reduce((sum, s) => sum + parseFloat(s.amount), 0);
  const netProfit = totalWon - totalLost;
  const winRate = won.length > 0 ? won.length / (won.length + lost.length) : 0;
  const bestWin = won.reduce((max, s) => {
    const profit = parseFloat(s.payout || '0') - parseFloat(s.amount);
    return profit > max ? profit : max;
  }, 0);

  return {
    totalStaked: totalStaked.toFixed(2),
    totalWon: totalWon.toFixed(2),
    totalLost: totalLost.toFixed(2),
    netProfit: netProfit.toFixed(2),
    winRate: (winRate * 100).toFixed(1) + '%',
    totalBets: userStakes.length,
    activeBets: active.length,
    bestWin: bestWin.toFixed(2),
  };
}

// ---- Persistence ----

async function saveStake(stake: Stake): Promise<void> {
  try {
    const existing = await loadStakes();
    const index = existing.findIndex(s => s.id === stake.id);
    if (index >= 0) {
      existing[index] = stake;
    } else {
      existing.unshift(stake);
    }
    await SecureStore.setItemAsync(STAKES_KEY, JSON.stringify(existing.slice(0, 200)));
  } catch {
    // SecureStore quota
  }
}

async function loadStakes(): Promise<Stake[]> {
  try {
    const raw = await SecureStore.getItemAsync(STAKES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function getUserStakes(userId: string): Promise<Stake[]> {
  const all = await loadStakes();
  return all.filter(s => s.userId === userId);
}

export async function getAllStakes(): Promise<Stake[]> {
  return loadStakes();
}
