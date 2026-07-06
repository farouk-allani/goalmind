// GoalMind — useFootballData Hook
// Fetches real football data from API, falls back to local sample data.

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchUpcomingMatches,
  fetchLiveMatches,
  fetchStandings,
  fetchFinishedMatches,
  type ApiMatch,
  type ApiStanding,
} from '@/lib/api/football';
import { SAMPLE_MATCHES, type MatchData, type TeamData, type TeamStats } from '@/lib/data/football';

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

type TeamStatIndex = Map<number, { stats: TeamStats; recentForm: ('W' | 'D' | 'L')[] }>;

const DEFAULT_STATS: TeamStats = {
  played: 0, wins: 0, draws: 0, losses: 0,
  goalsFor: 0, goalsAgainst: 0, cleanSheets: 0,
  avgPossession: 50, passAccuracy: 80, shotsPerGame: 12,
};

/**
 * Build real per-team stats from actual tournament results + standings, keyed
 * by team id. Without this, every live fixture feeds the prediction engine
 * all-zeros and produces the same degenerate output for every match.
 */
function buildTeamStatIndex(finished: ApiMatch[], standings: ApiStanding[]): TeamStatIndex {
  interface Agg {
    played: number; wins: number; draws: number; losses: number;
    goalsFor: number; goalsAgainst: number; cleanSheets: number;
    form: ('W' | 'D' | 'L')[]; // chronological, most-recent last
  }
  const agg = new Map<number, Agg>();
  const ensure = (id: number): Agg => {
    let a = agg.get(id);
    if (!a) {
      a = { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, cleanSheets: 0, form: [] };
      agg.set(id, a);
    }
    return a;
  };

  // Aggregate from finished matches (oldest → newest so form ends recent).
  const done = finished
    .filter((m) => m.status === 'FINISHED' && m.score.fullTime.home != null && m.score.fullTime.away != null)
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());

  for (const m of done) {
    const hs = m.score.fullTime.home as number;
    const as = m.score.fullTime.away as number;
    const h = ensure(m.homeTeam.id);
    const a = ensure(m.awayTeam.id);
    h.played++; a.played++;
    h.goalsFor += hs; h.goalsAgainst += as;
    a.goalsFor += as; a.goalsAgainst += hs;
    if (as === 0) h.cleanSheets++;
    if (hs === 0) a.cleanSheets++;
    if (hs > as) { h.wins++; a.losses++; h.form.push('W'); a.form.push('L'); }
    else if (hs < as) { a.wins++; h.losses++; a.form.push('W'); h.form.push('L'); }
    else { h.draws++; a.draws++; h.form.push('D'); a.form.push('D'); }
  }

  // Overlay standings totals + official form where they have more data.
  for (const s of standings) {
    const a = ensure(s.team.id);
    if (s.playedGames >= a.played) {
      a.played = s.playedGames; a.wins = s.won; a.draws = s.draw; a.losses = s.lost;
      a.goalsFor = s.goalsFor; a.goalsAgainst = s.goalsAgainst;
    }
    if (s.form) {
      const f = s.form.split('').filter((c) => 'WDL'.includes(c)) as ('W' | 'D' | 'L')[];
      if (f.length) a.form = f;
    }
  }

  const index: TeamStatIndex = new Map();
  for (const [id, a] of agg) {
    index.set(id, {
      stats: {
        ...DEFAULT_STATS,
        played: a.played, wins: a.wins, draws: a.draws, losses: a.losses,
        goalsFor: a.goalsFor, goalsAgainst: a.goalsAgainst, cleanSheets: a.cleanSheets,
      },
      recentForm: a.form.slice(-6),
    });
  }
  return index;
}

/** Convert API match to our local MatchData format, enriched with real stats. */
function apiMatchToMatchData(apiMatch: ApiMatch, index: TeamStatIndex): MatchData {
  const homeEntry = index.get(apiMatch.homeTeam.id);
  const awayEntry = index.get(apiMatch.awayTeam.id);

  const homeTeam: TeamData = {
    id: String(apiMatch.homeTeam.id),
    name: apiMatch.homeTeam.name,
    shortName: apiMatch.homeTeam.tla || apiMatch.homeTeam.shortName,
    country: '',
    league: apiMatch.competition.name,
    stats: homeEntry?.stats ?? { ...DEFAULT_STATS },
    recentForm: homeEntry?.recentForm ?? [],
  };

  const awayTeam: TeamData = {
    id: String(apiMatch.awayTeam.id),
    name: apiMatch.awayTeam.name,
    shortName: apiMatch.awayTeam.tla || apiMatch.awayTeam.shortName,
    country: '',
    league: apiMatch.competition.name,
    stats: awayEntry?.stats ?? { ...DEFAULT_STATS },
    recentForm: awayEntry?.recentForm ?? [],
  };

  return {
    id: String(apiMatch.id),
    competition: apiMatch.competition.name,
    matchday: apiMatch.matchday,
    homeTeam,
    awayTeam,
    kickoff: apiMatch.utcDate,
    venue: '',
    // Tournament fixtures from this feed are on neutral ground.
    neutralVenue: true,
    status: apiMatch.status === 'FINISHED' ? 'finished'
      : ['LIVE', 'IN_PLAY', 'PAUSED', 'HALFTIME'].includes(apiMatch.status) ? 'live'
      : 'scheduled',
    score: apiMatch.score.fullTime.home != null
      ? { home: apiMatch.score.fullTime.home, away: apiMatch.score.fullTime.away! }
      : undefined,
  };
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
      // Fetch in parallel. Finished matches + standings give us the real
      // per-team stats that make predictions differ from match to match.
      const [apiUpcoming, apiLive, apiStandings, apiFinished] = await Promise.all([
        fetchUpcomingMatches(competitionId),
        fetchLiveMatches(competitionId),
        fetchStandings(competitionId),
        fetchFinishedMatches(competitionId),
      ]);

      if (!mountedRef.current) return;

      const index = buildTeamStatIndex(apiFinished, apiStandings);
      const enrichedLive = apiLive.map((m) => apiMatchToMatchData(m, index));
      const enrichedUpcoming = apiUpcoming.map((m) => apiMatchToMatchData(m, index));

      // Live games first, then upcoming. Only replace the bundled samples if the
      // API actually returned fixtures (offline / no key keeps the rich samples).
      const combined = [...enrichedLive, ...enrichedUpcoming];
      if (combined.length > 0) {
        setMatches(combined);
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
