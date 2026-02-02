import React from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Card, Text, ProgressCircle } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { HintIndicator } from "./HintIndicator";

type FearGreedCardProps = {
  value?: number;
  loading?: boolean;
  timestamp?: string;
};

/**
 * Get the translation keys and appearance for a fear/greed value.
 */
function getFearGreedStatus(value: number): { labelKey: string; circleLabelKey: string; appearance: TextAppearance } {
  if (value <= 12) {
    return { labelKey: "extremeFear", circleLabelKey: "panic", appearance: TextAppearance.Danger };
  }
  if (value <= 25) {
    return { labelKey: "extremeFear", circleLabelKey: "fearful", appearance: TextAppearance.Danger };
  }
  if (value <= 37) {
    return { labelKey: "fear", circleLabelKey: "anxious", appearance: TextAppearance.Warning };
  }
  if (value <= 45) {
    return { labelKey: "fear", circleLabelKey: "cautious", appearance: TextAppearance.Warning };
  }
  if (value <= 55) {
    return { labelKey: "neutral", circleLabelKey: "balanced", appearance: TextAppearance.Muted };
  }
  if (value <= 65) {
    return { labelKey: "greed", circleLabelKey: "optimistic", appearance: TextAppearance.Success };
  }
  if (value <= 75) {
    return { labelKey: "greed", circleLabelKey: "greedy", appearance: TextAppearance.Success };
  }
  if (value <= 87) {
    return { labelKey: "extremeGreed", circleLabelKey: "euphoric", appearance: TextAppearance.Success };
  }
  return { labelKey: "extremeGreed", circleLabelKey: "manic", appearance: TextAppearance.Success };
}

export function FearGreedCard({ value = 72, loading = false }: FearGreedCardProps) {
  const { t } = useTranslation("components");
  const status = getFearGreedStatus(value);

  return (
    <Card style={styles.card} loading={loading}>
      <View style={styles.content}>
        {/* Hint indicator in top-right corner */}
        <HintIndicator
          id="fear-greed-hint"
          title={t("fearGreed.hint.title")}
          content={t("fearGreed.hint.content")}
          icon="i"
          color={Colors.accent.primary}
          priority={1}
        />

        {/* Header - stays at top */}
        <View style={styles.header}>
          <Text size={Size.Small} weight="semibold">
            {t("fearGreed.title")}
          </Text>
          <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
            {t("fearGreed.updated")}
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
            showValue
            label={t(`fearGreed.labels.${status.circleLabelKey}`)}
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
          >
            {t(`fearGreed.levels.${status.labelKey}`)}
          </Text>
          <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted} style={styles.description}>
            {t("fearGreed.description")}
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
