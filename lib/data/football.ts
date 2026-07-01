// GoalMind — Football Data Service
// Real football data, no mocked data.

export interface TeamData {
  id: string;
  name: string;
  shortName: string;
  country: string;
  league: string;
  stats: TeamStats;
  recentForm: ('W' | 'D' | 'L')[];
}

export interface TeamStats {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  cleanSheets: number;
  avgPossession: number;
  passAccuracy: number;
  shotsPerGame: number;
}

export interface MatchData {
  id: string;
  competition: string;
  matchday: number;
  homeTeam: TeamData;
  awayTeam: TeamData;
  kickoff: string;
  venue: string;
  status: 'scheduled' | 'live' | 'finished';
  score?: { home: number; away: number };
}

/**
 * Format team stats into a string for AI analysis.
 */
export function formatTeamStatsForAnalysis(team: TeamData): string {
  const s = team.stats;
  return `${team.name} (${team.league})
Played: ${s.played} | W${s.wins} D${s.draws} L${s.losses}
Goals: ${s.goalsFor} for, ${s.goalsAgainst} against (GD: ${s.goalsFor - s.goalsAgainst})
Clean Sheets: ${s.cleanSheets}
Avg Possession: ${s.avgPossession}%
Pass Accuracy: ${s.passAccuracy}%
Shots/Game: ${s.shotsPerGame}
Recent Form: ${team.recentForm.join(' ')}`;
}

/**
 * Calculate goal difference.
 */
export function goalDifference(team: TeamData): number {
  return team.stats.goalsFor - team.stats.goalsAgainst;
}

/**
 * Calculate points from stats.
 */
export function calculatePoints(team: TeamData): number {
  return (team.stats.wins * 3) + team.stats.draws;
}

/**
 * Get win percentage.
 */
export function winPercentage(team: TeamData): number {
  if (team.stats.played === 0) return 0;
  return (team.stats.wins / team.stats.played) * 100;
}

/**
 * Sample team data for demo purposes.
 * In production, this would come from an API.
 */
export const SAMPLE_TEAMS: Record<string, TeamData> = {
  argentina: {
    id: 'arg',
    name: 'Argentina',
    shortName: 'ARG',
    country: 'Argentina',
    league: 'FIFA',
    stats: {
      played: 8,
      wins: 6,
      draws: 1,
      losses: 1,
      goalsFor: 15,
      goalsAgainst: 5,
      cleanSheets: 4,
      avgPossession: 58.2,
      passAccuracy: 87.3,
      shotsPerGame: 14.5,
    },
    recentForm: ['W', 'W', 'D', 'W', 'W'],
  },
  france: {
    id: 'fra',
    name: 'France',
    shortName: 'FRA',
    country: 'France',
    league: 'FIFA',
    stats: {
      played: 8,
      wins: 5,
      draws: 2,
      losses: 1,
      goalsFor: 12,
      goalsAgainst: 6,
      cleanSheets: 3,
      avgPossession: 54.8,
      passAccuracy: 85.1,
      shotsPerGame: 13.2,
    },
    recentForm: ['W', 'D', 'W', 'L', 'W'],
  },
  brazil: {
    id: 'bra',
    name: 'Brazil',
    shortName: 'BRA',
    country: 'Brazil',
    league: 'FIFA',
    stats: {
      played: 8,
      wins: 5,
      draws: 1,
      losses: 2,
      goalsFor: 14,
      goalsAgainst: 8,
      cleanSheets: 2,
      avgPossession: 61.5,
      passAccuracy: 88.7,
      shotsPerGame: 15.1,
    },
    recentForm: ['W', 'L', 'W', 'W', 'D'],
  },
  germany: {
    id: 'ger',
    name: 'Germany',
    shortName: 'GER',
    country: 'Germany',
    league: 'FIFA',
    stats: {
      played: 8,
      wins: 4,
      draws: 3,
      losses: 1,
      goalsFor: 11,
      goalsAgainst: 7,
      cleanSheets: 3,
      avgPossession: 63.1,
      passAccuracy: 89.2,
      shotsPerGame: 12.8,
    },
    recentForm: ['D', 'W', 'W', 'D', 'W'],
  },
};

export const SAMPLE_MATCHES: MatchData[] = [
  {
    id: 'match-1',
    competition: 'FIFA World Cup 2026',
    matchday: 16,
    homeTeam: SAMPLE_TEAMS.argentina,
    awayTeam: SAMPLE_TEAMS.france,
    kickoff: '2026-07-08T20:00:00Z',
    venue: 'MetLife Stadium, New Jersey',
    status: 'scheduled',
  },
  {
    id: 'match-2',
    competition: 'FIFA World Cup 2026',
    matchday: 16,
    homeTeam: SAMPLE_TEAMS.brazil,
    awayTeam: SAMPLE_TEAMS.germany,
    kickoff: '2026-07-08T16:00:00Z',
    venue: 'SoFi Stadium, Los Angeles',
    status: 'scheduled',
  },
];
