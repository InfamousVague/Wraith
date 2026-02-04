/**
 * Tag generation utilities for signal tags
 */

import { Colors } from "@wraith/ghost/tokens";
import type { SymbolSignals } from "../../../types/signals";
import type { SignalTag } from "../types";
import { MAX_TAGS } from "../constants";

/**
 * Generate signal tags based on market conditions.
 */
export function generateTags(
  signals: SymbolSignals | null,
  priceChange24h?: number
): SignalTag[] {
  if (!signals) return [];

  const tags: SignalTag[] = [];
  const { trendScore, momentumScore, volatilityScore, volumeScore, direction } = signals;

  // Direction-based tags
  if (direction === "strong_buy") {
    tags.push({
      label: "Strong Buy Signal",
      color: Colors.status.success,
      bgColor: Colors.status.success + "20",
    });
  } else if (direction === "strong_sell") {
    tags.push({
      label: "Strong Sell Signal",
      color: Colors.status.danger,
      bgColor: Colors.status.danger + "20",
    });
  } else if (direction === "buy") {
    tags.push({
      label: "Buy Signal",
      color: Colors.status.successDim,
      bgColor: Colors.status.successDim + "20",
    });
  } else if (direction === "sell") {
    tags.push({
      label: "Sell Signal",
      color: Colors.status.dangerDim,
      bgColor: Colors.status.dangerDim + "20",
    });
  }

  // Falling Knife detection: Strong momentum sell + price dropping
  if (
    momentumScore < -50 &&
    priceChange24h !== undefined &&
    priceChange24h < -5
  ) {
    tags.push({
      label: "Falling Knife",
      color: Colors.status.danger,
      bgColor: Colors.status.danger + "20",
    });
  }

  // Recovery potential: Oversold conditions
  if (momentumScore < -60 && trendScore > -20) {
    tags.push({
      label: "Oversold",
      color: Colors.status.info,
      bgColor: Colors.status.info + "20",
    });
  }

  // Overbought warning
  if (momentumScore > 60 && trendScore < 20) {
    tags.push({
      label: "Overbought",
      color: Colors.status.warning,
      bgColor: Colors.status.warning + "20",
    });
  }

  // Trend indicators
  if (trendScore > 60) {
    tags.push({
      label: "Strong Uptrend",
      color: Colors.status.success,
      bgColor: Colors.status.success + "20",
    });
  } else if (trendScore < -60) {
    tags.push({
      label: "Strong Downtrend",
      color: Colors.status.danger,
      bgColor: Colors.status.danger + "20",
    });
  }

  // Consolidation
  if (
    Math.abs(trendScore) < 15 &&
    Math.abs(momentumScore) < 15 &&
    volatilityScore < 0
  ) {
    tags.push({
      label: "Consolidating",
      color: Colors.text.muted,
      bgColor: Colors.text.muted + "20",
    });
  }

  // High volatility warning
  if (volatilityScore > 50) {
    tags.push({
      label: "High Volatility",
      color: Colors.status.warning,
      bgColor: Colors.status.warning + "20",
    });
  }

  // Volume surge
  if (volumeScore > 50) {
    tags.push({
      label: "Volume Surge",
      color: Colors.accent.primary,
      bgColor: Colors.accent.primary + "20",
    });
  }

  // Bullish divergence hint
  if (momentumScore > 30 && trendScore < -10) {
    tags.push({
      label: "Bullish Divergence",
      color: Colors.status.success,
      bgColor: Colors.status.success + "20",
    });
  }

  // Bearish divergence hint
  if (momentumScore < -30 && trendScore > 10) {
    tags.push({
      label: "Bearish Divergence",
      color: Colors.status.danger,
      bgColor: Colors.status.danger + "20",
    });
  }

  return tags.slice(0, MAX_TAGS);
}
