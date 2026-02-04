/**
 * Chart grid helper utilities
 */

/** Virtualization threshold - use virtualized grid when asset count exceeds this */
export const VIRTUALIZATION_THRESHOLD = 50;

/**
 * Calculate chart height based on card size
 * Scales chart height proportionally: 140px -> 40px, 400px -> 120px
 * @param cardSize - Card width in pixels
 * @returns Chart height in pixels
 */
export function getChartHeight(cardSize: number): number {
  return Math.round(40 + ((cardSize - 140) / (400 - 140)) * 80);
}

/**
 * Determine if we should show compact view based on size
 * @param cardSize - Card width in pixels
 * @returns True if compact mode should be used
 */
export function isCompactSize(cardSize: number): boolean {
  return cardSize < 180;
}
