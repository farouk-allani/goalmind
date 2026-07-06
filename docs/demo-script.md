# GoalMind — Demo Video Script (Director's Cut)

Full shooting script for the **Tether Developers Cup 2026** submission.
Every screen, every tap, every line of narration — plus a tight 3-minute cut for the actual submission.

**The two money shots (never cut these):**
1. **QVAC** — Llama 3.2 streaming a tactical analysis *token by token*, on-device, in airplane mode.
2. **WDK** — the AI agent's tip getting **rejected by WDK's policy engine before signing** (`PolicyViolationError`).

Everything else is supporting cast. If you only have 3 minutes, shoot the **[CORE]** scenes. If you're doing a longer walkthrough for judges, shoot the **[EXTENDED]** scenes too.

---

## 0. Pre-flight checklist (do this the day before)

### Device
- [ ] Physical Android phone (native build — **not** Expo Go; QVAC/WDK need native). Samsung A-series is fine.
- [ ] Storage: **≥ 3 GB free** (Llama 1B ≈ 800 MB, SmolVLM2 vision ≈ 600 MB, TTS + embeddings on top).
- [ ] Battery > 60%, brightness max, **Do Not Disturb ON** (no notification banners in frame).
- [ ] Screen recorder ready (Samsung: quick panel → Screen recorder, 1080p, "Media sounds" on).

### Pre-warm ALL models (critical — first-token latency is 30–60 s cold)
Do a full dry run so every model is already downloaded and cached before you record:
1. Open the app, wait for Home to show **"On-device AI"** (green dot) — that's Llama finished downloading.
2. Open a match → **Analysis → Run Tactical Analysis** → let it fully stream once. (warms LLM)
3. Match → **Commentary → Demo: Goal!** → then tap the 🔊 speaker on the line. (warms TTS)
4. Match → **Camera → Open Camera → capture once**. (warms the SmolVLM2 vision model)
> After this, every feature responds in seconds on the real take.

### Fund the wallet (for the real on-chain scenes)
- [ ] Open **Fan Wallet** → let it create/restore, then **tap the address to copy it**.
- [ ] Send it **Sepolia ETH** from a faucet (for gas) — e.g. a Sepolia PoW/Google faucet.
- [ ] Send it **test USDT on Sepolia** (contract `0xc09BeC6f0AedFeb78792D84147648fF30647Dae4`, 6 decimals) so the **USDt balance shows real value** and tips move a real ERC-20.
- [ ] Pull-to-refresh the wallet; confirm **native ETH** and **USDt** both show non-zero.

### Demo-data tip (makes the analysis look strong)
Use a **bundled sample match with full season stats** — **Argentina vs France** or **Brazil vs Germany**. These populate the possession bar, momentum gauge, stats comparison, and give **meaningful prediction factors**. Live-API fixtures with no season history render a flat *0–0 / 0%* and look weak on camera. Easiest way to force samples: keep the phone in **airplane mode** (the app falls back to the bundled fixtures).

### Agent
- [ ] Fan Wallet → scroll to **AI AGENT (QVAC + WDK)** → **Initialize Agent Wallet** (it also auto-inits when your wallet is ready).
- [ ] Confirm the agent shows an address + **LIVE** badge.

---

## 1. The 3-minute competition cut (shot list)

| Time | Scene | Screen | The beat |
|------|-------|--------|----------|
| 0:00–0:18 | Hook | Home, airplane mode visible | "Stadium. No signal. This app still works." |
| 0:18–1:05 | **QVAC money shot** | Match → Analysis | Tap **Run Tactical Analysis**, tokens stream live |
| 1:05–1:30 | Prediction engine | Match → Predict | Win %, xG, predicted score, factors |
| 1:30–1:55 | Camera vision | Match → Camera | Point at footage → on-device vision read |
| 1:55–2:40 | **WDK money shot** | Fan Wallet → Agent | Real tip on-chain, then policy **DENY** |
| 2:40–3:00 | Offline proof + close | Home, airplane mode | Analyze again offline, sign-off |

Narration for the tight cut is embedded in the matching **[CORE]** scenes below — just read those lines.

---

## 2. Extended walkthrough (exact step-by-step)

Read the **Narration** aloud (or record voice-over separately over the footage — cleaner). **Do** is exactly what your thumb does. **On screen** is text/lower-thirds to add in the edit.

### Scene A — Cold open / onboarding  ·  [EXTENDED, optional]
**Do:** Fresh install → the branded splash (spinning ball) → onboarding. Swipe/tap **Next** through the 4 cards:
1. *GoalMind for the Cup* → 2. *True On-Device AI (QVAC)* → 3. *Self-Custodial WDK Wallet* → 4. *Stadium Ready. Offline First.* → tap **Enter GoalMind**.

**Narration:**
"GoalMind is an AI football companion built for one hostile environment: a packed stadium with no connectivity. Four ideas — on-device AI, a self-custodial wallet, an autonomous agent, and everything working offline."

**On screen:** "QVAC · WDK · 100% on-device"

> If you already onboarded, tap **Skip** or just start the recording on the Matches tab.

---

### Scene B — Home / Matches  ·  [CORE — this is your hook]
**Do:**
1. Start on the **Matches** tab. Pull the quick panel so the **airplane-mode** icon is visibly ON, then dismiss it.
2. Point out the top-right status pill: **"On-device AI"** with a green dot.
3. Slow scroll through the match list (Argentina vs France, Brazil vs Germany). Each card shows the competition, teams, kickoff, and the footer **"Tactical AI · Prediction · Staking"**.

**Narration (this is the 0:00–0:18 hook):**
"90,000 fans, zero bars of signal. Every football app you own just died — except this one. GoalMind runs its **entire** AI stack on the phone itself, on Tether's QVAC. No cloud, no API keys, nothing leaves the device."

**On screen:** "Airplane mode ON · Matches load · AI ready"

**Do:** Tap the **Argentina vs France** card → it opens the match detail (modal slides up).

---

### Scene C — Match detail · Analysis tab  ·  [CORE — QVAC money shot]
**Do:**
1. You land on the **Analysis** tab. You'll see the empty state **"Run AI Analysis"**.
2. Tap **Run Tactical Analysis**.
3. It shows **"Analyzing on-device…"**, then the **tokens start streaming into the "Tactical read · generated on-device" card**. **Let it breathe on screen for 10+ seconds — this is the proof.** Above it, the possession bar, momentum gauge, and head-to-head stats are populated from the same match data.

**Narration (0:18–1:05):**
"This is Llama 3.2, running locally through the QVAC SDK, on a mid-range Android. Watch the tokens stream in real time — genuine inference, on the device. And it's grounded: our statistical engine feeds it Elo ratings, a Poisson goal model, and recent form, so the tactical read is anchored to real numbers, not hallucinated."

**On screen:** "Llama 3.2 1B · streaming · 100% on-device · QVAC SDK"

**Do (persistence beat — shows off the polish):** Tap **Predict** then tap back to **Analysis**. The generated analysis is **still there** — it's cached per match, no regeneration needed.

---

### Scene D — Match detail · Predict tab  ·  [CORE]
**Do:**
1. Tap the **Predict** tab.
2. Walk through the card top-to-bottom: **win probabilities** (home / draw / away), the colored **probability bar**, **Expected Goals (xG)** for each side, and the gold **"Predicted Score: X - Y"**.
3. Scroll to the **Prediction Factors** card — read 2–3 factors aloud (Rating, Home Advantage, Recent Form, Possession, Defense), each with its signed % impact.

**Narration (1:05–1:30):**
"The prediction engine is fully deterministic and on-device: Elo-based strength, a Poisson distribution over scorelines, and weighted recent form. Every factor is transparent — you see exactly why it favors one side."

**On screen:** "Elo + Poisson + form · explainable · offline"

> Leave the **Stake 1.5 USDt** button for the wallet scene — just mention "and you can act on it," then move on.

---

### Scene E — Match detail · Commentary tab  ·  [EXTENDED]
**Do:**
1. Tap the **Commentary** tab. (The LLM is pre-warmed, so the demo buttons are enabled.)
2. Tap a language pill — **EN / FR / ES** — to set the voice.
3. Tap **Demo: Goal!** → a line of AI commentary appears in the feed (e.g. *"[67'] …"*).
4. Tap the **🔊 speaker** icon on that line → on-device TTS speaks it aloud. (Make sure "media sounds" is captured in the recording.)
5. Optional: tap **Demo: Save** for a second line.

**Narration:**
"Live, generative commentary — also fully on-device. Pick a language, and the same QVAC stack writes the line and speaks it with an on-device neural voice. In a stadium, offline, in the fan's own language."

**On screen:** "Generative commentary + on-device TTS · multilingual"

---

### Scene F — Match detail · Camera tab  ·  [CORE — condensed / EXTENDED — full]
**Do:**
1. Tap the **Camera** tab → tap **Open Camera** → grant permission if prompted.
2. Point the phone at match footage on a **second screen** (laptop/TV) inside the corner guide ("Point at match").
3. Tap the **scan** capture button → it shows **"Analyzing on-device…"**.
4. Close the camera → the **Camera Analysis** card shows the vision model's read of the scene.

**Narration (1:30–1:55):**
"Point the camera at the pitch. A multimodal vision model — SmolVLM2, also running entirely on-device — reads the frame: shapes, positioning, phase of play. No frame ever leaves the phone."

**On screen:** "SmolVLM2 500M · on-device vision · no upload"

> Vision is the slowest model. Keep this beat short in the tight cut, or trust the pre-warm and cut any dead air in the edit.

---

### Scene G — Predictions tab  ·  [EXTENDED]
**Do:**
1. Bottom tab → **Predictions**.
2. Tap **Generate Predictions** (button reads **"Computing…"** briefly).
3. The summary card animates: the **Avg Confidence** ring, plus tiles for **Matches**, **High Confidence**, **Avg Total xG**.
4. Scroll the per-match cards; tap one to **expand its factors** (chevron → "View factors").

**Narration:**
"Across all fixtures at once: the engine ranks every matchup by confidence and expected goals, on-device, in a fraction of a second. Tap any match to see the factors behind the number."

**On screen:** "Batch predictions · on-device · fully private"

---

### Scene H — Fan Wallet · identity & balances  ·  [CORE — setup for WDK shot]
**Do:**
1. Bottom tab → **Fan Wallet**. It **auto-restores** your existing wallet (no "create" prompt on a returning device) and shows **Connected**.
2. Read the **NATIVE BALANCE** (your funded Sepolia ETH) and the **USDt** line (your funded test USDT).
3. **Tap the address row** → a smooth toast slides up: **"Wallet address copied"**, and the icon flips to a green ✓. (No modal popup — clean UX.)
4. Swipe the **chain selector** (Sepolia · Ethereum · Polygon · Arbitrum · Optimism) to show multi-chain. Return to **Sepolia**.
5. Point out **"Seed phrase backed up"** — keys are on-device in the secure enclave.

**Narration:**
"The wallet is fully self-custodial, built on Tether's WDK. Keys are generated and stored on the device — here's a real balance on Sepolia. Multi-chain, and your seed never leaves the secure store."

**On screen:** "WDK · self-custodial · keys on-device"

---

### Scene I — Fan Wallet · a real signed transaction  ·  [CORE]
**Do:**
1. In **Send a Tip**, paste any address (or use a fan/demo address), enter a small amount (e.g. `1.5`), optional message → **Send Tip**.
   *(Alternatively, use the **Stake 1.5 USDt (real WDK)** button on a Predict card — same real transfer.)*
2. It confirms the send. Because Sepolia now has a USDT contract wired in, this moves a **real ERC-20 USDT** transfer, signed locally by WDK.
3. Open **sepolia.etherscan.io** for your address on the second screen and show the transaction landing.

**Narration (1:55–2:15):**
"This tip is a real, locally-signed transaction — here it is confirming on the block explorer. The keys signed it on the phone; WDK broadcast it."

**On screen:** "Real ERC-20 transfer · signed on-device"

---

### Scene J — Fan Wallet · the agent that CAN'T overspend  ·  [CORE — WDK money shot]
**Do:**
1. Scroll to **AI AGENT (QVAC + WDK)** — it shows the agent's own address, balance, and a **LIVE** badge.
2. Tap **Evaluate (real)** → an alert shows the agent's reasoning about the current match prediction (should it tip, how much, why). This is the LLM-driven decision.
3. Set the **Per-transaction cap** to a small number and tap **Apply Limit** (e.g. cap = `1`). Note the copy: *"enforced by WDK."*
4. Tap the one-tap demo button: **"Demo: Set 1 USDt limit & try 5 USDt (expect DENY)."**
5. The agent attempts a 5 USDt tip → **WDK rejects it before signing** → the red **"Blocked by WDK Policy"** result appears (`PolicyViolationError`). Show the **Agent History** line marked **⛔ (policy)**.

**Narration (2:15–2:40):**
"And this is the part we're proudest of. The agent has its **own** wallet — but its spending limits aren't app code you could patch out. They're **DENY rules registered in WDK's transaction policy engine**. When the agent tries to exceed its budget, **WDK refuses to sign** — a PolicyViolationError, before the transaction is ever created. The agent literally cannot go rogue."

**On screen:** "WDK policy engine · PolicyViolationError · blocked before signing"

**Do (optional flex):** Tap **Simulate (WDK)** to show the same allow/deny decision as a dry-run, and **Contribute 2.50 USDt** under **Group Tipping Pools** for another real transfer. Show **Recent Activity** listing the real flows (sent + blocked).

---

### Scene K — Settings  ·  [EXTENDED]
**Do:** Bottom tab → **Settings**. Slow scroll:
- **AI Models** — LLM Status *Loaded*, model name, **Inference: On-Device (QVAC)**, **Data Privacy: No Cloud**.
- **Wallet** — *Self-Custodial (WDK)*, supported chains.
- **App Info** — version, *Built For: Tether Developers Cup 2026*, author.
- **Tech Stack** and the **Features** grid.

**Narration:**
"Everything the app claims is verifiable right here: models loaded on-device, no cloud, self-custodial wallet. One coherent stack — QVAC for intelligence, WDK for money."

**On screen:** "On-device AI · No cloud · Self-custodial"

---

### Scene L — Offline proof + close  ·  [CORE]
**Do:**
1. Open the quick panel — **airplane mode is (still) ON** (you've been offline the whole time, but make it explicit now).
2. Go back to a match → **Analysis → Run Tactical Analysis** → it **streams anyway**.

**Narration (2:40–3:00):**
"Airplane mode — still on. Still analyzing. GoalMind: the beautiful game, with AI and money that are actually *yours*. Built on QVAC and WDK for the Tether Developers Cup."

**On screen:** "Offline. Private. Yours. · QVAC + WDK"

---

## 3. Narration cheat-sheet (QVAC / WDK talking points)

Drop these in if a judge-facing cut needs more depth:
- **QVAC**: Llama 3.2 1B (analysis, commentary, agent reasoning), SmolVLM2 500M (vision), Supertonic 3 (TTS), EmbeddingGemma 300M (RAG) — all loaded from the QVAC registry and run on-device via the QVAC SDK. CPU inference (mobile GPU Vulkan path disabled for stability). Structured output uses QVAC's grammar-constrained JSON.
- **WDK**: `new WDK(seed)` → per-chain `registerWallet` → `account.transfer()` signs locally. The agent is a **separate** self-custodial wallet; its limits are **transaction policies** in WDK — `simulate.transfer()` returns ALLOW/DENY, and a real `transfer()` over budget throws **`PolicyViolationError` before signing**. That's the guarantee: policy is enforced by the wallet kit, not by app code.

---

## 4. Troubleshooting / fallbacks (while filming)

- **First token hangs 30–60 s** → you skipped the pre-warm. Cold LLM. Re-warm, re-shoot, or cut the wait.
- **Analysis shows a "⚠ On-device AI unavailable" fallback** → the model failed to load (storage/first-run). It still shows the honest statistical summary; prefer to fix storage and re-shoot the streaming beat.
- **USDt shows 0** → you're on a chain without the token, or funds haven't been re-read. Ensure **Sepolia** is selected and **pull-to-refresh**; balances also auto-refresh every ~15 s while the wallet is open.
- **Predicted score is 0–0, factors all 0%** → you picked a live-API fixture with no season stats. Use a **bundled sample match** (airplane mode forces this).
- **Camera analysis errors** → vision model (~600 MB) not downloaded or low storage. Pre-warm it; needs a native build on a real device.
- **Agent buttons do nothing** → agent not initialized. Tap **Initialize Agent Wallet** (or ensure the user wallet is ready — it auto-inits).

---

## 5. Final checklist before you hit record

- [ ] All 4 models pre-warmed (LLM, vision, TTS, embeddings)
- [ ] Wallet funded on **Sepolia**: ETH (gas) **and** test USDT — both showing non-zero
- [ ] Agent initialized (LIVE badge)
- [ ] Demo match = a **sample** with full stats (Argentina vs France)
- [ ] Second screen queued: match footage (camera) + etherscan (tx proof)
- [ ] Airplane mode ON, Do Not Disturb ON, brightness max, battery > 60%
- [ ] Screen recorder at 1080p with media sounds captured (for TTS)
- [ ] Voice-over script rehearsed; timings hit the 3-minute cut
