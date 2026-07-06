// GoalMind — Match Detail Screen
// Streams tactical analysis from the on-device QVAC LLM (token by token),
// runs the statistical prediction engine, and hosts camera + commentary.

import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  Image,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS } from '@/types';
import { SAMPLE_MATCHES, formatTeamStatsForAnalysis, type MatchData } from '@/lib/data/football';
import { getTeamFlag } from '@/lib/utils/flags';
import { useAIStore, useMatchStore, useAnalysisStore } from '@/stores';
import { predictMatch } from '@/lib/predictions/engine';
import { generateTextStream, isModelLoaded } from '@/lib/ai/models';
import { Button, Card, Badge } from '@/components/ui';
import { PossessionBar, MomentumGauge, StatsComparison } from '@/components/analysis';
import { CameraAnalysis } from '@/components/analysis/CameraAnalysis';
import { LiveCommentary } from '@/components/analysis/LiveCommentary';
import type { PredictionResult } from '@/lib/predictions/engine';
import { useWallet } from '@/hooks/useWallet';
import { useAgent, resolveDemoAddress } from '@/hooks/useAgent';

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { modelsLoaded, loading, setLoading } = useAIStore();
  const { isReady: walletReady, sendTip } = useWallet();
  const { isReady: agentReady, evaluateForMatch, executeTip: executeAgentTip } = useAgent();

  const [activeTab, setActiveTab] = useState<'analysis' | 'predict' | 'commentary' | 'camera'>('analysis');

  // Cache the tactical read + prediction per match so leaving and returning to
  // this screen keeps a completed analysis instead of wiping it.
  const cached = useAnalysisStore((s) => (id ? s.byMatch[id] : undefined));
  const analysis = cached?.analysis ?? null;
  const prediction = cached?.prediction ?? null;
  const setCachedAnalysis = useAnalysisStore((s) => s.setAnalysis);
  const setCachedPrediction = useAnalysisStore((s) => s.setPrediction);
  const setAnalysis = useCallback(
    (val: string | null) => { if (id) setCachedAnalysis(id, val); },
    [id, setCachedAnalysis],
  );
  const setPrediction = useCallback(
    (val: PredictionResult | null) => { if (id) setCachedPrediction(id, val); },
    [id, setCachedPrediction],
  );

  const [showCamera, setShowCamera] = useState(false);
  const [cameraAnalysis, setCameraAnalysis] = useState<string | null>(null);
  const analysisRunning = useRef(false);
  const [actionBusy, setActionBusy] = useState(false);

  // Prefer the match handed over by the list screen (covers live-API
  // fixtures); fall back to the bundled samples for direct deep links.
  const selectedMatch = useMatchStore((s) => s.selectedMatch) as unknown as MatchData | null;
  const match =
    selectedMatch && String(selectedMatch.id) === String(id)
      ? selectedMatch
      : SAMPLE_MATCHES.find((m) => m.id === id);

  // Live-API fixtures come without season history — their stats are zeros.
  const hasStats = !!match && (match.homeTeam.stats.played > 0 || match.awayTeam.stats.played > 0);

  const runAnalysis = useCallback(async () => {
    if (!match || analysisRunning.current) return;
    analysisRunning.current = true;

    setLoading(true);
    try {
      // Statistical prediction engine (Elo + Poisson + form) — instant, always on.
      const result = predictMatch(match);
      setPrediction(result);

      // Stream the tactical read from the on-device QVAC LLM, token by token.
      const prompt = `Match: ${match.homeTeam.name} vs ${match.awayTeam.name}

Home team:
${formatTeamStatsForAnalysis(match.homeTeam)}

Away team:
${formatTeamStatsForAnalysis(match.awayTeam)}

Statistical model output: home win ${(result.homeWin * 100).toFixed(0)}%, draw ${(result.draw * 100).toFixed(0)}%, away win ${(result.awayWin * 100).toFixed(0)}%, xG ${result.xgHome.toFixed(1)} vs ${result.xgAway.toFixed(1)}.

Give a tactical analysis of this matchup.`;

      const systemPrompt = `You are GoalMind, an expert football tactical analyst. Analyze the matchup: formations and styles implied by the stats, where the game will be won or lost, and the key threat on each side. Be direct and technical, use proper football terminology, 2-3 short paragraphs.`;

      if (!isModelLoaded('llm')) {
        setAnalysis('Loading on-device AI model (first run downloads ~800 MB)...');
      }

      let streamed = '';
      for await (const token of generateTextStream(prompt, systemPrompt)) {
        streamed += token;
        setAnalysis(streamed);
      }
      if (streamed.trim().length === 0) {
        throw new Error('Empty response from model');
      }
    } catch (error) {
      console.warn('On-device LLM unavailable, falling back to statistical summary:', error);
      // Honest fallback: clearly labeled statistical summary, no fake AI.
      const result = prediction ?? predictMatch(match);
      setAnalysis(
        `⚠ On-device AI unavailable (${error instanceof Error ? error.message : 'unknown error'}). ` +
          `Showing statistical engine output only.\n\n` +
          `${match.homeTeam.name} win ${(result.homeWin * 100).toFixed(0)}% · draw ${(result.draw * 100).toFixed(0)}% · ` +
          `${match.awayTeam.name} win ${(result.awayWin * 100).toFixed(0)}%\n` +
          `Expected goals: ${result.xgHome.toFixed(1)} — ${result.xgAway.toFixed(1)}\n\n` +
          result.factors.map((f) => `• ${f.name}: ${f.description}`).join('\n')
      );
    } finally {
      setLoading(false);
      analysisRunning.current = false;
    }
  }, [match, prediction]);

  const handleCameraCapture = useCallback((uri: string) => {
    console.log('Captured:', uri);
  }, []);

  const handleCameraAnalysis = useCallback((analysis: string) => {
    setCameraAnalysis(analysis);
    setShowCamera(false);
  }, []);

  if (!match) {
    return (
      <View style={styles.container}>
        <Ionicons name="alert-circle" size={48} color={COLORS.error} />
        <Text style={styles.errorText}>Match not found</Text>
        <Button title="Go Back" onPress={() => router.back()} variant="outline" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Competition label */}
      <View style={styles.competitionRow}>
        <Ionicons name="trophy-outline" size={13} color={COLORS.textMuted} />
        <Text style={styles.competitionLabel} numberOfLines={1}>
          {match.competition ?? 'Friendly'}
        </Text>
      </View>

      {/* Match Header */}
      <View style={styles.matchHeader}>
        <View style={styles.teamColumn}>
          <Text style={styles.teamCode}>{getTeamFlag(match.homeTeam.name)} {match.homeTeam.shortName}</Text>
          <Text style={styles.teamFull}>{match.homeTeam.name}</Text>
          <Text style={styles.teamForm}>{match.homeTeam.recentForm.join(' ')}</Text>
        </View>
        <View style={styles.scoreColumn}>
          <Text style={styles.vsLabel}>VS</Text>
          <Text style={styles.matchTime}>
            {new Date(match.kickoff).toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </Text>
          <Text style={styles.matchTimeSmall}>
            {new Date(match.kickoff).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <View style={[styles.teamColumn, { alignItems: 'flex-end' }]}>
          <Text style={styles.teamCode}>{match.awayTeam.shortName} {getTeamFlag(match.awayTeam.name)}</Text>
          <Text style={styles.teamFull}>{match.awayTeam.name}</Text>
          <Text style={styles.teamForm}>{match.awayTeam.recentForm.join(' ')}</Text>
        </View>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabs}>
        {(['analysis', 'predict', 'commentary', 'camera'] as const).map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab(tab);
            }}
          >
            <Ionicons
              name={tab === 'analysis' ? 'analytics' : tab === 'predict' ? 'trending-up' : tab === 'commentary' ? 'mic' : 'camera'}
              size={16}
              color={activeTab === tab ? COLORS.background : COLORS.muted}
            />
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'analysis' && (
          <>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Ionicons name="sync" size={24} color={COLORS.primary} />
                <Text style={styles.loadingText}>Analyzing on-device...</Text>
              </View>
            ) : analysis ? (
              <>
                {/* Season stats widgets only when we actually have stats
                    (live-API fixtures come without a season history). */}
                {hasStats && (
                  <>
                    <PossessionBar
                      home={match.homeTeam.stats.avgPossession}
                      away={match.awayTeam.stats.avgPossession}
                      homeTeam={match.homeTeam.shortName}
                      awayTeam={match.awayTeam.shortName}
                    />
                    <MomentumGauge
                      value={match.homeTeam.stats.avgPossession - match.awayTeam.stats.avgPossession}
                      homeTeam={match.homeTeam.shortName}
                      awayTeam={match.awayTeam.shortName}
                    />
                    <StatsComparison
                      homeTeam={match.homeTeam.shortName}
                      awayTeam={match.awayTeam.shortName}
                      stats={[
                        { label: 'Played', home: match.homeTeam.stats.played, away: match.awayTeam.stats.played },
                        { label: 'Wins', home: match.homeTeam.stats.wins, away: match.awayTeam.stats.wins },
                        { label: 'Goals', home: match.homeTeam.stats.goalsFor, away: match.awayTeam.stats.goalsFor },
                        { label: 'Conceded', home: match.homeTeam.stats.goalsAgainst, away: match.awayTeam.stats.goalsAgainst, higherIsBetter: false },
                        { label: 'Pass Acc.', home: match.homeTeam.stats.passAccuracy, away: match.awayTeam.stats.passAccuracy },
                        { label: 'Shots/G', home: match.homeTeam.stats.shotsPerGame, away: match.awayTeam.stats.shotsPerGame },
                      ]}
                    />
                  </>
                )}
                <Card>
                  <View style={styles.analysisHeader}>
                    <Ionicons name="hardware-chip-outline" size={14} color={COLORS.primary} />
                    <Text style={styles.analysisHeaderText}>Tactical read · generated on-device</Text>
                  </View>
                  <Text style={styles.analysisText}>{analysis.replace(/\*\*/g, '')}</Text>
                </Card>
              </>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="analytics-outline" size={48} color={COLORS.textDim} />
                <Text style={styles.emptyTitle}>Run AI Analysis</Text>
                <Text style={styles.emptySubtitle}>
                  Get tactical insights powered by on-device AI
                </Text>
                <Button
                  title="Run Tactical Analysis"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    runAnalysis();
                  }}
                  icon="flash"
                />
              </View>
            )}
          </>
        )}

        {activeTab === 'predict' && (
          <>
            {prediction ? (
              <>
                <Card>
                  <Text style={styles.sectionTitle}>Match Prediction</Text>
                  <View style={styles.predictionGrid}>
                    <View style={styles.predictionItem}>
                      <Text style={styles.predictionLabel}>{match.homeTeam.shortName}</Text>
                      <Text style={[styles.predictionValue, { color: COLORS.primary }]}>
                        {(prediction.homeWin * 100).toFixed(0)}%
                      </Text>
                    </View>
                    <View style={styles.predictionItem}>
                      <Text style={styles.predictionLabel}>Draw</Text>
                      <Text style={styles.predictionValue}>
                        {(prediction.draw * 100).toFixed(0)}%
                      </Text>
                    </View>
                    <View style={styles.predictionItem}>
                      <Text style={styles.predictionLabel}>{match.awayTeam.shortName}</Text>
                      <Text style={[styles.predictionValue, { color: COLORS.secondary }]}>
                        {(prediction.awayWin * 100).toFixed(0)}%
                      </Text>
                    </View>
                  </View>

                  {/* Probability Bar */}
                  <View style={styles.probBar}>
                    <View style={[styles.probBarHome, { flex: prediction.homeWin }]} />
                    <View style={[styles.probBarDraw, { flex: prediction.draw }]} />
                    <View style={[styles.probBarAway, { flex: prediction.awayWin }]} />
                  </View>

                  {/* xG */}
                  <View style={styles.xgRow}>
                    <View style={styles.xgItem}>
                      <Text style={styles.xgLabel}>Expected Goals</Text>
                      <Text style={styles.xgValue}>{prediction.xgHome}</Text>
                    </View>
                    <Text style={styles.xgDivider}>vs</Text>
                    <View style={styles.xgItem}>
                      <Text style={styles.xgLabel}>Expected Goals</Text>
                      <Text style={styles.xgValue}>{prediction.xgAway}</Text>
                    </View>
                  </View>

                  {/* Suggested Score */}
                  <View style={styles.suggestedScore}>
                    <Ionicons name="football" size={16} color={COLORS.gold} />
                    <Text style={styles.suggestedScoreText}>
                      Predicted Score: {prediction.suggestedScore.home} - {prediction.suggestedScore.away}
                    </Text>
                  </View>

                  {/* Real WDK stake + agent action */}
                  <Button
                    style={{ marginTop: 16 }}
                    title={actionBusy ? 'Processing...' : 'Stake 1.5 USDt (real WDK)'}
                    onPress={async () => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      if (!walletReady) {
                        router.push('/wallet');
                        return;
                      }
                      setActionBusy(true);
                      try {
                        const favored = (prediction?.homeWin || 0) > (prediction?.awayWin || 0) ? match.homeTeam.name : match.awayTeam.name;
                        const to = resolveDemoAddress(favored);
                        const ok = await sendTip(to, '1.50', `Stake on ${match.homeTeam.shortName} vs ${match.awayTeam.shortName}`);
                        if (ok) {
                          Alert.alert('Staked!', 'Real transfer sent from your WDK wallet.');
                        } else {
                          Alert.alert(
                            'Stake not sent',
                            'The transfer could not be broadcast. A signed transaction still needs a network connection — check that you are online and have enough USDt + gas.'
                          );
                        }
                      } finally { setActionBusy(false); }
                    }}
                    icon="cash"
                    fullWidth
                    disabled={actionBusy}
                  />
                  {agentReady && (
                    <Button
                      title={actionBusy ? '...' : 'Let Agent Tip (policy enforced)'}
                      onPress={async () => {
                        setActionBusy(true);
                        try {
                          const dec = evaluateForMatch(match.id);
                          if (dec?.shouldAct && dec.action) {
                            const to = resolveDemoAddress(dec.action.to);
                            const act = await executeAgentTip(to, dec.action.amount, match.id);
                            Alert.alert(act.status === 'rejected' ? 'Blocked by WDK Policy' : 'Agent Acted', act.reason || act.status);
                          } else {
                            Alert.alert('Agent', dec?.reasoning || 'No action');
                          }
                        } finally { setActionBusy(false); }
                      }}
                      variant="outline"
                      size="sm"
                      icon="flash"
                      fullWidth
                      disabled={actionBusy}
                    />
                  )}
                </Card>

                {/* Factors */}
                <Card>
                  <Text style={styles.sectionTitle}>Prediction Factors</Text>
                  {prediction.factors.map((factor, i) => (
                    <View key={i} style={styles.factorRow}>
                      <View style={[
                        styles.factorImpact,
                        { backgroundColor: factor.impact > 0 ? COLORS.success + '20' : factor.impact < 0 ? COLORS.error + '20' : COLORS.textDim + '20' }
                      ]}>
                        <Text style={[
                          styles.factorImpactText,
                          { color: factor.impact > 0 ? COLORS.success : factor.impact < 0 ? COLORS.error : COLORS.textDim }
                        ]}>
                          {factor.impact > 0 ? '+' : ''}{(factor.impact * 100).toFixed(0)}%
                        </Text>
                      </View>
                      <View style={styles.factorInfo}>
                        <Text style={styles.factorName}>{factor.name}</Text>
                        <Text style={styles.factorDesc}>{factor.description}</Text>
                      </View>
                    </View>
                  ))}
                </Card>
              </>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="trending-up" size={48} color={COLORS.textDim} />
                <Text style={styles.emptyTitle}>Run Analysis First</Text>
                <Text style={styles.emptySubtitle}>
                  Go to the Analysis tab and run AI analysis to generate predictions.
                </Text>
              </View>
            )}
          </>
        )}

        {activeTab === 'commentary' && (
          <LiveCommentary
            matchId={match.id}
            homeTeam={match.homeTeam.shortName}
            awayTeam={match.awayTeam.shortName}
          />
        )}

        {activeTab === 'camera' && (
          <View style={styles.cameraSection}>
            <Card>
              <View style={styles.cameraCard}>
                <Ionicons name="camera" size={32} color={COLORS.primary} />
                <Text style={styles.cameraTitle}>Live Match Analysis</Text>
                <Text style={styles.cameraSubtitle}>
                  Point your camera at a live match to get instant AI analysis
                </Text>
                <Button
                  title="Open Camera"
                  onPress={() => setShowCamera(true)}
                  icon="camera"
                />
              </View>
            </Card>

            {cameraAnalysis && (
              <Card>
                <Text style={styles.sectionTitle}>Camera Analysis</Text>
                <Text style={styles.analysisText}>{cameraAnalysis}</Text>
              </Card>
            )}
          </View>
        )}
      </ScrollView>

      {/* Camera Modal */}
      <Modal
        visible={showCamera}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <View style={styles.cameraModal}>
          <CameraAnalysis
            onCapture={handleCameraCapture}
            onAnalyze={handleCameraAnalysis}
          />
          <Pressable
            style={styles.closeCamera}
            onPress={() => setShowCamera(false)}
          >
            <Ionicons name="close" size={24} color={COLORS.text} />
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 20, gap: 12 },
  matchHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  teamColumn: { flex: 1 },
  teamCode: { fontSize: 32, fontWeight: '800', color: COLORS.text, letterSpacing: -1 },
  teamFull: { fontSize: 12, color: COLORS.textDim, marginTop: 4 },
  teamForm: { fontSize: 12, color: COLORS.textMuted, marginTop: 4, letterSpacing: 2 },
  scoreColumn: { alignItems: 'center', paddingHorizontal: 20 },
  vsLabel: { fontSize: 16, fontWeight: '700', color: COLORS.textDim, letterSpacing: 3 },
  matchTime: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  matchTimeSmall: { fontSize: 11, color: COLORS.textDim, marginTop: 2 },
  tabs: { flexDirection: 'row', gap: 4, padding: 4, marginVertical: 8, backgroundColor: COLORS.surfaceElevated, borderRadius: 999 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 9, borderRadius: 999, backgroundColor: 'transparent' },
  tabActive: { backgroundColor: '#FFFFFF' },
  tabText: { fontSize: 11, fontWeight: '600', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.3 },
  tabTextActive: { color: COLORS.background },
  content: { flex: 1 },
  contentInner: { gap: 14, paddingBottom: 28 },
  loadingContainer: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { fontSize: 16, color: COLORS.text },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginTop: 8 },
  emptySubtitle: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginBottom: 16 },
  analysisText: { fontSize: 14, color: COLORS.textMuted, lineHeight: 22 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
  predictionGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  predictionItem: { alignItems: 'center', gap: 4 },
  predictionLabel: { fontSize: 12, color: COLORS.textDim },
  predictionValue: { fontSize: 28, fontWeight: '800', color: COLORS.text },
  probBar: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 16, backgroundColor: COLORS.border },
  probBarHome: { backgroundColor: COLORS.primary },
  probBarDraw: { backgroundColor: COLORS.textDim },
  probBarAway: { backgroundColor: COLORS.secondary },
  xgRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 16, paddingVertical: 12, backgroundColor: COLORS.background, borderRadius: 10 },
  xgItem: { alignItems: 'center' },
  xgLabel: { fontSize: 11, color: COLORS.textDim, marginBottom: 4 },
  xgValue: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  xgDivider: { fontSize: 14, color: COLORS.textDim },
  suggestedScore: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.accent + '15', paddingVertical: 10, borderRadius: 8 },
  suggestedScoreText: { fontSize: 14, fontWeight: '600', color: COLORS.accent },
  factorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  factorImpact: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, minWidth: 48, alignItems: 'center' },
  factorImpactText: { fontSize: 12, fontWeight: '700' },
  factorInfo: { flex: 1 },
  factorName: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  factorDesc: { fontSize: 11, color: COLORS.textDim, marginTop: 2 },
  cameraSection: { gap: 16 },
  cameraCard: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  cameraTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  cameraSubtitle: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginBottom: 8 },
  cameraModal: { flex: 1, backgroundColor: COLORS.background },
  closeCamera: { position: 'absolute', top: 60, left: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 16, color: COLORS.error, textAlign: 'center', marginTop: 16, marginBottom: 24 },

  competitionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    marginBottom: 4,
  },
  competitionLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  analysisHeaderText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
