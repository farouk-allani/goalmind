// GoalMind — State Management with Zustand
// Lightweight, no boilerplate, no providers needed.

import { create } from 'zustand';
import type { Match, AnalysisResult, WalletState, Tip, MatchPrediction } from '@/types';
import type { PredictionResult } from '@/lib/predictions/engine';

// AI Store — manages on-device model state
interface AIStore {
  modelsLoaded: boolean;
  loading: boolean;
  error: string | null;
  currentAnalysis: AnalysisResult | null;
  commentary: string;
  
  setModelsLoaded: (loaded: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setAnalysis: (analysis: AnalysisResult | null) => void;
  setCommentary: (commentary: string) => void;
  appendCommentary: (token: string) => void;
}

export const useAIStore = create<AIStore>((set) => ({
  modelsLoaded: false,
  loading: false,
  error: null,
  currentAnalysis: null,
  commentary: '',
  
  setModelsLoaded: (loaded) => set({ modelsLoaded: loaded }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setAnalysis: (analysis) => set({ currentAnalysis: analysis }),
  setCommentary: (commentary) => set({ commentary }),
  appendCommentary: (token) => set((state) => ({ 
    commentary: state.commentary + token 
  })),
}));

// Match Store — manages match data and selections
interface MatchStore {
  matches: Match[];
  selectedMatch: Match | null;
  predictions: Map<string, MatchPrediction>;
  
  setMatches: (matches: Match[]) => void;
  selectMatch: (match: Match | null) => void;
  setPrediction: (matchId: string, prediction: MatchPrediction) => void;
}

export const useMatchStore = create<MatchStore>((set) => ({
  matches: [],
  selectedMatch: null,
  predictions: new Map(),
  
  setMatches: (matches) => set({ matches }),
  selectMatch: (match) => set({ selectedMatch: match }),
  setPrediction: (matchId, prediction) => set((state) => {
    const predictions = new Map(state.predictions);
    predictions.set(matchId, prediction);
    return { predictions };
  }),
}));

// Wallet Store — manages wallet state
interface WalletStore {
  wallet: WalletState;
  tips: Tip[];
  initializing: boolean;
  // True while we silently re-hydrate a previously created wallet from the
  // securely stored seed on app launch (prevents the "Create Wallet" flash).
  restoring: boolean;

  setWallet: (wallet: Partial<WalletState>) => void;
  addTip: (tip: Tip) => void;
  setInitializing: (initializing: boolean) => void;
  setRestoring: (restoring: boolean) => void;
  reset: () => void;
}

const initialWallet: WalletState = {
  initialized: false,
  address: null,
  balance: '0.00',
  chain: 'ethereum',
};

export const useWalletStore = create<WalletStore>((set) => ({
  wallet: initialWallet,
  tips: [],
  initializing: false,
  // Start true: on launch we optimistically assume a returning user until the
  // stored-seed check resolves, so we never flash "Create Wallet" at them.
  restoring: true,

  setWallet: (partial) => set((state) => ({
    wallet: { ...state.wallet, ...partial }
  })),
  addTip: (tip) => set((state) => ({
    tips: [tip, ...state.tips]
  })),
  setInitializing: (initializing) => set({ initializing }),
  setRestoring: (restoring) => set({ restoring }),
  reset: () => set({ wallet: initialWallet, tips: [] }),
}));

// Analysis Store — caches the on-device tactical read + statistical prediction
// per match so navigating away and back does not wipe a completed analysis.
interface AnalysisCacheEntry {
  analysis: string | null;
  prediction: PredictionResult | null;
}

interface AnalysisStore {
  byMatch: Record<string, AnalysisCacheEntry>;
  setAnalysis: (matchId: string, analysis: string | null) => void;
  setPrediction: (matchId: string, prediction: PredictionResult | null) => void;
  clear: (matchId: string) => void;
}

export const useAnalysisStore = create<AnalysisStore>((set) => ({
  byMatch: {},
  setAnalysis: (matchId, analysis) =>
    set((state) => ({
      byMatch: {
        ...state.byMatch,
        [matchId]: { prediction: state.byMatch[matchId]?.prediction ?? null, analysis },
      },
    })),
  setPrediction: (matchId, prediction) =>
    set((state) => ({
      byMatch: {
        ...state.byMatch,
        [matchId]: { analysis: state.byMatch[matchId]?.analysis ?? null, prediction },
      },
    })),
  clear: (matchId) =>
    set((state) => {
      const next = { ...state.byMatch };
      delete next[matchId];
      return { byMatch: next };
    }),
}));

// Toast Store — app-wide, non-blocking snackbar (replaces intrusive Alerts for
// lightweight confirmations like "copied to clipboard").
type ToastType = 'success' | 'error' | 'info';

interface ToastOptions {
  type?: ToastType;
  icon?: string;
  duration?: number;
}

interface ToastStore {
  id: number;
  message: string | null;
  type: ToastType;
  icon?: string;
  duration: number;
  show: (message: string, options?: ToastOptions) => void;
  hide: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  id: 0,
  message: null,
  type: 'success',
  icon: undefined,
  duration: 2200,
  show: (message, options = {}) =>
    set((state) => ({
      id: state.id + 1,
      message,
      type: options.type ?? 'success',
      icon: options.icon,
      duration: options.duration ?? 2200,
    })),
  hide: () => set({ message: null }),
}));
