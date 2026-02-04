/**
 * Condition tag generation utilities for signal summary
 */

import { Colors } from "@wraith/ghost/tokens";
import type { SignalDirection, ConditionTag } from "../types";

/**
 * Generate compact condition tags based on market data.
 *
 * Detects conditions:
 * - Falling Knife: Heavy momentum + large price drop
 * - Oversold/Overbought: Momentum extremes
 * - Uptrend/Downtrend: Strong trend scores
 * - Consolidating: Low volatility and movement
 * - High Volatility: High volatility score
 * - Volume Surge: High volume score
 * - Bullish/Bearish Divergence: Momentum vs trend divergence
 *
 * @param direction - Signal direction
 * @param trendScore - Trend category score
 * @param momentumScore - Momentum category score
 * @param volatilityScore - Volatility category score
 * @param volumeScore - Volume category score
 * @param priceChange24h - Optional 24h price change percentage
 * @returns Array of up to 4 condition tags
 */
export function generateConditionTags(
  direction: SignalDirection,
  trendScore: number,
  momentumScore: number,
  volatilityScore: number,
  volumeScore: number,
  priceChange24h?: number
): ConditionTag[] {
  const tags: ConditionTag[] = [];

  // Falling Knife detection
  if (momentumScore < -50 && priceChange24h !== undefined && priceChange24h < -5) {
    tags.push({ labelKey: "fallingKnife", color: Colors.status.danger });
  }

  // Oversold/Overbought
  if (momentumScore < -60 && trendScore > -20) {
    tags.push({ labelKey: "oversold", color: Colors.status.info });
  }
  if (momentumScore > 60 && trendScore < 20) {
    tags.push({ labelKey: "overbought", color: Colors.status.warning });
  }

  // Trend tags
  if (trendScore > 60) {
    tags.push({ labelKey: "uptrend", color: Colors.status.success });
  } else if (trendScore < -60) {
    tags.push({ labelKey: "downtrend", color: Colors.status.danger });
  }

  // Consolidation
  if (Math.abs(trendScore) < 15 && Math.abs(momentumScore) < 15 && volatilityScore < 0) {
    tags.push({ labelKey: "consolidating", color: Colors.text.muted });
  }

  // Volatility
  if (volatilityScore > 50) {
    tags.push({ labelKey: "highVol", color: Colors.status.warning });
  }

  // Volume
  if (volumeScore > 50) {
    tags.push({ labelKey: "volSurge", color: Colors.accent.primary });
  }

  // Divergences
  if (momentumScore > 30 && trendScore < -10) {
    tags.push({ labelKey: "bullDiv", color: Colors.status.success });
  }
  if (momentumScore < -30 && trendScore > 10) {
    tags.push({ labelKey: "bearDiv", color: Colors.status.danger });
  }

  return tags.slice(0, 4); // Limit to 4 compact tags
}
