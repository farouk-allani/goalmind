// GoalMind — Utility Functions
// Common utilities used throughout the app.

/**
 * Format a number with commas (e.g., 1,234,567).
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Format a percentage with optional decimal places.
 */
export function formatPercent(value: number, decimals: number = 0): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format a date relative to now (e.g., "2 hours ago").
 */
export function timeAgo(date: Date | string | number): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  
  return then.toLocaleDateString();
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Generate a random ID.
 */
export function generateId(length: number = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Debounce a function.
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Sleep for a specified duration.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry an async function with exponential backoff.
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: { maxAttempts?: number; delay?: number; backoff?: number } = {}
): Promise<T> {
  const { maxAttempts = 3, delay = 1000, backoff = 2 } = options;
  
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts - 1) {
        await sleep(delay * Math.pow(backoff, attempt));
      }
    }
  }
  
  throw lastError;
}

/**
 * Truncate text with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Capitalize first letter of each word.
 */
export function titleCase(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Calculate win probability based on team stats.
 */
export function calculateWinProbability(
  homeStrength: number,
  awayStrength: number,
  homeAdvantage: number = 0.08
): { home: number; draw: number; away: number } {
  const diff = homeStrength - awayStrength;
  
  let home = 0.40 + diff * 0.5 + homeAdvantage;
  let away = 0.30 - diff * 0.5;
  let draw = 1 - home - away;
  
  // Normalize to ensure sum is 1
  const total = home + draw + away;
  return {
    home: home / total,
    draw: draw / total,
    away: away / total,
  };
}

/**
 * Calculate expected goals based on team stats.
 */
export function calculateExpectedGoals(
  homeGoalsFor: number,
  homeGoalsAgainst: number,
  awayGoalsFor: number,
  awayGoalsAgainst: number,
  matchesPlayed: number
): { home: number; away: number } {
  const homeAvgScored = homeGoalsFor / matchesPlayed;
  const awayAvgConceded = awayGoalsAgainst / matchesPlayed;
  const awayAvgScored = awayGoalsFor / matchesPlayed;
  const homeAvgConceded = homeGoalsAgainst / matchesPlayed;
  
  return {
    home: (homeAvgScored + awayAvgConceded) / 2,
    away: (awayAvgScored + homeAvgConceded) / 2,
  };
}
