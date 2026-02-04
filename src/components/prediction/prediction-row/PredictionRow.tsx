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
import { spacing } from "../../../styles/tokens";
import { formatPrice, formatChange, formatTimeAgo } from "./utils/formatters";
import { getBestOutcome, getDirectionDisplay } from "./utils/outcomeHelpers";
import type { PredictionRowProps } from "./types";

export function PredictionRow({ prediction, timeframe }: PredictionRowProps) {
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
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
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
