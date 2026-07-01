// GoalMind — Match Detail Screen with Camera Integration
// Enhanced match analysis with camera-based live analysis.

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
import { Button, Card, Badge } from '@/components/ui';
import { PossessionBar, MomentumGauge, StatsComparison } from '@/components/analysis';
import { CameraAnalysis } from '@/components/analysis/CameraAnalysis';
import { LiveCommentary } from '@/components/analysis/LiveCommentary';

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { modelsLoaded, loading, setLoading } = useAIStore();
  const [activeTab, setActiveTab] = useState<'analysis' | 'predict' | 'commentary' | 'camera'>('analysis');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraAnalysis, setCameraAnalysis] = useState<string | null>(null);

  const match = SAMPLE_MATCHES.find((m) => m.id === id);

  const runAnalysis = useCallback(async () => {
    if (!match || !modelsLoaded) return;
    
    setLoading(true);
    try {
      const homeStats = match.homeTeam.stats;
      const awayStats = match.awayTeam.stats;
      
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
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

      const totalGoalsHome = homeStats.goalsFor / homeStats.played;
      const totalGoalsAway = awayStats.goalsFor / awayStats.played;
      const homeXG = (totalGoalsHome + awayStats.goalsAgainst / awayStats.played) / 2;
      const awayXG = (totalGoalsAway + homeStats.goalsAgainst / homeStats.played) / 2;
      
      const homeWinProb = 0.35 + ((homeStats.goalsFor - homeStats.goalsAgainst) - (awayStats.goalsFor - awayStats.goalsAgainst)) * 0.02 + (formHome - formAway) * 0.05 + possessionDiff * 0.005;
      const awayWinProb = 0.30 - ((homeStats.goalsFor - homeStats.goalsAgainst) - (awayStats.goalsFor - awayStats.goalsAgainst)) * 0.02 - (formHome - formAway) * 0.05 - possessionDiff * 0.005;
      const drawProb = 1 - homeWinProb - awayWinProb;

      setPrediction({
        homeWin: Math.max(0.15, Math.min(0.65, homeWinProb)),
        draw: Math.max(0.15, Math.min(0.40, drawProb)),
        awayWin: Math.max(0.15, Math.min(0.65, awayWinProb)),
        expectedGoalsHome: Math.max(0.5, Math.min(3.5, homeXG)).toFixed(1),
        expectedGoalsAway: Math.max(0.5, Math.min(3.5, awayXG)).toFixed(1),
      });
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setLoading(false);
    }
  }, [match, modelsLoaded]);

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
        <Text style={styles.errorText}>Match not found</Text>
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
        </View>
        <View style={styles.scoreColumn}>
          <Text style={styles.vsLabel}>VS</Text>
          <Text style={styles.matchTime}>
            {new Date(match.kickoff).toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </Text>
        </View>
        <View style={[styles.teamColumn, { alignItems: 'flex-end' }]}>
          <Text style={styles.teamCode}>{match.awayTeam.shortName}</Text>
          <Text style={styles.teamFull}>{match.awayTeam.name}</Text>
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
                  disabled={!modelsLoaded}
                />
              </View>
            )}
          </>
        )}

        {activeTab === 'predict' && prediction && (
          <Card>
            <Text style={styles.sectionTitle}>Match Prediction</Text>
            <View style={styles.predictionGrid}>
              <View style={styles.predictionItem}>
                <Text style={styles.predictionLabel}>{match.homeTeam.shortName}</Text>
                <Text style={styles.predictionValue}>{(prediction.homeWin * 100).toFixed(0)}%</Text>
              </View>
              <View style={styles.predictionItem}>
                <Text style={styles.predictionLabel}>Draw</Text>
                <Text style={styles.predictionValue}>{(prediction.draw * 100).toFixed(0)}%</Text>
              </View>
              <View style={styles.predictionItem}>
                <Text style={styles.predictionLabel}>{match.awayTeam.shortName}</Text>
                <Text style={styles.predictionValue}>{(prediction.awayWin * 100).toFixed(0)}%</Text>
              </View>
            </View>
          </Card>
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
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  teamColumn: {
    flex: 1,
  },
  teamCode: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -1,
  },
  teamFull: {
    fontSize: 12,
    color: COLORS.textDim,
    marginTop: 4,
  },
  scoreColumn: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  vsLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDim,
    letterSpacing: 3,
  },
  matchTime: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  tabs: {
    flexDirection: 'row',
    gap: 4,
    paddingVertical: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
  },
  tabActive: {
    backgroundColor: COLORS.primaryMuted,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textDim,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.text,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 16,
  },
  analysisText: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  predictionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  predictionItem: {
    alignItems: 'center',
    gap: 4,
  },
  predictionLabel: {
    fontSize: 12,
    color: COLORS.textDim,
  },
  predictionValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  cameraSection: {
    gap: 16,
  },
  cameraCard: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 24,
  },
  cameraTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  cameraSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 8,
  },
  cameraModal: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  closeCamera: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: 40,
  },
});
