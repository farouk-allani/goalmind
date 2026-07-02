# GoalMind — For Tether Developers Cup Judges

Thank you for reviewing GoalMind. This document is intentionally honest: it says exactly what runs for real, on what hardware, and what it took to get there.

## The pitch (30 seconds)

GoalMind is an on-device AI football companion with a self-custodial fan wallet. A fan in a packed stadium — congested network, no signal — gets tactical match analysis streamed token-by-token from an LLM running **on their phone**, camera-based scene analysis from an on-device vision model, and can tip and stake through a **WDK wallet whose autonomous agent is hard-limited by WDK's transaction policy engine**. No cloud AI. No API keys. Nothing leaves the device.

## What runs for real (verified on a Samsung Galaxy A15, a ~$150 phone)

| Feature | Evidence |
|---------|----------|
| LLM tactical analysis | Llama 3.2 1B Q4_0 via `@qvac/sdk`, streamed via `completion` events, CPU inference |
| Camera vision analysis | SmolVLM2 500M multimodal + projection model, camera frame as `attachments` |
| RAG knowledge base | EmbeddingGemma 300M via `embed()`, batched, cosine retrieval |
| Multi-agent + tools | QVAC native tool calling (`query_knowledge`, `predict_match`, `get_team_stats`) + `json_schema` structured output |
| Spoken commentary | Supertonic 3 multilingual TTS, WAV assembled on-device, expo-audio playback |
| Self-custodial wallet | `new WDK(seed).registerWallet(chain, WalletManagerEvm, { provider })`, BIP-39 via WDK, keys in Android Keystore |
| On-chain tips | `account.transfer()` / `sendTransaction()` — Sepolia testnet default (fund via faucet, verify on sepolia.etherscan.io) |
| Agent spending limits | `wdk.registerPolicy()` DENY rules — violations throw `PolicyViolationError` **before signing**; `account.simulate.*` powers dry-run previews |
| Statistical predictions | Elo + Poisson + form engine (pure math, instant) |

**Honest caveats:** staking/tipping pools settle in a local on-device ledger (on-chain escrow is the next milestone); the "wow it runs on that" moment is CPU-only inference — we disable GPU offload because Mali GPUs crash ggml's Vulkan backend (see below).

## Run it yourself

**Fastest:** install the prebuilt APK from the GitHub Releases page — no build needed. Physical Android device, API 29+.

**From source** (~20 min first build):

```bash
npm install
npm run qvac:bundle:android   # Android-only QVAC worker bundle (see note below)
npx expo prebuild
npx expo run:android --device # PHYSICAL device — QVAC does not run on emulators
```

First AI use downloads models from the QVAC registry (LLM ~800 MB) — be on Wi-Fi. Everything after that is fully offline.

## Engineering notes judges may appreciate

Getting QVAC 0.14 + Expo 54 + WDK running together on real hardware required solving a chain of undocumented issues — we believe this version matrix is useful to the QVAC team:

1. **Docs pin stale versions.** `@qvac/sdk` 0.14.x needs `bare-pack@^2.x` (the SDK spawns `--host`, which 1.x lacks) and `react-native-bare-kit@0.14.x` — 0.11.5 aborts on first `loadModel`, and 0.15.0 links a private Android library (`libnativehelper.so`) that kills the whole native module bundle.
2. **Multi-platform worker bundles don't resolve.** The expo plugin bundles for 4 hosts, producing platform-conditional addon entries bare-kit 0.14.5 can't parse (`ADDON_NOT_FOUND`). Our `npm run qvac:bundle:android` regenerates an Android-only bundle (plain-string entries). Re-run it after every `npm install`/`prebuild`.
3. **Mali GPUs crash ggml's Vulkan backend.** Even with `gpu_layers: 0`, the scheduler probes GPU backends and segfaults on Mali-G57. Fix: `modelConfig: { device: 'cpu' }`.
4. **`@qvac/sdk` 0.14.0 shipped incomplete** (missing `runtime-lifecycle.js`); 0.14.1 (released July 2) fixes it.

All of this is reproducible from our commit history — the project was built entirely during the event.

## Where the code lives

- QVAC integration: [lib/ai/models.ts](../lib/ai/models.ts) (model lifecycle), [lib/ai/orchestrator.ts](../lib/ai/orchestrator.ts) (tool-calling agents), [lib/ai/rag.ts](../lib/ai/rag.ts)
- WDK integration: [lib/wallet/wdk.ts](../lib/wallet/wdk.ts) (wallet + transfers), [lib/wallet/agent.ts](../lib/wallet/agent.ts) (agent + policy engine)
- Prediction engine: [lib/predictions/engine.ts](../lib/predictions/engine.ts)

## Demo flow (3 minutes)

1. Home → match card → **Run Tactical Analysis** → tokens stream from the on-device LLM
2. Camera tab → point at match footage → on-device vision analysis
3. Predict tab → statistical engine with factor breakdown → Stake
4. Wallet → real Sepolia address, faucet-funded → send tip → explorer link resolves
5. Agent → set 1 USDt limit → attempt 5 USDt tip → **rejected by WDK policy engine** (the money shot for WDK)
6. Airplane mode → analysis still works
