// GoalMind — State Management with Zustand
// Lightweight, no boilerplate, no providers needed.

import { create } from 'zustand';
import type { Match, AnalysisResult, WalletState, Tip, MatchPrediction } from '@/types';

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
  
  setWallet: (wallet: Partial<WalletState>) => void;
  addTip: (tip: Tip) => void;
  setInitializing: (initializing: boolean) => void;
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
  
  setWallet: (partial) => set((state) => ({ 
    wallet: { ...state.wallet, ...partial } 
  })),
  addTip: (tip) => set((state) => ({ 
    tips: [tip, ...state.tips] 
  })),
  setInitializing: (initializing) => set({ initializing }),
  reset: () => set({ wallet: initialWallet, tips: [] }),
}));
