// GoalMind — Match Detail Screen (Enhanced)
// Real analysis, prediction engine, camera integration, live commentary.

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/types';
import { SAMPLE_MATCHES, formatTeamStatsForAnalysis } from '@/lib/data/football';
import { useAIStore } from '@/stores';
import { predictMatch } from '@/lib/predictions/engine';
import { Button, Card, Badge } from '@/components/ui';
import { PossessionBar, MomentumGauge, StatsComparison } from '@/components/analysis';
import { CameraAnalysis } from '@/components/analysis/CameraAnalysis';
import { LiveCommentary } from '@/components/analysis/LiveCommentary';
import type { PredictionResult } from '@/lib/predictions/engine';

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { modelsLoaded, loading, setLoading } = useAIStore();
  const [activeTab, setActiveTab] = useState<'analysis' | 'predict' | 'commentary' | 'camera'>('analysis');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraAnalysis, setCameraAnalysis] = useState<string | null>(null);

  const match = SAMPLE_MATCHES.find((m) => m.id === id);

  const runAnalysis = useCallback(async () => {
    if (!match) return;

    setLoading(true);
    try {
      // Run real analysis using team stats
      const homeStats = match.homeTeam.stats;
      const awayStats = match.awayTeam.stats;

      const possessionDiff = homeStats.avgPossession - awayStats.avgPossession;
      const formHome = match.homeTeam.recentForm.filter(r => r === 'W').length;
      const formAway = match.awayTeam.recentForm.filter(r => r === 'W').length;

      const analysisText = `TACTICAL ANALYSIS: ${match.homeTeam.name} vs ${match.awayTeam.name}

${match.homeTeam.name} enters with ${homeStats.avgPossession}% average possession and a goal difference of ${homeStats.goalsFor - homeStats.goalsAgainst > 0 ? '+' : ''}${homeStats.goalsFor - homeStats.goalsAgainst}. Their pass accuracy sits at ${homeStats.passAccuracy}%, generating ${homeStats.shotsPerGame} shots per game.

${match.awayTeam.name} counters with ${awayStats.avgPossession}% possession and ${awayStats.shotsPerGame} shots per game. Their ${awayStats.cleanSheets} clean sheets suggest ${awayStats.cleanSheets >= 3 ? 'solid' : 'vulnerable'} defensive organization.

${possessionDiff > 3 ? `${match.homeTeam.name} will likely dominate possession (${Math.abs(possessionDiff).toFixed(1)}% advantage).` : possessionDiff < -3 ? `${match.awayTeam.name} should control the ball (${Math.abs(possessionDiff).toFixed(1)}% advantage).` : 'Possession should be evenly contested.'}

Key factor: ${homeStats.passAccuracy > awayStats.passAccuracy + 2 ? `${match.homeTeam.name}'s superior passing accuracy could be decisive` : awayStats.passAccuracy > homeStats.passAccuracy + 2 ? `${match.awayTeam.name}'s passing precision gives them an edge` : 'Both teams are evenly matched in build-up play'}.

Momentum: ${match.homeTeam.name} recent form (${match.homeTeam.recentForm.join(' ')}) vs ${match.awayTeam.name} (${match.awayTeam.recentForm.join(' ')}). ${formHome > formAway ? `Advantage ${match.homeTeam.name}.` : formAway > formHome ? `Advantage ${match.awayTeam.name}.` : 'Neither side has clear momentum.'}`;

      setAnalysis(analysisText);

      // Run real prediction engine
      const result = predictMatch(match);
      setPrediction(result);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setLoading(false);
    }
  }, [match]);

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
      {/* Match Header */}
      <View style={styles.matchHeader}>
        <View style={styles.teamColumn}>
          <Text style={styles.teamCode}>{match.homeTeam.shortName}</Text>
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
          <Text style={styles.teamCode}>{match.awayTeam.shortName}</Text>
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
            onPress={() => setActiveTab(tab)}
          >
            <Ionicons
              name={tab === 'analysis' ? 'analytics' : tab === 'predict' ? 'trending-up' : tab === 'commentary' ? 'mic' : 'camera'}
              size={16}
              color={activeTab === tab ? COLORS.primary : COLORS.textDim}
            />
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'analysis' && (
          <>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Ionicons name="sync" size={24} color={COLORS.primary} />
                <Text style={styles.loadingText}>Analyzing on-device...</Text>
              </View>
            ) : analysis ? (
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
                <Card>
                  <Text style={styles.analysisText}>{analysis}</Text>
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
                  title="Analyze Match"
                  onPress={runAnalysis}
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
                    <Ionicons name="football" size={16} color={COLORS.accent} />
                    <Text style={styles.suggestedScoreText}>
                      Predicted Score: {prediction.suggestedScore.home} - {prediction.suggestedScore.away}
                    </Text>
                  </View>
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
  tabs: { flexDirection: 'row', gap: 4, paddingVertical: 8 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10, borderRadius: 8, backgroundColor: COLORS.surface },
  tabActive: { backgroundColor: COLORS.primaryMuted },
  tabText: { fontSize: 12, fontWeight: '600', color: COLORS.textDim },
  tabTextActive: { color: COLORS.primary },
  content: { flex: 1 },
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
});
