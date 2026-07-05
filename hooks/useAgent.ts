// GoalMind — useAgent Hook
// Reactive wrapper around the real GoalMindAgent (WDK self-custodial agent wallet + policy engine).
// Provides live state, config, simulation, and execution so the UI can demonstrate
// real WDK policy enforcement (DENY rules throw PolicyViolationError before signing).

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  agent as goalMindAgent,
  type AgentState,
  type AgentConfig,
  type AgentAction,
  type AgentDecision,
} from '@/lib/wallet/agent';
import { predictMatch, type PredictionResult } from '@/lib/predictions/engine';
import { SAMPLE_MATCHES } from '@/lib/data/football';
import { type ChainId } from '@/lib/wallet/wdk';

interface UseAgentReturn {
  isReady: boolean;
  initializing: boolean;
  state: AgentState | null;
  config: AgentConfig;
  actions: AgentAction[];
  error: string | null;
  initialize: () => Promise<void>;
  updateConfig: (partial: Partial<AgentConfig>) => Promise<void>;
  evaluateForMatch: (matchId?: string) => AgentDecision | null;
  simulateTip: (toAddress: string, amount: string) => Promise<{ decision: 'ALLOW' | 'DENY'; reason?: string }>;
  executeTip: (toAddress: string, amount: string, matchId?: string) => Promise<AgentAction>;
  refresh: () => Promise<void>;
  reset: () => Promise<void>;
}

export function useAgent(): UseAgentReturn {
  const [isReady, setIsReady] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [state, setState] = useState<AgentState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const syncState = useCallback(() => {
    if (!mountedRef.current) return;
    try {
      const current = goalMindAgent.getState();
      setState(current);
      setIsReady(current.initialized);
    } catch (e) {
      // ignore sync errors
    }
  }, []);

  const initialize = useCallback(async () => {
    setInitializing(true);
    setError(null);
    try {
      await goalMindAgent.initialize();
      syncState();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to initialize agent wallet';
      setError(msg);
    } finally {
      setInitializing(false);
    }
  }, [syncState]);

  const updateConfig = useCallback(async (partial: Partial<AgentConfig>) => {
    try {
      await goalMindAgent.updateConfig(partial);
      syncState();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update config';
      setError(msg);
    }
  }, [syncState]);

  const evaluateForMatch = useCallback((matchId?: string): AgentDecision | null => {
    const matches = SAMPLE_MATCHES;
    const target = matchId
      ? matches.find(m => m.id === matchId) || matches[0]
      : matches[0];
    if (!target) return null;

    const prediction = predictMatch(target);
    return goalMindAgent.evaluatePrediction(
      target.id,
      target.homeTeam.name,
      target.awayTeam.name,
      {
        homeWin: prediction.homeWin,
        draw: prediction.draw,
        awayWin: prediction.awayWin,
        confidence: prediction.confidence,
        xgHome: prediction.xgHome,
        xgAway: prediction.xgAway,
      }
    );
  }, []);

  const simulateTip = useCallback(async (toAddress: string, amount: string) => {
    try {
      return await goalMindAgent.simulateTip(toAddress, amount);
    } catch (err) {
      return { decision: 'DENY' as const, reason: err instanceof Error ? err.message : 'Simulation failed' };
    }
  }, []);

  const executeTip = useCallback(async (toAddress: string, amount: string, matchId?: string): Promise<AgentAction> => {
    setError(null);
    try {
      const action = await goalMindAgent.executeTip(toAddress, amount, matchId);
      syncState();
      return action;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Execute failed';
      setError(msg);
      // Return a failed action for UI
      return {
        id: `agent_fail_${Date.now()}`,
        type: 'tip',
        amount,
        to: toAddress,
        reason: msg,
        timestamp: Date.now(),
        status: 'failed',
      };
    }
  }, [syncState]);

  const refresh = useCallback(async () => {
    try {
      await goalMindAgent.refreshBalances();
      syncState();
    } catch (e) {
      // non-fatal
    }
  }, [syncState]);

  const reset = useCallback(async () => {
    try {
      await goalMindAgent.reset();
      setState(null);
      setIsReady(false);
      setError(null);
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    // Initial sync if already initialized
    syncState();
    return () => {
      mountedRef.current = false;
    };
  }, [syncState]);

  return {
    isReady,
    initializing,
    state,
    config: state?.config || goalMindAgent.getConfig(),
    actions: state?.actions || [],
    error,
    initialize,
    updateConfig,
    evaluateForMatch,
    simulateTip,
    executeTip,
    refresh,
    reset,
  };
}

// Helper demo addresses for realistic agent tips (self-custodial fan wallets in demo)
export const DEMO_FAN_ADDRESSES: Record<string, string> = {
  'Argentina': '0xA1f2B3c4D5e6F7a8B9c0d1E2f3A4b5C6d7E8f9A0',
  'France': '0xB2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1',
  'Brazil': '0xC3d4E5f6A7b8C9d0E1f2A3b4C5d6E7f8A9b0C1d2',
  'Germany': '0xD4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3',
  default: '0xF1a2B3c4D5e6F7a8B9c0D1e2F3a4B5c6D7e8F9a0',
};

export function resolveDemoAddress(teamOrName: string): string {
  const key = Object.keys(DEMO_FAN_ADDRESSES).find(k => teamOrName.toLowerCase().includes(k.toLowerCase()));
  return key ? DEMO_FAN_ADDRESSES[key] : DEMO_FAN_ADDRESSES.default;
}
