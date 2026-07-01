// GoalMind — Home / Live Analysis Screen
// The main screen: select a match, get AI analysis.

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS } from '@/types';
import { SAMPLE_MATCHES, formatTeamStatsForAnalysis } from '@/lib/data/football';
import { useAIStore, useMatchStore } from '@/stores';

export default function AnalyzeScreen() {
  const { matches, setMatches, selectMatch } = useMatchStore();
  const { modelsLoaded, loading, commentary, setCommentary } = useAIStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    // Load sample matches for demo
    setMatches(SAMPLE_MATCHES as any);
  }, []);

  const handleMatchSelect = useCallback((match: any) => {
    setSelectedId(match.id);
    selectMatch(match);
    router.push(`/match/${match.id}`);
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>GoalMind</Text>
          <Text style={styles.subtitle}>AI Football Companion</Text>
        </View>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: modelsLoaded ? COLORS.success : COLORS.warning }]} />
          <Text style={styles.statusText}>
            {modelsLoaded ? 'AI Ready' : 'Loading AI...'}
          </Text>
        </View>
      </View>

      {/* AI Status Card */}
      {!modelsLoaded && (
        <View style={styles.aiCard}>
          <ActivityIndicator color={COLORS.primary} size="small" />
          <Text style={styles.aiCardText}>
            Loading on-device AI models...{'\n'}
            <Text style={styles.aiCardSubtext}>First launch downloads ~1.5GB. No data leaves your device.</Text>
          </Text>
        </View>
      )}

      {/* Matches */}
      <Text style={styles.sectionTitle}>Upcoming Matches</Text>
      <ScrollView style={styles.matchList} showsVerticalScrollIndicator={false}>
        {SAMPLE_MATCHES.map((match) => (
          <Pressable
            key={match.id}
            style={({ pressed }) => [
              styles.matchCard,
              pressed && styles.matchCardPressed,
              selectedId === match.id && styles.matchCardSelected,
            ]}
            onPress={() => handleMatchSelect(match)}
          >
            <View style={styles.matchCompetition}>
              <Ionicons name="trophy-outline" size={14} color={COLORS.accent} />
              <Text style={styles.competitionText}>{match.competition}</Text>
            </View>

            <View style={styles.matchTeams}>
              <View style={styles.teamSide}>
                <Text style={styles.teamName}>{match.homeTeam.shortName}</Text>
                <Text style={styles.teamFullName}>{match.homeTeam.name}</Text>
              </View>

              <View style={styles.vsContainer}>
                <Text style={styles.vsText}>VS</Text>
                <Text style={styles.matchTime}>
                  {new Date(match.kickoff).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>

              <View style={[styles.teamSide, { alignItems: 'flex-end' }]}>
                <Text style={styles.teamName}>{match.awayTeam.shortName}</Text>
                <Text style={styles.teamFullName}>{match.awayTeam.name}</Text>
              </View>
            </View>

            <View style={styles.matchMeta}>
              <Ionicons name="location-outline" size={12} color={COLORS.textDim} />
              <Text style={styles.matchVenue}>{match.venue}</Text>
            </View>

            <View style={styles.analyzeButton}>
              <Ionicons name="analytics-outline" size={16} color={COLORS.primary} />
              <Text style={styles.analyzeButtonText}>Analyze with AI</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Pressable style={styles.quickAction} onPress={() => router.push('/predict')}>
          <Ionicons name="trending-up" size={20} color={COLORS.secondary} />
          <Text style={styles.quickActionText}>Predictions</Text>
        </Pressable>
        <Pressable style={styles.quickAction} onPress={() => router.push('/wallet')}>
          <Ionicons name="wallet" size={20} color={COLORS.accent} />
          <Text style={styles.quickActionText}>Wallet</Text>
        </Pressable>
      </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  greeting: {
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  aiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.primaryMuted,
  },
  aiCardText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  aiCardSubtext: {
    fontSize: 12,
    color: COLORS.textDim,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  matchList: {
    flex: 1,
  },
  matchCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  matchCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  matchCardSelected: {
    borderColor: COLORS.primary,
  },
  matchCompetition: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  competitionText: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  matchTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  teamSide: {
    flex: 1,
  },
  teamName: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  teamFullName: {
    fontSize: 12,
    color: COLORS.textDim,
    marginTop: 2,
  },
  vsContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  vsText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDim,
    letterSpacing: 2,
  },
  matchTime: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  matchMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  matchVenue: {
    fontSize: 12,
    color: COLORS.textDim,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primaryMuted,
    paddingVertical: 12,
    borderRadius: 10,
  },
  analyzeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 16,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
});
