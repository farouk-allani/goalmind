# GoalMind — Demo Video Script

3-minute demo for the Tether Developers Cup 2026 (Round of 16 submission).

**Recording setup:** screen-record directly on the phone (Settings → quick panel → Screen recorder on Samsung). 1080p. Do a full dry run first — the LLM's first token takes ~30–60 s after tapping analyze, so **pre-warm the model** (run one analysis, then record the second run) or cut the wait in the edit. Voice-over recorded separately over the footage beats live narration.

---

## Scene 1 — Hook (0:00–0:20)

**Visual:** phone in hand, airplane-mode toggle visible in the quick panel. Open GoalMind.

**Narration:**
"90,000 fans in a stadium. Zero bars of signal. Every football app you own is dead — except this one. GoalMind runs its entire AI stack on the phone itself: Tether's QVAC. No cloud. No API keys. Nothing leaves the device."

---

## Scene 2 — On-device tactical analysis (0:20–1:10) ⭐ QVAC money shot

**Visual:** Home → tap a match → **Run Tactical Analysis** → tokens streaming in live. Let the streaming breathe on screen for 10+ seconds — it's the proof.

**Narration:**
"This is Llama 3.2 running locally through the QVAC SDK — on a $150 Samsung. Watch the tokens stream: real inference, on-device, informed by our statistical engine — Elo ratings, Poisson goal models, recent form. The AI agents behind this use QVAC's native tool calling to query a local RAG knowledge base and the prediction engine."

**Text on screen:** "Llama 3.2 1B · 100% on-device · QVAC SDK"

---

## Scene 3 — Camera vision (1:10–1:40)

**Visual:** Camera tab → point the phone at match footage playing on a laptop/TV → capture → vision analysis appears.

**Narration:**
"Point the camera at the pitch. A multimodal vision model — also fully on-device — reads the game: shapes, positioning, phase of play."

---

## Scene 4 — Wallet + the agent that can't overspend (1:40–2:40) ⭐ WDK money shot

**Visual:** Wallet tab → real address → balance (pre-funded from Sepolia faucet) → send a tip → tap the explorer link → **the transaction on sepolia.etherscan.io**. Then: agent settings → spending limit 1 USDt → trigger a larger agent tip → the **"Blocked by WDK policy"** rejection.

**Narration:**
"The wallet is fully self-custodial, built on Tether's WDK — keys generated and stored on-device. This tip is a real signed transaction; here it is on the block explorer. And this is the part we're proudest of: our AI agent has its own wallet, but its spending limits aren't app code — they're DENY rules registered in WDK's transaction policy engine. When the agent tries to exceed them, WDK refuses to sign. The agent cannot go rogue."

**Text on screen:** "WDK policy engine · PolicyViolationError before signing"

---

## Scene 5 — Offline proof + close (2:40–3:00)

**Visual:** enable airplane mode in the quick panel → run another analysis → it streams anyway.

**Narration:**
"Airplane mode. Still analyzing. GoalMind — the beautiful game, with AI that's actually yours. Built on QVAC and WDK for the Tether Developers Cup."

---

## Checklist before recording

- [ ] Model pre-warmed (one analysis run completed)
- [ ] Wallet pre-funded with Sepolia ETH from a faucet
- [ ] Agent spending limit set low for the rejection demo
- [ ] Match footage queued on a second screen for the camera scene
- [ ] Do Not Disturb ON (no notification popups in the recording)
- [ ] Battery > 50%, screen brightness max
