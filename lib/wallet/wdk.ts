// GoalMind — WDK Wallet Integration
// Self-custodial wallet. User holds their own keys.

import WDK from '@tetherto/wdk';

export interface WalletInstance {
  wdk: WDK;
  address: string;
  chain: string;
  initialized: boolean;
}

/**
 * Initialize a self-custodial wallet from a seed phrase.
 * The seed phrase is generated locally and never leaves the device.
 */
export async function initializeWallet(
  seedPhrase?: string
): Promise<WalletInstance> {
  // Generate new seed if none provided
  const seed = seedPhrase || WDK.getRandomSeedPhrase();
  
  const wdk = new WDK(seed);
  const account = await wdk.getAccount('ethereum', 0);
  const address = account.address;

  return {
    wdk,
    address,
    chain: 'ethereum',
    initialized: true,
  };
}

/**
 * Validate a seed phrase before importing.
 */
export function validateSeedPhrase(phrase: string): boolean {
  try {
    const words = phrase.trim().split(/\s+/);
    return words.length >= 12 && words.length <= 24;
  } catch {
    return false;
  }
}

/**
 * Get wallet balance (mock for hackathon — real implementation needs RPC).
 */
export async function getBalance(address: string): Promise<string> {
  // In production, this would query the blockchain
  // For hackathon demo, return a formatted placeholder
  return '0.00';
}

/**
 * Create a tip transaction between fans.
 * Self-custodial — user signs with their own keys.
 */
export async function createTip(
  wdk: WDK,
  toAddress: string,
  amount: string,
  message?: string
): Promise<{ txHash: string; success: boolean }> {
  try {
    const account = await wdk.getAccount('ethereum', 0);
    
    // In production, this would construct and sign a real transaction
    // For hackathon, we simulate the flow
    const txHash = `0x${Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('')}`;

    return { txHash, success: true };
  } catch (error) {
    console.error('Tip failed:', error);
    return { txHash: '', success: false };
  }
}

/**
 * Register a prediction stake.
 * Locks tokens in a prediction contract.
 */
export async function stakePrediction(
  wdk: WDK,
  matchId: string,
  prediction: string,
  amount: string
): Promise<{ stakeId: string; success: boolean }> {
  try {
    const stakeId = `pred_${matchId}_${Date.now()}`;
    
    // In production, this would interact with a prediction market contract
    return { stakeId, success: true };
  } catch (error) {
    console.error('Stake failed:', error);
    return { stakeId: '', success: false };
  }
}

/**
 * Format an address for display (0x1234...5678).
 */
export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format token amount for display.
 */
export function formatAmount(amount: string | number, decimals: number = 4): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0.00';
  return num.toFixed(decimals);
}
