/**
 * Formatting utilities for predictions
 */

import type { SignalPrediction } from "../../../types/signals";

/**
 * Format relative time compactly
 */
export function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return "now";
}

/**
 * Format countdown remaining
 */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return "Ready";
  const totalSec = Math.floor(ms / 1000);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}:${secs.toString().padStart(2, "0")}`;
  return `0:${secs.toString().padStart(2, "0")}`;
}

/**
 * Check if prediction has any validated outcomes
 */
export function hasValidatedOutcome(prediction: SignalPrediction): boolean {
  return !!(prediction.outcome5m || prediction.outcome1h || prediction.outcome4h);
}
