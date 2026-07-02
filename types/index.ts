// GoalMind — Type Definitions

export interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  status: MatchStatus;
  kickoff: string; // ISO 8601
  venue: string;
  competition: string;
  score?: Score;
  minute?: number;
  events: MatchEvent[];
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  crest: string; // URL or asset path
  players: Player[];
  formation: Formation;
}

export interface Player {
  id: string;
  name: string;
  position: Position;
  number: number;
  nationality: string;
  stats: PlayerStats;
}

export interface PlayerStats {
  goals: number;
  assists: number;
  minutesPlayed: number;
  passAccuracy: number;
  shotsOnTarget: number;
  tackles: number;
  interceptions: number;
  rating: number;
}

export type Position = 'GK' | 'DEF' | 'MID' | 'FWD';

export type Formation = 
  | '4-4-2' | '4-3-3' | '3-5-2' | '4-2-3-1' 
  | '3-4-3' | '4-1-4-1' | '5-3-2' | '5-4-1';

export type MatchStatus = 'scheduled' | 'live' | 'halftime' | 'finished' | 'postponed';

export interface Score {
  home: number;
  away: number;
}

export interface MatchEvent {
  minute: number;
  type: EventType;
  team: 'home' | 'away';
  player: string;
  detail?: string;
}

export type EventType = 'goal' | 'assist' | 'yellowCard' | 'redCard' | 'substitution' | 'var';

// AI Analysis Types
export interface AnalysisResult {
  matchId: string;
  timestamp: number;
  tactical: TacticalAnalysis;
  predictions: MatchPrediction;
  commentary: string;
  language: string;
}

export interface TacticalAnalysis {
  homeFormation: Formation;
  awayFormation: Formation;
  possession: { home: number; away: number };
  pressingIntensity: { home: number; away: number };
  keyAreas: HeatmapZone[];
  threats: Threat[];
  momentum: number; // -100 (away dominant) to 100 (home dominant)
}

export interface HeatmapZone {
  zone: string;
  team: 'home' | 'away';
  intensity: number;
}

export interface Threat {
  team: 'home' | 'away';
  type: 'counter' | 'setpiece' | 'wing' | 'central';
  description: string;
  dangerLevel: number; // 1-10
}

export interface MatchPrediction {
  homeWin: number;   // 0-1 probability
  draw: number;
  awayWin: number;
  expectedGoals: { home: number; away: number };
  confidence: number; // 0-1
}

// Wallet Types
export interface WalletState {
  initialized: boolean;
  address: string | null;
  balance: string;
  chain: SupportedChain;
}

export type SupportedChain = 'sepolia' | 'ethereum' | 'polygon' | 'arbitrum' | 'optimism';

export interface Tip {
  id: string;
  from: string;
  to: string;
  amount: string;
  token: string;
  matchId: string;
  message?: string;
  timestamp: number;
}

export interface Prediction {
  id: string;
  matchId: string;
  userId: string;
  prediction: MatchPrediction;
  stake: string;
  resolved: boolean;
  won?: boolean;
  payout?: string;
}

// UI Theme
export interface ThemeColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  primary: string;
  primaryMuted: string;
  gold: string;
  secondary: string;
  accent: string;
  text: string;
  textMuted: string;
  textDim: string;
  success: string;
  warning: string;
  error: string;
  border: string;
}

export const COLORS: ThemeColors = {
  background: '#0A0A0A',
  surface: '#121212',
  surfaceElevated: '#1A1A1A',
  primary: '#10B981',     // Rich Emerald - football pitch + success
  primaryMuted: '#065F46',
  gold: '#C5A26F',        // Premium tournament gold
  secondary: '#6366F1',
  accent: '#F59E0B',
  text: '#F8F8F8',
  textMuted: '#A3A3A3',
  textDim: '#525252',
  success: '#22C55E',
  warning: '#EAB308',
  error: '#EF4444',
  border: '#262626',
};

// Extended theme tokens for premium UI
export const GRADIENTS = {
  primary: ['#10B981', '#059669'] as const,
  gold: ['#C5A26F', '#A67C52'] as const,
  dark: ['#0A0A0A', '#121212'] as const,
  card: ['#121212', '#1A1A1A'] as const,
};
