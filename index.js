// GoalMind — App entry.
// Polyfills must load before anything else: @tetherto/wdk's dependency chain
// (ethers, bip39, @noble/hashes/@noble/curves) needs `crypto.getRandomValues`
// for seed generation and key derivation, and ethers + wdk-wallet-evm's HD
// node/signing-key code needs a global `Buffer` — neither is provided natively
// by Hermes/React Native.
//
// Deliberately using require() here, not import: Babel hoists ES `import`
// declarations above other statements, which would have run `expo-router/entry`
// (and its whole transitive require graph) before `global.Buffer` was set.
// Plain require() calls execute strictly in the order written, guaranteeing
// both polyfills are installed before any wallet code ever loads.
require('react-native-get-random-values');
global.Buffer = global.Buffer || require('buffer').Buffer;
require('expo-router/entry');
