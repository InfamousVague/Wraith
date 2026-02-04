/**
 * Filter utilities for prediction history
 */

import type { SignalPrediction, SignalAccuracy } from "../../../types/signals";
import type { FilterTab, OverallAccuracy } from "../types";

/**
 * Filter predictions based on active tab.
 */
export function filterPredictions(
  predictions: SignalPrediction[],
  filter: FilterTab
): SignalPrediction[] {
  switch (filter) {
    case "validated":
      return predictions.filter(
        (p) => p.validated || p.outcome5m || p.outcome1h || p.outcome4h || p.outcome24h
      );
    case "pending":
      return predictions.filter(
        (p) => !p.validated && !p.outcome5m && !p.outcome1h && !p.outcome4h && !p.outcome24h
      );
    default:
      return predictions;
  }
}

/**
 * Calculate overall accuracy from accuracies array.
 * Uses 1h timeframe as the primary accuracy metric.
 */
export function calculateOverallAccuracy(
  accuracies: SignalAccuracy[]
): OverallAccuracy | null {
  const hourlyAccuracies = accuracies.filter((a) => a.timeframe === "1h");
  if (hourlyAccuracies.length === 0) return null;

  let totalCorrect = 0;
  let totalIncorrect = 0;

  for (const acc of hourlyAccuracies) {
    totalCorrect += acc.correctPredictions;
    totalIncorrect += acc.incorrectPredictions;
  }

  const total = totalCorrect + totalIncorrect;
  if (total === 0) return null;

  return {
    percentage: (totalCorrect / total) * 100,
    correct: totalCorrect,
    total,
  };
}
