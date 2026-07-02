# GoalMind — Architecture

## Overview

GoalMind is the premium on-device AI football companion built for the **Tether Developers Cup 2026**.

A React Native + Expo mobile app delivering:
- Deep QVAC on-device intelligence (multi-agent, vision, RAG, TTS)
- Full-featured WDK self-custodial wallet + agent + staking/pools
- Tournament-themed experience with beautiful cinematic UI

Everything stays private and works offline in the stands.

## Core Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        GoalMind App                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    UI Layer (Expo)                   │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │   │
│  │  │ Analyze │ │ Predict │ │ Wallet  │ │Settings │   │   │
│  │  │ Screen  │ │ Screen  │ │ Screen  │ │ Screen  │   │   │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └─────────┘   │   │
│  └───────┼───────────┼───────────┼─────────────────────┘   │
│          │           │           │                          │
│  ┌───────▼───────────▼───────────▼─────────────────────┐   │
│  │                 State Management (Zustand)           │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐               │   │
│  │  │ AI      │ │ Match   │ │ Wallet  │               │   │
│  │  │ Store   │ │ Store   │ │ Store   │               │   │
│  │  └─────────┘ └─────────┘ └─────────┘               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 Business Logic Layer                 │   │
│  │  ┌─────────────────────┐ ┌─────────────────────┐   │   │
│  │  │    QVAC SDK (AI)    │ │    WDK (Wallet)     │   │   │
│  │  │  ┌─────┐ ┌──────┐  │ │  ┌─────┐ ┌──────┐  │   │   │
│  │  │  │ LLM │ │ TTS  │  │ │  │ ETH │ │ SOL  │  │   │   │
│  │  │  └─────┘ └──────┘  │ │  └─────┘ └──────┘  │   │   │
│  │  └─────────────────────┘ └─────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    Data Layer                       │   │
│  │  ┌─────────────────────┐ ┌─────────────────────┐   │   │
│  │  │  Football Data      │ │  Model Cache        │   │   │
│  │  │  (Teams, Matches)   │ │  (On-Device)        │   │   │
│  │  └─────────────────────┘ └─────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Match Analysis Flow

```
User selects match
       │
       ▼
Load team statistics
       │
       ▼
Format for AI prompt
       │
       ▼
QVAC LLM inference (on-device)
       │
       ▼
Parse tactical analysis
       │
       ▼
Render UI components
```

### Prediction Flow

```
User requests predictions
       │
       ▼
Load all upcoming matches
       │
       ▼
Calculate team strengths
       │
       ▼
Apply prediction algorithm
       │
       ▼
Generate probability scores
       │
       ▼
Render prediction cards
```

### Wallet Flow

```
User creates wallet
       │
       ▼
Generate seed phrase (WDK)
       │
       ▼
Derive Ethereum account
       │
       ▼
Store in secure storage
       │
       ▼
Display wallet UI
```

## Key Design Decisions

### 1. On-Device AI (QVAC)

All AI inference runs locally on the user's device using QVAC SDK. This ensures:
- **Privacy** — No data leaves the device
- **Offline capability** — Works without internet
- **Speed** — No network latency for inference
- **Cost** — No API fees

### 2. Self-Custodial Wallet (WDK)

The wallet is built with WDK, giving users full control:
- **Self-custody** — Users hold their own keys
- **Multi-chain** — Support for Ethereum, Solana, TON, TRON
- **Modular** — Register only the chains needed
- **Policy engine** — Transaction rules and simulation

### 3. Dark Theme

The app uses a dark theme optimized for:
- **Stadium use** — Easy on eyes in dark environments
- **Battery saving** — OLED screens use less power
- **Aesthetics** — Modern, clean design

### 4. Component Architecture

Components are organized by feature:
- **ui/** — Base components (Button, Card, Badge)
- **analysis/** — Match analysis components
- **wallet/** — Wallet operation components
- **prediction/** — Prediction display components

## State Management

Zustand stores manage:
- **AI Store** — Model loading state, current analysis, commentary
- **Match Store** — Match data, selections, predictions
- **Wallet Store** — Wallet state, tips, transactions

## Security Considerations

1. **Seed phrases** — Generated locally, never transmitted
2. **Model inference** — All on-device, no cloud calls
3. **API keys** — None required, no external dependencies
4. **Data storage** — Local only, user controls their data

## Performance Optimizations

1. **Model caching** — Models loaded once, reused
2. **Lazy loading** — Components loaded on demand
3. **Memoization** — Expensive calculations cached
4. **Streaming** — Token-by-token AI output for responsiveness

## Future Enhancements

1. **Camera integration** — Live match analysis via camera
2. **Multi-language** — Commentary in multiple languages
3. **Social features** — Fan communities, leaderboards
4. **Advanced analytics** — Heatmaps, pass networks, xG maps
