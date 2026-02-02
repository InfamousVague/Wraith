import React from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Card, Text, ProgressBar, Number } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { HintIndicator } from "./HintIndicator";

type AltcoinSeasonCardProps = {
  /** 0 = BTC season, 100 = Altcoin season */
  value?: number;
  btcDominance?: number;
  loading?: boolean;
};

/**
 * Get the status translation key and appearance based on the altcoin season value.
 */
function getSeasonStatus(value: number): {
  statusKey: string;
  appearance: TextAppearance;
} {
  if (value <= 20) {
    return { statusKey: "bitcoinSeason", appearance: TextAppearance.Warning };
  }
  if (value <= 40) {
    return { statusKey: "btcLeaning", appearance: TextAppearance.Warning };
  }
  if (value <= 60) {
    return { statusKey: "neutral", appearance: TextAppearance.Muted };
  }
  if (value <= 80) {
    return { statusKey: "altLeaning", appearance: TextAppearance.Info };
  }
  return { statusKey: "altcoinSeason", appearance: TextAppearance.Info };
}

export function AltcoinSeasonCard({
  value = 35,
  btcDominance = 52.4,
  loading = false,
}: AltcoinSeasonCardProps) {
  const { t } = useTranslation("components");
  const status = getSeasonStatus(value);

  return (
    <Card style={styles.card} loading={loading}>
      <View style={styles.content}>
        {/* Hint indicator in top-right corner */}
        <HintIndicator
          id="altcoin-season-hint"
          title={t("altcoinSeason.hint.title")}
          content={t("altcoinSeason.hint.content")}
          icon="i"
          color={Colors.accent.primary}
          priority={2}
        />

        {/* Header - stays at top */}
        <View style={styles.header}>
          <Text size={Size.Small} weight="semibold">
            {t("altcoinSeason.title")}
          </Text>
          <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
            {t("altcoinSeason.btcDominance", { value: (btcDominance ?? 0).toFixed(1) })}
          </Text>
        </View>

        {/* Spacer pushes meter down */}
        <View style={styles.spacer} />

        {/* Meter section - centered */}
        <View style={styles.meterContainer}>
          <View style={styles.meterLabels}>
            <Text size={Size.TwoXSmall} weight="semibold" appearance={TextAppearance.Warning}>
              {t("altcoinSeason.labels.btc")}
            </Text>
            <Text size={Size.TwoXSmall} weight="semibold" appearance={TextAppearance.Info}>
              {t("altcoinSeason.labels.alt")}
            </Text>
          </View>

          <ProgressBar
            value={value}
            max={100}
            size={Size.Medium}
            appearance={status.appearance}
          />

          <View style={styles.valueRow}>
            <Number
              value={value}
              format={{ type: "score", max: 100 }}
              size={Size.Large}
              weight="bold"
              appearance={status.appearance}
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
          >
            {t(`altcoinSeason.status.${status.statusKey}`)}
          </Text>
          <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted} style={styles.description}>
            {t(`altcoinSeason.descriptions.${status.statusKey}`)}
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
    // @ts-ignore - position relative needed for absolute positioned hint
    position: "relative",
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
