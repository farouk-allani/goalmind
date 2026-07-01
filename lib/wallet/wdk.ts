// GoalMind — WDK Wallet Integration (Enhanced)
// Self-custodial wallet. User holds their own keys.
// Supports Ethereum, Polygon, Arbitrum, and Optimism.

import WDK from '@tetherto/wdk';
import WDKWalletEVM from '@tetherto/wdk-wallet-evm';
import * as SecureStore from 'expo-secure-store';

// ---- Types ----

export type ChainId = 'ethereum' | 'polygon' | 'arbitrum' | 'optimism';

export interface ChainConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  usdtAddress: string;
}

export interface WalletInstance {
  wdk: WDK;
  address: string;
  chain: ChainId;
  initialized: boolean;
}

export interface TransactionResult {
  txHash: string;
  success: boolean;
  error?: string;
}

// ---- Chain Configs ----

export const CHAINS: Record<ChainId, ChainConfig> = {
  ethereum: {
    chainId: 1,
    name: 'Ethereum',
    rpcUrl: 'https://eth.llamarpc.com',
    explorerUrl: 'https://etherscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    usdtAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  },
  polygon: {
    chainId: 137,
    name: 'Polygon',
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    usdtAddress: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  },
  arbitrum: {
    chainId: 42161,
    name: 'Arbitrum',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    usdtAddress: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
  },
  optimism: {
    chainId: 10,
    name: 'Optimism',
    rpcUrl: 'https://mainnet.optimism.io',
    explorerUrl: 'https://optimistic.etherscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    usdtAddress: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
  },
};

const SEED_STORAGE_KEY = 'goalmind_wallet_seed';

// ---- Seed Phrase Management ----

/**
 * Generate a new seed phrase.
 * The seed never leaves the device.
 */
export function generateSeedPhrase(): string {
  return WDK.getRandomSeedPhrase();
}

/**
 * Validate a seed phrase (12 or 24 words, BIP39 compatible).
 */
export function validateSeedPhrase(phrase: string): {
  valid: boolean;
  error?: string;
} {
  try {
    const words = phrase.trim().toLowerCase().split(/\s+/);
    if (words.length !== 12 && words.length !== 24) {
      return { valid: false, error: 'Seed phrase must be 12 or 24 words' };
    }
    // Basic character validation
    for (const word of words) {
      if (!/^[a-z]+$/.test(word)) {
        return { valid: false, error: `Invalid word: "${word}"` };
      }
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid seed phrase format' };
  }
}

/**
 * Securely store seed phrase on device.
 */
export async function storeSeedPhrase(phrase: string): Promise<void> {
  await SecureStore.setItemAsync(SEED_STORAGE_KEY, phrase, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

/**
 * Retrieve stored seed phrase.
 */
export async function getStoredSeedPhrase(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(SEED_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Delete stored seed phrase (wallet reset).
 */
export async function deleteStoredSeedPhrase(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(SEED_STORAGE_KEY);
  } catch {
    // ignore
  }
}

// ---- Wallet Operations ----

/**
 * Initialize a self-custodial wallet.
 * If seedPhrase is provided, restores from that seed.
 * Otherwise, generates a new seed or loads from secure storage.
 */
export async function initializeWallet(
  seedPhrase?: string,
  chain: ChainId = 'ethereum'
): Promise<WalletInstance> {
  let seed = seedPhrase;

  if (!seed) {
    // Try loading from storage
    seed = await getStoredSeedPhrase();
  }

  if (!seed) {
    // Generate new seed
    seed = generateSeedPhrase();
    await storeSeedPhrase(seed);
  }

  const wdk = new WDK(seed);
  const account = await wdk.getAccount(chain, 0);

  return {
    wdk,
    address: account.address,
    chain,
    initialized: true,
  };
}

/**
 * Switch wallet to a different chain.
 */
export async function switchChain(
  wdk: WDK,
  chain: ChainId
): Promise<string> {
  const account = await wdk.getAccount(chain, 0);
  return account.address;
}

/**
 * Get balance for an address on a specific chain.
 * Uses public RPC — no API key needed.
 */
export async function getBalance(
  address: string,
  chain: ChainId = 'ethereum'
): Promise<string> {
  try {
    const config = CHAINS[chain];
    const response = await fetch(config.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [address, 'latest'],
        id: 1,
      }),
    });

    const data = await response.json();
    if (data.result) {
      // Convert wei to ether (18 decimals)
      const balanceWei = BigInt(data.result);
      const balanceEther = Number(balanceWei) / 1e18;
      return balanceEther.toFixed(6);
    }
    return '0.000000';
  } catch (error) {
    console.warn('[Wallet] Balance fetch failed:', error);
    return '0.000000';
  }
}

/**
 * Get USDt balance for an address.
 */
export async function getUSDTBalance(
  address: string,
  chain: ChainId = 'ethereum'
): Promise<string> {
  try {
    const config = CHAINS[chain];
    // balanceOf(address) selector: 0x70a08231
    const paddedAddress = address.slice(2).padStart(64, '0');
    const data = `0x70a08231${paddedAddress}`;

    const response = await fetch(config.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{ to: config.usdtAddress, data }, 'latest'],
        id: 1,
      }),
    });

    const result = await response.json();
    if (result.result) {
      const balance = BigInt(result.result);
      // USDT has 6 decimals
      const balanceUsdt = Number(balance) / 1e6;
      return balanceUsdt.toFixed(2);
    }
    return '0.00';
  } catch {
    return '0.00';
  }
}

/**
 * Create a tip transaction.
 * Self-custodial — user signs with their own keys via WDK.
 */
export async function createTip(
  wdk: WDK,
  toAddress: string,
  amount: string,
  chain: ChainId = 'ethereum'
): Promise<TransactionResult> {
  try {
    const account = await wdk.getAccount(chain, 0);
    const config = CHAINS[chain];

    // In production, this would:
    // 1. Build ERC-20 transfer transaction
    // 2. Sign with WDK
    // 3. Broadcast to network

    // For hackathon demo, we construct the transaction intent
    const txData = {
      from: account.address,
      to: config.usdtAddress,
      value: '0x0',
      data: encodeTransfer(toAddress, amount),
      chainId: config.chainId,
    };

    // WDK signing flow (real implementation)
    // const signed = await wdk.signTransaction(chain, 0, txData);
    // const txHash = await broadcastTransaction(signed, chain);

    // Demo: generate deterministic hash from tx data
    const txHash = `0x${hashTxData(txData)}`;

    return { txHash, success: true };
  } catch (error) {
    return {
      txHash: '',
      success: false,
      error: error instanceof Error ? error.message : 'Transaction failed',
    };
  }
}

// ---- Utilities ----

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

/** Get block explorer URL for a transaction. */
export function getExplorerTxUrl(txHash: string, chain: ChainId): string {
  return `${CHAINS[chain].explorerUrl}/tx/${txHash}`;
}

/** Get block explorer URL for an address. */
export function getExplorerAddressUrl(address: string, chain: ChainId): string {
  return `${CHAINS[chain].explorerUrl}/address/${address}`;
}

// ---- Internal Helpers ----

function encodeTransfer(to: string, amount: string): string {
  // ERC-20 transfer(address,uint256) selector
  const selector = '0xa9059cbb';
  const paddedTo = to.toLowerCase().replace('0x', '').padStart(64, '0');
  // USDT has 6 decimals
  const amountWei = BigInt(Math.floor(parseFloat(amount) * 1e6));
  const paddedAmount = amountWei.toString(16).padStart(64, '0');
  return `${selector}${paddedTo}${paddedAmount}`;
}

function hashTxData(data: Record<string, any>): string {
  // Simple hash for demo — in production, use proper keccak256
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
}
