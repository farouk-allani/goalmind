// GoalMind — useWallet Hook (Enhanced)
// Manages wallet state, seed phrase backup, and multi-chain support.

import { useState, useCallback, useEffect } from 'react';
import { useWalletStore } from '@/stores';
import {
  initializeWallet as initWDKWallet,
  getBalance,
  getUSDTBalance,
  createTip,
  storeSeedPhrase,
  getStoredSeedPhrase,
  deleteStoredSeedPhrase,
  validateSeedPhrase,
  switchChain as switchChainWDK,
  formatAddress,
  type ChainId,
  type WalletInstance,
  CHAINS,
} from '@/lib/wallet/wdk';
import WDK from '@tetherto/wdk';

interface UseWalletOptions {
  autoInit?: boolean;
  defaultChain?: ChainId;
}

interface UseWalletReturn {
  isReady: boolean;
  initializing: boolean;
  address: string | null;
  balance: string;
  usdtBalance: string;
  chain: ChainId;
  error: string | null;
  hasStoredSeed: boolean;
  initialize: (seedPhrase?: string) => Promise<void>;
  restore: (seedPhrase: string) => Promise<void>;
  switchChain: (chain: ChainId) => Promise<void>;
  sendTip: (to: string, amount: string, message?: string) => Promise<boolean>;
  refreshBalance: () => Promise<void>;
  reset: () => Promise<void>;
  getFormattedAddress: () => string;
}

export function useWallet(options: UseWalletOptions = {}): UseWalletReturn {
  const { autoInit = false, defaultChain = 'ethereum' } = options;

  const { wallet, initializing, tips, setWallet, setInitializing, addTip, reset: resetStore } = useWalletStore();
  const [error, setError] = useState<string | null>(null);
  const [wdkInstance, setWdkInstance] = useState<WDK | null>(null);
  const [hasStoredSeed, setHasStoredSeed] = useState(false);
  const [usdtBalance, setUsdtBalance] = useState('0.00');
  const [currentChain, setCurrentChain] = useState<ChainId>(defaultChain);

  // Check for stored seed on mount
  useEffect(() => {
    getStoredSeedPhrase().then((seed) => {
      setHasStoredSeed(!!seed);
    });
  }, []);

  const initialize = useCallback(async (seedPhrase?: string) => {
    setInitializing(true);
    setError(null);

    try {
      const instance = await initWDKWallet(seedPhrase, currentChain);
      setWdkInstance(instance.wdk);

      setWallet({
        initialized: true,
        address: instance.address,
        balance: '0.00',
        chain: currentChain,
      });

      // Fetch real balance
      const balance = await getBalance(instance.address, currentChain);
      const usdt = await getUSDTBalance(instance.address, currentChain);

      setWallet({ balance });
      setUsdtBalance(usdt);
      setHasStoredSeed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize wallet');
    } finally {
      setInitializing(false);
    }
  }, [currentChain]);

  const restore = useCallback(async (seedPhrase: string) => {
    const validation = validateSeedPhrase(seedPhrase);
    if (!validation.valid) {
      setError(validation.error || 'Invalid seed phrase');
      return;
    }

    // Store the seed securely
    await storeSeedPhrase(seedPhrase.trim().toLowerCase());
    await initialize(seedPhrase);
  }, [initialize]);

  const switchChain = useCallback(async (chain: ChainId) => {
    if (!wdkInstance || !wallet.address) {
      setError('Wallet not initialized');
      return;
    }

    try {
      setCurrentChain(chain);
      const newAddress = await switchChainWDK(wdkInstance, chain);

      setWallet({
        address: newAddress,
        chain,
        balance: '0.00',
      });

      // Fetch balance on new chain
      const balance = await getBalance(newAddress, chain);
      const usdt = await getUSDTBalance(newAddress, chain);

      setWallet({ balance });
      setUsdtBalance(usdt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch chain');
    }
  }, [wdkInstance, wallet.address]);

  const refreshBalance = useCallback(async () => {
    if (!wallet.address) return;

    try {
      const balance = await getBalance(wallet.address, currentChain);
      const usdt = await getUSDTBalance(wallet.address, currentChain);
      setWallet({ balance });
      setUsdtBalance(usdt);
    } catch (err) {
      console.warn('[Wallet] Balance refresh failed:', err);
    }
  }, [wallet.address, currentChain]);

  const sendTip = useCallback(async (to: string, amount: string, message?: string): Promise<boolean> => {
    if (!wdkInstance || !wallet.address) {
      setError('Wallet not initialized');
      return false;
    }

    try {
      const result = await createTip(wdkInstance, to, amount, currentChain);

      if (result.success) {
        addTip({
          id: `tip_${Date.now()}`,
          from: wallet.address,
          to,
          amount,
          token: 'USDt',
          matchId: 'general',
          message,
          timestamp: Date.now(),
        });
        return true;
      } else {
        setError(result.error || 'Transaction failed');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send tip');
      return false;
    }
  }, [wdkInstance, wallet.address, currentChain]);

  const reset = useCallback(async () => {
    await deleteStoredSeedPhrase();
    setWdkInstance(null);
    setHasStoredSeed(false);
    setUsdtBalance('0.00');
    resetStore();
  }, [resetStore]);

  const getFormattedAddressFn = useCallback((): string => {
    return formatAddress(wallet.address || '');
  }, [wallet.address]);

  useEffect(() => {
    if (autoInit && !wallet.initialized && !initializing) {
      initialize();
    }
  }, [autoInit]);

  return {
    isReady: wallet.initialized,
    initializing,
    address: wallet.address,
    balance: wallet.balance,
    usdtBalance,
    chain: currentChain,
    error,
    hasStoredSeed,
    initialize,
    restore,
    switchChain,
    sendTip,
    refreshBalance,
    reset,
    getFormattedAddress: getFormattedAddressFn,
  };
}
