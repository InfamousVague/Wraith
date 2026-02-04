/**
 * Helper functions for prediction display
 */

import { Colors } from "@wraith/ghost/tokens";
import type { PredictionOutcome } from "../types";

/**
 * Get color based on accuracy percentage
 */
export function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 70) return Colors.status.success;
  if (accuracy >= 55) return Colors.status.warning;
  return Colors.status.danger;
}

/**
 * Get color for outcome
 */
export function getOutcomeColor(outcome: PredictionOutcome | undefined | null): string | null {
  if (!outcome) return null;
  switch (outcome) {
    case "correct": return Colors.status.success;
    case "incorrect": return Colors.status.danger;
    case "neutral": return Colors.text.muted;
    default: return null;
  }
}

/**
 * Get direction color based on signal direction
 */
export function getDirectionColor(direction: string): string {
  switch (direction) {
    case "strong_buy": return Colors.status.success;
    case "buy": return Colors.status.successDim;
    case "sell": return Colors.status.dangerDim;
    case "strong_sell": return Colors.status.danger;
    default: return Colors.text.muted;
  }
}

/**
 * Get human-readable direction label
 */
export function getDirectionLabel(direction: string): string {
  switch (direction) {
    case "strong_buy":
    case "buy":
      return "BUY";
    case "sell":
    case "strong_sell":
      return "SELL";
    default:
      return "HOLD";
  }
}

/**
 * Get icon configuration for outcome
 */
export function getOutcomeIcon(outcome: PredictionOutcome | undefined | null): { name: string; color: string } {
  if (!outcome) return { name: "clock", color: Colors.text.muted };
  switch (outcome) {
    case "correct": return { name: "check", color: Colors.status.success };
    case "incorrect": return { name: "x", color: Colors.status.danger };
    case "neutral": return { name: "minus", color: Colors.text.muted };
    default: return { name: "clock", color: Colors.text.muted };
  }
}
