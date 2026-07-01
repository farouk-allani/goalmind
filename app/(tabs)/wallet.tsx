// GoalMind — Fan Wallet Screen
// Self-custodial wallet for tipping, predictions, and rewards.

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/types';
import { useWalletStore } from '@/stores';
import { formatAddress, formatAmount } from '@/lib/wallet/wdk';

export default function WalletScreen() {
  const { wallet, tips, initializing, setWallet, setInitializing, addTip } = useWalletStore();
  const [tipAmount, setTipAmount] = useState('');
  const [tipRecipient, setTipRecipient] = useState('');
  const [tipMessage, setTipMessage] = useState('');

  const handleInitializeWallet = useCallback(async () => {
    setInitializing(true);
    try {
      // Simulate wallet initialization
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const mockAddress = `0x${Array.from({ length: 40 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`;

      setWallet({
        initialized: true,
        address: mockAddress,
        balance: '0.00',
        chain: 'ethereum',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to initialize wallet');
    } finally {
      setInitializing(false);
    }
  }, []);

  const handleSendTip = useCallback(() => {
    if (!wallet.initialized) {
      Alert.alert('Wallet Required', 'Initialize your wallet first');
      return;
    }

    if (!tipRecipient || !tipAmount) {
      Alert.alert('Missing Info', 'Enter recipient and amount');
      return;
    }

    const tip = {
      id: `tip_${Date.now()}`,
      from: wallet.address || '',
      to: tipRecipient,
      amount: tipAmount,
      token: 'USDt',
      matchId: 'general',
      message: tipMessage || undefined,
      timestamp: Date.now(),
    };

    addTip(tip);
    setTipAmount('');
    setTipRecipient('');
    setTipMessage('');
    Alert.alert('Tip Sent', `${tipAmount} USDt sent to ${formatAddress(tipRecipient)}`);
  }, [wallet, tipRecipient, tipAmount, tipMessage]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Fan Wallet</Text>
        <Text style={styles.subtitle}>Self-custodial. Your keys, your crypto.</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Wallet Card */}
        <View style={styles.walletCard}>
          {wallet.initialized ? (
            <>
              <View style={styles.walletHeader}>
                <View style={styles.walletIcon}>
                  <Ionicons name="wallet" size={24} color={COLORS.primary} />
                </View>
                <View style={styles.walletStatus}>
                  <Text style={styles.walletStatusText}>Connected</Text>
                  <View style={styles.statusDot} />
                </View>
              </View>

              <Text style={styles.balanceLabel}>Balance</Text>
              <Text style={styles.balanceValue}>{formatAmount(wallet.balance)} USDt</Text>

              <View style={styles.addressRow}>
                <Text style={styles.addressText}>{formatAddress(wallet.address || '')}</Text>
                <Pressable style={styles.copyButton}>
                  <Ionicons name="copy-outline" size={16} color={COLORS.textMuted} />
                </Pressable>
              </View>

              <View style={styles.chainBadge}>
                <Text style={styles.chainText}>{wallet.chain.toUpperCase()}</Text>
              </View>
            </>
          ) : (
            <View style={styles.walletEmpty}>
              <Ionicons name="wallet-outline" size={48} color={COLORS.textDim} />
              <Text style={styles.emptyTitle}>No Wallet Connected</Text>
              <Text style={styles.emptySubtitle}>
                Create a self-custodial wallet to tip fans, earn predictions, and receive rewards.
              </Text>
              <Pressable
                style={[styles.initButton, initializing && styles.initButtonDisabled]}
                onPress={handleInitializeWallet}
                disabled={initializing}
              >
                <Text style={styles.initButtonText}>
                  {initializing ? 'Creating...' : 'Create Wallet'}
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        {wallet.initialized && (
          <View style={styles.quickActions}>
            <Pressable style={styles.quickAction}>
              <Ionicons name="arrow-up" size={20} color={COLORS.primary} />
              <Text style={styles.quickActionText}>Send</Text>
            </Pressable>
            <Pressable style={styles.quickAction}>
              <Ionicons name="arrow-down" size={20} color={COLORS.secondary} />
              <Text style={styles.quickActionText}>Receive</Text>
            </Pressable>
            <Pressable style={styles.quickAction}>
              <Ionicons name="swap-horizontal" size={20} color={COLORS.accent} />
              <Text style={styles.quickActionText}>Swap</Text>
            </Pressable>
          </View>
        )}

        {/* Tip Section */}
        {wallet.initialized && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Send a Tip</Text>
            <View style={styles.tipForm}>
              <TextInput
                style={styles.input}
                placeholder="Recipient address (0x...)"
                placeholderTextColor={COLORS.textDim}
                value={tipRecipient}
                onChangeText={setTipRecipient}
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Amount (USDt)"
                placeholderTextColor={COLORS.textDim}
                value={tipAmount}
                onChangeText={setTipAmount}
                keyboardType="decimal-pad"
              />
              <TextInput
                style={styles.input}
                placeholder="Message (optional)"
                placeholderTextColor={COLORS.textDim}
                value={tipMessage}
                onChangeText={setTipMessage}
              />
              <Pressable style={styles.sendButton} onPress={handleSendTip}>
                <Ionicons name="paper-plane" size={18} color={COLORS.background} />
                <Text style={styles.sendButtonText}>Send Tip</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Recent Tips */}
        {tips.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Tips</Text>
            {tips.slice(0, 5).map((tip) => (
              <View key={tip.id} style={styles.tipItem}>
                <View style={styles.tipIcon}>
                  <Ionicons name="paper-plane" size={16} color={COLORS.primary} />
                </View>
                <View style={styles.tipInfo}>
                  <Text style={styles.tipAmount}>{tip.amount} USDt</Text>
                  <Text style={styles.tipTo}>To: {formatAddress(tip.to)}</Text>
                  {tip.message && <Text style={styles.tipMessage}>{tip.message}</Text>}
                </View>
                <Text style={styles.tipTime}>
                  {new Date(tip.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark" size={20} color={COLORS.success} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Self-Custodial Security</Text>
            <Text style={styles.infoText}>
              Your wallet is built with the Tether WDK. Private keys are generated and stored locally on your device. No one else has access — not even us.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  walletCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  walletIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  walletStatusText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '600',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  balanceLabel: {
    fontSize: 13,
    color: COLORS.textDim,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -1,
    marginBottom: 16,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textMuted,
    fontFamily: 'monospace',
  },
  copyButton: {
    padding: 4,
  },
  chainBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primaryMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  chainText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '700',
    letterSpacing: 1,
  },
  walletEmpty: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  initButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  initButtonDisabled: {
    opacity: 0.6,
  },
  initButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.background,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.surface,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  tipForm: {
    gap: 12,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  sendButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.background,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tipIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipInfo: {
    flex: 1,
  },
  tipAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  tipTo: {
    fontSize: 12,
    color: COLORS.textDim,
    marginTop: 2,
  },
  tipMessage: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },
  tipTime: {
    fontSize: 11,
    color: COLORS.textDim,
  },
  infoCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.success + '30',
    marginBottom: 24,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.success,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
});
