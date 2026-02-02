/**
 * Trading Signals Types
 *
 * Type definitions for technical indicators, trading signals,
 * and prediction accuracy tracking.
 */

import { Colors } from "@wraith/ghost/tokens";

/** Trading timeframe/style for signal calculations */
export type TradingTimeframe =
  | "scalping"
  | "day_trading"
  | "swing_trading"
  | "position_trading";

/** Trading timeframe configuration */
export const TRADING_TIMEFRAMES: {
  value: TradingTimeframe;
  label: string;
  description: string;
}[] = [
  {
    value: "scalping",
    label: "Scalping",
    description: "Minutes to hours - momentum focused",
  },
  {
    value: "day_trading",
    label: "Day Trading",
    description: "Intraday - balanced indicators",
  },
  {
    value: "swing_trading",
    label: "Swing",
    description: "Days to weeks - trend focused",
  },
  {
    value: "position_trading",
    label: "Position",
    description: "Weeks to months - long-term trends",
  },
];

/** Direction of a trading signal */
export type SignalDirection =
  | "strong_buy"
  | "buy"
  | "neutral"
  | "sell"
  | "strong_sell";

/** Category of a signal indicator */
export type SignalCategory = "trend" | "momentum" | "volatility" | "volume";

/** Output from a single signal indicator calculation */
export type SignalOutput = {
  /** Indicator name (e.g., "RSI", "MACD") */
  name: string;
  /** Category this indicator belongs to */
  category: SignalCategory;
  /** Raw indicator value */
  value: number;
  /** Normalized score from -100 (strong sell) to +100 (strong buy) */
  score: number;
  /** Signal direction derived from score */
  direction: SignalDirection;
  /** Historical accuracy percentage (0-100), if available */
  accuracy?: number;
  /** Number of predictions used for accuracy calculation */
  sampleSize?: number;
  /** Unix timestamp (milliseconds) when calculated */
  timestamp: number;
};

/** Aggregated signals for a symbol */
export type SymbolSignals = {
  /** Symbol this data is for */
  symbol: string;
  /** Trading timeframe used for calculations */
  timeframe: TradingTimeframe;
  /** All individual indicator signals */
  signals: SignalOutput[];
  /** Trend category composite score (-100 to +100) */
  trendScore: number;
  /** Momentum category composite score (-100 to +100) */
  momentumScore: number;
  /** Volatility category composite score (-100 to +100) */
  volatilityScore: number;
  /** Volume category composite score (-100 to +100) */
  volumeScore: number;
  /** Overall composite score (-100 to +100) */
  compositeScore: number;
  /** Overall signal direction */
  direction: SignalDirection;
  /** Unix timestamp (milliseconds) when calculated */
  timestamp: number;
};

/** Outcome of a validated prediction */
export type PredictionOutcome = "correct" | "incorrect" | "neutral";

/** A recorded signal prediction for accuracy tracking */
export type SignalPrediction = {
  /** Unique prediction ID */
  id: string;
  /** Symbol this prediction is for */
  symbol: string;
  /** Indicator that made the prediction */
  indicator: string;
  /** Predicted direction */
  direction: SignalDirection;
  /** Signal score at time of prediction (-100 to +100) */
  score: number;
  /** Price when prediction was made */
  priceAtPrediction: number;
  /** Unix timestamp (milliseconds) when prediction was made */
  timestamp: number;
  /** Whether this prediction has been validated */
  validated: boolean;
  /** Price 5 minutes after prediction */
  priceAfter5m?: number;
  /** Price 1 hour after prediction */
  priceAfter1h?: number;
  /** Price 4 hours after prediction */
  priceAfter4h?: number;
  /** Price 24 hours after prediction */
  priceAfter24h?: number;
  /** Outcome after 5 minutes */
  outcome5m?: PredictionOutcome;
  /** Outcome after 1 hour */
  outcome1h?: PredictionOutcome;
  /** Outcome after 4 hours */
  outcome4h?: PredictionOutcome;
  /** Outcome after 24 hours */
  outcome24h?: PredictionOutcome;
};

/** Accuracy statistics for a signal indicator */
export type SignalAccuracy = {
  /** Indicator name */
  indicator: string;
  /** Symbol (or "global" for cross-symbol stats) */
  symbol: string;
  /** Timeframe for this accuracy ("1h", "4h", "24h") */
  timeframe: string;
  /** Total number of predictions made */
  totalPredictions: number;
  /** Number of correct predictions */
  correctPredictions: number;
  /** Number of incorrect predictions */
  incorrectPredictions: number;
  /** Number of neutral outcomes (price didn't move enough) */
  neutralPredictions: number;
  /** Accuracy percentage: correct / (correct + incorrect) * 100 */
  accuracyPct: number;
  /** Unix timestamp (milliseconds) when last updated */
  lastUpdated: number;
};

/** Response for accuracy endpoint */
export type AccuracyResponse = {
  symbol: string;
  accuracies: SignalAccuracy[];
  timestamp: number;
};

/** Response for predictions endpoint */
export type PredictionsResponse = {
  symbol: string;
  predictions: SignalPrediction[];
  timestamp: number;
};

/** WebSocket signal update data */
export type SignalUpdateData = {
  symbol: string;
  compositeScore: number;
  direction: SignalDirection;
  trendScore: number;
  momentumScore: number;
  volatilityScore: number;
  volumeScore: number;
  timestamp: number;
};

/** Helper to get display label for direction */
export function getDirectionLabel(direction: SignalDirection): string {
  switch (direction) {
    case "strong_buy":
      return "Strong Buy";
    case "buy":
      return "Buy";
    case "neutral":
      return "Neutral";
    case "sell":
      return "Sell";
    case "strong_sell":
      return "Strong Sell";
    default:
      return "Unknown";
  }
}

/** Helper to get color for direction */
export function getDirectionColor(direction: SignalDirection): string {
  switch (direction) {
    case "strong_buy":
      return Colors.status.success;
    case "buy":
      return Colors.status.successDim;
    case "neutral":
      return Colors.text.muted;
    case "sell":
      return Colors.status.dangerDim;
    case "strong_sell":
      return Colors.status.danger;
    default:
      return Colors.text.muted;
  }
}

/** Helper to get color for score */
export function getScoreColor(score: number): string {
  if (score >= 60) return Colors.status.success;
  if (score >= 20) return Colors.status.successDim;
  if (score > -20) return Colors.text.muted;
  if (score > -60) return Colors.status.dangerDim;
  return Colors.status.danger;
}

/** Helper to get category display name */
export function getCategoryName(category: SignalCategory): string {
  switch (category) {
    case "trend":
      return "Trend";
    case "momentum":
      return "Momentum";
    case "volatility":
      return "Volatility";
    case "volume":
      return "Volume";
    default:
      return "Unknown";
  }
}

/** Simple recommendation action: Buy, Sell, or Hold */
export type RecommendationAction = "buy" | "sell" | "hold";

/** Accuracy-weighted trading recommendation */
export type Recommendation = {
  /** Symbol this recommendation is for */
  symbol: string;
  /** The action: Buy, Sell, or Hold */
  action: RecommendationAction;
  /** Confidence level (0-100). Higher = more confident */
  confidence: number;
  /** Weighted score that produced this recommendation (-100 to +100) */
  weightedScore: number;
  /** Number of indicators with accuracy data used */
  indicatorsWithAccuracy: number;
  /** Total number of indicators considered */
  totalIndicators: number;
  /** Average accuracy of indicators used */
  averageAccuracy: number;
  /** Description explaining the recommendation */
  description: string;
  /** Unix timestamp (milliseconds) when computed */
  timestamp: number;
};

/** Helper to get color for recommendation action */
export function getRecommendationColor(action: RecommendationAction): string {
  switch (action) {
    case "buy":
      return Colors.status.success;
    case "sell":
      return Colors.status.danger;
    case "hold":
      return Colors.text.muted;
    default:
      return Colors.text.muted;
  }
}
