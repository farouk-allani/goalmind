// GoalMind — Agent Wallet
// An AI agent that autonomously holds, sends, and manages USDt.
// Uses WDK for wallet creation and signing.
// The agent makes decisions based on match analysis and predictions.

import WDK from '@tetherto/wdk';
import * as SecureStore from 'expo-secure-store';
import {
  initializeWallet,
  getBalance,
  getUSDTBalance,
  createTip,
  storeSeedPhrase,
  getStoredSeedPhrase,
  type ChainId,
  type WalletInstance,
} from './wdk';

// ---- Types ----

export interface AgentConfig {
  name: string;
  description: string;
  strategy: AgentStrategy;
  spendingLimit: number; // Max USDt per transaction
  autoTipEnabled: boolean;
  autoStakeEnabled: boolean;
  maxDailySpend: number; // Max USDt per day
}

export type AgentStrategy =
  | 'conservative'  // Only tips on high-confidence predictions
  | 'moderate'      // Tips on medium+ confidence
  | 'aggressive';   // Tips on any positive prediction

export interface AgentAction {
  id: string;
  type: 'tip' | 'stake' | 'pool_contribution' | 'reward';
  amount: string;
  to: string;
  reason: string;
  matchId?: string;
  timestamp: number;
  txHash?: string;
  status: 'pending' | 'executed' | 'failed' | 'rejected';
}

export interface AgentState {
  initialized: boolean;
  address: string | null;
  balance: string;
  usdtBalance: string;
  chain: ChainId;
  config: AgentConfig;
  actions: AgentAction[];
  dailySpent: number;
  lastReset: number;
}

export interface AgentDecision {
  shouldAct: boolean;
  action?: Omit<AgentAction, 'id' | 'timestamp' | 'status'>;
  reasoning: string;
}

// ---- Constants ----

const AGENT_SEED_KEY = 'goalmind_agent_seed';
const AGENT_STATE_KEY = 'goalmind_agent_state';
const AGENT_CONFIG_KEY = 'goalmind_agent_config';

const DEFAULT_CONFIG: AgentConfig = {
  name: 'GoalMind Agent',
  description: 'Autonomous football AI agent that manages tips and stakes based on match analysis',
  strategy: 'moderate',
  spendingLimit: 10, // 10 USDt max per transaction
  autoTipEnabled: true,
  autoStakeEnabled: false, // disabled by default for safety
  maxDailySpend: 50, // 50 USDt max per day
};

// ---- Agent Class ----

export class GoalMindAgent {
  private wallet: WalletInstance | null = null;
  private state: AgentState;
  private wdk: WDK | null = null;

  constructor() {
    this.state = {
      initialized: false,
      address: null,
      balance: '0',
      usdtBalance: '0',
      chain: 'ethereum',
      config: DEFAULT_CONFIG,
      actions: [],
      dailySpent: 0,
      lastReset: Date.now(),
    };
  }

  // ---- Initialization ----

  async initialize(seedPhrase?: string): Promise<void> {
    // Try to load existing agent seed
    let seed = seedPhrase;
    if (!seed) {
      seed = await this.loadAgentSeed();
    }

    if (!seed) {
      // Generate new agent wallet
      seed = WDK.getRandomSeedPhrase();
      await this.saveAgentSeed(seed);
    }

    this.wallet = await initializeWallet(seed, this.state.chain);
    this.wdk = this.wallet.wdk;

    this.state.initialized = true;
    this.state.address = this.wallet.address;

    // Load saved state
    await this.loadState();

    // Fetch balances
    await this.refreshBalances();
  }

  // ---- Decision Making ----

  /**
   * Analyze a match prediction and decide whether to take action.
   * This is where the AI agent logic lives.
   */
  evaluatePrediction(
    matchId: string,
    homeTeam: string,
    awayTeam: string,
    prediction: {
      homeWin: number;
      draw: number;
      awayWin: number;
      confidence: number;
      xgHome: number;
      xgAway: number;
    }
  ): AgentDecision {
    const { config, dailySpent } = this.state;

    // Check daily spending limit
    if (dailySpent >= config.maxDailySpend) {
      return {
        shouldAct: false,
        reasoning: `Daily spending limit reached (${config.maxDailySpend} USDt)`,
      };
    }

    // Determine confidence threshold based on strategy
    const confidenceThreshold =
      config.strategy === 'conservative' ? 0.75 :
      config.strategy === 'moderate' ? 0.60 :
      0.50;

    // Check if prediction is confident enough
    if (prediction.confidence < confidenceThreshold) {
      return {
        shouldAct: false,
        reasoning: `Confidence ${(prediction.confidence * 100).toFixed(0)}% below ${config.strategy} threshold (${(confidenceThreshold * 100).toFixed(0)}%)`,
      };
    }

    // Determine which team to tip based on prediction
    const strongestPrediction = Math.max(prediction.homeWin, prediction.draw, prediction.awayWin);
    let tipTarget = '';
    let reason = '';

    if (strongestPrediction === prediction.homeWin && prediction.homeWin > 0.45) {
      tipTarget = homeTeam;
      reason = `${homeTeam} predicted to win (${(prediction.homeWin * 100).toFixed(0)}%) with ${(prediction.confidence * 100).toFixed(0)}% confidence. xG: ${prediction.xgHome} vs ${prediction.xgAway}`;
    } else if (strongestPrediction === prediction.awayWin && prediction.awayWin > 0.45) {
      tipTarget = awayTeam;
      reason = `${awayTeam} predicted to win (${(prediction.awayWin * 100).toFixed(0)}%) with ${(prediction.confidence * 100).toFixed(0)}% confidence. xG: ${prediction.xgAway} vs ${prediction.xgHome}`;
    } else {
      // Draw or low confidence — don't tip
      return {
        shouldAct: false,
        reasoning: `No clear winner predicted. Home: ${(prediction.homeWin * 100).toFixed(0)}%, Draw: ${(prediction.draw * 100).toFixed(0)}%, Away: ${(prediction.awayWin * 100).toFixed(0)}%`,
      };
    }

    // Calculate tip amount based on confidence
    const baseAmount = config.spendingLimit * 0.2; // 20% of limit as base
    const confidenceMultiplier = prediction.confidence;
    const tipAmount = Math.min(
      config.spendingLimit,
      baseAmount * confidenceMultiplier * (config.strategy === 'aggressive' ? 1.5 : 1)
    );

    // Check if we can afford it
    const remainingBudget = config.maxDailySpend - dailySpent;
    const finalAmount = Math.min(tipAmount, remainingBudget);

    if (finalAmount < 0.5) {
      return {
        shouldAct: false,
        reasoning: `Tip amount too small (${finalAmount.toFixed(2)} USDt) or budget exhausted`,
      };
    }

    return {
      shouldAct: true,
      action: {
        type: 'tip',
        amount: finalAmount.toFixed(2),
        to: tipTarget, // In production, this would be the team's/fan's wallet address
        reason,
        matchId,
      },
      reasoning: reason,
    };
  }

  /**
   * Evaluate whether to stake on a prediction.
   */
  evaluateStake(
    matchId: string,
    prediction: { homeWin: number; draw: number; awayWin: number; confidence: number }
  ): AgentDecision {
    const { config, dailySpent } = this.state;

    if (!config.autoStakeEnabled) {
      return { shouldAct: false, reasoning: 'Auto-staking is disabled' };
    }

    // Only stake on high-confidence predictions
    if (prediction.confidence < 0.70) {
      return {
        shouldAct: false,
        reasoning: `Confidence ${(prediction.confidence * 100).toFixed(0)}% below staking threshold (70%)`,
      };
    }

    const maxStake = Math.min(config.spendingLimit * 0.5, config.maxDailySpend - dailySpent);
    if (maxStake < 1) {
      return { shouldAct: false, reasoning: 'Insufficient budget for staking' };
    }

    // Pick the most likely outcome
    const outcomes = [
      { outcome: 'home', prob: prediction.homeWin },
      { outcome: 'draw', prob: prediction.draw },
      { outcome: 'away', prob: prediction.awayWin },
    ];
    const best = outcomes.reduce((a, b) => a.prob > b.prob ? a : b);

    if (best.prob < 0.40) {
      return { shouldAct: false, reasoning: 'No outcome has >40% probability' };
    }

    const stakeAmount = maxStake * best.prob;

    return {
      shouldAct: true,
      action: {
        type: 'stake',
        amount: stakeAmount.toFixed(2),
        to: 'prediction_pool',
        reason: `Staking ${(stakeAmount).toFixed(2)} USDt on ${best.outcome} (${(best.prob * 100).toFixed(0)}% probability, ${(prediction.confidence * 100).toFixed(0)}% confidence)`,
        matchId,
      },
      reasoning: `High confidence stake: ${best.outcome} with ${(best.prob * 100).toFixed(0)}% probability`,
    };
  }

  // ---- Actions ----

  async executeTip(toAddress: string, amount: string, matchId?: string): Promise<AgentAction> {
    if (!this.wallet) throw new Error('Agent not initialized');

    const action: AgentAction = {
      id: `agent_tip_${Date.now()}`,
      type: 'tip',
      amount,
      to: toAddress,
      reason: 'Agent auto-tip',
      matchId,
      timestamp: Date.now(),
      status: 'pending',
    };

    try {
      const result = await createTip(this.wallet.wdk, toAddress, amount, this.state.chain);

      if (result.success) {
        action.txHash = result.txHash;
        action.status = 'executed';
        this.state.dailySpent += parseFloat(amount);
      } else {
        action.status = 'failed';
      }
    } catch (error) {
      action.status = 'failed';
    }

    this.state.actions.unshift(action);
    await this.saveState();
    return action;
  }

  // ---- State Management ----

  async refreshBalances(): Promise<void> {
    if (!this.state.address) return;

    const [balance, usdt] = await Promise.all([
      getBalance(this.state.address, this.state.chain),
      getUSDTBalance(this.state.address, this.state.chain),
    ]);

    this.state.balance = balance;
    this.state.usdtBalance = usdt;
  }

  getState(): AgentState {
    return { ...this.state };
  }

  getConfig(): AgentConfig {
    return { ...this.state.config };
  }

  async updateConfig(partial: Partial<AgentConfig>): Promise<void> {
    this.state.config = { ...this.state.config, ...partial };
    await this.saveState();
  }

  getActionHistory(): AgentAction[] {
    return [...this.state.actions];
  }

  // ---- Persistence ----

  private async saveAgentSeed(seed: string): Promise<void> {
    await SecureStore.setItemAsync(AGENT_SEED_KEY, seed, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  }

  private async loadAgentSeed(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(AGENT_SEED_KEY);
    } catch {
      return null;
    }
  }

  private async saveState(): Promise<void> {
    try {
      await SecureStore.setItemAsync(
        AGENT_STATE_KEY,
        JSON.stringify({
          config: this.state.config,
          actions: this.state.actions.slice(0, 100), // Keep last 100 actions
          dailySpent: this.state.dailySpent,
          lastReset: this.state.lastReset,
        })
      );
    } catch {
      // SecureStore quota exceeded
    }
  }

  private async loadState(): Promise<void> {
    try {
      const raw = await SecureStore.getItemAsync(AGENT_STATE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        this.state.config = { ...DEFAULT_CONFIG, ...saved.config };
        this.state.actions = saved.actions || [];
        this.state.dailySpent = saved.dailySpent || 0;
        this.state.lastReset = saved.lastReset || Date.now();

        // Reset daily spending if it's a new day
        const now = new Date();
        const lastReset = new Date(this.state.lastReset);
        if (now.toDateString() !== lastReset.toDateString()) {
          this.state.dailySpent = 0;
          this.state.lastReset = Date.now();
        }
      }
    } catch {
      // Use defaults
    }
  }

  // ---- Cleanup ----

  async reset(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(AGENT_SEED_KEY);
      await SecureStore.deleteItemAsync(AGENT_STATE_KEY);
    } catch {
      // ignore
    }

    this.wallet = null;
    this.wdk = null;
    this.state = {
      initialized: false,
      address: null,
      balance: '0',
      usdtBalance: '0',
      chain: 'ethereum',
      config: DEFAULT_CONFIG,
      actions: [],
      dailySpent: 0,
      lastReset: Date.now(),
    };
  }
}

// Singleton instance
export const agent = new GoalMindAgent();
