// GoalMind — Prediction Components
// Visual components for displaying match predictions.

import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/types';
import { Card, Badge, ProgressBar } from '@/components/ui';

interface PredictionCardProps {
  homeTeam: string;
  awayTeam: string;
  homeWin: number;
  draw: number;
  awayWin: number;
  xgHome: number;
  xgAway: number;
  confidence: number;
  onPress?: () => void;
}

export function PredictionCard({
  homeTeam,
  awayTeam,
  homeWin,
  draw,
  awayWin,
  xgHome,
  xgAway,
  confidence,
  onPress,
}: PredictionCardProps) {
  const confidenceColor = confidence > 0.75 ? COLORS.success : confidence > 0.6 ? COLORS.warning : COLORS.error;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
      <Card style={styles.card}>
        {/* Match Header */}
        <View style={styles.header}>
          <View style={styles.teamSide}>
            <Text style={styles.teamCode}>{homeTeam}</Text>
          </View>
          <View style={styles.vsContainer}>
            <Text style={styles.vsText}>VS</Text>
          </View>
          <View style={[styles.teamSide, { alignItems: 'flex-end' }]}>
            <Text style={styles.teamCode}>{awayTeam}</Text>
          </View>
        </View>

        {/* Win Probability */}
        <View style={styles.probContainer}>
          <View style={styles.probItem}>
            <Text style={styles.probLabel}>{homeTeam}</Text>
            <Text style={[styles.probValue, { color: COLORS.primary }]}>
              {(homeWin * 100).toFixed(0)}%
            </Text>
          </View>
          <View style={styles.probItem}>
            <Text style={styles.probLabel}>Draw</Text>
            <Text style={[styles.probValue, { color: COLORS.textDim }]}>
              {(draw * 100).toFixed(0)}%
            </Text>
          </View>
          <View style={styles.probItem}>
            <Text style={styles.probLabel}>{awayTeam}</Text>
            <Text style={[styles.probValue, { color: COLORS.secondary }]}>
              {(awayWin * 100).toFixed(0)}%
            </Text>
          </View>
        </View>

        {/* Probability Bar */}
        <View style={styles.probBar}>
          <View style={[styles.probBarHome, { flex: homeWin }]} />
          <View style={[styles.probBarDraw, { flex: draw }]} />
          <View style={[styles.probBarAway, { flex: awayWin }]} />
        </View>

        {/* xG */}
        <View style={styles.xgRow}>
          <View style={styles.xgItem}>
            <Text style={styles.xgLabel}>xG</Text>
            <Text style={styles.xgValue}>{xgHome.toFixed(1)}</Text>
          </View>
          <View style={styles.xgDivider} />
          <View style={styles.xgItem}>
            <Text style={styles.xgLabel}>xG</Text>
            <Text style={styles.xgValue}>{xgAway.toFixed(1)}</Text>
          </View>
        </View>

        {/* Confidence */}
        <View style={styles.confidenceRow}>
          <Text style={styles.confidenceLabel}>Confidence</Text>
          <ProgressBar value={confidence} color={confidenceColor} height={4} />
          <Text style={[styles.confidenceValue, { color: confidenceColor }]}>
            {(confidence * 100).toFixed(0)}%
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

interface PredictionSummaryProps {
  totalPredictions: number;
  correctPredictions: number;
  averageConfidence: number;
}

export function PredictionSummary({
  totalPredictions,
  correctPredictions,
  averageConfidence,
}: PredictionSummaryProps) {
  const accuracy = totalPredictions > 0 ? correctPredictions / totalPredictions : 0;

  return (
    <Card style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>Prediction Stats</Text>
      
      <View style={styles.summaryGrid}>
        <View style={styles.summaryItem}>
          <Ionicons name="football" size={20} color={COLORS.primary} />
          <Text style={styles.summaryValue}>{totalPredictions}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
          <Text style={styles.summaryValue}>{correctPredictions}</Text>
          <Text style={styles.summaryLabel}>Correct</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Ionicons name="trending-up" size={20} color={COLORS.accent} />
          <Text style={styles.summaryValue}>{(accuracy * 100).toFixed(0)}%</Text>
          <Text style={styles.summaryLabel}>Accuracy</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Ionicons name="shield-checkmark" size={20} color={COLORS.secondary} />
          <Text style={styles.summaryValue}>{(averageConfidence * 100).toFixed(0)}%</Text>
          <Text style={styles.summaryLabel}>Avg Confidence</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  teamSide: {
    flex: 1,
  },
  teamCode: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  vsContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
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
  confidenceValue: {
    fontSize: 12,
    fontWeight: '600',
    width: 35,
    textAlign: 'right',
  },
  summaryCard: {
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    gap: 6,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  summaryLabel: {
    fontSize: 11,
    color: COLORS.textDim,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
