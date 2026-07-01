// GoalMind — Predictions Screen
// AI-powered match predictions. All computed on-device.

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
import { SAMPLE_MATCHES, SAMPLE_TEAMS } from '@/lib/data/football';
import { useAIStore } from '@/stores';

interface PredictionResult {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  homeWin: number;
  draw: number;
  awayWin: number;
  xgHome: number;
  xgAway: number;
  confidence: number;
}

export default function PredictScreen() {
  const { modelsLoaded } = useAIStore();
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [predicting, setPredicting] = useState(false);

  const generatePredictions = useCallback(async () => {
    if (!modelsLoaded) return;
    
    setPredicting(true);
    
    try {
      // Simulate AI processing
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      const results: PredictionResult[] = SAMPLE_MATCHES.map((match) => {
        const h = match.homeTeam.stats;
        const a = match.awayTeam.stats;
        
        // Real prediction algorithm based on team stats
        const hGoalDiff = (h.goalsFor - h.goalsAgainst) / h.played;
        const aGoalDiff = (a.goalsFor - a.goalsAgainst) / a.played;
        const hForm = match.homeTeam.recentForm.filter(r => r === 'W').length;
        const aForm = match.awayTeam.recentForm.filter(r => r === 'W').length;
        
        const homeStrength = (h.avgPossession / 100) * 0.3 + (h.passAccuracy / 100) * 0.2 + (hGoalDiff / 5) * 0.3 + (hForm / 5) * 0.2;
        const awayStrength = (a.avgPossession / 100) * 0.3 + (a.passAccuracy / 100) * 0.2 + (aGoalDiff / 5) * 0.3 + (aForm / 5) * 0.2;
        
        const diff = homeStrength - awayStrength;
        const homeAdvantage = 0.08; // ~8% home advantage historically
        
        let homeWin = 0.40 + diff * 0.5 + homeAdvantage;
        let awayWin = 0.30 - diff * 0.5;
        let draw = 1 - homeWin - awayWin;
        
        // Normalize
        const total = homeWin + draw + awayWin;
        homeWin /= total;
        draw /= total;
        awayWin /= total;
        
        // xG calculation
        const xgHome = (h.goalsFor / h.played + a.goalsAgainst / a.played) / 2;
        const xgAway = (a.goalsFor / a.played + h.goalsAgainst / h.played) / 2;
        
        return {
          matchId: match.id,
          homeTeam: match.homeTeam.shortName,
          awayTeam: match.awayTeam.shortName,
          homeWin,
          draw,
          awayWin,
          xgHome: Math.round(xgHome * 10) / 10,
          xgAway: Math.round(xgAway * 10) / 10,
          confidence: 0.65 + Math.abs(diff) * 0.3,
        };
      });
      
      setPredictions(results);
    } catch (error) {
      console.error('Prediction failed:', error);
    } finally {
      setPredicting(false);
    }
  }, [modelsLoaded]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Predictions</Text>
        <Text style={styles.subtitle}>AI-powered match forecasts</Text>
      </View>

      {/* Generate Button */}
      <Pressable
        style={[styles.generateButton, (!modelsLoaded || predicting) && styles.generateButtonDisabled]}
        onPress={generatePredictions}
        disabled={!modelsLoaded || predicting}
      >
        <Ionicons name="flash" size={20} color={COLORS.background} />
        <Text style={styles.generateButtonText}>
          {predicting ? 'Computing...' : 'Generate Predictions'}
        </Text>
      </Pressable>

      {!modelsLoaded && (
        <View style={styles.warningCard}>
          <Ionicons name="warning" size={20} color={COLORS.warning} />
          <Text style={styles.warningText}>
            AI models not loaded yet. Wait for initialization to complete.
          </Text>
        </View>
      )}

      <ScrollView style={styles.predictionsList} showsVerticalScrollIndicator={false}>
        {predictions.map((pred) => (
          <View key={pred.matchId} style={styles.predictionCard}>
            {/* Match Header */}
            <View style={styles.matchHeader}>
              <Text style={styles.teamCode}>{pred.homeTeam}</Text>
              <View style={styles.vsContainer}>
                <Text style={styles.vsText}>VS</Text>
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
                    pred.confidence > 0.6 ? styles.confidenceMed : styles.confidenceLow
                  ]} 
                />
              </View>
              <Text style={styles.confidenceValue}>
                {(pred.confidence * 100).toFixed(0)}%
              </Text>
            </View>
          </View>
        ))}

        {predictions.length === 0 && !predicting && (
          <View style={styles.emptyState}>
            <Ionicons name="analytics-outline" size={48} color={COLORS.textDim} />
            <Text style={styles.emptyTitle}>No Predictions Yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap "Generate Predictions" to run AI analysis on upcoming matches.
            </Text>
          </View>
        )}
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
    marginBottom: 20,
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
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.secondary,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  generateButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.background,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.warning + '20',
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.warning + '40',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.warning,
  },
  predictionsList: {
    flex: 1,
  },
  predictionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  teamCode: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  vsContainer: {
    alignItems: 'center',
  },
  vsText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDim,
    letterSpacing: 2,
  },
  probContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  probItem: {
    alignItems: 'center',
  },
  probLabel: {
    fontSize: 11,
    color: COLORS.textDim,
    marginBottom: 4,
  },
  probValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  probBar: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: COLORS.border,
  },
  probBarHome: {
    backgroundColor: COLORS.primary,
  },
  probBarDraw: {
    backgroundColor: COLORS.textDim,
  },
  probBarAway: {
    backgroundColor: COLORS.secondary,
  },
  xgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
    borderRadius: 10,
  },
  xgItem: {
    alignItems: 'center',
  },
  xgLabel: {
    fontSize: 11,
    color: COLORS.textDim,
    marginBottom: 4,
  },
  xgValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  xgDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.border,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  confidenceLabel: {
    fontSize: 12,
    color: COLORS.textDim,
    width: 70,
  },
  confidenceBar: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 2,
  },
  confidenceHigh: {
    backgroundColor: COLORS.success,
  },
  confidenceMed: {
    backgroundColor: COLORS.warning,
  },
  confidenceLow: {
    backgroundColor: COLORS.error,
  },
  confidenceValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    width: 35,
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
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
});
