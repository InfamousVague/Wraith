/**
 * Score helper utilities for data quality display
 */

import { Colors } from "@wraith/ghost/tokens";

/**
 * Get color based on confidence score
 * @param score - Confidence score (0-100)
 * @returns Color string for the score level
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return Colors.status.success;
  if (score >= 60) return Colors.status.successDim;
  if (score >= 40) return Colors.status.warning;
  if (score >= 20) return Colors.status.dangerDim;
  return Colors.status.danger;
}

/**
 * Get translation key based on score
 * @param score - Confidence score (0-100)
 * @returns Translation key for score label
 */
export function getScoreLabelKey(score: number): string {
  if (score >= 80) return "excellent";
  if (score >= 60) return "good";
  if (score >= 40) return "fair";
  if (score >= 20) return "low";
  return "veryLow";
}
