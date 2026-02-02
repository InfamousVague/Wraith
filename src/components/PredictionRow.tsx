/**
 * PredictionRow Component
 *
 * Single-line display for a prediction with outcome.
 * Format: RSI  BUY  $50,000 -> $50,500 (+1.0%)  checkmark correct  [1h ago]
 *
 * Color coding:
 * - Green checkmark: correct
 * - Red X: incorrect
 * - Gray circle: neutral
 * - Muted spinner: pending
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Icon } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { Colors } from "@wraith/ghost/tokens";
import type { SignalPrediction, PredictionOutcome } from "../types/signals";

type Props = {
  prediction: SignalPrediction;
  /** Which timeframe outcome to display (default: best available) */
  timeframe?: "5m" | "1h" | "4h" | "24h";
};

/** Format a number as currency */
function formatPrice(price: number): string {
  if (price >= 1000) {
    return `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  }
  if (price >= 1) {
    return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  }
  return `$${price.toLocaleString(undefined, { maximumFractionDigits: 6 })}`;
}

/** Format percent change */
function formatChange(change: number): string {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(2)}%`;
}

/** Format relative time */
function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}

/** Get the best available outcome and price */
function getBestOutcome(prediction: SignalPrediction, preferredTimeframe?: string): {
  outcome: PredictionOutcome | null;
  priceAfter: number | null;
  timeframe: string;
} {
  // If a specific timeframe is requested
  if (preferredTimeframe) {
    switch (preferredTimeframe) {
      case "5m":
        return {
          outcome: prediction.outcome5m ?? null,
          priceAfter: prediction.priceAfter5m ?? null,
          timeframe: "5m",
        };
      case "1h":
        return {
          outcome: prediction.outcome1h ?? null,
          priceAfter: prediction.priceAfter1h ?? null,
          timeframe: "1h",
        };
      case "4h":
        return {
          outcome: prediction.outcome4h ?? null,
          priceAfter: prediction.priceAfter4h ?? null,
          timeframe: "4h",
        };
      case "24h":
        return {
          outcome: prediction.outcome24h ?? null,
          priceAfter: prediction.priceAfter24h ?? null,
          timeframe: "24h",
        };
    }
  }

  // Otherwise, return the longest validated timeframe
  if (prediction.outcome24h) {
    return {
      outcome: prediction.outcome24h,
      priceAfter: prediction.priceAfter24h ?? null,
      timeframe: "24h",
    };
  }
  if (prediction.outcome4h) {
    return {
      outcome: prediction.outcome4h,
      priceAfter: prediction.priceAfter4h ?? null,
      timeframe: "4h",
    };
  }
  if (prediction.outcome1h) {
    return {
      outcome: prediction.outcome1h,
      priceAfter: prediction.priceAfter1h ?? null,
      timeframe: "1h",
    };
  }
  if (prediction.outcome5m) {
    return {
      outcome: prediction.outcome5m,
      priceAfter: prediction.priceAfter5m ?? null,
      timeframe: "5m",
    };
  }

  return { outcome: null, priceAfter: null, timeframe: "pending" };
}

/** Get direction display */
function getDirectionDisplay(direction: string): { label: string; color: string } {
  switch (direction) {
    case "strong_buy":
      return { label: "BUY", color: Colors.status.success };
    case "buy":
      return { label: "BUY", color: Colors.status.successDim };
    case "sell":
      return { label: "SELL", color: Colors.status.dangerDim };
    case "strong_sell":
      return { label: "SELL", color: Colors.status.danger };
    default:
      return { label: "HOLD", color: Colors.text.muted };
  }
}

export function PredictionRow({ prediction, timeframe }: Props) {
  const themeColors = useThemeColors();

  const { outcome, priceAfter, timeframe: usedTimeframe } = getBestOutcome(prediction, timeframe);
  const direction = getDirectionDisplay(prediction.direction);

  // Calculate price change
  const priceChange = priceAfter
    ? ((priceAfter - prediction.priceAtPrediction) / prediction.priceAtPrediction) * 100
    : null;

  // Outcome icon and color
  const getOutcomeDisplay = () => {
    if (!outcome) {
      return {
        icon: "clock" as const,
        color: themeColors.text.muted,
        label: "pending",
      };
    }
    switch (outcome) {
      case "correct":
        return { icon: "check" as const, color: Colors.status.success, label: "correct" };
      case "incorrect":
        return { icon: "x" as const, color: Colors.status.danger, label: "incorrect" };
      case "neutral":
        return { icon: "minus" as const, color: Colors.text.muted, label: "neutral" };
      default:
        return { icon: "clock" as const, color: themeColors.text.muted, label: "pending" };
    }
  };

  const outcomeDisplay = getOutcomeDisplay();
  const isPending = !outcome;

  return (
    <View style={[styles.container, isPending && styles.containerPending]}>
      {/* Indicator name */}
      <Text
        size={Size.Small}
        weight="medium"
        style={[styles.indicator, isPending && styles.textPending]}
      >
        {prediction.indicator}
      </Text>

      {/* Direction */}
      <Text
        size={Size.ExtraSmall}
        weight="bold"
        style={[
          styles.direction,
          { color: isPending ? themeColors.text.muted : direction.color },
        ]}
      >
        {direction.label}
      </Text>

      {/* Price at prediction */}
      <Text
        size={Size.ExtraSmall}
        appearance={isPending ? TextAppearance.Muted : TextAppearance.Default}
        style={styles.price}
      >
        {formatPrice(prediction.priceAtPrediction)}
      </Text>

      {/* Arrow and price after */}
      {priceAfter ? (
        <>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.arrow}>
            {"\u2192"}
          </Text>
          <Text
            size={Size.ExtraSmall}
            style={[styles.priceAfter, { color: priceChange && priceChange >= 0 ? Colors.status.success : Colors.status.danger }]}
          >
            {formatPrice(priceAfter)}
          </Text>
          <Text
            size={Size.ExtraSmall}
            style={[styles.change, { color: priceChange && priceChange >= 0 ? Colors.status.success : Colors.status.danger }]}
          >
            ({formatChange(priceChange ?? 0)})
          </Text>
        </>
      ) : (
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.pendingPrice}>
          awaiting {usedTimeframe}...
        </Text>
      )}

      {/* Spacer */}
      <View style={styles.spacer} />

      {/* Outcome icon */}
      <View style={[styles.outcomeIcon, { backgroundColor: `${outcomeDisplay.color}20` }]}>
        <Icon name={outcomeDisplay.icon} size={Size.ExtraSmall} color={outcomeDisplay.color} />
      </View>

      {/* Time ago */}
      <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.timeAgo}>
        {formatTimeAgo(prediction.timestamp)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  containerPending: {
    opacity: 0.6,
  },
  indicator: {
    width: 50,
  },
  direction: {
    width: 36,
  },
  price: {
    width: 80,
    textAlign: "right",
    fontFamily: "monospace",
  },
  arrow: {
    width: 16,
    textAlign: "center",
  },
  priceAfter: {
    width: 80,
    textAlign: "right",
    fontFamily: "monospace",
  },
  change: {
    width: 60,
    textAlign: "right",
    fontFamily: "monospace",
  },
  pendingPrice: {
    flex: 1,
    fontStyle: "italic",
  },
  spacer: {
    flex: 1,
  },
  outcomeIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  timeAgo: {
    width: 50,
    textAlign: "right",
  },
  textPending: {
    opacity: 0.7,
  },
});
