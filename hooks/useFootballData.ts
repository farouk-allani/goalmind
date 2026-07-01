// GoalMind — useFootballData Hook
// Fetches real football data from API, falls back to local sample data.

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchUpcomingMatches,
  fetchLiveMatches,
  fetchStandings,
  type ApiMatch,
  type ApiStanding,
} from '@/lib/api/football';
import { SAMPLE_MATCHES, SAMPLE_TEAMS, type MatchData, type TeamData } from '@/lib/data/football';

interface UseFootballDataOptions {
  competitionId?: number;
  autoFetch?: boolean;
}

interface UseFootballDataReturn {
  matches: MatchData[];
  liveMatches: ApiMatch[];
  standings: ApiStanding[];
  loading: boolean;
  error: string | null;
  isLive: boolean;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

/** Convert API match to our local MatchData format. */
function apiMatchToMatchData(apiMatch: ApiMatch): MatchData {
  const homeStats = {
    played: 0, wins: 0, draws: 0, losses: 0,
    goalsFor: 0, goalsAgainst: 0, cleanSheets: 0,
    avgPossession: 50, passAccuracy: 80, shotsPerGame: 12,
  };
  const awayStats = { ...homeStats };

  const homeTeam: TeamData = {
    id: String(apiMatch.homeTeam.id),
    name: apiMatch.homeTeam.name,
    shortName: apiMatch.homeTeam.tla || apiMatch.homeTeam.shortName,
    country: '',
    league: apiMatch.competition.name,
    stats: homeStats,
    recentForm: [],
  };

  const awayTeam: TeamData = {
    id: String(apiMatch.awayTeam.id),
    name: apiMatch.awayTeam.name,
    shortName: apiMatch.awayTeam.tla || apiMatch.awayTeam.shortName,
    country: '',
    league: apiMatch.competition.name,
    stats: awayStats,
    recentForm: [],
  };

  return {
    id: String(apiMatch.id),
    competition: apiMatch.competition.name,
    matchday: apiMatch.matchday,
    homeTeam,
    awayTeam,
    kickoff: apiMatch.utcDate,
    venue: '',
    status: apiMatch.status === 'FINISHED' ? 'finished'
      : ['LIVE', 'IN_PLAY', 'PAUSED', 'HALFTIME'].includes(apiMatch.status) ? 'live'
      : 'scheduled',
    score: apiMatch.score.fullTime.home != null
      ? { home: apiMatch.score.fullTime.home, away: apiMatch.score.fullTime.away! }
      : undefined,
  };
}

/** Merge API standings into team stats. */
function enrichTeamsWithStandings(
  teams: Record<string, TeamData>,
  standings: ApiStanding[]
): Record<string, TeamData> {
  const enriched = { ...teams };
  for (const entry of standings) {
    const key = entry.team.tla?.toLowerCase() || entry.team.shortName?.toLowerCase();
    if (enriched[key]) {
      enriched[key] = {
        ...enriched[key],
        stats: {
          ...enriched[key].stats,
          played: entry.playedGames,
          wins: entry.won,
          draws: entry.draw,
          losses: entry.lost,
          goalsFor: entry.goalsFor,
          goalsAgainst: entry.goalsAgainst,
        },
        recentForm: entry.form
          ? entry.form.split('').filter(c => 'WDL'.includes(c)) as ('W' | 'D' | 'L')[]
          : enriched[key].recentForm,
      };
    }
  }
  return enriched;
}

export function useFootballData(options: UseFootballDataOptions = {}): UseFootballDataReturn {
  const { competitionId = 2000, autoFetch = true } = options;

  const [matches, setMatches] = useState<MatchData[]>(SAMPLE_MATCHES);
  const [liveMatches, setLiveMatches] = useState<ApiMatch[]>([]);
  const [standings, setStandings] = useState<ApiStanding[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch in parallel
      const [apiMatches, apiLive, apiStandings] = await Promise.all([
        fetchUpcomingMatches(competitionId),
        fetchLiveMatches(competitionId),
        fetchStandings(competitionId),
      ]);

      if (!mountedRef.current) return;

      // If API returned data, use it; otherwise keep sample data
      if (apiMatches.length > 0) {
        const converted = apiMatches.map(apiMatchToMatchData);
        setMatches(converted);
      }

      setLiveMatches(apiLive);
      setIsLive(apiLive.length > 0);
      setStandings(apiStandings);
      setLastUpdated(new Date());
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch football data');
        // Keep sample data as fallback
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [competitionId]);

  useEffect(() => {
    if (autoFetch) {
      refresh();
    }
    return () => {
      mountedRef.current = false;
    };
  }, [autoFetch, refresh]);

  return {
    matches,
    liveMatches,
    standings,
    loading,
    error,
    isLive,
    refresh,
    lastUpdated,
  };
}
