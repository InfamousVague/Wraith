/**
 * SignalIndicatorsPanel Component
 *
 * Tabbed panel displaying individual technical indicators by category.
 * Each indicator row shows value, score bar, direction badge, and accuracy.
 */

import React, { useState, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Card, Text, ProgressBar, SegmentedControl } from "@wraith/ghost/components";
import { Size, TextAppearance, Brightness } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { Colors } from "@wraith/ghost/tokens";
import { AccuracyTag } from "./AccuracyTag";
import { IndicatorTooltip } from "./IndicatorTooltip";
import {
  getScoreColor,
  getCategoryName,
  type SignalOutput,
  type SignalCategory,
} from "../types/signals";
import { HintIndicator } from "./HintIndicator";

type SignalIndicatorsPanelProps = {
  /** All indicator signals */
  signals: SignalOutput[];
  /** Whether data is loading */
  loading?: boolean;
};


type IndicatorRowProps = {
  signal: SignalOutput;
  /** Index for hint priority ordering */
  index: number;
};

const IndicatorRow = React.memo(function IndicatorRow({
  signal,
  index,
}: IndicatorRowProps) {
  const themeColors = useThemeColors();
  const scoreColor = getScoreColor(signal.score);

  // Format the raw value based on indicator type
  const formattedValue = useMemo(() => {
    const value = signal.value;
    if (signal.name.includes("MACD") || signal.name.includes("OBV")) {
      // These can be large or small, format intelligently
      if (Math.abs(value) >= 1000000) {
        return `${(value / 1000000).toFixed(2)}M`;
      }
      if (Math.abs(value) >= 1000) {
        return `${(value / 1000).toFixed(2)}K`;
      }
      return value.toFixed(4);
    }
    // Most indicators are percentages or small numbers
    return value.toFixed(2);
  }, [signal.value, signal.name]);

  // Normalize score from -100..+100 to 0..100 for progress bar
  // The bar fills from center (50) to show direction
  const normalizedScore = (signal.score + 100) / 2;

  return (
    <View style={styles.indicatorRow}>
      {/* Name with help tooltip */}
      <View style={styles.indicatorName}>
        <View style={styles.indicatorNameRow}>
          <Text size={Size.Small} weight="medium">
            {signal.name}
          </Text>
          <IndicatorTooltip
            indicatorName={signal.name}
            priority={30 + index}
          />
        </View>
      </View>

      {/* Value */}
      <View style={styles.indicatorValue}>
        <Text size={Size.Small} appearance={TextAppearance.Muted}>
          {formattedValue}
        </Text>
      </View>

      {/* Score bar */}
      <View style={styles.indicatorBar}>
        <ProgressBar
          value={normalizedScore}
          max={100}
          size={Size.Medium}
          color={scoreColor}
          brightness={Brightness.Soft}
          style={styles.scoreBar}
        />
      </View>

      {/* Direction badge */}
      <View style={styles.indicatorDirection}>
        <View
          style={[
            styles.directionBadge,
            { backgroundColor: `${scoreColor}20` },
          ]}
        >
          <Text
            size={Size.Small}
            weight="medium"
            style={{ color: scoreColor }}
          >
            {signal.score > 20
              ? "Buy"
              : signal.score < -20
              ? "Sell"
              : "Hold"}
          </Text>
        </View>
      </View>

      {/* Accuracy */}
      <View style={styles.indicatorAccuracy}>
        <AccuracyTag
          accuracy={signal.accuracy ?? 0}
          sampleSize={signal.sampleSize ?? 0}
        />
      </View>
    </View>
  );
});

export function SignalIndicatorsPanel({
  signals,
  loading = false,
}: SignalIndicatorsPanelProps) {
  const { t } = useTranslation("components");
  const themeColors = useThemeColors();
  const [activeCategory, setActiveCategory] = useState<SignalCategory>("trend");

  // Category options for segmented control - must be inside component for i18n
  const categoryOptions = [
    { value: "trend" as const, label: t("signals.categories.trend") },
    { value: "momentum" as const, label: t("signals.categories.momentum") },
    { value: "volatility" as const, label: t("signals.categories.volatility") },
    { value: "volume" as const, label: t("signals.categories.volume") },
  ];

  // Group signals by category
  const signalsByCategory = useMemo(() => {
    const grouped: Record<SignalCategory, SignalOutput[]> = {
      trend: [],
      momentum: [],
      volatility: [],
      volume: [],
    };

    for (const signal of signals) {
      if (grouped[signal.category]) {
        grouped[signal.category].push(signal);
      }
    }

    return grouped;
  }, [signals]);

  const currentSignals = signalsByCategory[activeCategory];

  return (
    <Card style={styles.card} loading={loading}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text
              size={Size.Medium}
              appearance={TextAppearance.Muted}
              style={styles.headerLabel}
            >
              {t("indicators.title")}
            </Text>
            <HintIndicator
              id="technical-indicators-hint"
              title={t("indicators.hint.title")}
              content={t("indicators.hint.content")}
              icon="?"
              color={Colors.accent.primary}
              priority={14}
              inline
            />
          </View>
          <Text size={Size.Small} appearance={TextAppearance.Muted}>
            {t("indicators.subtitle")}
          </Text>
        </View>

        {/* Category Selector */}
        <View style={styles.segmentContainer}>
          <SegmentedControl
            options={categoryOptions}
            value={activeCategory}
            onChange={setActiveCategory}
            size={Size.Medium}
          />
        </View>

        {/* Category explanation */}
        <Text
          size={Size.Small}
          appearance={TextAppearance.Muted}
          style={styles.categoryExplanation}
        >
          {t(`indicators.categoryDescriptions.${activeCategory}`)}
        </Text>

        {/* Indicator list */}
        <View style={styles.indicatorsList}>
          {/* Header row */}
          <View style={styles.indicatorHeader}>
            <View style={styles.indicatorName}>
              <Text size={Size.Small} appearance={TextAppearance.Muted}>
                {t("indicators.columns.indicator")}
              </Text>
            </View>
            <View style={styles.indicatorValue}>
              <Text size={Size.Small} appearance={TextAppearance.Muted}>
                {t("indicators.columns.value")}
              </Text>
            </View>
            <View style={styles.indicatorBar}>
              <Text size={Size.Small} appearance={TextAppearance.Muted}>
                {t("indicators.columns.score")}
              </Text>
            </View>
            <View style={styles.indicatorDirection}>
              <Text size={Size.Small} appearance={TextAppearance.Muted}>
                {t("indicators.columns.signal")}
              </Text>
            </View>
            <View style={styles.indicatorAccuracy}>
              <Text size={Size.Small} appearance={TextAppearance.Muted}>
                {t("indicators.columns.accuracy")}
              </Text>
            </View>
          </View>

          {/* Indicator rows */}
          {currentSignals.length > 0 ? (
            currentSignals.map((signal, index) => (
              <IndicatorRow key={signal.name} signal={signal} index={index} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text size={Size.Medium} appearance={TextAppearance.Muted}>
                {t("indicators.noIndicators", { category: getCategoryName(activeCategory).toLowerCase() })}
              </Text>
            </View>
          )}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
            {t("indicators.legend")}
          </Text>
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerLabel: {
    marginBottom: 4,
  },
  segmentContainer: {
    marginBottom: 16,
  },
  categoryExplanation: {
    marginBottom: 16,
  },
  indicatorsList: {
    gap: 10,
  },
  indicatorHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 10,
    gap: 12,
  },
  indicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
  indicatorName: {
    flex: 2,
    minWidth: 100,
  },
  indicatorNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  indicatorValue: {
    flex: 1,
    minWidth: 60,
    alignItems: "flex-end",
  },
  indicatorBar: {
    flex: 2,
    minWidth: 100,
  },
  scoreBar: {
    width: "100%",
  },
  indicatorDirection: {
    minWidth: 60,
    alignItems: "center",
  },
  directionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  indicatorAccuracy: {
    minWidth: 65,
    alignItems: "flex-end",
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: "center",
  },
  legend: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
});
