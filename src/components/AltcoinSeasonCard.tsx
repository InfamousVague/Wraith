import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, Text, ProgressBar, Number } from "@wraith/ghost/components";
import { Size, TextAppearance, Brightness } from "@wraith/ghost/enums";

type AltcoinSeasonCardProps = {
  /** 0 = BTC season, 100 = Altcoin season */
  value?: number;
  btcDominance?: number;
  loading?: boolean;
};

/**
 * Get the status label and appearance based on the altcoin season value.
 */
function getSeasonStatus(value: number): {
  label: string;
  description: string;
  appearance: TextAppearance;
} {
  if (value <= 20) {
    return {
      label: "Bitcoin Season",
      description: "BTC strongly outperforming altcoins",
      appearance: TextAppearance.Warning,
    };
  }
  if (value <= 40) {
    return {
      label: "BTC Leaning",
      description: "Bitcoin showing relative strength",
      appearance: TextAppearance.Warning,
    };
  }
  if (value <= 60) {
    return {
      label: "Neutral",
      description: "Balanced market conditions",
      appearance: TextAppearance.Muted,
    };
  }
  if (value <= 80) {
    return {
      label: "Alt Leaning",
      description: "Altcoins gaining momentum",
      appearance: TextAppearance.Info,
    };
  }
  return {
    label: "Altcoin Season",
    description: "Altcoins strongly outperforming BTC",
    appearance: TextAppearance.Info,
  };
}

export function AltcoinSeasonCard({
  value = 35,
  btcDominance = 52.4,
  loading = false,
}: AltcoinSeasonCardProps) {
  const status = getSeasonStatus(value);

  return (
    <Card style={styles.card} loading={loading}>
      <View style={styles.content}>
        {/* Header - stays at top */}
        <View style={styles.header}>
          <Text size={Size.Small} weight="semibold">
            Altcoin Season Index
          </Text>
          <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
            BTC Dominance: {(btcDominance ?? 0).toFixed(1)}%
          </Text>
        </View>

        {/* Spacer pushes meter down */}
        <View style={styles.spacer} />

        {/* Meter section - centered */}
        <View style={styles.meterContainer}>
          <View style={styles.meterLabels}>
            <Text size={Size.TwoXSmall} weight="semibold" appearance={TextAppearance.Warning}>
              BTC
            </Text>
            <Text size={Size.TwoXSmall} weight="semibold" appearance={TextAppearance.Info}>
              ALT
            </Text>
          </View>

          <ProgressBar
            value={value}
            max={100}
            size={Size.Medium}
            appearance={status.appearance}
            brightness={Brightness.Bright}
          />

          <View style={styles.valueRow}>
            <Number
              value={value}
              format={{ type: "score", max: 100 }}
              size={Size.Large}
              weight="bold"
              appearance={status.appearance}
              brightness={Brightness.Bright}
            />
            <Text size={Size.Small} appearance={TextAppearance.Muted}>
              / 100
            </Text>
          </View>
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
            {status.description}
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
  meterContainer: {
    gap: 12,
    alignSelf: "stretch",
  },
  meterLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 4,
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
