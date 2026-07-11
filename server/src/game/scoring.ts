// Faithful equivalent of skribbl.io's publicly observable scoring behaviour
// (faster + earlier correct guesses score more, the drawer earns points as
// people guess). Skribbl's exact internal constants aren't published, so
// these are original values tuned to produce the same feel, not a byte-exact
// reverse engineering.

export function guesserPoints(timeLeftSec: number, drawTimeSec: number, guessOrderIndex: number): number {
  const timeFraction = Math.max(0, Math.min(1, timeLeftSec / drawTimeSec));
  const base = 50 + Math.round(900 * timeFraction);
  const orderPenalty = 1 - Math.min(0.4, guessOrderIndex * 0.05);
  return Math.max(50, Math.round(base * orderPenalty));
}

export function drawerPointsForGuess(guesserScore: number): number {
  return Math.round(guesserScore * 0.5);
}

export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

export function isCloseGuess(guess: string, word: string): boolean {
  if (guess === word) return false;
  if (Math.abs(guess.length - word.length) > 2) return false;
  return levenshtein(guess, word) <= 2;
}
