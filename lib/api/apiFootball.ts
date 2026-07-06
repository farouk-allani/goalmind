// GoalMind — API-Football (api-sports.io) live match statistics
// The free plan blocks querying the current season by id, but the live feed
// (`/fixtures?live=all`) still returns in-play matches WITH real statistics —
// possession, shots, pass accuracy — so we can enrich a live match's analysis
// with genuine live data instead of season-history estimates.

const API_BASE = 'https://v3.football.api-sports.io';
const API_KEY = process.env.EXPO_PUBLIC_API_FOOTBALL_KEY || '';

export interface LiveTeamStats {
  possession?: number;    // percent
  shots?: number;
  shotsOnTarget?: number;
  passAccuracy?: number;  // percent
  corners?: number;
}

export interface LiveMatchStats {
  fixtureId: number;
  elapsed: number | null;
  statusShort: string;    // e.g. '1H', '2H', 'HT'
  homeGoals: number | null;
  awayGoals: number | null;
  home: LiveTeamStats;
  away: LiveTeamStats;
}

export interface LiveMatchEvent {
  minute: number;
  type: string;      // Goal | Card | subst | Var
  detail: string;
  team: string;
  player?: string;
}

export function isApiFootballConfigured(): boolean {
  return API_KEY.length > 0;
}

async function af<T>(path: string): Promise<T | null> {
  if (!API_KEY) return null;
  try {
    const res = await fetch(API_BASE + path, { headers: { 'x-apisports-key': API_KEY } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');

// The live feed changes slowly; cache it briefly so opening + polling a match
// doesn't burn the 100 req/day budget.
let liveCache: { at: number; data: ApiFixture[] } | null = null;

interface ApiFixture {
  fixture: { id: number; status: { short: string; elapsed: number | null } };
  teams: { home: { id: number; name: string }; away: { id: number; name: string } };
  goals: { home: number | null; away: number | null };
  league: { id: number; name: string; season: number };
}

async function getLiveFixtures(): Promise<ApiFixture[]> {
  if (liveCache && Date.now() - liveCache.at < 30_000) return liveCache.data;
  const json = await af<{ response: ApiFixture[] }>('/fixtures?live=all');
  const data = json?.response ?? [];
  liveCache = { at: Date.now(), data };
  return data;
}

function findFixture(fixtures: ApiFixture[], homeName: string, awayName: string): ApiFixture | undefined {
  const h = norm(homeName);
  const a = norm(awayName);
  const like = (x: string, y: string) => x.includes(y) || y.includes(x);
  return fixtures.find((f) => {
    const fh = norm(f.teams.home.name);
    const fa = norm(f.teams.away.name);
    return (like(fh, h) && like(fa, a)) || (like(fh, a) && like(fa, h));
  });
}

function toNumber(value: unknown): number | undefined {
  if (value == null) return undefined;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const n = parseInt(value.replace('%', ''), 10);
    return Number.isNaN(n) ? undefined : n;
  }
  return undefined;
}

interface ApiStatItem { type: string; value: unknown }

function mapStats(items: ApiStatItem[]): LiveTeamStats {
  const pick = (type: string) => toNumber(items.find((s) => s.type === type)?.value);
  return {
    possession: pick('Ball Possession'),
    shots: pick('Total Shots'),
    shotsOnTarget: pick('Shots on Goal'),
    passAccuracy: pick('Passes %'),
    corners: pick('Corner Kicks'),
  };
}

/**
 * Find the in-play fixture that matches these team names and return its real
 * live statistics. Returns null if the match isn't currently live in the feed,
 * or if no API-Football key is configured.
 */
export async function fetchLiveMatchStats(homeName: string, awayName: string): Promise<LiveMatchStats | null> {
  const fixtures = await getLiveFixtures();
  const fx = findFixture(fixtures, homeName, awayName);
  if (!fx) return null;

  const statsJson = await af<{ response: Array<{ team: { id: number }; statistics: ApiStatItem[] }> }>(
    `/fixtures/statistics?fixture=${fx.fixture.id}`
  );
  const resp = statsJson?.response ?? [];
  const forTeam = (id: number) => resp.find((t) => t.team.id === id)?.statistics ?? [];

  return {
    fixtureId: fx.fixture.id,
    elapsed: fx.fixture.status.elapsed,
    statusShort: fx.fixture.status.short,
    homeGoals: fx.goals.home,
    awayGoals: fx.goals.away,
    home: mapStats(forTeam(fx.teams.home.id)),
    away: mapStats(forTeam(fx.teams.away.id)),
  };
}

/** Real in-play events (goals, cards, subs) for a fixture — powers live commentary. */
export async function fetchLiveMatchEvents(homeName: string, awayName: string): Promise<LiveMatchEvent[] | null> {
  const fixtures = await getLiveFixtures();
  const fx = findFixture(fixtures, homeName, awayName);
  if (!fx) return null;

  const json = await af<{
    response: Array<{ time: { elapsed: number }; type: string; detail: string; team: { name: string }; player: { name: string | null } }>;
  }>(`/fixtures/events?fixture=${fx.fixture.id}`);

  return (json?.response ?? []).map((e) => ({
    minute: e.time.elapsed,
    type: e.type,
    detail: e.detail,
    team: e.team.name,
    player: e.player?.name ?? undefined,
  }));
}
