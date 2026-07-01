# GoalMind — Changelog

## [1.0.0] - 2026-06-28

### Added
- Initial project structure with Expo + React Native
- QVAC SDK integration for on-device AI
  - LLM inference for tactical analysis
  - Text-to-speech for commentary generation
  - Model lifecycle management (load, cache, unload)
- WDK integration for self-custodial wallet
  - Ethereum account derivation
  - Fan-to-fan tipping
  - Prediction staking
- Home screen with upcoming matches
- Match analysis screen with:
  - Tactical breakdown
  - Possession analysis
  - Threat indicators
  - Momentum gauge
  - Stats comparison
- Predictions screen with:
  - AI-powered match predictions
  - Win probability calculations
  - Expected goals (xG)
  - Confidence scores
- Wallet screen with:
  - Wallet creation
  - Balance display
  - Tip sending
  - Recent transactions
- Settings screen with:
  - AI model status
  - Wallet information
  - Tech stack details
- Dark theme UI with custom components:
  - Button (primary, secondary, outline, ghost)
  - Card (default, elevated, outlined)
  - Badge (filled, outline)
  - Progress Bar
  - Stat Display
  - Empty State
- State management with Zustand:
  - AI Store
  - Match Store
  - Wallet Store
- Custom hooks:
  - useAI — AI model lifecycle and inference
  - useWallet — Wallet operations
- Utility functions:
  - Number formatting
  - Date formatting
  - Win probability calculation
  - Expected goals calculation
- TypeScript type definitions:
  - Match types
  - Team types
  - Player types
  - Analysis types
  - Wallet types
  - Theme types
- Documentation:
  - README
  - Architecture guide
  - Contributing guide
  - Demo video script
  - Changelog

### Technical Details
- Expo SDK 52
- React Native 0.76
- TypeScript 5.3
- Zustand 5.0
- NativeWind 4.0
- MIT License

### Tracks
- QVAC Track — On-device AI inference
- WDK Track — Self-custodial wallet

### Author
Farouk Allani (@farouk_allani)
