/**
 * SignalTags Component
 *
 * Displays signal condition tags like "Falling Knife", "Strong Buy", etc.
 * based on current signal data and market conditions.
 */

import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Text, Tag } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import type { SymbolSignals, SignalDirection } from "../types/signals";

type SignalTag = {
  label: string;
  color: string;
  bgColor: string;
};

type SignalTagsProps = {
  signals: SymbolSignals | null;
  /** Optional price change percentage for context */
  priceChange24h?: number;
  loading?: boolean;
};

/**
 * Generate signal tags based on market conditions.
 */
function generateTags(
  signals: SymbolSignals | null,
  priceChange24h?: number
): SignalTag[] {
  if (!signals) return [];

  const tags: SignalTag[] = [];
  const { compositeScore, direction, trendScore, momentumScore, volatilityScore, volumeScore } = signals;

  // Direction-based tags
  if (direction === "strong_buy") {
    tags.push({
      label: "Strong Buy Signal",
      color: "#22C55E",
      bgColor: "#22C55E20",
    });
  } else if (direction === "strong_sell") {
    tags.push({
      label: "Strong Sell Signal",
      color: "#EF4444",
      bgColor: "#EF444420",
    });
  } else if (direction === "buy") {
    tags.push({
      label: "Buy Signal",
      color: "#84CC16",
      bgColor: "#84CC1620",
    });
  } else if (direction === "sell") {
    tags.push({
      label: "Sell Signal",
      color: "#F97316",
      bgColor: "#F9731620",
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
      color: "#DC2626",
      bgColor: "#DC262620",
    });
  }

  // Recovery potential: Oversold conditions
  if (momentumScore < -60 && trendScore > -20) {
    tags.push({
      label: "Oversold",
      color: "#06B6D4",
      bgColor: "#06B6D420",
    });
  }

  // Overbought warning
  if (momentumScore > 60 && trendScore < 20) {
    tags.push({
      label: "Overbought",
      color: "#F59E0B",
      bgColor: "#F59E0B20",
    });
  }

  // Trend indicators
  if (trendScore > 60) {
    tags.push({
      label: "Strong Uptrend",
      color: "#10B981",
      bgColor: "#10B98120",
    });
  } else if (trendScore < -60) {
    tags.push({
      label: "Strong Downtrend",
      color: "#EF4444",
      bgColor: "#EF444420",
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
      color: "#6B7280",
      bgColor: "#6B728020",
    });
  }

  // High volatility warning
  if (volatilityScore > 50) {
    tags.push({
      label: "High Volatility",
      color: "#F97316",
      bgColor: "#F9731620",
    });
  }

  // Volume surge
  if (volumeScore > 50) {
    tags.push({
      label: "Volume Surge",
      color: "#8B5CF6",
      bgColor: "#8B5CF620",
    });
  }

  // Bullish divergence hint
  if (momentumScore > 30 && trendScore < -10) {
    tags.push({
      label: "Bullish Divergence",
      color: "#22C55E",
      bgColor: "#22C55E20",
    });
  }

  // Bearish divergence hint
  if (momentumScore < -30 && trendScore > 10) {
    tags.push({
      label: "Bearish Divergence",
      color: "#EF4444",
      bgColor: "#EF444420",
    });
  }

  return tags.slice(0, 5); // Limit to 5 tags
}

// Descriptions for each tag type
const tagDescriptions: Record<string, string> = {
  "Strong Buy Signal": "Multiple indicators strongly suggest price increase",
  "Strong Sell Signal": "Multiple indicators strongly suggest price decrease",
  "Buy Signal": "Indicators lean toward potential price increase",
  "Sell Signal": "Indicators lean toward potential price decrease",
  "Falling Knife": "Rapid decline - catching the bottom is risky",
  "Oversold": "Price may have dropped too far, potential bounce ahead",
  "Overbought": "Price may have risen too fast, potential pullback ahead",
  "Strong Uptrend": "Clear upward price movement with momentum",
  "Strong Downtrend": "Clear downward price movement with momentum",
  "Consolidating": "Price is ranging with low volatility, breakout may follow",
  "High Volatility": "Large price swings - higher risk and opportunity",
  "Volume Surge": "Unusual trading activity - watch for significant moves",
  "Bullish Divergence": "Price falling but momentum improving - potential reversal",
  "Bearish Divergence": "Price rising but momentum weakening - potential reversal",
};

export function SignalTags({
  signals,
  priceChange24h,
  loading = false,
}: SignalTagsProps) {
  const themeColors = useThemeColors();
  const tags = useMemo(
    () => generateTags(signals, priceChange24h),
    [signals, priceChange24h]
  );

  if (loading || tags.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text
        size={Size.Medium}
        appearance={TextAppearance.Muted}
        style={styles.label}
      >
        MARKET CONDITIONS
      </Text>
      <Text
        size={Size.Small}
        appearance={TextAppearance.Muted}
        style={styles.subtitle}
      >
        Current patterns detected in market data
      </Text>
      <View style={styles.tagsRow}>
        {tags.map((tag, index) => (
          <View
            key={index}
            style={[styles.tag, { backgroundColor: tag.bgColor }]}
          >
            <Text
              size={Size.Medium}
              weight="semibold"
              style={{ color: tag.color }}
            >
              {tag.label}
            </Text>
            <Text
              size={Size.ExtraSmall}
              style={{ color: tag.color, opacity: 0.8 }}
            >
              {tagDescriptions[tag.label] ?? "Market condition detected"}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  label: {
    marginBottom: 4,
  },
  subtitle: {
    marginBottom: 14,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 4,
  },
});
