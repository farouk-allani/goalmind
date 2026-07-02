// Learn more: https://docs.expo.dev/guides/customizing-metro/
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// The @tetherto/wdk packages expose sub-paths (e.g. "@tetherto/wdk-wallet/protocols")
// only through their package.json "exports" maps. Expo SDK 52's Metro has
// package-exports resolution disabled by default, so enable it here.
config.resolver.unstable_enablePackageExports = true;

// --- Web preview mocks -------------------------------------------------------
// @qvac/sdk (on-device AI) and @tetherto/wdk (wallet) are NATIVE-only SDKs that
// cannot bundle or run in a browser. For `--web` we swap them for lightweight
// mocks so the UI is browsable. Native builds (android/ios) keep the real SDKs.
const WEB_MOCKS = {
  '@qvac/sdk': path.resolve(__dirname, 'mocks/qvac.web.js'),
  '@tetherto/wdk': path.resolve(__dirname, 'mocks/wdk.web.js'),
  '@tetherto/wdk-wallet-evm': path.resolve(__dirname, 'mocks/wdk-wallet-evm.web.js'),
};

const upstreamResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && WEB_MOCKS[moduleName]) {
    return { type: 'sourceFile', filePath: WEB_MOCKS[moduleName] };
  }
  // sodium-universal resolves to the sodium-native C addon, which Metro cannot
  // bundle (it targets Node/Bare). The pure-JS implementation covers everything
  // WDK uses in-app (sodium_memzero). The QVAC Bare worker is bundled separately
  // by bare-pack and keeps the real native addon there.
  if (moduleName === 'sodium-native') {
    return (upstreamResolveRequest || context.resolveRequest)(context, 'sodium-javascript', platform);
  }
  return (upstreamResolveRequest || context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
