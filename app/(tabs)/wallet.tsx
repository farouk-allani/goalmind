// GoalMind — Fan Wallet Screen (Enhanced)
// Self-custodial wallet with seed phrase backup, multi-chain, and tipping.

import { useState, useCallback, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, FONTS } from '@/types';
import { useWallet } from '@/hooks/useWallet';
import { useAgent, resolveDemoAddress, DEMO_FAN_ADDRESSES } from '@/hooks/useAgent';
import { formatAddress, formatAmount, CHAINS, type ChainId } from '@/lib/wallet/wdk';
import { Card, Button, Badge } from '@/components/ui';
import { SAMPLE_MATCHES } from '@/lib/data/football';
import { predictMatch } from '@/lib/predictions/engine';
import { useToastStore } from '@/stores';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

export default function WalletScreen() {
  const {
    isReady,
    initializing,
    restoring,
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

  const showToast = useToastStore((s) => s.show);

  const {
    isReady: agentReady,
    initializing: agentInitializing,
    state: agentState,
    config: agentConfig,
    actions: agentActions,
    error: agentError,
    initialize: initAgent,
    updateConfig: updateAgentConfig,
    evaluateForMatch,
    simulateTip: simulateAgentTip,
    executeTip: executeAgentTip,
    refresh: refreshAgent,
    reset: resetAgent,
  } = useAgent();

  const [tipAmount, setTipAmount] = useState('');
  const [tipRecipient, setTipRecipient] = useState('');
  const [tipMessage, setTipMessage] = useState('');
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [seedInput, setSeedInput] = useState('');
  const [showRestore, setShowRestore] = useState(false);
  const [tips, setTips] = useState<Array<{
    id: string; to: string; amount: string; message?: string; timestamp: number; source?: string;
  }>>([]);
  const [agentLimitInput, setAgentLimitInput] = useState('5');
  const [agentSimulateResult, setAgentSimulateResult] = useState<{ decision: string; reason?: string } | null>(null);
  const [agentBusy, setAgentBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auto-init agent if user wallet is ready (for seamless demo)
  useEffect(() => {
    if (isReady && !agentReady && !agentInitializing) {
      // Fire and forget — user can also tap button
      initAgent().catch(() => {});
    }
  }, [isReady, agentReady, agentInitializing, initAgent]);

  // Keep agent balances fresh when chain changes
  useEffect(() => {
    if (agentReady) {
      refreshAgent();
    }
  }, [chain, agentReady, refreshAgent]);

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
      setTips((prev) => [
        { id: Date.now().toString(), to: tipRecipient, amount: tipAmount, message: tipMessage || undefined, timestamp: Date.now(), source: 'user' },
        ...prev,
      ].slice(0, 20));
      setTipAmount('');
      setTipRecipient('');
      setTipMessage('');
      refreshBalance();
    }
  }, [tipRecipient, tipAmount, tipMessage, sendTip, refreshBalance]);

  const handleReset = useCallback(() => {
    Alert.alert(
      'Reset Wallet',
      'This will remove your wallet from this device. Make sure you have your seed phrase backed up. (Agent wallet will also reset)',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset All', style: 'destructive', onPress: async () => {
          await reset();
          await resetAgent();
          setTips([]);
          setAgentSimulateResult(null);
        } },
      ]
    );
  }, [reset, resetAgent]);

  // === REAL AGENT + WDK INTEGRATION ===
  const handleInitAgent = useCallback(async () => {
    await initAgent();
    await refreshAgent();
  }, [initAgent, refreshAgent]);

  const handleUpdateAgentLimit = useCallback(async () => {
    const limit = parseFloat(agentLimitInput) || 5;
    await updateAgentConfig({ spendingLimit: limit, maxDailySpend: Math.max(20, limit * 4) });
    setAgentSimulateResult(null);
    Alert.alert('Agent Config Updated', `Per-tx limit set to ${limit} USDt via WDK policy engine.`);
  }, [agentLimitInput, updateAgentConfig]);

  const handleCopyAddress = useCallback(async () => {
    if (!address) return;
    await Clipboard.setStringAsync(address);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    showToast('Wallet address copied', { type: 'success', icon: 'copy' });
    setTimeout(() => setCopied(false), 1600);
  }, [address, showToast]);

  const handleAgentEvaluate = useCallback(() => {
    if (!agentReady) {
      Alert.alert('Agent Not Ready', 'Initialize the agent wallet first.');
      return;
    }
    // Use first sample match for demo (real predictions available from Predict tab)
    const decision = evaluateForMatch();
    if (decision) {
      const msg = decision.shouldAct
        ? `Agent recommends: ${decision.action?.amount} USDt tip to ${decision.action?.to}\nReason: ${decision.reasoning}`
        : `Agent decided NOT to act: ${decision.reasoning}`;
      Alert.alert('Agent Evaluation (real)', msg);
    }
  }, [agentReady, evaluateForMatch]);

  const handleAgentSimulate = useCallback(async () => {
    if (!agentReady) return;
    setAgentBusy(true);
    const match = SAMPLE_MATCHES[0];
    const pred = predictMatch(match);
    const targetTeam = pred.homeWin > pred.awayWin ? match.homeTeam.name : match.awayTeam.name;
    const toAddr = resolveDemoAddress(targetTeam);
    const amount = (parseFloat(agentLimitInput) * 0.6).toFixed(2); // demo amount within/near limit

    const result = await simulateAgentTip(toAddr, amount);
    setAgentSimulateResult(result);

    if (result.decision === 'DENY') {
      Alert.alert(
        'WDK Policy Blocked (REAL)',
        `Simulate tip of ${amount} USDt → ${formatAddress(toAddr)}\n\nDENIED by WDK policy engine.\n${result.reason || 'Limit or daily budget exceeded.'}\n\nThis is the money shot: the agent cannot bypass WDK rules.`
      );
    } else {
      Alert.alert('WDK Simulation', `Tip of ${amount} USDt to ${formatAddress(toAddr)} would be ALLOWED.`);
    }
    setAgentBusy(false);
  }, [agentReady, agentLimitInput, simulateAgentTip]);

  const handleAgentExecute = useCallback(async () => {
    if (!agentReady) return;
    setAgentBusy(true);

    const match = SAMPLE_MATCHES[0];
    const pred = predictMatch(match);
    const targetTeam = pred.homeWin > pred.awayWin ? match.homeTeam.name : match.awayTeam.name;
    const toAddr = resolveDemoAddress(targetTeam);
    const amount = (parseFloat(agentLimitInput) * 0.5).toFixed(2);

    const action = await executeAgentTip(toAddr, amount, match.id);

    if (action.status === 'rejected') {
      Alert.alert(
        'REAL WDK Policy Rejection',
        `Agent tried ${amount} USDt tip.\nBlocked BEFORE signing by WDK policy engine.\n\n${action.reason}`,
        [{ text: 'This is the point of the track!' }]
      );
    } else if (action.status === 'executed') {
      Alert.alert('Agent Tip Executed', `${amount} USDt sent via WDK to ${formatAddress(toAddr)}.\nTx: ${action.txHash ? action.txHash.slice(0, 10) + '...' : 'simulated in this build'}`);
      setTips((prev) => [{ id: action.id, to: toAddr, amount, message: action.reason, timestamp: action.timestamp, source: 'agent' }, ...prev].slice(0, 20));
      refreshAgent();
    } else {
      Alert.alert('Agent Action', `Status: ${action.status}\n${action.reason}`);
    }
    setAgentBusy(false);
  }, [agentReady, agentLimitInput, executeAgentTip, refreshAgent]);

  // Real pool contribution using the user's WDK wallet
  const handleJoinPool = useCallback(async () => {
    if (!isReady) {
      Alert.alert('Wallet Required', 'Create or restore your user wallet first to contribute with real WDK.');
      return;
    }
    const poolAddr = DEMO_FAN_ADDRESSES['Argentina']; // demo pool address
    const contrib = '2.50';

    const success = await sendTip(poolAddr, contrib, 'GoalMind Fan Pool contribution');
    if (success) {
      setTips((prev) => [
        { id: 'pool_' + Date.now(), to: poolAddr, amount: contrib, message: 'Contributed to Argentina Fan Pool (real WDK transfer)', timestamp: Date.now(), source: 'pool' },
        ...prev,
      ].slice(0, 20));
      Alert.alert(
        'Pool Contribution (real WDK)',
        `Sent ${contrib} USDt to fan pool address via your self-custodial WDK wallet.\n\nOn a real deployment this would hit an on-chain pool contract.`
      );
      refreshBalance();
    }
  }, [isReady, sendTip, refreshBalance]);

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
          {!isReady && restoring ? (
            <View style={styles.walletRestoring}>
              <ActivityIndicator color={COLORS.primary} />
              <Text style={styles.walletRestoringText}>Restoring your wallet…</Text>
            </View>
          ) : isReady ? (
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
              <Text style={styles.balanceLabel}>NATIVE BALANCE</Text>
              <Text style={styles.balanceValue}>{formatAmount(balance, 4)} {CHAINS[chain].nativeCurrency.symbol}</Text>
              <View style={styles.usdtRow}>
                <Ionicons name="shield-checkmark" size={15} color={COLORS.gold} />
                <Text style={styles.usdtBalance}>{formatAmount(usdtBalance, 2)} USDt (on supported chains)</Text>
              </View>

              {/* Address - tap to copy full address */}
              <Pressable
                style={({ pressed }) => [styles.addressRow, pressed && styles.addressRowPressed]}
                onPress={handleCopyAddress}
                hitSlop={8}
              >
                <Text style={styles.addressText}>{formatAddress(address || '')}</Text>
                <View style={styles.copyButton}>
                  <Ionicons
                    name={copied ? 'checkmark' : 'copy-outline'}
                    size={16}
                    color={copied ? COLORS.success : COLORS.textMuted}
                  />
                </View>
              </Pressable>

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

        {/* === REAL AI AGENT + WDK POLICY ENGINE === */}
        <Card style={styles.agentCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Image source={require('@/assets/brand/trophy-cup.jpg')} style={{ width: 28, height: 28, borderRadius: 4 }} />
            <Text style={{ color: COLORS.gold, fontWeight: '700', fontSize: 14 }}>AI AGENT (QVAC + WDK)</Text>
            {agentReady && <Badge label="LIVE" color={COLORS.success} />}
          </View>

          {!agentReady ? (
            <View>
              <Text style={{ color: COLORS.textMuted, fontSize: 13, marginBottom: 12 }}>
                Separate self-custodial agent wallet. Spending limits are enforced by WDK policy engine — the agent cannot bypass them.
              </Text>
              <Button
                title={agentInitializing ? 'Initializing Agent Wallet...' : 'Initialize Agent Wallet (real WDK)'}
                onPress={handleInitAgent}
                loading={agentInitializing}
                fullWidth
              />
            </View>
          ) : (
            <View>
              {/* Agent identity + balances */}
              <View style={styles.agentHeader}>
                <Text style={styles.agentAddr}>{formatAddress(agentState?.address || '')}</Text>
                <Text style={styles.agentBal}>
                  {agentState?.usdtBalance || '0.00'} USDt (agent)
                </Text>
              </View>

              {/* Live Config Controls — directly affects policy conditions */}
              <View style={styles.agentConfig}>
                <Text style={styles.configLabel}>Per-transaction cap (USDt) — enforced by WDK</Text>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <TextInput
                    style={styles.limitInput}
                    value={agentLimitInput}
                    onChangeText={setAgentLimitInput}
                    keyboardType="decimal-pad"
                  />
                  <Button title="Apply Limit" onPress={handleUpdateAgentLimit} size="sm" variant="outline" />
                </View>
                <Text style={styles.configHint}>
                  Strategy: {agentConfig.strategy} • Daily max: {agentConfig.maxDailySpend}
                </Text>
              </View>

              {/* Real actions */}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <Button
                  title="Evaluate (real)"
                  onPress={handleAgentEvaluate}
                  variant="ghost"
                  size="sm"
                  icon="analytics"
                  disabled={agentBusy}
                />
                <Button
                  title={agentBusy ? '...' : 'Simulate (WDK)'}
                  onPress={handleAgentSimulate}
                  variant="outline"
                  size="sm"
                  icon="play"
                  disabled={agentBusy}
                />
                <Button
                  title={agentBusy ? '...' : 'Execute Tip'}
                  onPress={handleAgentExecute}
                  size="sm"
                  icon="paper-plane"
                  disabled={agentBusy}
                />
              </View>

              {/* Quick demo for judges: force a policy violation */}
              <Button
                title="Demo: Set 1 USDt limit & try 5 USDt (expect DENY)"
                onPress={async () => {
                  setAgentLimitInput('1');
                  await updateAgentConfig({ spendingLimit: 1, maxDailySpend: 5 });
                  setTimeout(() => handleAgentExecute(), 150);
                }}
                variant="ghost"
                size="sm"
                style={{ marginTop: 6 }}
              />

              {agentSimulateResult && (
                <View style={[styles.policyResult, agentSimulateResult.decision === 'DENY' && styles.policyDeny]}>
                  <Ionicons
                    name={agentSimulateResult.decision === 'DENY' ? 'shield' : 'checkmark-circle'}
                    size={16}
                    color={agentSimulateResult.decision === 'DENY' ? COLORS.error : COLORS.success}
                  />
                  <Text style={styles.policyText}>
                    WDK says: {agentSimulateResult.decision} {agentSimulateResult.reason ? `• ${agentSimulateResult.reason}` : ''}
                  </Text>
                </View>
              )}

              {agentError && <Text style={styles.errorTextSmall}>{agentError}</Text>}

              {/* Recent agent actions (real history) */}
              {agentActions.length > 0 && (
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.smallLabel}>Agent History (real)</Text>
                  {agentActions.slice(0, 3).map((a, i) => (
                    <Text key={i} style={styles.actionLine}>
                      {a.status.toUpperCase()} {a.amount} → {formatAddress(a.to)} {a.status === 'rejected' ? '⛔ (policy)' : ''}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}
        </Card>

        {/* Recent Activity — merged real user tips + live agent actions */}
        {(tips.length > 0 || agentActions.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity (real WDK flows)</Text>
            {[...tips, ...agentActions.map(a => ({
              id: a.id,
              to: a.to,
              amount: a.amount,
              message: a.reason,
              timestamp: a.timestamp,
              source: a.status === 'rejected' ? 'agent-blocked' : 'agent'
            }))].sort((a,b) => b.timestamp - a.timestamp).slice(0, 6).map((tip: any, idx) => (
              <View key={idx} style={styles.activityRow}>
                <Ionicons name="paper-plane" size={14} color={tip.source?.includes('agent') ? COLORS.gold : COLORS.primary} />
                <Text style={styles.activityText}>
                  {tip.amount} USDt → {formatAddress(tip.to)}
                  {tip.source === 'agent' && ' (agent)'}
                  {tip.source === 'agent-blocked' && ' ⛔ BLOCKED'}
                  {tip.source === 'pool' && ' (pool)'}
                </Text>
                {tip.message && <Text style={styles.activityMsg} numberOfLines={1}>{tip.message}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Group Tipping Pools — now triggers real WDK transfer */}
        {isReady && (
          <Card style={{ marginBottom: 16, borderColor: COLORS.gold + '20' }}>
            <Text style={{ color: COLORS.gold, fontWeight: '700', marginBottom: 6 }}>Group Tipping Pools (real WDK transfer)</Text>
            <Text style={{ color: COLORS.textMuted, fontSize: 13 }}>
              Contribute to Argentina fans pool. Your keys sign the transfer.
            </Text>
            <Button
              title="Contribute 2.50 USDt (real WDK)"
              onPress={handleJoinPool}
              size="sm"
              style={{ marginTop: 12 }}
              icon="people"
            />
            <Text style={{ fontSize: 10, color: COLORS.textDim, marginTop: 6 }}>
              Sends to demo pool address via your user wallet. Full on-chain pools are the next milestone.
            </Text>
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
  addressRowPressed: { opacity: 0.6 },
  addressText: { flex: 1, fontSize: 13, color: COLORS.textMuted, fontFamily: 'monospace' },
  copyButton: { padding: 4 },
  walletRestoring: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 12 },
  walletRestoringText: { fontSize: 14, color: COLORS.textMuted, fontWeight: '500' },
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
  dangerButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    paddingVertical: 14, 
    paddingHorizontal: 20,
    marginBottom: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.error + '40',
    backgroundColor: COLORS.error + '10',
  },
  dangerText: { fontSize: 14, color: COLORS.error, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', paddingHorizontal: 24 },
  modalContent: { backgroundColor: COLORS.surfaceElevated, borderRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: COLORS.textMuted, marginBottom: 16, lineHeight: 20 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },

  // Agent real integration styles
  agentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  agentAddr: { fontFamily: 'monospace', fontSize: 12, color: COLORS.textMuted },
  agentBal: { fontSize: 14, fontWeight: '700', color: COLORS.gold },
  agentConfig: { backgroundColor: COLORS.background, padding: 10, borderRadius: 10, marginVertical: 6 },
  configLabel: { fontSize: 11, color: COLORS.textDim, marginBottom: 4 },
  limitInput: { backgroundColor: COLORS.surface, color: COLORS.text, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, width: 80, textAlign: 'center' },
  configHint: { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },
  policyResult: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.success + '15', padding: 8, borderRadius: 8, marginTop: 8 },
  policyDeny: { backgroundColor: COLORS.error + '15' },
  policyText: { flex: 1, fontSize: 12, color: COLORS.text },
  smallLabel: { fontSize: 11, color: COLORS.textDim, marginBottom: 4, fontWeight: '600' },
  actionLine: { fontSize: 11, color: COLORS.textMuted, fontFamily: 'monospace', marginBottom: 2 },
  errorTextSmall: { color: COLORS.warning, fontSize: 12, marginTop: 6 },
});
