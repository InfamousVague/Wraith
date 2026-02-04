/**
 * Types for prediction row components
 */

import type { SignalPrediction, PredictionOutcome } from "../../types/signals";

export type PredictionRowProps = {
  prediction: SignalPrediction;
  /** Which timeframe outcome to display (default: best available) */
  timeframe?: "5m" | "1h" | "4h" | "24h";
};

export type OutcomeResult = {
  outcome: PredictionOutcome | null;
  priceAfter: number | null;
  timeframe: string;
};

export type DirectionDisplay = {
  label: string;
  color: string;
};
