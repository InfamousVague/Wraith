/**
 * Types for prediction history components
 */

import type { SignalPrediction, SignalAccuracy } from "../../types/signals";

export type FilterTab = "all" | "validated" | "pending";

export type PredictionHistoryProps = {
  predictions: SignalPrediction[];
  accuracies: SignalAccuracy[];
  loading?: boolean;
};

export type OverallAccuracy = {
  percentage: number;
  correct: number;
  total: number;
};

export type FilterTabConfig = {
  key: FilterTab;
  label: string;
};
