// GoalMind — Home / Live Analysis Screen (Enhanced)
// Main screen: real matches, live status, AI analysis.

import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Image,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, FONTS } from '@/types';
import { useAIStore, useMatchStore } from '@/stores';
import { useFootballData } from '@/hooks/useFootballData';
import { formatTeamStatsForAnalysis } from '@/lib/data/football';
import { getTeamFlag } from '@/lib/utils/flags';
import { ensureModelLoaded } from '@/lib/ai/models';
import { Badge } from '@/components/ui';

export default function AnalyzeScreen() {
  const { modelsLoaded, setModelsLoaded } = useAIStore();
  const { matches, liveMatches, loading, error, isLive, refresh, lastUpdated } = useFootballData();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [downloadPct, setDownloadPct] = useState<number | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Preload the on-device LLM on first launch with real download progress.
  // Other models (vision, TTS, embeddings) download on first use of their feature.
  useEffect(() => {
    if (modelsLoaded) return;
    let cancelled = false;

    (async () => {
      try {
        await ensureModelLoaded('llm', (p) => {
          if (!cancelled) setDownloadPct(Math.round(p.percentage));
        });
        if (!cancelled) {
          setModelsLoaded(true);
          setDownloadPct(null);
        }
      } catch (err) {
        if (!cancelled) {
          setAiError(err instanceof Error ? err.message : 'Failed to load AI model');
          setDownloadPct(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [modelsLoaded]);

  const selectMatch = useMatchStore((s) => s.selectMatch);

  const handleMatchSelect = useCallback((match: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedId(match.id);
    // The detail screen reads the selected match from the store so that
    // live-API matches (whose ids aren't in SAMPLE_MATCHES) resolve too.
    selectMatch(match);
    router.push(`/match/${match.id}`);
  }, [selectMatch]);

  return (
    <View style={styles.container}>
      {/* Brand row */}
      <View style={styles.brandRow}>
        <View style={styles.brandLeft}>
          <Image
            source={require('@/assets/brand/logo-mark.jpg')}
            style={styles.brandLogo}
            resizeMode="contain"
          />
          <Text style={styles.brandName}>GoalMind</Text>
        </View>
        <View style={styles.brandRight}>
          {isLive && (
            <View style={styles.liveBadge}>
              <View style={[styles.statusDot, { backgroundColor: COLORS.error }]} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: modelsLoaded ? COLORS.success : COLORS.warning }]} />
            <Text style={styles.statusText}>
              {modelsLoaded ? 'On-device AI' : 'Loading AI'}
            </Text>
          </View>
        </View>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Matches</Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          Tether Developers Cup 2026
        </Text>
      </View>

      {/* AI Status Card — real model download progress */}
      {!modelsLoaded && !aiError && (
        <View style={styles.aiCard}>
          <ActivityIndicator color={COLORS.primary} size="small" />
          <Text style={styles.aiCardText}>
            {downloadPct !== null && downloadPct < 100
              ? `Downloading on-device AI model... ${downloadPct}%`
              : 'Loading on-device AI model...'}
            {'\n'}
            <Text style={styles.aiCardSubtext}>
              Llama 3.2 1B (~800 MB) on first launch. No data leaves your device.
            </Text>
          </Text>
        </View>
      )}
      {aiError && (
        <View style={styles.aiCard}>
          <Ionicons name="alert-circle" size={18} color={COLORS.warning} />
          <Text style={styles.aiCardText}>
            On-device AI unavailable{'\n'}
            <Text style={styles.aiCardSubtext}>{aiError}</Text>
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
                onPress={() => {
                  const full = matches.find((m) => m.id === String(match.id));
                  if (full) selectMatch(full as any);
                  router.push(`/match/${match.id}`);
                }}
              >
                <Text style={styles.liveTeamName}>{getTeamFlag(match.homeTeam.name)} {match.homeTeam.shortName}</Text>
                <View style={styles.liveScoreContainer}>
                  <Text style={styles.liveScore}>
                    {match.score.fullTime.home ?? 0} - {match.score.fullTime.away ?? 0}
                  </Text>
                  <Text style={styles.liveMinute}>LIVE</Text>
                </View>
                <Text style={styles.liveTeamName}>{getTeamFlag(match.awayTeam.name)} {match.awayTeam.shortName}</Text>
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
        {matches.filter((m) => m.status !== 'live').map((match) => (
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
                <Text style={styles.teamName}>{getTeamFlag(match.homeTeam.name)} {match.homeTeam.shortName}</Text>
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
                <Text style={styles.teamName}>{match.awayTeam.shortName} {getTeamFlag(match.awayTeam.name)}</Text>
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

            <View style={styles.cardFooter}>
              <Ionicons name="flash-outline" size={13} color={COLORS.primary} />
              <Text style={styles.cardFooterText}>Tactical AI · Prediction · Staking</Text>
              <Ionicons name="chevron-forward" size={14} color={COLORS.textDim} style={{ marginLeft: 'auto' }} />
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

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 20, paddingTop: 56 },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  brandLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandLogo: { width: 26, height: 26, borderRadius: 6 },
  brandName: { fontFamily: FONTS.displaySemibold, fontSize: 15, color: COLORS.text, letterSpacing: 0.2 },
  brandRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  header: { marginBottom: 20 },
  greeting: { fontFamily: FONTS.display, fontSize: 26, color: COLORS.text, letterSpacing: 0 },
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 3 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, gap: 6 },
  liveText: { fontSize: 11, color: COLORS.error, fontWeight: '700', letterSpacing: 1 },
  aiCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceElevated, padding: 16, borderRadius: 18, marginBottom: 24, gap: 12, borderWidth: 1, borderColor: COLORS.primaryMuted },
  aiCardText: { flex: 1, fontSize: 14, color: COLORS.text, lineHeight: 20 },
  aiCardSubtext: { fontSize: 12, color: COLORS.textDim },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.warning + '15', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, marginBottom: 16 },
  errorText: { fontSize: 12, color: COLORS.warning, flex: 1 },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  lastUpdated: { fontSize: 11, color: COLORS.textDim },
  liveMatchCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceElevated, borderRadius: 20, padding: 16, marginRight: 12, gap: 12, borderWidth: 1, borderColor: COLORS.primary + '30' },
  liveTeamName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  liveScoreContainer: { alignItems: 'center' },
  liveScore: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  liveMinute: { fontSize: 10, color: COLORS.error, fontWeight: '700', marginTop: 2 },
  matchList: { flex: 1 },
  matchCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 24,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  matchCardPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  matchCardSelected: { borderColor: COLORS.primary },
  matchCompetition: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  competitionText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  matchLiveBadge: { backgroundColor: COLORS.primary, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999, marginLeft: 'auto' },
  matchLiveText: { fontSize: 10, color: COLORS.background, fontWeight: '800', letterSpacing: 0.4 },
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
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    marginTop: 2,
  },
  cardFooterText: { fontSize: 12, color: COLORS.textDim, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginTop: 8 },
});
