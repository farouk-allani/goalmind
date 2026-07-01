# GoalMind ⚽🧠

**AI Football Companion — On-device AI match analysis, commentary, predictions + self-custodial fan wallet**

Built for the **Tether Developers Cup 2026** 🏆

## What is GoalMind?

GoalMind is a mobile app that brings AI-powered football analysis directly to your device — no cloud, no API keys, no data leaving your phone. Combined with a self-custodial wallet for fan engagement, it's the ultimate companion for football fans worldwide.

## Features

### 🎥 Live Match Analysis
Point your camera at a match and get real-time tactical analysis, formation tracking, and key insights. All inference runs locally via QVAC SDK.

### 🎙️ AI Commentary
Real-time audio commentary generation in 6 languages (EN, FR, ES, DE, PT, AR). Text-to-speech runs entirely on-device. Works offline in stadiums.

### 📊 Prediction Engine
Statistical match predictions using Elo ratings, Poisson distribution, and form-weighted analysis. Includes expected goals (xG), suggested scores, and transparent prediction factors.

### 💰 Self-Custodial Fan Wallet
Built with Tether WDK for fan-to-fan tipping, prediction rewards, and match achievements. Supports Ethereum, Polygon, Arbitrum, and Optimism. You hold your own keys.

### 🤖 Agent Wallet (WDK Track)
An AI agent that autonomously holds, sends, and manages USDt based on match analysis. Configurable strategies (conservative/moderate/aggressive), daily spending limits, and decision-making based on prediction confidence.

### 📈 Prediction Staking (WDK Track)
Escrow-based stakes on match outcomes with dynamic odds. Fans can stake on predictions and earn rewards. Includes user stats, win rate tracking, and pool settlement.

### 👥 Group Tipping Pools (WDK Track)
Fans pool tips together for matches. Multiple distribution rules (proportional, equal, winner-take-all, top-three). Min/max contribution limits and pool analytics.

### 🔍 RAG Knowledge Base (QVAC Track)
Retrieval-Augmented Generation over football knowledge using QVAC embeddings. Local document search for rules, tactics, history, player info, and team analysis. All processing on-device.

### 🎯 Multi-Agent Orchestration (QVAC Track)
Multiple specialized AI agents (Coach, Analyst, Commentator, Scout) that collaborate to provide comprehensive insights. Tool calling for knowledge queries and predictions. Parallel task execution with result synthesis.

### 🔒 Privacy First
All AI inference runs on-device. No cloud. No API keys. No data leaves your phone. Works offline.

## Tech Stack

| Component | Technology |
|-----------|------------|
| Mobile Framework | React Native + Expo |
| On-Device AI | QVAC SDK (`@qvac/sdk`) |
| Wallet | WDK (`@tetherto/wdk`) |
| AI Models | Llama 3.2 1B (Q4_0), GTE Large (embeddings), Piper TTS |
| Navigation | Expo Router |
| State Management | Zustand |
| Football Data | football-data.org API (free tier) |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    GoalMind App                          │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────────┐  ┌────────────┐  │
│  │   Camera    │  │   UI Layer      │  │  Settings  │  │
│  │   Input     │  │   (Expo/RN)     │  │  & Config  │  │
│  └──────┬──────┘  └────────┬────────┘  └─────┬──────┘  │
│         │                  │                   │         │
│  ┌──────▼──────────────────▼───────────────────▼──────┐ │
│  │              QVAC SDK (Local AI)                    │ │
│  │  ┌─────────┐ ┌────────┐ ┌─────┐ ┌──────────────┐  │ │
│  │  │ Vision  │ │  LLM   │ │ TTS │ │  Embeddings  │  │ │
│  │  │ Model   │ │ Model  │ │Model│ │    Model     │  │ │
│  │  └─────────┘ └────────┘ └─────┘ └──────────────┘  │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │           Multi-Agent Orchestration                │ │
│  │  ┌────────┐ ┌────────┐ ┌──────────┐ ┌─────────┐  │ │
│  │  │ Coach  │ │Analyst │ │Commentator│ │  Scout  │  │ │
│  │  │ Agent  │ │ Agent  │ │  Agent   │ │  Agent  │  │ │
│  │  └────────┘ └────────┘ └──────────┘ └─────────┘  │ │
│  │              ┌──────────────┐                      │ │
│  │              │ Orchestrator │                      │ │
│  │              └──────────────┘                      │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │              WDK (Self-Custodial)                   │ │
│  │  ┌─────────┐ ┌────────────┐ ┌───────────────────┐ │ │
│  │  │ Wallet  │ │   Agent    │ │  Staking & Pools  │ │ │
│  │  │ Manager │ │   Wallet   │ │  (Escrow)         │ │ │
│  │  └─────────┘ └────────────┘ └───────────────────┘ │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │              Prediction Engine                      │ │
│  │  ┌──────┐ ┌────────┐ ┌───────┐ ┌───────────────┐ │ │
│  │  │ Elo  │ │Poisson │ │ Form  │ │  RAG Query    │ │ │
│  │  │Rating│ │  Dist  │ │Analysis│ │  (Embeddings) │ │ │
│  │  └──────┘ └────────┘ └───────┘ └───────────────┘ │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android
```

## Environment Setup

1. Copy `.env.example` to `.env`
2. (Optional) Get a free football API key at https://www.football-data.org/client/register
3. The app works without an API key using sample data

## Project Structure

```
goalmind/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation
│   │   ├── index.tsx      # Home / Live Analysis
│   │   ├── predict.tsx    # Predictions
│   │   ├── wallet.tsx     # Fan Wallet
│   │   └── settings.tsx   # Settings
│   ├── _layout.tsx        # Root layout
│   ├── onboarding.tsx     # First-time experience
│   └── match/[id].tsx     # Match detail view
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   ├── analysis/         # Match analysis components
│   ├── wallet/           # Wallet components
│   ├── prediction/       # Prediction components
│   └── ErrorBoundary.tsx # Error handling
├── lib/                   # Core logic
│   ├── ai/               # QVAC integration
│   │   ├── models.ts     # Model lifecycle
│   │   ├── rag.ts        # RAG knowledge base
│   │   └── orchestrator.ts # Multi-agent orchestration
│   ├── api/              # Football data API
│   ├── wallet/           # WDK integration
│   │   ├── wdk.ts        # Wallet operations
│   │   ├── agent.ts      # Agent wallet
│   │   ├── staking.ts    # Prediction staking
│   │   └── pools.ts      # Group tipping pools
│   ├── predictions/      # Prediction engine
│   ├── data/             # Sample football data
│   └── config.ts         # App configuration
├── hooks/                 # Custom React hooks
│   ├── useAI.ts          # AI model lifecycle
│   ├── useWallet.ts      # Wallet operations
│   └── useFootballData.ts # Football data fetching
├── stores/               # Zustand state management
├── types/                # TypeScript types
└── docs/                 # Documentation
```

## Tracks

This project enters **two tracks**:

### QVAC Track (Local AI)
- ✅ On-device NLP, TTS, and vision using QVAC SDK
- ✅ RAG (Retrieval-Augmented Generation) over football knowledge base
- ✅ Multi-agent orchestration with tool calling
- ✅ Privacy-first: no cloud, no API keys, no data leaves device
- ✅ Works offline in stadiums

### WDK Track (Wallets)
- ✅ Self-custodial wallet with seed phrase backup
- ✅ Multi-chain support (Ethereum, Polygon, Arbitrum, Optimism)
- ✅ Agent Wallet: AI agent that autonomously manages USDt
- ✅ Prediction Staking: escrow-based stakes with dynamic odds
- ✅ Group Tipping Pools: fans pool tips with smart distribution
- ✅ Programmable payments and event-triggered transfers

## Judging Criteria

| Criterion | How GoalMind Delivers |
|-----------|----------------------|
| Technical Ambition | Multi-agent orchestration + RAG + on-device AI + blockchain wallet |
| User Experience | Pull-to-refresh matches → tap → get instant analysis. Tap to tip. |
| Real-World Utility | 4B+ football fans. Works offline in stadiums. |
| Creativity | First on-device AI football companion with agent wallet and RAG |
| Tether Platform | Deep QVAC + WDK integration across all features |

## API Integration

### Football Data
- Uses football-data.org free API (10 requests/min)
- Caches data locally with 1-hour TTL
- Falls back to sample data when API is unavailable

### QVAC SDK
- LLM: Llama 3.2 1B (Q4_0 quantized, ~800MB)
- Embeddings: GTE Large (FP16, ~400MB)
- TTS: Piper Norman EN-US Medium (~200MB)

### WDK Wallet
- Self-custodial: keys generated and stored locally
- Multi-chain: Ethereum, Polygon, Arbitrum, Optimism
- Seed phrase backup via SecureStore

## License

MIT — Built for the Tether Developers Cup 2026

## Author

**Farouk Allani** — [@farouk_allani](https://x.com/farouk_allani)
