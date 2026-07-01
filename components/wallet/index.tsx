// GoalMind — Wallet Components
// Visual components for wallet operations.

import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/types';
import { Card, Badge } from '@/components/ui';
import { formatAddress, formatAmount } from '@/lib/wallet/wdk';

interface WalletCardProps {
  address: string;
  balance: string;
  chain: string;
  onSend?: () => void;
  onReceive?: () => void;
}

export function WalletCard({ address, balance, chain, onSend, onReceive }: WalletCardProps) {
  return (
    <Card style={styles.walletCard}>
      <View style={styles.walletHeader}>
        <View style={styles.walletIcon}>
          <Ionicons name="wallet" size={24} color={COLORS.primary} />
        </View>
        <Badge label="Connected" color={COLORS.success} />
      </View>

      <Text style={styles.balanceLabel}>Balance</Text>
      <Text style={styles.balanceValue}>{formatAmount(balance)} USDt</Text>

      <View style={styles.addressRow}>
        <Text style={styles.addressText}>{formatAddress(address)}</Text>
        <Pressable style={styles.copyButton}>
          <Ionicons name="copy-outline" size={16} color={COLORS.textMuted} />
        </Pressable>
      </View>

      <View style={styles.chainBadge}>
        <Text style={styles.chainText}>{chain.toUpperCase()}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.actionButton} onPress={onSend}>
          <Ionicons name="arrow-up" size={18} color={COLORS.primary} />
          <Text style={styles.actionText}>Send</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={onReceive}>
          <Ionicons name="arrow-down" size={18} color={COLORS.secondary} />
          <Text style={styles.actionText}>Receive</Text>
        </Pressable>
      </View>
    </Card>
  );
}

interface TipCardProps {
  amount: string;
  to: string;
  message?: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
}

export function TipCard({ amount, to, message, timestamp, status }: TipCardProps) {
  const statusColors = {
    pending: COLORS.warning,
    confirmed: COLORS.success,
    failed: COLORS.error,
  };

  return (
    <View style={styles.tipCard}>
      <View style={styles.tipIcon}>
        <Ionicons name="paper-plane" size={16} color={COLORS.primary} />
      </View>
      <View style={styles.tipInfo}>
        <View style={styles.tipHeader}>
          <Text style={styles.tipAmount}>{amount} USDt</Text>
          <Badge label={status} color={statusColors[status]} variant="outline" />
        </View>
        <Text style={styles.tipTo}>To: {formatAddress(to)}</Text>
        {message && <Text style={styles.tipMessage}>{message}</Text>}
      </View>
      <Text style={styles.tipTime}>
        {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );
}

interface PredictionStakeProps {
  matchName: string;
  prediction: string;
  amount: string;
  potentialWin: string;
  status: 'active' | 'won' | 'lost';
}

export function PredictionStake({ matchName, prediction, amount, potentialWin, status }: PredictionStakeProps) {
  const statusColors = {
    active: COLORS.warning,
    won: COLORS.success,
    lost: COLORS.error,
  };

  return (
    <Card style={styles.stakeCard}>
      <View style={styles.stakeHeader}>
        <Text style={styles.matchName}>{matchName}</Text>
        <Badge label={status} color={statusColors[status]} />
      </View>
      
      <View style={styles.stakeDetails}>
        <View style={styles.stakeItem}>
          <Text style={styles.stakeLabel}>Prediction</Text>
          <Text style={styles.stakeValue}>{prediction}</Text>
        </View>
        <View style={styles.stakeItem}>
          <Text style={styles.stakeLabel}>Stake</Text>
          <Text style={styles.stakeValue}>{amount} USDt</Text>
        </View>
        <View style={styles.stakeItem}>
          <Text style={styles.stakeLabel}>Potential Win</Text>
          <Text style={[styles.stakeValue, { color: COLORS.success }]}>{potentialWin} USDt</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  walletCard: {
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
    marginBottom: 16,
  },
  chainText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '700',
    letterSpacing: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tipCard: {
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
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  tipAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  tipTo: {
    fontSize: 12,
    color: COLORS.textDim,
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
  stakeCard: {
    marginBottom: 12,
  },
  stakeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  matchName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  stakeDetails: {
    gap: 12,
  },
  stakeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stakeLabel: {
    fontSize: 13,
    color: COLORS.textDim,
  },
  stakeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
});
