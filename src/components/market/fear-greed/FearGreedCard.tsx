/**
 * FearGreedCard Component
 *
 * @fileoverview Displays the Crypto Fear & Greed Index as a circular gauge
 * with descriptive labels and sentiment interpretation.
 *
 * @description
 * Features:
 * - **Circular Gauge**: ProgressCircle showing 0-100 score
 * - **Sentiment Labels**: Dynamic labels based on score ranges (Panic -> Manic)
 * - **Color Coding**: Danger/Warning/Success appearance based on sentiment
 * - **Helpful Hint**: Explains what the Fear & Greed Index measures
 *
 * @example
 * <FearGreedCard value={72} loading={false} />
 *
 * @exports FearGreedCard - Main component
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Card, Text, ProgressCircle } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { spacing } from "../../../styles/tokens";
import {
  HintIndicator,
  TooltipContainer,
  TooltipSection,
  TooltipText,
  TooltipSignal,
  TooltipMetric,
} from "../../ui/hint-indicator";
import { getFearGreedStatus } from "./utils/statusHelpers";
import type { FearGreedCardProps } from "./types";

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
          icon="i"
          color={Colors.accent.primary}
          priority={1}
          width={380}
        >
          <TooltipContainer>
            <TooltipText>
              The Fear & Greed Index measures crypto market sentiment on a scale of 0-100.
            </TooltipText>
            <TooltipSection title="Score Ranges">
              <TooltipMetric label="0-25" value="Extreme Fear — potential buying opportunity" valueColor={Colors.status.danger} />
              <TooltipMetric label="26-45" value="Fear — market is cautious" valueColor={Colors.status.warning} />
              <TooltipMetric label="46-55" value="Neutral — balanced sentiment" valueColor={Colors.text.secondary} />
              <TooltipMetric label="56-75" value="Greed — market is optimistic" valueColor={Colors.data.amber} />
              <TooltipMetric label="76-100" value="Extreme Greed — potential correction ahead" valueColor={Colors.status.danger} />
            </TooltipSection>
            <TooltipSignal type="info" text="Contrarian strategy: buy during fear, be cautious during greed" />
          </TooltipContainer>
        </HintIndicator>

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
    padding: spacing.lg,
    alignItems: "center",
    // @ts-ignore - position relative needed for absolute positioned hint
    position: "relative",
  },
  header: {
    alignItems: "center",
    gap: spacing.xxs,
  },
  spacer: {
    flex: 1,
  },
  circleContainer: {
    paddingVertical: spacing.md,
  },
  footer: {
    alignItems: "center",
    gap: spacing.xs,
  },
  description: {
    textAlign: "center",
    lineHeight: 16,
  },
});
