// GoalMind — WDK Wallet Integration
// Self-custodial wallet built on @tetherto/wdk. The user holds their own keys.
//
// Real WDK flow: new WDK(seed) → registerWallet(chain, WalletManagerEvm, { provider })
// → getAccount(chain, index) → account.transfer()/sendTransaction() signs locally
// and broadcasts through the configured RPC provider.
//
// Default chain is Sepolia testnet so judges can fund the wallet from a faucet
// and watch real on-chain transactions. Mainnet chains (with real USDt) are
// one tap away in the chain switcher.

import WDK, { PolicyViolationError } from '@tetherto/wdk';
import WDKWalletEVM from '@tetherto/wdk-wallet-evm';
import * as SecureStore from 'expo-secure-store';

// ---- Types ----

export type ChainId = 'sepolia' | 'ethereum' | 'polygon' | 'arbitrum' | 'optimism';

/**
 * The account surface this app uses. WDK's JSDoc-derived
 * `IWalletAccountWithProtocols` type only declares protocol methods, so we
 * narrow to the real runtime surface (see @tetherto/wdk-wallet-evm docs).
 */
export interface WdkAccount {
  getAddress(): Promise<string>;
  transfer(options: {
    token: string;
    recipient: string;
    amount: number | bigint;
  }): Promise<{ hash: string; fee: bigint }>;
  sendTransaction(tx: {
    to: string;
    value?: number | bigint;
    data?: string;
  }): Promise<{ hash: string; fee: bigint }>;
  simulate: {
    transfer(options: object): Promise<{ decision: 'ALLOW' | 'DENY'; reason?: string }>;
    sendTransaction(tx: object): Promise<{ decision: 'ALLOW' | 'DENY'; reason?: string }>;
  };
}

/** Fetch a chain account with the app-facing account type. */
export async function getWdkAccount(wdk: WDK, chain: ChainId, index = 0): Promise<WdkAccount> {
  return (await wdk.getAccount(chain, index)) as unknown as WdkAccount;
}

export interface ChainConfig {
  chainId: number;
  name: string;
  testnet: boolean;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  /** USDt (ERC-20) contract — null on chains without a canonical USDt deployment. */
  usdtAddress: string | null;
}

export interface WalletInstance {
  wdk: WDK;
  account: WdkAccount;
  address: string;
  chain: ChainId;
  initialized: boolean;
}

export interface TransactionResult {
  txHash: string;
  success: boolean;
  /** What was actually sent: USDt on mainnet chains, native coin on testnet. */
  asset: string;
  error?: string;
  /** True when a WDK transaction policy blocked the operation before signing. */
  rejectedByPolicy?: boolean;
  policyReason?: string;
}

// ---- Chain Configs ----

export const CHAINS: Record<ChainId, ChainConfig> = {
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia (testnet)',
    testnet: true,
    rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
    explorerUrl: 'https://sepolia.etherscan.io',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    usdtAddress: null,
  },
  ethereum: {
    chainId: 1,
    name: 'Ethereum',
    testnet: false,
    rpcUrl: 'https://eth.llamarpc.com',
    explorerUrl: 'https://etherscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    usdtAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  },
  polygon: {
    chainId: 137,
    name: 'Polygon',
    testnet: false,
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
    usdtAddress: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  },
  arbitrum: {
    chainId: 42161,
    name: 'Arbitrum',
    testnet: false,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    usdtAddress: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
  },
  optimism: {
    chainId: 10,
    name: 'Optimism',
    testnet: false,
    rpcUrl: 'https://mainnet.optimism.io',
    explorerUrl: 'https://optimistic.etherscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    usdtAddress: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
  },
};

export const DEFAULT_CHAIN: ChainId = 'sepolia';

const SEED_STORAGE_KEY = 'goalmind_wallet_seed';
const USDT_DECIMALS = 6;

// ---- Seed Phrase Management ----

/**
 * Generate a new BIP-39 seed phrase via WDK.
 * The seed never leaves the device.
 */
export function generateSeedPhrase(): string {
  return WDK.getRandomSeedPhrase();
}

/**
 * Validate a seed phrase with WDK's real BIP-39 validation
 * (wordlist + checksum), not just shape checks.
 */
export function validateSeedPhrase(phrase: string): {
  valid: boolean;
  error?: string;
} {
  const normalized = phrase.trim().toLowerCase().replace(/\s+/g, ' ');
  const words = normalized.split(' ');
  if (words.length !== 12 && words.length !== 24) {
    return { valid: false, error: 'Seed phrase must be 12 or 24 words' };
  }
  if (!WDK.isValidSeed(normalized)) {
    return { valid: false, error: 'Not a valid BIP-39 seed phrase' };
  }
  return { valid: true };
}

/**
 * Securely store seed phrase on device (Keychain / Keystore).
 */
export async function storeSeedPhrase(phrase: string): Promise<void> {
  await SecureStore.setItemAsync(SEED_STORAGE_KEY, phrase, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function getStoredSeedPhrase(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(SEED_STORAGE_KEY);
  } catch {
    return null;
  }
}

export async function deleteStoredSeedPhrase(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(SEED_STORAGE_KEY);
  } catch {
    // ignore
  }
}

// ---- Wallet Setup ----

/**
 * Create a WDK instance with every supported chain registered.
 * Each chain gets its own WalletManagerEvm bound to a public RPC provider.
 */
export function createWdk(seed: string): WDK {
  let wdk = new WDK(seed);
  for (const [chainId, config] of Object.entries(CHAINS)) {
    wdk = wdk.registerWallet(
      chainId,
      WDKWalletEVM as unknown as Parameters<WDK['registerWallet']>[1],
      { provider: config.rpcUrl } as unknown as Parameters<WDK['registerWallet']>[2]
    );
  }
  return wdk;
}

/**
 * Initialize a self-custodial wallet.
 * Restores from the provided seed, then secure storage, or generates a new one.
 */
export async function initializeWallet(
  seedPhrase?: string,
  chain: ChainId = DEFAULT_CHAIN
): Promise<WalletInstance> {
  let seed = seedPhrase ?? (await getStoredSeedPhrase()) ?? undefined;

  if (!seed) {
    seed = generateSeedPhrase();
    await storeSeedPhrase(seed);
  }

  const wdk = createWdk(seed);
  const account = await getWdkAccount(wdk, chain);
  const address = await account.getAddress();

  return { wdk, account, address, chain, initialized: true };
}

/**
 * Get the account for a chain and return its address.
 */
export async function switchChain(wdk: WDK, chain: ChainId): Promise<string> {
  const account = await getWdkAccount(wdk, chain);
  return account.getAddress();
}

// ---- Balance Reads (keyless public RPC) ----

async function rpcCall(chain: ChainId, method: string, params: unknown[]): Promise<string | null> {
  try {
    const response = await fetch(CHAINS[chain].rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }),
    });
    const data = await response.json();
    return typeof data.result === 'string' ? data.result : null;
  } catch (error) {
    console.warn(`[Wallet] RPC ${method} failed:`, error);
    return null;
  }
}

/** Format a base-unit bigint as a decimal string without float precision loss. */
function formatUnits(value: bigint, decimals: number, displayDecimals: number): string {
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const base = 10n ** BigInt(decimals);
  const whole = abs / base;
  const fraction = (abs % base).toString().padStart(decimals, '0').slice(0, displayDecimals);
  return `${negative ? '-' : ''}${whole}${displayDecimals > 0 ? '.' + fraction : ''}`;
}

/** Parse a decimal amount string to base units. */
export function toBaseUnits(amount: string, decimals: number): bigint {
  const [whole = '0', fraction = ''] = amount.trim().split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole || '0') * 10n ** BigInt(decimals) + BigInt(paddedFraction || '0');
}

/**
 * Native coin balance for an address.
 */
export async function getBalance(address: string, chain: ChainId = DEFAULT_CHAIN): Promise<string> {
  const result = await rpcCall(chain, 'eth_getBalance', [address, 'latest']);
  if (!result) return '0.000000';
  return formatUnits(BigInt(result), 18, 6);
}

/**
 * USDt (ERC-20) balance for an address. Returns '0.00' on chains without USDt.
 */
export async function getUSDTBalance(address: string, chain: ChainId = DEFAULT_CHAIN): Promise<string> {
  const config = CHAINS[chain];
  if (!config.usdtAddress) return '0.00';

  // balanceOf(address) selector 0x70a08231
  const data = `0x70a08231${address.slice(2).padStart(64, '0')}`;
  const result = await rpcCall(chain, 'eth_call', [{ to: config.usdtAddress, data }, 'latest']);
  if (!result || result === '0x') return '0.00';
  return formatUnits(BigInt(result), USDT_DECIMALS, 2);
}

// ---- Transactions ----

/**
 * Send a tip. Signed locally by WDK with the user's own keys and broadcast
 * through the chain's RPC provider.
 *
 * - Mainnet chains: real USDt ERC-20 transfer via `account.transfer()`.
 * - Sepolia testnet: native ETH transfer via `account.sendTransaction()`
 *   (no canonical USDt on Sepolia), so the flow is demoable with faucet funds.
 */
export async function createTip(
  wdk: WDK,
  toAddress: string,
  amount: string,
  chain: ChainId = DEFAULT_CHAIN
): Promise<TransactionResult> {
  try {
    const account = await getWdkAccount(wdk, chain);
    const config = CHAINS[chain];

    if (config.usdtAddress) {
      const result = await account.transfer({
        token: config.usdtAddress,
        recipient: toAddress,
        amount: toBaseUnits(amount, USDT_DECIMALS),
      });
      return { txHash: result.hash, success: true, asset: 'USDt' };
    }

    // Testnet: tip in native coin (interpreting the amount as ETH).
    const result = await account.sendTransaction({
      to: toAddress,
      value: toBaseUnits(amount, 18),
    });
    return { txHash: result.hash, success: true, asset: config.nativeCurrency.symbol };
  } catch (error) {
    if (error instanceof PolicyViolationError) {
      return {
        txHash: '',
        success: false,
        asset: '',
        error: error.message,
        rejectedByPolicy: true,
        policyReason: (error as unknown as { reason?: string }).reason ?? error.message,
      };
    }
    return {
      txHash: '',
      success: false,
      asset: '',
      error: error instanceof Error ? error.message : 'Transaction failed',
    };
  }
}

// ---- Display Utilities ----

/** Format address for display (0x1234...5678). */
export function formatAddress(address: string): string {
  if (!address || address.length < 10) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/** Format token amount for display. */
export function formatAmount(amount: string | number, decimals: number = 4): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0.00';
  return num.toFixed(decimals);
}

export function getExplorerTxUrl(txHash: string, chain: ChainId): string {
  return `${CHAINS[chain].explorerUrl}/tx/${txHash}`;
}

export function getExplorerAddressUrl(address: string, chain: ChainId): string {
  return `${CHAINS[chain].explorerUrl}/address/${address}`;
}
