// GoalMind — Football Data API Service
// Real football data from football-data.org (free tier: 10 req/min)
// Falls back to cached data when API is unavailable.

import * as SecureStore from 'expo-secure-store';

const API_BASE = 'https://api.football-data.org/v4';
const API_KEY = process.env.EXPO_PUBLIC_FOOTBALL_API_KEY || '';

const CACHE_PREFIX = 'goalmind_cache_';
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export interface ApiTeam {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
}

export interface ApiMatch {
  id: number;
  competition: { id: number; name: string; emblem: string };
  utcDate: string;
  status: 'SCHEDULED' | 'TIMED' | 'LIVE' | 'IN_PLAY' | 'PAUSED' | 'HALFTIME' | 'FINISHED' | 'POSTPONED';
  matchday: number;
  homeTeam: ApiTeam;
  awayTeam: ApiTeam;
  score: {
    winner: string | null;
    fullTime: { home: number | null; away: number | null };
    halfTime: { home: number | null; away: number | null };
  };
}

export interface ApiStanding {
  position: number;
  team: ApiTeam;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  form: string;
}

// ---- Cache Layer ----

async function getCached<T>(key: string): Promise<T | null> {
  try {
    const raw = await SecureStore.getItemAsync(CACHE_PREFIX + key);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL) return null;
    return data as T;
  } catch {
    return null;
  }
}

async function setCache<T>(key: string, data: T): Promise<void> {
  try {
    await SecureStore.setItemAsync(
      CACHE_PREFIX + key,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch {
    // SecureStore quota exceeded — silently fail
  }
}

// ---- API Layer ----

async function apiFetch<T>(endpoint: string): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (API_KEY) {
    headers['X-Auth-Token'] = API_KEY;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Football API: ${response.status}`);
    }

    return response.json() as Promise<T>;
  } finally {
    clearTimeout(timeout);
  }
}

// ---- Public Functions ----

/** Fetch upcoming matches for a competition (default: World Cup 2026). */
export async function fetchUpcomingMatches(
  competitionId: number = 2000
): Promise<ApiMatch[]> {
  const cacheKey = `matches_${competitionId}`;
  const cached = await getCached<ApiMatch[]>(cacheKey);
  if (cached) return cached;

  try {
    const data = await apiFetch<{ matches: ApiMatch[] }>(
      `/competitions/${competitionId}/matches?status=SCHEDULED,TIMED&limit=20`
    );
    await setCache(cacheKey, data.matches);
    return data.matches;
  } catch (error) {
    console.warn('[GoalMind API] Upcoming matches fetch failed:', error);
    return [];
  }
}

/** Fetch live matches for a competition. */
export async function fetchLiveMatches(
  competitionId: number = 2000
): Promise<ApiMatch[]> {
  try {
    const data = await apiFetch<{ matches: ApiMatch[] }>(
      `/competitions/${competitionId}/matches?status=LIVE,IN_PLAY,PAUSED,HALFTIME`
    );
    return data.matches;
  } catch {
    return [];
  }
}

/** Fetch league standings. */
export async function fetchStandings(
  competitionId: number = 2000
): Promise<ApiStanding[]> {
  const cacheKey = `standings_${competitionId}`;
  const cached = await getCached<ApiStanding[]>(cacheKey);
  if (cached) return cached;

  try {
    const data = await apiFetch<{
      standings: Array<{ table: ApiStanding[] }>;
    }>(`/competitions/${competitionId}/standings`);

    const table = data.standings?.[0]?.table || [];
    await setCache(cacheKey, table);
    return table;
  } catch (error) {
    console.warn('[GoalMind API] Standings fetch failed:', error);
    return [];
  }
}

/** Fetch finished matches (for form/stats). */
export async function fetchFinishedMatches(
  competitionId: number = 2000
): Promise<ApiMatch[]> {
  const cacheKey = `finished_${competitionId}`;
  const cached = await getCached<ApiMatch[]>(cacheKey);
  if (cached) return cached;

  try {
    const data = await apiFetch<{ matches: ApiMatch[] }>(
      `/competitions/${competitionId}/matches?status=FINISHED&limit=50`
    );
    await setCache(cacheKey, data.matches);
    return data.matches;
  } catch {
    return [];
  }
}

/** Fetch available competitions on free tier. */
export async function fetchCompetitions(): Promise<any[]> {
  const cacheKey = 'competitions';
  const cached = await getCached<any[]>(cacheKey);
  if (cached) return cached;

  try {
    const data = await apiFetch<{ competitions: any[] }>('/competitions');
    await setCache(cacheKey, data.competitions);
    return data.competitions;
  } catch {
    return [];
  }
}

/** Clear all cached data. */
export async function clearFootballCache(): Promise<void> {
  const keys = ['matches_2000', 'standings_2000', 'finished_2000', 'competitions'];
  for (const key of keys) {
    try {
      await SecureStore.deleteItemAsync(CACHE_PREFIX + key);
    } catch {
      // ignore
    }
  }
}
