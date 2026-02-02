/**
 * SignalSummaryCard Component
 *
 * Displays composite trading signal scores with category breakdowns.
 * Includes compact colorful tags showing market conditions.
 */

import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Card, Text, ProgressBar, AnimatedNumber } from "@wraith/ghost/components";
import { Size, TextAppearance, Brightness } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import {
  getDirectionLabel,
  getDirectionColor,
  getScoreColor,
  type SignalDirection,
} from "../types/signals";

type CategoryScore = {
  label: string;
  score: number;
  color: string;
};

type ConditionTag = {
  label: string;
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
    tags.push({ label: "Falling Knife", color: "#DC2626" });
  }

  // Oversold/Overbought
  if (momentumScore < -60 && trendScore > -20) {
    tags.push({ label: "Oversold", color: "#06B6D4" });
  }
  if (momentumScore > 60 && trendScore < 20) {
    tags.push({ label: "Overbought", color: "#F59E0B" });
  }

  // Trend tags
  if (trendScore > 60) {
    tags.push({ label: "Uptrend", color: "#10B981" });
  } else if (trendScore < -60) {
    tags.push({ label: "Downtrend", color: "#EF4444" });
  }

  // Consolidation
  if (Math.abs(trendScore) < 15 && Math.abs(momentumScore) < 15 && volatilityScore < 0) {
    tags.push({ label: "Consolidating", color: "#6B7280" });
  }

  // Volatility
  if (volatilityScore > 50) {
    tags.push({ label: "High Vol", color: "#F97316" });
  }

  // Volume
  if (volumeScore > 50) {
    tags.push({ label: "Vol Surge", color: "#8B5CF6" });
  }

  // Divergences
  if (momentumScore > 30 && trendScore < -10) {
    tags.push({ label: "Bull Div", color: "#22C55E" });
  }
  if (momentumScore < -30 && trendScore > 10) {
    tags.push({ label: "Bear Div", color: "#EF4444" });
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
  const themeColors = useThemeColors();
  const directionColor = getDirectionColor(direction);
  const directionLabel = getDirectionLabel(direction);

  const categories: CategoryScore[] = [
    { label: "Trend", score: trendScore, color: "#8B5CF6" }, // Purple
    { label: "Momentum", score: momentumScore, color: "#06B6D4" }, // Cyan
    { label: "Volatility", score: volatilityScore, color: "#F59E0B" }, // Amber
    { label: "Volume", score: volumeScore, color: "#10B981" }, // Emerald
  ];

  // Generate compact condition tags
  const conditionTags = useMemo(
    () => generateConditionTags(direction, trendScore, momentumScore, volatilityScore, volumeScore, priceChange24h),
    [direction, trendScore, momentumScore, volatilityScore, volumeScore, priceChange24h]
  );

  // Generate helpful interpretation text
  const interpretationText = compositeScore >= 40
    ? "Strong buy conditions - multiple indicators suggest upward momentum"
    : compositeScore >= 10
    ? "Moderate buy signal - consider entering positions"
    : compositeScore > -10
    ? "Neutral - no clear direction, wait for stronger signals"
    : compositeScore > -40
    ? "Moderate sell signal - consider reducing exposure"
    : "Strong sell conditions - indicators suggest downward pressure";

  return (
    <Card style={styles.card} loading={loading}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text
            size={Size.Medium}
            appearance={TextAppearance.Muted}
            style={styles.headerLabel}
          >
            TRADING SIGNALS
          </Text>
          <Text size={Size.Small} appearance={TextAppearance.Muted}>
            Combined analysis of {indicatorCount} technical indicators
          </Text>
        </View>

        <View
          style={[styles.divider, { backgroundColor: themeColors.border.subtle }]}
        />

        {/* Main score display */}
        <View style={styles.mainScore}>
          <View style={styles.scoreRow}>
            <Text size={Size.Small} appearance={TextAppearance.Muted}>
              Composite Score
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
                    {tag.label}
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
            CATEGORY BREAKDOWN
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
