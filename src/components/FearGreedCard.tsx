import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, Text, ProgressCircle } from "@wraith/ghost/components";
import { Size, TextAppearance, Brightness } from "@wraith/ghost/enums";

type FearGreedCardProps = {
  value?: number;
  loading?: boolean;
  timestamp?: string;
};

/**
 * Get the label and appearance for a fear/greed value.
 */
function getFearGreedStatus(value: number): { label: string; circleLabel: string; appearance: TextAppearance } {
  if (value <= 12) {
    return { label: "Extreme Fear", circleLabel: "Panic", appearance: TextAppearance.Danger };
  }
  if (value <= 25) {
    return { label: "Extreme Fear", circleLabel: "Fearful", appearance: TextAppearance.Danger };
  }
  if (value <= 37) {
    return { label: "Fear", circleLabel: "Anxious", appearance: TextAppearance.Warning };
  }
  if (value <= 45) {
    return { label: "Fear", circleLabel: "Cautious", appearance: TextAppearance.Warning };
  }
  if (value <= 55) {
    return { label: "Neutral", circleLabel: "Balanced", appearance: TextAppearance.Muted };
  }
  if (value <= 65) {
    return { label: "Greed", circleLabel: "Optimistic", appearance: TextAppearance.Success };
  }
  if (value <= 75) {
    return { label: "Greed", circleLabel: "Greedy", appearance: TextAppearance.Success };
  }
  if (value <= 87) {
    return { label: "Extreme Greed", circleLabel: "Euphoric", appearance: TextAppearance.Success };
  }
  return { label: "Extreme Greed", circleLabel: "Manic", appearance: TextAppearance.Success };
}

export function FearGreedCard({ value = 72, loading = false }: FearGreedCardProps) {
  const status = getFearGreedStatus(value);

  return (
    <Card style={styles.card} loading={loading}>
      <View style={styles.content}>
        {/* Header - stays at top */}
        <View style={styles.header}>
          <Text size={Size.Small} weight="semibold">
            Fear & Greed Index
          </Text>
          <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
            Updated 1h ago
          </Text>
        </View>

        {/* Spacer pushes circle down */}
        <View style={styles.spacer} />

        {/* Progress circle - centered */}
        <View style={styles.circleContainer}>
          <ProgressCircle
            value={value}
            max={100}
            size={Size.ExtraLarge}
            appearance={status.appearance}
            brightness={Brightness.Bright}
            showValue
            label={status.circleLabel}
          />
        </View>

        {/* Spacer pushes footer down */}
        <View style={styles.spacer} />

        {/* Footer - stays at bottom */}
        <View style={styles.footer}>
          <Text
            size={Size.Medium}
            weight="bold"
            appearance={status.appearance}
            brightness={Brightness.Bright}
          >
            {status.label}
          </Text>
          <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted} style={styles.description}>
            Market sentiment based on volatility, momentum, and social signals
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 280,
    height: 356,
    flexShrink: 0,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    gap: 4,
  },
  spacer: {
    flex: 1,
  },
  circleContainer: {
    paddingVertical: 16,
  },
  footer: {
    alignItems: "center",
    gap: 8,
  },
  description: {
    textAlign: "center",
    lineHeight: 16,
  },
});
