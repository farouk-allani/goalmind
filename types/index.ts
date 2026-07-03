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
  muted: string;
  success: string;
  warning: string;
  error: string;
  border: string;
}

// Goalix Football Prediction Design System — exact brand tokens.
export const COLORS: ThemeColors = {
  background: '#111317',  // Charcoal — base canvas
  surface: '#17191C',
  surfaceElevated: '#2A2E34', // Slate — secondary surfaces / nested cards
  primary: '#C8FF2E',     // Lime — brand main highlight
  primaryMuted: '#2B3316',
  gold: '#C5A26F',        // Premium tournament gold (USDt / agent wallet accent)
  secondary: '#6366F1',
  accent: '#F59E0B',
  text: '#FFFFFF',        // Pure white — primary text / display values
  textMuted: '#A7ACB3',
  textDim: '#5B6167',
  muted: '#E9EBEE',       // Muted gray — subtle borders, secondary text, outline badges
  success: '#22C55E',
  warning: '#EAB308',
  error: '#EF4444',
  border: '#25282D',
};

// Extended theme tokens for premium UI
export const GRADIENTS = {
  primary: ['#DBFF5C', '#A6D400'] as const,
  gold: ['#C5A26F', '#A67C52'] as const,
  dark: ['#111317', '#17191C'] as const,
  card: ['#17191C', '#2A2E34'] as const,
};

// Display typography (Orbitron) — headlines/logo only, loaded in app/_layout.tsx
export const FONTS = {
  display: 'Orbitron_800ExtraBold',
  displaySemibold: 'Orbitron_700Bold',
};

// Goalix type scale — condensed, high-contrast hierarchy.
export const TYPE = {
  h1: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.32 },
  h2: { fontSize: 24, fontWeight: '600' as const, letterSpacing: -0.24 },
  bodyLarge: { fontSize: 16, fontWeight: '400' as const },
  bodyMedium: { fontSize: 14, fontWeight: '400' as const },
  label: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.5, textTransform: 'uppercase' as const },
};
