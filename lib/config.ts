// GoalMind — App Configuration
// Central configuration for the app.

export const APP_CONFIG = {
  name: 'GoalMind',
  version: '1.0.0',
  description: 'AI Football Companion — On-device AI match analysis, commentary, predictions + self-custodial fan wallet',
  
  // Tether Developers Cup
  hackathon: {
    name: 'Tether Developers Cup 2026',
    tracks: ['QVAC', 'WDK'],
    author: 'Farouk Allani',
    github: 'https://github.com/farouk-allani/goalmind',
  },
  
  // AI Configuration
  ai: {
    models: {
      llm: 'llama-3.2-1b-instruct-q4_0',
      embeddings: 'gte-large-fp16',
      tts: 'piper-norman-en-us-medium',
    },
    maxTokens: 512,
    temperature: 0.7,
  },
  
  // Wallet Configuration
  wallet: {
    defaultChain: 'ethereum',
    supportedChains: ['ethereum', 'polygon', 'arbitrum', 'optimism'],
    defaultToken: 'USDt',
  },
  
  // Football Data
  football: {
    competitions: ['FIFA World Cup', 'UEFA Champions League', 'Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1'],
    updateInterval: 60000, // 1 minute
  },
  
  // UI Theme
  theme: {
    dark: true,
    colors: {
      background: '#0a0a0a',
      surface: '#141414',
      primary: '#10b981',
      secondary: '#6366f1',
      accent: '#f59e0b',
    },
  },
  
  // Feature Flags
  features: {
    camera: true,
    commentary: true,
    predictions: true,
    wallet: true,
    offline: true,
  },
} as const;

export type AppConfig = typeof APP_CONFIG;
