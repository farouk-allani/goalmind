// GoalMind — Match Analysis Screen
// Deep AI analysis of a selected match. All on-device.

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/types';
import { SAMPLE_MATCHES, formatTeamStatsForAnalysis } from '@/lib/data/football';
import { useAIStore } from '@/stores';

export default function MatchAnalysisScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { modelsLoaded, loading, setLoading, commentary, setCommentary } = useAIStore();
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'analysis' | 'prediction' | 'commentary'>('analysis');

  const match = SAMPLE_MATCHES.find((m) => m.id === id);

  const runAnalysis = useCallback(async () => {
    if (!match || !modelsLoaded) return;
    
    setLoading(true);
    setCommentary('');
    
    try {
      // In production, this calls QVAC SDK
      // For now, generate analysis based on real team data
      const homeContext = formatTeamStatsForAnalysis(match.homeTeam);
      const awayContext = formatTeamStatsForAnalysis(match.awayTeam);
      
      // Simulate AI processing time
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      const homeStats = match.homeTeam.stats;
      const awayStats = match.awayTeam.stats;
      
      // Real analysis based on actual stats
      const possessionDiff = homeStats.avgPossession - awayStats.avgPossession;
      const goalDiff = (homeStats.goalsFor - homeStats.goalsAgainst) - (awayStats.goalsFor - awayStats.goalsAgainst);
      const formHome = match.homeTeam.recentForm.filter(r => r === 'W').length;
      const formAway = match.awayTeam.recentForm.filter(r => r === 'W').length;
      
      const analysisText = `TACTICAL ANALYSIS: ${match.homeTeam.name} vs ${match.awayTeam.name}

${match.homeTeam.name} enters with ${homeStats.avgPossession}% average possession and a goal difference of ${homeStats.goalsFor - homeStats.goalsAgainst > 0 ? '+' : ''}${homeStats.goalsFor - homeStats.goalsAgainst}. Their pass accuracy sits at ${homeStats.passAccuracy}%, generating ${homeStats.shotsPerGame} shots per game.

${match.awayTeam.name} counters with ${awayStats.avgPossession}% possession and ${awayStats.shotsPerGame} shots per game. Their ${awayStats.cleanSheets} clean sheets suggest ${awayStats.cleanSheets >= 3 ? 'solid' : 'vulnerable'} defensive organization.

${possessionDiff > 3 ? `${match.homeTeam.name} will likely dominate possession (${Math.abs(possessionDiff).toFixed(1)}% advantage).` : possessionDiff < -3 ? `${match.awayTeam.name} should control the ball (${Math.abs(possessionDiff).toFixed(1)}% advantage).` : 'Possession should be evenly contested.'}

Key factor: ${homeStats.passAccuracy > awayStats.passAccuracy + 2 ? `${match.homeTeam.name}'s superior passing accuracy could be decisive` : awayStats.passAccuracy > homeStats.passAccuracy + 2 ? `${match.awayTeam.name}'s passing precision gives them an edge` : 'Both teams are evenly matched in build-up play'}.

Momentum: ${match.homeTeam.name} recent form (${match.homeTeam.recentForm.join(' ')}) vs ${match.awayTeam.name} (${match.awayTeam.recentForm.join(' ')}). ${formHome > formAway ? `Advantage ${match.homeTeam.name}.` : formAway > formHome ? `Advantage ${match.awayTeam.name}.` : 'Neither side has clear momentum.'}`;

      setAnalysis(analysisText);

      // Generate prediction
      const totalGoalsHome = homeStats.goalsFor / homeStats.played;
      const totalGoalsAway = awayStats.goalsFor / awayStats.played;
      const homeXG = (totalGoalsHome + awayStats.goalsAgainst / awayStats.played) / 2;
      const awayXG = (totalGoalsAway + homeStats.goalsAgainst / homeStats.played) / 2;
      
      const homeWinProb = 0.35 + (goalDiff * 0.02) + (formHome - formAway) * 0.05 + possessionDiff * 0.005;
      const awayWinProb = 0.30 - (goalDiff * 0.02) - (formHome - formAway) * 0.05 - possessionDiff * 0.005;
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

  useEffect(() => {
    if (match && modelsLoaded) {
      runAnalysis();
    }
  }, [match, modelsLoaded]);

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
        {(['analysis', 'prediction', 'commentary'] as const).map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={COLORS.primary} size="large" />
            <Text style={styles.loadingText}>Analyzing on-device...</Text>
            <Text style={styles.loadingSubtext}>No data leaves your phone</Text>
          </View>
        ) : (
          <>
            {activeTab === 'analysis' && analysis && (
              <View style={styles.analysisCard}>
                <View style={styles.analysisHeader}>
                  <Ionicons name="analytics" size={20} color={COLORS.primary} />
                  <Text style={styles.analysisTitle}>Tactical Breakdown</Text>
                </View>
                <Text style={styles.analysisText}>{analysis}</Text>
              </View>
            )}

            {activeTab === 'prediction' && prediction && (
              <View style={styles.predictionCard}>
                <View style={styles.analysisHeader}>
                  <Ionicons name="trending-up" size={20} color={COLORS.secondary} />
                  <Text style={styles.analysisTitle}>Match Prediction</Text>
                </View>
                
                <View style={styles.predictionGrid}>
                  <View style={styles.predictionItem}>
                    <Text style={styles.predictionLabel}>{match.homeTeam.shortName} Win</Text>
                    <Text style={styles.predictionValue}>
                      {(prediction.homeWin * 100).toFixed(0)}%
                    </Text>
                    <View style={[styles.predictionBar, { width: `${prediction.homeWin * 100}%`, backgroundColor: COLORS.primary }]} />
                  </View>
                  <View style={styles.predictionItem}>
                    <Text style={styles.predictionLabel}>Draw</Text>
                    <Text style={styles.predictionValue}>
                      {(prediction.draw * 100).toFixed(0)}%
                    </Text>
                    <View style={[styles.predictionBar, { width: `${prediction.draw * 100}%`, backgroundColor: COLORS.textDim }]} />
                  </View>
                  <View style={styles.predictionItem}>
                    <Text style={styles.predictionLabel}>{match.awayTeam.shortName} Win</Text>
                    <Text style={styles.predictionValue}>
                      {(prediction.awayWin * 100).toFixed(0)}%
                    </Text>
                    <View style={[styles.predictionBar, { width: `${prediction.awayWin * 100}%`, backgroundColor: COLORS.secondary }]} />
                  </View>
                </View>

                <View style={styles.xgRow}>
                  <View style={styles.xgItem}>
                    <Text style={styles.xgLabel}>xG {match.homeTeam.shortName}</Text>
                    <Text style={styles.xgValue}>{prediction.expectedGoalsHome}</Text>
                  </View>
                  <View style={styles.xgItem}>
                    <Text style={styles.xgLabel}>xG {match.awayTeam.shortName}</Text>
                    <Text style={styles.xgValue}>{prediction.expectedGoalsAway}</Text>
                  </View>
                </View>
              </View>
            )}

            {activeTab === 'commentary' && (
              <View style={styles.commentaryCard}>
                <View style={styles.analysisHeader}>
                  <Ionicons name="mic" size={20} color={COLORS.accent} />
                  <Text style={styles.analysisTitle}>AI Commentary</Text>
                </View>
                <Text style={styles.commentaryText}>
                  {commentary || 'Start a match to generate live AI commentary. Works offline in stadiums — no connectivity needed.'}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Action Button */}
      {!loading && !analysis && modelsLoaded && (
        <Pressable style={styles.actionButton} onPress={runAnalysis}>
          <Ionicons name="flash" size={20} color={COLORS.background} />
          <Text style={styles.actionButtonText}>Run AI Analysis</Text>
        </Pressable>
      )}
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
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: COLORS.primaryMuted,
  },
  tabText: {
    fontSize: 13,
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
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 12,
    color: COLORS.textDim,
    marginTop: 4,
  },
  analysisCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  analysisText: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 22,
  },
  predictionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  predictionGrid: {
    gap: 16,
    marginBottom: 24,
  },
  predictionItem: {
    gap: 8,
  },
  predictionLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  predictionValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  predictionBar: {
    height: 4,
    borderRadius: 2,
  },
  xgRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  xgItem: {
    alignItems: 'center',
  },
  xgLabel: {
    fontSize: 12,
    color: COLORS.textDim,
    marginBottom: 4,
  },
  xgValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  commentaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  commentaryText: {
    fontSize: 16,
    color: COLORS.textMuted,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginVertical: 16,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.background,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: 40,
  },
});
