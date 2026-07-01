// GoalMind — Home / Live Analysis Screen (Enhanced)
// Main screen: real matches, live status, AI analysis.

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS } from '@/types';
import { useAIStore } from '@/stores';
import { useFootballData } from '@/hooks/useFootballData';
import { formatTeamStatsForAnalysis } from '@/lib/data/football';
import { Badge } from '@/components/ui';

export default function AnalyzeScreen() {
  const { modelsLoaded } = useAIStore();
  const { matches, liveMatches, loading, error, isLive, refresh, lastUpdated } = useFootballData();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleMatchSelect = useCallback((match: any) => {
    setSelectedId(match.id);
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
        <View style={styles.headerRight}>
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: modelsLoaded ? COLORS.success : COLORS.warning }]} />
            <Text style={styles.statusText}>
              {modelsLoaded ? 'AI Ready' : 'Loading AI...'}
            </Text>
          </View>
          {isLive && (
            <View style={styles.liveBadge}>
              <View style={[styles.statusDot, { backgroundColor: COLORS.error }]} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
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

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning" size={16} color={COLORS.warning} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Live Matches Section */}
      {liveMatches.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="radio" size={16} color={COLORS.error} />
            <Text style={styles.sectionTitle}>Live Now</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {liveMatches.map((match) => (
              <Pressable
                key={match.id}
                style={styles.liveMatchCard}
                onPress={() => router.push(`/match/${match.id}`)}
              >
                <Text style={styles.liveTeamName}>{match.homeTeam.shortName}</Text>
                <View style={styles.liveScoreContainer}>
                  <Text style={styles.liveScore}>
                    {match.score.fullTime.home ?? 0} - {match.score.fullTime.away ?? 0}
                  </Text>
                  <Text style={styles.liveMinute}>LIVE</Text>
                </View>
                <Text style={styles.liveTeamName}>{match.awayTeam.shortName}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Matches */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Upcoming Matches</Text>
        {lastUpdated && (
          <Text style={styles.lastUpdated}>
            Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
      </View>

      <ScrollView
        style={styles.matchList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {matches.map((match) => (
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
              {match.status === 'live' && (
                <View style={styles.matchLiveBadge}>
                  <Text style={styles.matchLiveText}>LIVE</Text>
                </View>
              )}
            </View>

            <View style={styles.matchTeams}>
              <View style={styles.teamSide}>
                <Text style={styles.teamName}>{match.homeTeam.shortName}</Text>
                <Text style={styles.teamFullName}>{match.homeTeam.name}</Text>
              </View>

              <View style={styles.vsContainer}>
                <Text style={styles.vsText}>VS</Text>
                <Text style={styles.matchTime}>
                  {new Date(match.kickoff).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </Text>
                <Text style={styles.matchTimeSmall}>
                  {new Date(match.kickoff).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>

              <View style={[styles.teamSide, { alignItems: 'flex-end' }]}>
                <Text style={styles.teamName}>{match.awayTeam.shortName}</Text>
                <Text style={styles.teamFullName}>{match.awayTeam.name}</Text>
              </View>
            </View>

            {match.score && (
              <View style={styles.scoreRow}>
                <Text style={styles.scoreText}>
                  {match.score.home} - {match.score.away}
                </Text>
              </View>
            )}

            <View style={styles.analyzeButton}>
              <Ionicons name="analytics-outline" size={16} color={COLORS.primary} />
              <Text style={styles.analyzeButtonText}>Analyze with AI</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
            </View>
          </Pressable>
        ))}

        {matches.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="football-outline" size={48} color={COLORS.textDim} />
            <Text style={styles.emptyTitle}>No Matches Available</Text>
            <Text style={styles.emptySubtitle}>Pull to refresh or check back later.</Text>
          </View>
        )}
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
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  headerRight: { alignItems: 'flex-end', gap: 8 },
  greeting: { fontSize: 28, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.error + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 6 },
  liveText: { fontSize: 11, color: COLORS.error, fontWeight: '700', letterSpacing: 1 },
  aiCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, padding: 16, borderRadius: 12, marginBottom: 24, gap: 12, borderWidth: 1, borderColor: COLORS.primaryMuted },
  aiCardText: { flex: 1, fontSize: 14, color: COLORS.text, lineHeight: 20 },
  aiCardSubtext: { fontSize: 12, color: COLORS.textDim },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.warning + '15', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, marginBottom: 16 },
  errorText: { fontSize: 12, color: COLORS.warning, flex: 1 },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  lastUpdated: { fontSize: 11, color: COLORS.textDim },
  liveMatchCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginRight: 12, gap: 12, borderWidth: 1, borderColor: COLORS.error + '30' },
  liveTeamName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  liveScoreContainer: { alignItems: 'center' },
  liveScore: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  liveMinute: { fontSize: 10, color: COLORS.error, fontWeight: '700', marginTop: 2 },
  matchList: { flex: 1 },
  matchCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  matchCardPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  matchCardSelected: { borderColor: COLORS.primary },
  matchCompetition: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  competitionText: { fontSize: 12, color: COLORS.accent, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  matchLiveBadge: { backgroundColor: COLORS.error + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 'auto' },
  matchLiveText: { fontSize: 10, color: COLORS.error, fontWeight: '700' },
  matchTeams: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  teamSide: { flex: 1 },
  teamName: { fontSize: 24, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  teamFullName: { fontSize: 12, color: COLORS.textDim, marginTop: 2 },
  vsContainer: { alignItems: 'center', paddingHorizontal: 16 },
  vsText: { fontSize: 14, fontWeight: '700', color: COLORS.textDim, letterSpacing: 2 },
  matchTime: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  matchTimeSmall: { fontSize: 11, color: COLORS.textDim, marginTop: 2 },
  scoreRow: { alignItems: 'center', marginBottom: 12 },
  scoreText: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  analyzeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primaryMuted, paddingVertical: 12, borderRadius: 10 },
  analyzeButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  quickActions: { flexDirection: 'row', gap: 12, paddingVertical: 16 },
  quickAction: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.surface, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  quickActionText: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginTop: 8 },
});
