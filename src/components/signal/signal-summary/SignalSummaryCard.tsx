/**
 * SignalSummaryCard Component
 *
 * Displays composite trading signal scores with category breakdowns.
 * Includes compact colorful tags showing market conditions.
 */

import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Card, Text, ProgressBar, AnimatedNumber } from "@wraith/ghost/components";
import { Size, TextAppearance, Brightness } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { Colors } from "@wraith/ghost/tokens";
import { spacing, radii } from "../../../styles/tokens";
import { getDirectionLabel, getDirectionColor } from "../../../types/signals";
import {
  HintIndicator,
  TooltipContainer,
  TooltipSection,
  TooltipText,
  TooltipSignal,
  TooltipMetric,
  TooltipDivider,
} from "../../ui/hint-indicator";
import { useBreakpoint } from "../../../hooks/useBreakpoint";
import { CategoryRow } from "./CategoryRow";
import { generateConditionTags } from "./utils/conditionTags";
import type { SignalSummaryCardProps, CategoryScore } from "./types";

export function SignalSummaryCard({
  compositeScore,
  direction,
  trendScore,
  momentumScore,
  volatilityScore,
  volumeScore,
  indicatorCount = 12,
  priceChange24h,
  loading = false,
}: SignalSummaryCardProps) {
  const { t } = useTranslation("components");
  const themeColors = useThemeColors();
  const { isMobile } = useBreakpoint();
  const directionColor = getDirectionColor(direction);
  const directionLabel = getDirectionLabel(direction);

  const categories: CategoryScore[] = [
    { label: t("signals.categories.trend"), score: trendScore, color: Colors.data.violet },
    { label: t("signals.categories.momentum"), score: momentumScore, color: Colors.data.cyan },
    { label: t("signals.categories.volatility"), score: volatilityScore, color: Colors.data.amber },
    { label: t("signals.categories.volume"), score: volumeScore, color: Colors.data.emerald },
  ];

  // Generate compact condition tags
  const conditionTags = useMemo(
    () => generateConditionTags(direction, trendScore, momentumScore, volatilityScore, volumeScore, priceChange24h),
    [direction, trendScore, momentumScore, volatilityScore, volumeScore, priceChange24h]
  );

  // Generate helpful interpretation text key
  const interpretationKey = compositeScore >= 40
    ? "strongBuy"
    : compositeScore >= 10
    ? "moderateBuy"
    : compositeScore > -10
    ? "neutral"
    : compositeScore > -40
    ? "moderateSell"
    : "strongSell";
  const interpretationText = t(`signals.interpretation.${interpretationKey}`);

  return (
    <Card style={styles.card} loading={loading} fullBleed={isMobile}>
      <View style={[styles.content, isMobile && styles.contentMobile]}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text
              size={Size.Medium}
              appearance={TextAppearance.Muted}
              style={styles.headerLabel}
            >
              {t("signals.title")}
            </Text>
            <HintIndicator
              id="trading-signals-hint"
              title={t("signals.hint.title")}
              icon="i"
              color={Colors.accent.primary}
              priority={11}
              width={420}
              inline
            >
              <TooltipContainer>
                <TooltipText>
                  Combines multiple technical indicators into a single composite score from -100 to +100.
                </TooltipText>
                <TooltipSection title="Score Interpretation">
                  <TooltipSignal type="bullish" text="+40 to +100 — Strong bullish signal" />
                  <TooltipSignal type="bullish" text="+10 to +39 — Moderate bullish bias" />
                  <TooltipSignal type="neutral" text="-9 to +9 — Neutral / No clear direction" />
                  <TooltipSignal type="bearish" text="-39 to -10 — Moderate bearish bias" />
                  <TooltipSignal type="bearish" text="-100 to -40 — Strong bearish signal" />
                </TooltipSection>
                <TooltipDivider />
                <TooltipSection title="Category Breakdown">
                  <TooltipMetric label="Trend" value="Overall price direction" valueColor={Colors.data.violet} />
                  <TooltipMetric label="Momentum" value="Speed of price changes" valueColor={Colors.data.cyan} />
                  <TooltipMetric label="Volatility" value="Price fluctuation range" valueColor={Colors.data.amber} />
                  <TooltipMetric label="Volume" value="Trading activity level" valueColor={Colors.data.emerald} />
                </TooltipSection>
              </TooltipContainer>
            </HintIndicator>
          </View>
          <Text size={Size.Small} appearance={TextAppearance.Muted}>
            {t("signals.subtitle", { count: indicatorCount })}
          </Text>
        </View>

        <View
          style={[styles.divider, { backgroundColor: themeColors.border.subtle }]}
        />

        {/* Main score display */}
        <View style={styles.mainScore}>
          <View style={styles.scoreRow}>
            <Text size={Size.Small} appearance={TextAppearance.Muted}>
              {t("signals.compositeScore")}
            </Text>
            <View style={styles.directionBadge}>
              <View
                style={[styles.badge, { backgroundColor: `${directionColor}20` }]}
              >
                <Text
                  size={Size.Small}
                  weight="semibold"
                  style={{ color: directionColor }}
                >
                  {directionLabel}
                </Text>
              </View>
            </View>
          </View>
          <AnimatedNumber
            value={compositeScore}
            decimals={0}
            prefix={compositeScore > 0 ? "+" : ""}
            size={Size.TwoXLarge}
            weight="bold"
            style={{ color: directionColor }}
            animate
            animationDuration={300}
          />
          {/* Composite progress bar - centered at 50 (neutral) */}
          <View style={styles.compositeBarContainer}>
            <ProgressBar
              value={(compositeScore + 100) / 2}
              max={100}
              size={Size.Large}
              color={directionColor}
              brightness={Brightness.Base}
              style={styles.compositeBar}
            />
          </View>
          {/* Interpretation text */}
          <Text
            size={Size.Small}
            appearance={TextAppearance.Muted}
            style={styles.interpretationText}
          >
            {interpretationText}
          </Text>
        </View>

        <View
          style={[styles.divider, { backgroundColor: themeColors.border.subtle }]}
        />

        {/* Category breakdown */}
        <View style={styles.categoriesSection}>
          {/* Compact condition tags */}
          {conditionTags.length > 0 && (
            <View style={styles.conditionTagsRow}>
              {conditionTags.map((tag, i) => (
                <View
                  key={i}
                  style={[styles.conditionTag, { backgroundColor: `${tag.color}20` }]}
                >
                  <Text size={Size.ExtraSmall} weight="medium" style={{ color: tag.color }}>
                    {t(`signals.conditions.${tag.labelKey}`)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <Text
            size={Size.Small}
            appearance={TextAppearance.Muted}
            style={styles.categoriesTitle}
          >
            {t("signals.categoryBreakdown")}
          </Text>
          <View style={styles.categoriesList}>
            {categories.map((category) => (
              <CategoryRow key={category.label} {...category} />
            ))}
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  contentMobile: {
    padding: spacing.md,
  },
  header: {
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  headerLabel: {
    marginBottom: spacing.xxs,
  },
  divider: {
    height: 1,
    marginBottom: spacing.lg,
  },
  mainScore: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  directionBadge: {
    flexDirection: "row",
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.lg,
  },
  compositeBarContainer: {
    width: "100%",
    marginTop: spacing.sm,
  },
  compositeBar: {
    width: "100%",
  },
  interpretationText: {
    marginTop: spacing.sm,
    textAlign: "center",
  },
  categoriesSection: {
    gap: spacing.sm,
  },
  conditionTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xxs,
    marginBottom: spacing.sm,
  },
  conditionTag: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    borderRadius: radii.soft,
  },
  categoriesTitle: {
    marginBottom: spacing.xs,
  },
  categoriesList: {
    gap: spacing.sm,
  },
});
