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
  DEFAULT_CHAIN,
  type ChainId,
  type WalletInstance,
  CHAINS,
} from '@/lib/wallet/wdk';
import WDK from '@tetherto/wdk';

interface UseWalletOptions {
  autoInit?: boolean;
  defaultChain?: ChainId;
}

// Module-level guard so the silent restore runs once per app session, even
// though several screens mount useWallet() against the shared store.
let autoRestoreAttempted = false;

interface UseWalletReturn {
  isReady: boolean;
  initializing: boolean;
  restoring: boolean;
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
  const { autoInit = false, defaultChain = DEFAULT_CHAIN } = options;

  const { wallet, initializing, restoring, tips, setWallet, setInitializing, setRestoring, addTip, reset: resetStore } = useWalletStore();
  const [error, setError] = useState<string | null>(null);
  const [wdkInstance, setWdkInstance] = useState<WDK | null>(null);
  const [hasStoredSeed, setHasStoredSeed] = useState(false);
  const [usdtBalance, setUsdtBalance] = useState('0.00');
  const [currentChain, setCurrentChain] = useState<ChainId>(defaultChain);

  // Check for a stored seed on mount, and silently re-hydrate a wallet that was
  // already created on this device. The seed lives in SecureStore across app
  // restarts, but the in-memory store resets — without this, a returning user
  // is wrongly shown "Create Wallet".
  useEffect(() => {
    let cancelled = false;
    getStoredSeedPhrase().then((seed) => {
      if (cancelled) return;
      setHasStoredSeed(!!seed);

      const alreadyInitialized = useWalletStore.getState().wallet.initialized;

      // Nothing to restore (fresh install) or already live — drop the spinner
      // so the correct UI ("Create Wallet" / connected) shows immediately.
      if (!seed || alreadyInitialized) {
        setRestoring(false);
        return;
      }

      // Another mounted screen's hook already kicked off the restore; let it
      // own the `restoring` flag instead of racing it.
      if (autoRestoreAttempted) return;

      autoRestoreAttempted = true;
      setRestoring(true);
      initialize(seed).finally(() => {
        if (!cancelled) setRestoring(false);
      });
    });
    return () => {
      cancelled = true;
    };
    // Run once on mount; `initialize` is stable enough for the default chain.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    restoring,
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
