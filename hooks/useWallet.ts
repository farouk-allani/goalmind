// GoalMind — useWallet Hook
// Manages wallet state and operations.

import { useState, useCallback, useEffect } from 'react';
import WDK from '@tetherto/wdk';
import { useWalletStore } from '@/stores';
import { formatAddress } from '@/lib/wallet/wdk';

interface UseWalletOptions {
  autoInit?: boolean;
}

interface UseWalletReturn {
  isReady: boolean;
  initializing: boolean;
  address: string | null;
  balance: string;
  error: string | null;
  initialize: (seedPhrase?: string) => Promise<void>;
  sendTip: (to: string, amount: string, message?: string) => Promise<boolean>;
  getFormattedAddress: () => string;
}

export function useWallet(options: UseWalletOptions = {}): UseWalletReturn {
  const { autoInit = false } = options;
  
  const { wallet, initializing, setWallet, setInitializing, addTip } = useWalletStore();
  const [error, setError] = useState<string | null>(null);
  const [wdkInstance, setWdkInstance] = useState<WDK | null>(null);

  const initialize = useCallback(async (seedPhrase?: string) => {
    setInitializing(true);
    setError(null);

    try {
      // Generate seed if not provided
      const seed = seedPhrase || WDK.getRandomSeedPhrase();
      
      // Initialize WDK
      const wdk = new WDK(seed);
      const account = await wdk.getAccount('ethereum', 0);
      const address = account.address;

      setWdkInstance(wdk);
      setWallet({
        initialized: true,
        address,
        balance: '0.00',
        chain: 'ethereum',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize wallet');
    } finally {
      setInitializing(false);
    }
  }, []);

  const sendTip = useCallback(async (to: string, amount: string, message?: string): Promise<boolean> => {
    if (!wallet.initialized || !wallet.address) {
      setError('Wallet not initialized');
      return false;
    }

    try {
      // Create tip record
      const tip = {
        id: `tip_${Date.now()}`,
        from: wallet.address,
        to,
        amount,
        token: 'USDt',
        matchId: 'general',
        message,
        timestamp: Date.now(),
      };

      addTip(tip);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send tip');
      return false;
    }
  }, [wallet]);

  const getFormattedAddress = useCallback((): string => {
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
    error,
    initialize,
    sendTip,
    getFormattedAddress,
  };
}
