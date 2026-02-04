/**
 * Types for signal summary components
 */

import type { SignalDirection } from "../../types/signals";

export type { SignalDirection };

export type CategoryScore = {
  label: string;
  score: number;
  color: string;
};

export type ConditionTag = {
  labelKey: string;
  color: string;
};

export type SignalSummaryCardProps = {
  /** Overall composite score (-100 to +100) */
  compositeScore: number;
  /** Signal direction */
  direction: SignalDirection;
  /** Trend category score */
  trendScore: number;
  /** Momentum category score */
  momentumScore: number;
  /** Volatility category score */
  volatilityScore: number;
  /** Volume category score */
  volumeScore: number;
  /** Number of indicators used */
  indicatorCount?: number;
  /** Optional 24h price change for condition detection */
  priceChange24h?: number;
  /** Whether data is loading */
  loading?: boolean;
};
