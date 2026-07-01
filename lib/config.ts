// GoalMind — App Configuration
// Centralized config from environment variables.

import Constants from 'expo-constants';

const env = Constants.expoConfig?.extra || process.env;

export const config = {
  // Football API
  footballApiKey: env.EXPO_PUBLIC_FOOTBALL_API_KEY || '',

  // RPC URLs
  rpc: {
    ethereum: env.EXPO_PUBLIC_ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
    polygon: env.EXPO_PUBLIC_POLYGON_RPC_URL || 'https://polygon-rpc.com',
    arbitrum: env.EXPO_PUBLIC_ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    optimism: env.EXPO_PUBLIC_OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
  },

  // App info
  appName: env.EXPO_PUBLIC_APP_NAME || 'GoalMind',
  appVersion: env.EXPO_PUBLIC_APP_VERSION || '1.0.0',

  // Feature flags
  features: {
    cameraAnalysis: true,
    liveCommentary: true,
    predictions: true,
    wallet: true,
    offlineMode: true,
  },

  // QVAC model config
  qvac: {
    llm: 'llama-3.2-1b-instruct-q4_0',
    embeddings: 'gte-large-fp16',
    tts: 'piper-norman-en-us-medium',
  },

  // Competition defaults
  defaultCompetitionId: 2000, // FIFA World Cup
} as const;
