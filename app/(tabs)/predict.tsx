// GoalMind — Predictions Screen (Enhanced)
// AI-powered match predictions using Elo + Poisson + form analysis.

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/types';
import { SAMPLE_MATCHES } from '@/lib/data/football';
import { useAIStore } from '@/stores';
import { predictMatch, type PredictionResult } from '@/lib/predictions/engine';
import { Card, Button, Badge } from '@/components/ui';

export default function PredictScreen() {
  const { modelsLoaded } = useAIStore();
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [predicting, setPredicting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const generatePredictions = useCallback(async () => {
    setPredicting(true);

    try {
      // Use the real prediction engine
      const results = SAMPLE_MATCHES.map((match) => predictMatch(match));
      setPredictions(results);
    } catch (error) {
      console.error('Prediction failed:', error);
    } finally {
      setPredicting(false);
    }
  }, []);

  const toggleExpanded = useCallback((matchId: string) => {
    setExpandedId((prev) => (prev === matchId ? null : matchId));
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Predictions</Text>
        <Text style={styles.subtitle}>Elo + Poisson + form analysis</Text>
      </View>

      {/* Generate Button */}
      <Button
        title={predicting ? 'Computing...' : 'Generate Predictions'}
        onPress={generatePredictions}
        icon="flash"
        loading={predicting}
        fullWidth
      />

      {/* Algorithm Info */}
      <View style={styles.algoInfo}>
        <Ionicons name="information-circle" size={14} color={COLORS.textDim} />
        <Text style={styles.algoText}>
          Uses Elo ratings, Poisson distribution, and weighted form analysis. All computed on-device.
        </Text>
      </View>

      <ScrollView style={styles.predictionsList} showsVerticalScrollIndicator={false}>
        {predictions.map((pred) => {
          const isExpanded = expandedId === pred.matchId;

          return (
            <Pressable
              key={pred.matchId}
              style={styles.predictionCard}
              onPress={() => toggleExpanded(pred.matchId)}
            >
              {/* Match Header */}
              <View style={styles.matchHeader}>
                <Text style={styles.teamCode}>{pred.homeTeam}</Text>
                <View style={styles.vsContainer}>
                  <Text style={styles.vsText}>VS</Text>
                  <Text style={styles.suggestedScore}>
                    {pred.suggestedScore.home} - {pred.suggestedScore.away}
                  </Text>
                </View>
                <Text style={styles.teamCode}>{pred.awayTeam}</Text>
              </View>

              {/* Win Probability */}
              <View style={styles.probContainer}>
                <View style={styles.probItem}>
                  <Text style={styles.probLabel}>{pred.homeTeam}</Text>
                  <Text style={[styles.probValue, { color: COLORS.primary }]}>
                    {(pred.homeWin * 100).toFixed(0)}%
                  </Text>
                </View>
                <View style={styles.probItem}>
                  <Text style={styles.probLabel}>Draw</Text>
                  <Text style={[styles.probValue, { color: COLORS.textDim }]}>
                    {(pred.draw * 100).toFixed(0)}%
                  </Text>
                </View>
                <View style={styles.probItem}>
                  <Text style={styles.probLabel}>{pred.awayTeam}</Text>
                  <Text style={[styles.probValue, { color: COLORS.secondary }]}>
                    {(pred.awayWin * 100).toFixed(0)}%
                  </Text>
                </View>
              </View>

              {/* Probability Bar */}
              <View style={styles.probBar}>
                <View style={[styles.probBarHome, { flex: pred.homeWin }]} />
                <View style={[styles.probBarDraw, { flex: pred.draw }]} />
                <View style={[styles.probBarAway, { flex: pred.awayWin }]} />
              </View>

              {/* xG */}
              <View style={styles.xgRow}>
                <View style={styles.xgItem}>
                  <Text style={styles.xgLabel}>xG</Text>
                  <Text style={styles.xgValue}>{pred.xgHome}</Text>
                </View>
                <View style={styles.xgDivider} />
                <View style={styles.xgItem}>
                  <Text style={styles.xgLabel}>xG</Text>
                  <Text style={styles.xgValue}>{pred.xgAway}</Text>
                </View>
              </View>

              {/* Confidence */}
              <View style={styles.confidenceRow}>
                <Text style={styles.confidenceLabel}>Confidence</Text>
                <View style={styles.confidenceBar}>
                  <View
                    style={[
                      styles.confidenceFill,
                      { width: `${pred.confidence * 100}%` },
                      pred.confidence > 0.75 ? styles.confidenceHigh :
                      pred.confidence > 0.6 ? styles.confidenceMed : styles.confidenceLow,
                    ]}
                  />
                </View>
                <Text style={styles.confidenceValue}>
                  {(pred.confidence * 100).toFixed(0)}%
                </Text>
              </View>

              {/* Expanded: Factors */}
              {isExpanded && (
                <View style={styles.factorsContainer}>
                  <Text style={styles.factorsTitle}>Prediction Factors</Text>
                  {pred.factors.map((factor, i) => (
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
                </View>
              )}

              {/* Expand indicator */}
              <View style={styles.expandRow}>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={COLORS.textDim}
                />
                <Text style={styles.expandText}>
                  {isExpanded ? 'Hide factors' : 'View factors'}
                </Text>
              </View>
            </Pressable>
          );
        })}

        {predictions.length === 0 && !predicting && (
          <View style={styles.emptyState}>
            <Ionicons name="analytics-outline" size={48} color={COLORS.textDim} />
            <Text style={styles.emptyTitle}>No Predictions Yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap "Generate Predictions" to run statistical analysis on upcoming matches.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 20, paddingTop: 60 },
  header: { marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
  algoInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, marginBottom: 16, paddingHorizontal: 4 },
  algoText: { fontSize: 12, color: COLORS.textDim, flex: 1, lineHeight: 16 },
  predictionsList: { flex: 1 },
  predictionCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  matchHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  teamCode: { fontSize: 24, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  vsContainer: { alignItems: 'center' },
  vsText: { fontSize: 12, fontWeight: '700', color: COLORS.textDim, letterSpacing: 2 },
  suggestedScore: { fontSize: 14, fontWeight: '700', color: COLORS.accent, marginTop: 4 },
  probContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  probItem: { alignItems: 'center' },
  probLabel: { fontSize: 11, color: COLORS.textDim, marginBottom: 4 },
  probValue: { fontSize: 20, fontWeight: '800' },
  probBar: { flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 16, backgroundColor: COLORS.border },
  probBarHome: { backgroundColor: COLORS.primary },
  probBarDraw: { backgroundColor: COLORS.textDim },
  probBarAway: { backgroundColor: COLORS.secondary },
  xgRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 16, paddingVertical: 12, backgroundColor: COLORS.background, borderRadius: 10 },
  xgItem: { alignItems: 'center' },
  xgLabel: { fontSize: 11, color: COLORS.textDim, marginBottom: 4 },
  xgValue: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  xgDivider: { width: 1, height: 32, backgroundColor: COLORS.border },
  confidenceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  confidenceLabel: { fontSize: 12, color: COLORS.textDim, width: 70 },
  confidenceBar: { flex: 1, height: 4, backgroundColor: COLORS.border, borderRadius: 2, overflow: 'hidden' },
  confidenceFill: { height: '100%', borderRadius: 2 },
  confidenceHigh: { backgroundColor: COLORS.success },
  confidenceMed: { backgroundColor: COLORS.warning },
  confidenceLow: { backgroundColor: COLORS.error },
  confidenceValue: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, width: 35, textAlign: 'right' },
  factorsContainer: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border },
  factorsTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textDim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  factorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  factorImpact: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, minWidth: 48, alignItems: 'center' },
  factorImpactText: { fontSize: 12, fontWeight: '700' },
  factorInfo: { flex: 1 },
  factorName: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  factorDesc: { fontSize: 11, color: COLORS.textDim, marginTop: 2 },
  expandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 12 },
  expandText: { fontSize: 12, color: COLORS.textDim },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 20 },
});
