# GoalMind ⚽🧠

**The On-Device AI Companion for the Global Football Tournament**

Built for the **Tether Developers Cup 2026** 🏆 — QVAC (Local AI) + WDK (Wallets) tracks.

Point your phone at the pitch for tactical AI analysis, stream match breakdowns from an LLM that runs entirely on your device, and put skin in the game through a self-custodial wallet — with an autonomous agent whose spending is hard-limited by WDK's transaction policy engine.

**100% private. Works in the stadium with zero signal. No cloud AI, no API keys.**

## What's real (and what's a demo)

We believe judges should know exactly what they're looking at:

| Feature | Status |
|---------|--------|
| LLM match analysis (streamed token-by-token) | ✅ Real — QVAC `completion` on-device (Llama 3.2 1B) |
| Camera tactical analysis | ✅ Real — QVAC multimodal vision (SmolVLM2 500M) |
| RAG over football knowledge base | ✅ Real — QVAC `embed` (EmbeddingGemma 300M) + cosine retrieval |
| Multi-agent orchestration | ✅ Real — QVAC native tool calling + structured output (json_schema) |
| Spoken commentary (TTS) | ✅ Real — QVAC Supertonic 3 multilingual, played via expo-audio |
| Statistical prediction engine | ✅ Real math — Elo + Poisson + form, runs instantly on-device |
| Wallet create/restore (BIP-39) | ✅ Real — WDK seed generation + validation, keys in SecureStore |
| Tips (on-chain transfers) | ✅ Real — WDK `account.transfer()` / `sendTransaction()`, Sepolia testnet by default |
| Agent wallet with spending limits | ✅ Real — WDK **policy engine** (`registerPolicy`) denies over-limit txs before signing |
| Prediction staking & tipping pools | 🟡 Local ledger demo — flows and math are real, settlement contract is roadmap |

## Quick start for judges

**⚠ Physical device required** — QVAC (llama.cpp) does not run on emulators. Android needs API 29+.

```bash
# 1. Install
npm install

# 2. Generate native projects (QVAC config plugin wires the Bare runtime)
npx expo prebuild

# 3. Build & run on a connected physical device
npx expo run:android --device   # or: npx expo run:ios --device
```

First AI use downloads models from the QVAC registry (LLM ~800 MB; vision, embeddings, TTS on first use of each feature). After that, everything is fully offline.

**Wallet demo:** the wallet defaults to **Sepolia testnet** so you can fund it from any faucet (e.g. sepolia-faucet.pk910.de) and watch real transactions land on sepolia.etherscan.io. Mainnet chains (Ethereum/Polygon/Arbitrum/Optimism with real USDt) are in the chain switcher.

**Web preview (UI only):** `npx expo start --web` swaps QVAC/WDK for browser mocks (see `mocks/` + `metro.config.js`) so you can browse the interface. All real inference and signing is native-only.

## The stack, used for real

### QVAC (Local AI)

Everything runs through `@qvac/sdk` on the user's device:

- **LLM** — `loadModel({ modelSrc: LLAMA_3_2_1B_INST_Q4_0 })`, streamed via `completion` events ([lib/ai/models.ts](lib/ai/models.ts))
- **Vision** — SmolVLM2 500M + projection model; camera frames go in as `attachments` ([components/analysis/CameraAnalysis.tsx](components/analysis/CameraAnalysis.tsx))
- **Embeddings/RAG** — EmbeddingGemma 300M via `embed()`, batched over a football knowledge base ([lib/ai/rag.ts](lib/ai/rag.ts))
- **Native tool calling** — agents call `query_knowledge`, `predict_match`, `get_team_stats`; the SDK constrains generation and we invoke real handlers ([lib/ai/orchestrator.ts](lib/ai/orchestrator.ts))
- **Structured output** — the orchestrator's plan is generated under a `json_schema` grammar, so it always parses
- **TTS** — Supertonic 3 multilingual (30+ languages), WAV assembled on-device and played with expo-audio

### WDK (Wallets)

- **Self-custodial** — `new WDK(seed).registerWallet(chain, WalletManagerEvm, { provider })`; seed lives in SecureStore, keys never leave the device ([lib/wallet/wdk.ts](lib/wallet/wdk.ts))
- **Real transfers** — `account.transfer({ token, recipient, amount })` for USDt on mainnet chains; native transfers on Sepolia
- **Agent wallet with role separation** — the agent has its own seed/account, distinct from the user's ([lib/wallet/agent.ts](lib/wallet/agent.ts))
- **Policy engine** — the agent registers DENY rules (`per-tx cap`, `daily budget`) via `wdk.registerPolicy()`. Violations throw `PolicyViolationError` *before signing* — the limits are enforced inside WDK, not by app code the agent could bypass. `account.simulate.*` powers a dry-run preview in the UI.

## Architecture

```
┌──────────────────────── GoalMind (Expo / React Native) ───────────────────────┐
│                                                                                │
│  Screens: Home · Match Detail · Predict · Wallet · Settings                   │
│      │                                                                         │
│  ┌───▼──────────────── lib/ai (QVAC SDK) ─────────────────┐                   │
│  │ models.ts      LLM · vision · embeddings · TTS          │                   │
│  │ rag.ts         knowledge base + embed() retrieval       │                   │
│  │ orchestrator.ts coach/analyst/commentator/scout agents  │                   │
│  │                 + native tool calling + json_schema      │                   │
│  └──────────────────────────────────────────────────────────┘                  │
│  ┌──────────────────── lib/wallet (WDK) ───────────────────┐                   │
│  │ wdk.ts    registerWallet · getAccount · transfer         │                   │
│  │ agent.ts  agent seed + registerPolicy spending limits    │                   │
│  │ staking/pools  local-ledger demo flows                   │                   │
│  └──────────────────────────────────────────────────────────┘                  │
│  lib/predictions/engine.ts   Elo + Poisson + form (pure math)                  │
└────────────────────────────────────────────────────────────────────────────────┘
```

## Models

| Role | Model | Size |
|------|-------|------|
| LLM | Llama 3.2 1B Instruct Q4_0 | ~800 MB |
| Vision | SmolVLM2 500M multimodal Q8_0 (+ projector) | ~600 MB |
| Embeddings | EmbeddingGemma 300M Q8_0 | ~320 MB |
| TTS | Supertonic 3 multilingual Q4_0 | ~300 MB |

All pulled from the QVAC model registry on first use, cached on device.

## Project structure

```
goalmind/
├── app/                  # Expo Router screens
│   ├── (tabs)/           # Home, Predict, Wallet, Settings
│   └── match/[id].tsx    # Match detail: streaming AI analysis
├── components/analysis/  # CameraAnalysis (vision), LiveCommentary (LLM+TTS)
├── lib/
│   ├── ai/               # QVAC: models, RAG, multi-agent orchestration
│   ├── wallet/           # WDK: wallet, agent + policy engine, staking, pools
│   ├── predictions/      # Statistical engine (Elo/Poisson/form)
│   └── data/             # Sample tournament data
├── hooks/                # useAI, useWallet, useFootballData
├── mocks/                # Web-preview stubs for native-only SDKs
└── docs/                 # Architecture, demo script, judge briefing
```

## Environment

Works out of the box with sample tournament data. Optional: set `EXPO_PUBLIC_FOOTBALL_API_KEY` (free at football-data.org) for live fixtures.

## Disclosure

- Third-party: football-data.org (optional match data), public JSON-RPC endpoints (balance reads / broadcasting), Expo.
- Staking/pools settle in a local ledger for the demo; on-chain escrow is the next milestone.
- Prior work: none — built during the event.

## License

MIT — Built for the Tether Developers Cup 2026

## Author

**Farouk Allani** — [@farouk_allani](https://x.com/farouk_allani)
