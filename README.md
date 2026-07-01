# GoalMind ⚽🧠

**AI Football Companion — On-device AI match analysis, commentary, predictions + self-custodial fan wallet**

Built for the **Tether Developers Cup 2026** 🏆

## What is GoalMind?

GoalMind is a mobile app that brings AI-powered football analysis directly to your device — no cloud, no API keys, no data leaving your phone. Combined with a self-custodial wallet for fan engagement, it's the ultimate companion for football fans worldwide.

### Features

- **Live Match Analysis** — Point your camera at a match and get real-time tactical analysis, player identification, and formation tracking. All inference runs locally via QVAC SDK.

- **AI Commentary** — Real-time audio commentary generation in any language. Text-to-speech runs entirely on-device. Works offline in stadiums.

- **Prediction Engine** — On-device ML model predicts match outcomes, goal probabilities, and player performance based on historical data. Your predictions stay private.

- **Self-Custodial Fan Wallet** — Integrated wallet built with WDK for fan-to-fan tipping, prediction rewards, and match achievements. You hold your own keys.

## Tech Stack

| Component | Technology |
|-----------|------------|
| Mobile Framework | React Native + Expo |
| On-Device AI | QVAC SDK (`@qvac/sdk`) |
| Wallet | WDK (`@tetherto/wdk`) |
| AI Models | Llama 3.2 1B (Q4_0), GTE Large (embeddings), Piper TTS |
| UI | NativeWind (Tailwind for React Native) |
| Navigation | Expo Router |

## Architecture

```
┌─────────────────────────────────────────┐
│            GoalMind App                 │
├─────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────────┐  │
│  │   Camera    │  │   UI Layer      │  │
│  │   Input     │  │   (Expo/NW)     │  │
│  └──────┬──────┘  └────────┬────────┘  │
│         │                  │            │
│  ┌──────▼──────────────────▼────────┐  │
│  │         QVAC SDK (Local AI)      │  │
│  │  ┌─────────┐ ┌────────┐ ┌─────┐ │  │
│  │  │ Vision  │ │  LLM   │ │ TTS │ │  │
│  │  │ Model   │ │ Model  │ │Model│ │  │
│  │  └─────────┘ └────────┘ └─────┘ │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │       WDK (Self-Custodial)       │  │
│  │  ┌─────────┐ ┌────────────────┐  │  │
│  │  │ Wallet  │ │   Payments     │  │  │
│  │  │ Manager │ │   & Tips       │  │  │
│  │  └─────────┘ └────────────────┘  │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
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
│   └── match/[id].tsx     # Match detail view
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   ├── analysis/         # Match analysis components
│   ├── wallet/           # Wallet components
│   └── prediction/       # Prediction components
├── lib/                   # Core logic
│   ├── ai/               # QVAC integration
│   ├── wallet/           # WDK integration
│   ├── data/             # Football data
│   └── utils/            # Utilities
├── hooks/                 # Custom React hooks
├── stores/               # State management
├── assets/               # Images, fonts, models
└── types/                # TypeScript types
```

## Tracks

This project enters **two tracks**:

- **QVAC Track** — All AI inference (vision, language, speech) runs on-device via QVAC SDK
- **WDK Track** — Self-custodial wallet with fan-to-fan tipping and prediction rewards

## Judging Criteria

| Criterion | How GoalMind Delivers |
|-----------|----------------------|
| Technical Ambition | On-device computer vision + NLP + TTS + blockchain wallet |
| User Experience | Point camera → get instant analysis. Tap to tip. |
| Real-World Utility | 4B+ football fans. Works offline in stadiums. |
| Creativity | First on-device AI football companion with integrated crypto wallet |
| Tether Platform | Deep QVAC + WDK integration, not just a logo |

## License

MIT — Built for the Tether Developers Cup 2026

## Author

**Farouk Allani** — [@farouk_allani](https://x.com/farouk_allani)
# GoalMind is ready for the Tether Developers Cup 2026!
