// GoalMind — Prediction Engine
// Statistical match prediction using Elo ratings, Poisson distribution,
// and form-weighted analysis. All computed on-device.

import type { TeamData, MatchData } from '@/lib/data/football';

export interface PredictionResult {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  homeWin: number;
  draw: number;
  awayWin: number;
  xgHome: number;
  xgAway: number;
  confidence: number;
  factors: PredictionFactor[];
  suggestedScore: { home: number; away: number };
}

export interface PredictionFactor {
  name: string;
  impact: number; // -1 to 1, negative favors away
  description: string;
}

// ---- Elo Rating System ----

const DEFAULT_ELO = 1500;
const K_FACTOR = 32;

function calculateElo(team: TeamData): number {
  const { stats } = team;
  if (stats.played === 0) return DEFAULT_ELO;

  const winRate = stats.wins / stats.played;
  const goalDiff = (stats.goalsFor - stats.goalsAgainst) / stats.played;
  const cleanSheetRate = stats.cleanSheets / stats.played;

  // Base Elo from win rate (scaled to ~1200-1800 range)
  const baseElo = 1200 + winRate * 600;

  // Adjust for goal difference (±200 max)
  const goalDiffBonus = Math.max(-200, Math.min(200, goalDiff * 80));

  // Adjust for clean sheets (±100 max)
  const defenseBonus = cleanSheetRate * 100;

  return Math.round(baseElo + goalDiffBonus + defenseBonus);
}

function expectedScore(eloA: number, eloB: number): number {
  return 1 / (1 + Math.pow(10, (eloB - eloA) / 400));
}

// ---- Poisson Distribution ----

function poissonPMF(k: number, lambda: number): number {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

function factorial(n: number): number {
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

function poissonMatchProbabilities(
  homeXG: number,
  awayXG: number,
  maxGoals: number = 6
): { homeWin: number; draw: number; awayWin: number } {
  let homeWin = 0;
  let draw = 0;
  let awayWin = 0;

  for (let h = 0; h <= maxGoals; h++) {
    for (let a = 0; a <= maxGoals; a++) {
      const prob = poissonPMF(h, homeXG) * poissonPMF(a, awayXG);
      if (h > a) homeWin += prob;
      else if (h === a) draw += prob;
      else awayWin += prob;
    }
  }

  // Normalize
  const total = homeWin + draw + awayWin;
  return {
    homeWin: homeWin / total,
    draw: draw / total,
    awayWin: awayWin / total,
  };
}

// ---- Form Analysis ----

function calculateFormMultiplier(form: ('W' | 'D' | 'L')[]): number {
  if (form.length === 0) return 1.0;

  // Recent form is weighted more heavily
  let score = 0;
  let weightSum = 0;

  form.forEach((result, index) => {
    const weight = index + 1; // More recent = higher weight
    weightSum += weight;
    if (result === 'W') score += weight * 3;
    else if (result === 'D') score += weight * 1;
  });

  const avgPoints = score / weightSum;
  // Normalize: 3 = great form, 0 = terrible form → multiplier 1.2 to 0.8
  return 0.8 + (avgPoints / 3) * 0.4;
}

// ---- Main Prediction Function ----

export function predictMatch(match: MatchData): PredictionResult {
  const { homeTeam, awayTeam } = match;
  const factors: PredictionFactor[] = [];

  // 1. Elo-based expected score
  const homeElo = calculateElo(homeTeam);
  const awayElo = calculateElo(awayTeam);
  const eloExpected = expectedScore(homeElo, awayElo);

  factors.push({
    name: 'Rating',
    impact: eloExpected - 0.5,
    description: `${homeTeam.shortName} Elo ${homeElo} vs ${awayTeam.shortName} Elo ${awayElo}`,
  });

  // 2. Home advantage (historically ~8-12% boost)
  const homeAdvantage = 0.10;
  factors.push({
    name: 'Home Advantage',
    impact: homeAdvantage,
    description: `${homeTeam.shortName} playing at home`,
  });

  // 3. Form analysis
  const homeForm = calculateFormMultiplier(homeTeam.recentForm);
  const awayForm = calculateFormMultiplier(awayTeam.recentForm);
  const formDiff = (homeForm - awayForm) * 0.15;

  factors.push({
    name: 'Recent Form',
    impact: formDiff,
    description: `${homeTeam.shortName} form: ${homeForm.toFixed(2)}x | ${awayTeam.shortName}: ${awayForm.toFixed(2)}x`,
  });

  // 4. Possession-based control factor
  const possDiff = (homeTeam.stats.avgPossession - awayTeam.stats.avgPossession) / 100;
  factors.push({
    name: 'Possession',
    impact: possDiff * 0.1,
    description: `${homeTeam.stats.avgPossession}% vs ${awayTeam.stats.avgPossession}% avg possession`,
  });

  // 5. Defensive strength
  const homeDefense = homeTeam.stats.cleanSheets / Math.max(1, homeTeam.stats.played);
  const awayDefense = awayTeam.stats.cleanSheets / Math.max(1, awayTeam.stats.played);
  const defDiff = (homeDefense - awayDefense) * 0.1;

  factors.push({
    name: 'Defense',
    impact: defDiff,
    description: `Clean sheet rate: ${(homeDefense * 100).toFixed(0)}% vs ${(awayDefense * 100).toFixed(0)}%`,
  });

  // Calculate xG using team stats
  const homeAttack = homeTeam.stats.goalsFor / Math.max(1, homeTeam.stats.played);
  const awayAttack = awayTeam.stats.goalsFor / Math.max(1, awayTeam.stats.played);
  const homeConcede = homeTeam.stats.goalsAgainst / Math.max(1, homeTeam.stats.played);
  const awayConcede = awayTeam.stats.goalsAgainst / Math.max(1, awayTeam.stats.played);

  // xG = (team's attack + opponent's concession rate) / 2, adjusted for form
  let xgHome = ((homeAttack + awayConcede) / 2) * homeForm;
  let xgAway = ((awayAttack + homeConcede) / 2) * awayForm;

  // Apply home advantage to xG
  xgHome *= 1.1;

  // Clamp xG
  xgHome = Math.max(0.3, Math.min(4.0, xgHome));
  xgAway = Math.max(0.3, Math.min(4.0, xgAway));

  // Use Poisson distribution for final probabilities
  const poisson = poissonMatchProbabilities(xgHome, xgAway);

  // Blend Elo expected with Poisson (60% Poisson, 40% Elo)
  let homeWin = poisson.homeWin * 0.6 + (eloExpected + homeAdvantage + formDiff) * 0.4;
  let awayWin = poisson.awayWin * 0.6 + (1 - eloExpected - homeAdvantage - formDiff) * 0.4;
  let draw = poisson.draw * 0.6 + (1 - Math.abs(eloExpected - 0.5) * 2) * 0.4 * 0.5;

  // Normalize to sum to 1
  const total = homeWin + draw + awayWin;
  homeWin /= total;
  draw /= total;
  awayWin /= total;

  // Clamp
  homeWin = Math.max(0.05, Math.min(0.90, homeWin));
  draw = Math.max(0.05, Math.min(0.45, draw));
  awayWin = Math.max(0.05, Math.min(0.90, awayWin));

  // Re-normalize after clamping
  const total2 = homeWin + draw + awayWin;
  homeWin /= total2;
  draw /= total2;
  awayWin /= total2;

  // Confidence based on data quality and prediction strength
  const dataQuality = homeTeam.stats.played > 0 && awayTeam.stats.played > 0 ? 0.8 : 0.5;
  const predictionStrength = Math.abs(homeWin - awayWin) / Math.max(homeWin, awayWin);
  const confidence = Math.min(0.95, dataQuality * (0.5 + predictionStrength * 0.5));

  // Suggested score from xG
  const suggestedHome = Math.round(xgHome);
  const suggestedAway = Math.round(xgAway);

  return {
    matchId: match.id,
    homeTeam: homeTeam.shortName,
    awayTeam: awayTeam.shortName,
    homeWin: Math.round(homeWin * 1000) / 1000,
    draw: Math.round(draw * 1000) / 1000,
    awayWin: Math.round(awayWin * 1000) / 1000,
    xgHome: Math.round(xgHome * 10) / 10,
    xgAway: Math.round(xgAway * 10) / 10,
    confidence: Math.round(confidence * 100) / 100,
    factors,
    suggestedScore: {
      home: Math.max(0, suggestedHome),
      away: Math.max(0, suggestedAway),
    },
  };
}

/** Generate predictions for multiple matches. */
export function predictMatches(matches: MatchData[]): PredictionResult[] {
  return matches.map(predictMatch);
}
