# GoalMind — For Tether Developers Cup Judges

Thank you for reviewing GoalMind.

## The Pitch (30 seconds)

GoalMind is the on-device AI companion built for the global football tournament. Fans get:
- Instant tactical analysis by pointing their camera at the match (QVAC vision)
- Live multilingual commentary spoken on-device (QVAC TTS)
- Private predictions + the ability to stake and tip using a real self-custodial WDK wallet
- An AI agent that can intelligently engage with fans based on live insights

Everything stays on the user's phone. Perfect for stadiums.

## Core Demo Flow (recommended for video)

See `docs/demo-script.md` (updated with the new premium UI).

Recommended order:
1. Onboarding (cinematic)
2. Home → beautiful match cards + hero
3. Match detail → one-tap "Analyze with AI"
4. Predictions tab → generate + factors
5. Stake / Wallet flow
6. Camera + Commentary demo
7. Airplane mode proof (offline)

## Platform Usage

**QVAC (Local AI)**
- LLM inference (Llama 3.2 via QVAC)
- Embeddings + RAG over football knowledge
- Vision model path for camera
- Multi-language TTS
- Multi-agent orchestration with tool calling

**WDK (Wallets)**
- Wallet creation + seed backup (SecureStore)
- Multi-chain (ETH, Polygon, Arbitrum, Optimism)
- Real USDt tipping
- Agent that uses WDK primitives for autonomous actions (configurable limits)
- Staking and group pool primitives demonstrated

## Design

New premium cinematic assets + gold/emerald dark theme. Built to look like a real tournament app.

## Setup for Review

1. `npm install`
2. `npx expo prebuild` then `npx expo run:android --device` (physical device required — QVAC does not run on emulators)
3. First launch downloads models (~1.5 GB). Subsequent runs fast.
4. All core features work 100% offline after cache.

## Repo Highlights
- `app/` – All screens
- `lib/ai/` – Full QVAC integration + orchestrator + RAG
- `lib/wallet/` – WDK + agent + staking + pools
- `assets/brand/` – All custom pro visuals
- MIT license

Questions? Reach out via the event Discord.

Built with pride for the Tether Developers Cup 2026.
