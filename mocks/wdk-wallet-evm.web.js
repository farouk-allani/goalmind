// Web-only stub for @tetherto/wdk-wallet-evm.
//
// It is imported by lib/wallet/wdk.ts but not actually referenced, so an empty
// default export is enough to let the web bundle resolve. Aliased in
// metro.config.js for `platform === 'web'`; native builds use the real package.

export default {};
