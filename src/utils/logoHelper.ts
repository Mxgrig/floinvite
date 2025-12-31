/**
 * Logo Helper Utility
 * Returns the appropriate logo based on the current date/season
 */

/**
 * Determines if the current date is within the holiday/Yuletide season
 * Yuletide runs from mid-November through early January
 */
export function isYuletideSeason(): boolean {
  const now = new Date();
  const month = now.getMonth(); // 0-11 (0 = Jan, 11 = Dec)
  const date = now.getDate();

  // November 15 - January 6 (roughly)
  if (month === 10 && date >= 15) return true; // Nov 15+
  if (month === 11) return true; // All of December
  if (month === 0 && date <= 6) return true; // Jan 1-6

  return false;
}

/**
 * Returns the appropriate logo path for the current season
 */
export function getLogoPath(): string {
  return isYuletideSeason() ? '/xmas-logo.png' : '/mainflologo.png';
}

/**
 * Returns the appropriate logo URL (supports both relative and absolute URLs)
 * Useful for external links (email templates, etc)
 */
export function getLogoUrl(baseUrl: string = 'https://floinvite.com'): string {
  return `${baseUrl}${getLogoPath()}`;
}
