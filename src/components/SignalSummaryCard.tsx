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
import {
  getDirectionLabel,
  getDirectionColor,
  getScoreColor,
  type SignalDirection,
} from "../types/signals";
import { HintIndicator } from "./HintIndicator";
import { useBreakpoint } from "../hooks/useBreakpoint";

type CategoryScore = {
  label: string;
  score: number;
  color: string;
};

type ConditionTag = {
  labelKey: string;
  color: string;
};

type SignalSummaryCardProps = {
  /** Overall composite score (-100 to +100) */
  compositeScore: number;
  /** Signal direction */
  direction: SignalDirection;
  /** Trend category score */
  trendScore: number;
  /** Momentum category score */
  momentumScore: number;
  /** Volatility category score */
  volatilityScore: number;
  /** Volume category score */
  volumeScore: number;
  /** Number of indicators used */
  indicatorCount?: number;
  /** Optional 24h price change for condition detection */
  priceChange24h?: number;
  /** Whether data is loading */
  loading?: boolean;
};

/**
 * Generate compact condition tags based on market data.
 */
function generateConditionTags(
  direction: SignalDirection,
  trendScore: number,
  momentumScore: number,
  volatilityScore: number,
  volumeScore: number,
  priceChange24h?: number
): ConditionTag[] {
  const tags: ConditionTag[] = [];

  // Falling Knife detection
  if (momentumScore < -50 && priceChange24h !== undefined && priceChange24h < -5) {
    tags.push({ labelKey: "fallingKnife", color: Colors.status.danger });
  }

  // Oversold/Overbought
  if (momentumScore < -60 && trendScore > -20) {
    tags.push({ labelKey: "oversold", color: Colors.status.info });
  }
  if (momentumScore > 60 && trendScore < 20) {
    tags.push({ labelKey: "overbought", color: Colors.status.warning });
  }

  // Trend tags
  if (trendScore > 60) {
    tags.push({ labelKey: "uptrend", color: Colors.status.success });
  } else if (trendScore < -60) {
    tags.push({ labelKey: "downtrend", color: Colors.status.danger });
  }

  // Consolidation
  if (Math.abs(trendScore) < 15 && Math.abs(momentumScore) < 15 && volatilityScore < 0) {
    tags.push({ labelKey: "consolidating", color: Colors.text.muted });
  }

  // Volatility
  if (volatilityScore > 50) {
    tags.push({ labelKey: "highVol", color: Colors.status.warning });
  }

  // Volume
  if (volumeScore > 50) {
    tags.push({ labelKey: "volSurge", color: Colors.accent.primary });
  }

  // Divergences
  if (momentumScore > 30 && trendScore < -10) {
    tags.push({ labelKey: "bullDiv", color: Colors.status.success });
  }
  if (momentumScore < -30 && trendScore > 10) {
    tags.push({ labelKey: "bearDiv", color: Colors.status.danger });
  }

  return tags.slice(0, 4); // Limit to 4 compact tags
}

const CategoryRow = React.memo(function CategoryRow({
  label,
  score,
  color,
}: CategoryScore) {
  const themeColors = useThemeColors();

  // Normalize score from -100..+100 to 0..100 for progress bar
  const normalizedValue = (score + 100) / 2;

  return (
    <View style={styles.categoryRow}>
      <View style={styles.categoryLabel}>
        <Text size={Size.Small} appearance={TextAppearance.Muted}>
          {label}
        </Text>
      </View>
      <View style={styles.categoryBar}>
        <ProgressBar
          value={normalizedValue}
          max={100}
          size={Size.Medium}
          color={color}
          brightness={Brightness.Soft}
          style={styles.progressBar}
        />
      </View>
      <View style={styles.categoryScore}>
        <Text
          size={Size.Small}
          weight="semibold"
          style={{ color: getScoreColor(score) }}
        >
          {score > 0 ? "+" : ""}
          {score}
        </Text>
      </View>
    </View>
  );
});

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
              content={t("signals.hint.content")}
              icon="?"
              color={Colors.accent.primary}
              priority={11}
              inline
            />
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
    padding: 20,
  },
  contentMobile: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerLabel: {
    marginBottom: 4,
  },
  divider: {
    height: 1,
    marginBottom: 20,
  },
  mainScore: {
    alignItems: "center",
    marginBottom: 20,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 10,
  },
  directionBadge: {
    flexDirection: "row",
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  compositeBarContainer: {
    width: "100%",
    marginTop: 14,
  },
  compositeBar: {
    width: "100%",
  },
  interpretationText: {
    marginTop: 12,
    textAlign: "center",
  },
  categoriesSection: {
    gap: 12,
  },
  conditionTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  conditionTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  categoriesTitle: {
    marginBottom: 8,
  },
  categoriesList: {
    gap: 14,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  categoryLabel: {
    width: 80,
  },
  categoryBar: {
    flex: 1,
  },
  progressBar: {
    width: "100%",
  },
  categoryScore: {
    width: 50,
    alignItems: "flex-end",
  },
});
