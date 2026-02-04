/**
 * Formatting utilities for signal indicators
 */

/** Format indicator value based on indicator type */
export function formatIndicatorValue(value: number, indicatorName: string): string {
  if (indicatorName.includes("MACD") || indicatorName.includes("OBV")) {
    // These can be large or small, format intelligently
    if (Math.abs(value) >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    }
    if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(2)}K`;
    }
    return value.toFixed(4);
  }
  // Most indicators are percentages or small numbers
  return value.toFixed(2);
}

/** Get signal direction label from score */
export function getSignalDirection(score: number): "Buy" | "Sell" | "Hold" {
  if (score > 20) return "Buy";
  if (score < -20) return "Sell";
  return "Hold";
}
