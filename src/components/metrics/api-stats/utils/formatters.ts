/**
 * Formatting utilities for API stats
 */

import { Colors } from "@wraith/ghost/tokens";

/** Format uptime as human-readable string */
export function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  }
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return `${days}d ${hours}h`;
}

/** Get health color based on score */
export function getHealthColor(score: number): string {
  if (score >= 80) return Colors.status.success;
  if (score >= 50) return Colors.status.warning;
  return Colors.status.danger;
}
