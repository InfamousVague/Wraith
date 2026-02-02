/**
 * SentimentMeter Component
 *
 * A circular gauge showing overall market sentiment using the Ghost ProgressCircle.
 */

import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Card, Text, ProgressCircle, AnimatedNumber } from "@wraith/ghost/components";
import { Size, TextAppearance, Brightness } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import {
  getDirectionLabel,
  type SignalDirection,
} from "../types/signals";

type SentimentMeterProps = {
  /** Composite score (-100 to +100) */
  score: number;
  /** Signal direction */
  direction: SignalDirection;
  /** Whether data is loading */
  loading?: boolean;
};

/**
 * Map score to TextAppearance for color coding.
 */
function getAppearance(score: number): TextAppearance {
  if (score >= 40) return TextAppearance.Success; // Strong buy - green
  if (score >= 10) return TextAppearance.Info; // Buy - blue/cyan
  if (score > -10) return TextAppearance.Muted; // Neutral - gray
  if (score > -40) return TextAppearance.Warning; // Sell - orange
  return TextAppearance.Danger; // Strong sell - red
}

export function SentimentMeter({
  score,
  direction,
  loading = false,
}: SentimentMeterProps) {
  const themeColors = useThemeColors();

  // Convert score from -100..+100 to 0..100 for ProgressCircle
  const normalizedValue = useMemo(() => {
    return ((score + 100) / 2);
  }, [score]);

  const appearance = getAppearance(score);
  const directionLabel = getDirectionLabel(direction);

  // Get interpretive description based on score
  const sentimentDescription = score >= 40
    ? "Market is bullish - most indicators point upward"
    : score >= 10
    ? "Slight bullish lean - positive but watch for changes"
    : score > -10
    ? "Market is uncertain - no clear direction yet"
    : score > -40
    ? "Slight bearish lean - caution advised"
    : "Market is bearish - most indicators point downward";

  return (
    <Card style={styles.card} loading={loading}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text
            size={Size.Medium}
            appearance={TextAppearance.Muted}
            style={styles.headerLabel}
          >
            MARKET SENTIMENT
          </Text>
          <Text size={Size.Small} appearance={TextAppearance.Muted}>
            Overall market direction
          </Text>
        </View>

        <View
          style={[styles.divider, { backgroundColor: themeColors.border.subtle }]}
        />

        <View style={styles.gaugeContainer}>
          <ProgressCircle
            value={normalizedValue}
            max={100}
            size={Size.TwoXLarge}
            appearance={appearance}
            brightness={Brightness.Soft}
            showValue={false}
            label={directionLabel.toUpperCase()}
          />

          {/* Overlay score in center */}
          <View style={styles.scoreOverlay}>
            <AnimatedNumber
              value={score}
              decimals={0}
              prefix={score > 0 ? "+" : ""}
              size={Size.TwoXLarge}
              weight="bold"
              appearance={appearance}
              animate
              animationDuration={300}
            />
          </View>
        </View>

        {/* Interpretive description */}
        <Text
          size={Size.Small}
          appearance={TextAppearance.Muted}
          style={styles.description}
        >
          {sentimentDescription}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 16,
  },
  headerLabel: {
    marginBottom: 4,
  },
  divider: {
    height: 1,
    marginBottom: 20,
  },
  gaugeContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  scoreOverlay: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  description: {
    marginTop: 16,
    textAlign: "center",
  },
});
