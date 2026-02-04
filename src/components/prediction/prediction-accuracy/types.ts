/**
 * Types for PredictionAccuracyCard component
 */

import type { SignalAccuracy, SignalPrediction, Recommendation, PredictionOutcome } from "../../types/signals";

export type { PredictionOutcome };

export type PredictionAccuracyCardProps = {
  accuracies: SignalAccuracy[];
  predictions: SignalPrediction[];
  pendingPredictions?: SignalPrediction[];
  recommendation?: Recommendation | null;
  loading?: boolean;
  generating?: boolean;
  onGeneratePredictions?: () => void;
};

export type HalfCircleGaugeProps = {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  label: string;
  valueLabel: string;
};

export type CompactPredictionRowProps = {
  prediction: SignalPrediction;
  opacity: number;
};

export type TimeframeRowProps = {
  label: string;
  outcome: PredictionOutcome | undefined | null;
  accuracy: number | null;
  targetTime: number | null;
};

export type IndicatorGroupProps = {
  indicator: string;
  predictions: SignalPrediction[];
  pendingPrediction?: SignalPrediction;
  accuracyByTimeframe: Record<string, number | null>;
  overallAccuracy: number | null;
  index: number;
};

export type PendingPredictionRowProps = {
  prediction: SignalPrediction;
};
