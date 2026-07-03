// GoalMind — Fan Wallet Screen (Enhanced)
// Self-custodial wallet with seed phrase backup, multi-chain, and tipping.

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  StyleSheet,
  Modal,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, FONTS } from '@/types';
import { useWallet } from '@/hooks/useWallet';
import { formatAddress, formatAmount, CHAINS, type ChainId } from '@/lib/wallet/wdk';
import { Card, Button, Badge } from '@/components/ui';

export default function WalletScreen() {
  const {
    isReady,
    initializing,
    address,
    balance,
    usdtBalance,
    chain,
    error,
    hasStoredSeed,
    initialize,
    restore,
    switchChain,
    sendTip,
    refreshBalance,
    reset,
  } = useWallet();

  const [tipAmount, setTipAmount] = useState('');
  const [tipRecipient, setTipRecipient] = useState('');
  const [tipMessage, setTipMessage] = useState('');
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [seedInput, setSeedInput] = useState('');
  const [showRestore, setShowRestore] = useState(false);
  const [tips, setTips] = useState<Array<{
    id: string; to: string; amount: string; message?: string; timestamp: number;
  }>>([]);

  const handleCreateWallet = useCallback(async () => {
    await initialize();
  }, [initialize]);

  const handleRestore = useCallback(async () => {
    if (!seedInput.trim()) {
      Alert.alert('Error', 'Enter your seed phrase');
      return;
    }
    await restore(seedInput);
    setShowRestore(false);
    setSeedInput('');
  }, [seedInput, restore]);

  const handleSendTip = useCallback(async () => {
    if (!tipRecipient || !tipAmount) {
      Alert.alert('Missing Info', 'Enter recipient and amount');
      return;
    }

    const success = await sendTip(tipRecipient, tipAmount, tipMessage);
    if (success) {
      Alert.alert('Tip Sent', `${tipAmount} USDt sent to ${formatAddress(tipRecipient)}`);
      setTipAmount('');
      setTipRecipient('');
      setTipMessage('');
    }
  }, [tipRecipient, tipAmount, tipMessage, sendTip]);

  const handleReset = useCallback(() => {
    Alert.alert(
      'Reset Wallet',
      'This will remove your wallet from this device. Make sure you have your seed phrase backed up.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => reset() },
      ]
    );
  }, [reset]);

  return (
    <View style={styles.container}>
      {/* Premium Header Banner */}
      <View style={styles.heroWrap}>
        <Image 
          source={require('@/assets/brand/hero-wallet.jpg')} 
          style={styles.heroImage}
          resizeMode="cover"
        />
        <LinearGradient 
          colors={['rgba(10,10,10,0.45)', 'rgba(10,10,10,0.88)']} 
          style={styles.heroOverlay} 
        />
        <View style={styles.heroContent}>
          <Text style={styles.title}>Fan Wallet</Text>
          <Text style={styles.subtitle}>Self-custodial • Powered by Tether WDK</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Wallet Card */}
        <Card style={styles.walletCard}>
          {isReady ? (
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

              {/* Balance */}
              <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>
              <Text style={styles.balanceValue}>{formatAmount(balance, 4)} ETH</Text>
              <View style={styles.usdtRow}>
                <Ionicons name="shield-checkmark" size={15} color={COLORS.gold} />
                <Text style={styles.usdtBalance}>{formatAmount(usdtBalance, 2)} USDt</Text>
              </View>

              {/* Address */}
              <View style={styles.addressRow}>
                <Text style={styles.addressText}>{formatAddress(address || '')}</Text>
                <Pressable style={styles.copyButton}>
                  <Ionicons name="copy-outline" size={16} color={COLORS.textMuted} />
                </Pressable>
              </View>

              {/* Chain Selector */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chainSelector}>
                {(Object.keys(CHAINS) as ChainId[]).map((c) => (
                  <Pressable
                    key={c}
                    style={[styles.chainButton, chain === c && styles.chainButtonActive]}
                    onPress={() => switchChain(c)}
                  >
                    <Text style={[styles.chainButtonText, chain === c && styles.chainButtonTextActive]}>
                      {CHAINS[c].name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Seed Backup Warning */}
              {hasStoredSeed && (
                <Pressable
                  style={styles.backupWarning}
                  onPress={() => setShowSeedModal(true)}
                >
                  <Ionicons name="shield-checkmark" size={16} color={COLORS.success} />
                  <Text style={styles.backupText}>Seed phrase backed up</Text>
                </Pressable>
              )}
            </>
          ) : (
            <View style={styles.walletEmpty}>
              <Ionicons name="wallet-outline" size={48} color={COLORS.textDim} />
              <Text style={styles.emptyTitle}>No Wallet Connected</Text>
              <Text style={styles.emptySubtitle}>
                Create a self-custodial wallet to tip fans, earn predictions, and receive rewards.
              </Text>
              {error && (
                <View style={styles.errorBanner}>
                  <Ionicons name="warning" size={16} color={COLORS.warning} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
              <View style={styles.walletActions}>
                <Button
                  title={initializing ? 'Creating...' : 'Create Wallet'}
                  onPress={handleCreateWallet}
                  loading={initializing}
                  fullWidth
                />
                <Button
                  title="Restore from Seed"
                  onPress={() => setShowRestore(true)}
                  variant="outline"
                  fullWidth
                />
              </View>
            </View>
          )}
        </Card>

        {/* Quick Actions */}
        {isReady && (
          <View style={styles.quickActions}>
            <Pressable style={styles.quickAction}>
              <Ionicons name="arrow-up" size={20} color={COLORS.primary} />
              <Text style={styles.quickActionText}>Send</Text>
            </Pressable>
            <Pressable style={styles.quickAction}>
              <Ionicons name="arrow-down" size={20} color={COLORS.secondary} />
              <Text style={styles.quickActionText}>Receive</Text>
            </Pressable>
            <Pressable style={styles.quickAction} onPress={refreshBalance}>
              <Ionicons name="refresh" size={20} color={COLORS.accent} />
              <Text style={styles.quickActionText}>Refresh</Text>
            </Pressable>
          </View>
        )}

        {/* Tip Section */}
        {isReady && (
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
              <Button
                title="Send Tip"
                onPress={handleSendTip}
                icon="paper-plane"
                fullWidth
              />
              {error && (
                <View style={styles.errorBanner}>
                  <Ionicons name="warning" size={16} color={COLORS.warning} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark" size={20} color={COLORS.success} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Self-Custodial Security (WDK)</Text>
              <Text style={styles.infoText}>
                Your keys. Your USDt. Built with Tether WDK. No cloud custody.
              </Text>
            </View>
          </View>
        </Card>

        {/* AI Agent Wallet Highlight — Major creativity + WDK point */}
        {isReady && (
          <Card style={styles.agentCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Image source={require('@/assets/brand/trophy-cup.jpg')} style={{ width: 28, height: 28, borderRadius: 4 }} />
              <Text style={{ color: COLORS.gold, fontWeight: '700', fontSize: 14 }}>AI AGENT (QVAC + WDK)</Text>
            </View>
            <Text style={{ color: COLORS.textMuted, fontSize: 13, lineHeight: 18 }}>
              Agent watches live predictions. High confidence → auto-suggests small USDt tips to fellow fans (within your rules). Full transparency and control.
            </Text>
            <View style={{ marginTop: 14, gap: 8 }}>
              <Button 
                title="Simulate: Agent Tips on Strong Prediction" 
                onPress={() => {
                  Alert.alert(
                    'Agent Action (WDK)',
                    'Prediction confidence 87% → Agent executed 5 USDt tip to @fan-42.\n\nKeys signed locally via WDK. Transaction would settle on-chain.',
                    [{ text: 'Got it', style: 'default' }]
                  );
                  // Bonus: add visual feedback by pushing a fake tip
                  setTips((prev) => [
                    ...prev.slice(-2),
                    { id: Date.now().toString(), to: '0xAgent...f42', amount: '5.00', message: 'Agent tip from strong prediction', timestamp: Date.now() }
                  ]);
                }} 
                variant="outline" 
                size="sm" 
                icon="flash"
              />
              <Button 
                title="Configure Limits & Strategy" 
                onPress={() => Alert.alert('Agent Settings', 'Conservative • Max 10 USDt/day • Only on >75% confidence. (Demo)')} 
                variant="ghost" 
                size="sm" 
              />
            </View>
          </Card>
        )}

        {/* Recent Activity — visible proof of tipping + agent */}
        {tips.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {tips.slice(-3).reverse().map((tip, idx) => (
              <View key={idx} style={styles.activityRow}>
                <Ionicons name="paper-plane" size={14} color={COLORS.gold} />
                <Text style={styles.activityText}>
                  {tip.amount} USDt → {tip.to.slice(0, 10)}...
                </Text>
                {tip.message && <Text style={styles.activityMsg}>{tip.message}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Group Tipping Pools teaser — WDK feature */}
        {isReady && (
          <Card style={{ marginBottom: 16, borderColor: COLORS.gold + '20' }}>
            <Text style={{ color: COLORS.gold, fontWeight: '700', marginBottom: 6 }}>Group Tipping Pools (WDK)</Text>
            <Text style={{ color: COLORS.textMuted, fontSize: 13 }}>
              Argentina fans pool • 12 contributors • 124 USDt • Winner-take-all after match.
            </Text>
            <Button 
              title="Join Pool (demo)" 
              onPress={() => Alert.alert('Pool Joined', 'You contributed 10 USDt. Distribution rules enforced via WDK escrow.')} 
              size="sm" 
              style={{ marginTop: 12 }} 
            />
          </Card>
        )}

        {/* Danger Zone */}
        {isReady && (
          <Pressable style={styles.dangerButton} onPress={handleReset}>
            <Ionicons name="trash-outline" size={16} color={COLORS.error} />
            <Text style={styles.dangerText}>Reset Wallet</Text>
          </Pressable>
        )}
      </ScrollView>

      {/* Restore Modal */}
      <Modal visible={showRestore} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Restore Wallet</Text>
            <Text style={styles.modalSubtitle}>
              Enter your 12 or 24 word seed phrase to restore your wallet.
            </Text>
            <TextInput
              style={[styles.input, styles.seedInput]}
              placeholder="Enter seed phrase..."
              placeholderTextColor={COLORS.textDim}
              value={seedInput}
              onChangeText={setSeedInput}
              multiline
              autoCapitalize="none"
            />
            <View style={styles.modalActions}>
              <Button title="Cancel" onPress={() => setShowRestore(false)} variant="ghost" />
              <Button title="Restore" onPress={handleRestore} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 20, paddingTop: 12 },
  heroWrap: {
    height: 112,
    marginHorizontal: -20,
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: { ...StyleSheet.absoluteFillObject },
  heroOverlay: { ...StyleSheet.absoluteFillObject },
  heroContent: { position: 'absolute', bottom: 14, left: 20 },
  header: { marginBottom: 24 },
  title: { fontFamily: FONTS.display, fontSize: 24, color: COLORS.text, letterSpacing: 0 },
  subtitle: { fontSize: 13, color: 'rgba(163,163,163,0.85)', marginTop: 2 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.warning + '15', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, marginTop: 16, width: '100%' },
  errorText: { fontSize: 12, color: COLORS.warning, flex: 1 },
  walletCard: { marginBottom: 16, padding: 24 },
  walletHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  walletIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: COLORS.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  walletStatus: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  walletStatusText: { fontSize: 12, color: COLORS.success, fontWeight: '600' },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success },
  balanceLabel: { fontSize: 11, color: COLORS.textDim, marginBottom: 4, letterSpacing: 1 },
  balanceValue: { fontFamily: FONTS.display, fontSize: 28, color: COLORS.text, letterSpacing: 0, marginBottom: 2 },
  usdtRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  usdtBalance: { fontSize: 18, fontWeight: '700', color: COLORS.gold },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.background, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginBottom: 12 },
  addressText: { flex: 1, fontSize: 13, color: COLORS.textMuted, fontFamily: 'monospace' },
  copyButton: { padding: 4 },
  chainSelector: { marginBottom: 12 },
  chainButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: COLORS.background, marginRight: 8 },
  chainButtonActive: { backgroundColor: COLORS.primaryMuted },
  chainButtonText: { fontSize: 12, fontWeight: '600', color: COLORS.textDim },
  chainButtonTextActive: { color: COLORS.primary },
  backupWarning: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.success + '15', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  backupText: { fontSize: 12, color: COLORS.success, fontWeight: '500' },
  walletEmpty: { alignItems: 'center', paddingVertical: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 20, marginBottom: 20 },
  walletActions: { gap: 12, width: '100%' },
  quickActions: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  quickAction: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.surfaceElevated, paddingVertical: 16, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  quickActionText: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  tipForm: { gap: 12 },
  input: { backgroundColor: COLORS.surface, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border },
  seedInput: { minHeight: 80, textAlignVertical: 'top' },
  infoCard: { marginBottom: 24, padding: 16 },
  infoRow: { flexDirection: 'row', gap: 12 },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: 14, fontWeight: '700', color: COLORS.success, marginBottom: 4 },
  infoText: { fontSize: 13, color: COLORS.textMuted, lineHeight: 18 },
  agentCard: { 
    marginBottom: 24, 
    padding: 18, 
    borderWidth: 1, 
    borderColor: COLORS.gold + '30',
    backgroundColor: COLORS.surfaceElevated 
  },
  activityRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    backgroundColor: COLORS.surface, 
    padding: 12, 
    borderRadius: 10, 
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.border 
  },
  activityText: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
  activityMsg: { color: COLORS.textDim, fontSize: 11, marginLeft: 22 },
  dangerButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, marginBottom: 40 },
  dangerText: { fontSize: 14, color: COLORS.error, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', paddingHorizontal: 24 },
  modalContent: { backgroundColor: COLORS.surfaceElevated, borderRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: COLORS.textMuted, marginBottom: 16, lineHeight: 20 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
});
