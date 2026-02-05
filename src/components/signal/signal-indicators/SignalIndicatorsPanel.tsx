/**
 * SignalIndicatorsPanel Component
 *
 * Tabbed panel displaying individual technical indicators by category.
 * Each indicator row shows value, score bar, direction badge, and accuracy.
 */

import React, { useState, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Card, Text, SegmentedControl } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { Colors } from "@wraith/ghost/tokens";
import { spacing } from "../../../styles/tokens";
import { getCategoryName, type SignalOutput, type SignalCategory } from "../../../types/signals";
import {
  HintIndicator,
  TooltipContainer,
  TooltipSection,
  TooltipText,
  TooltipListItem,
  TooltipDivider,
} from "../../ui/hint-indicator";
import { useBreakpoint } from "../../../hooks/useBreakpoint";
import { IndicatorRow } from "./IndicatorRow";
import type { SignalIndicatorsPanelProps } from "./types";

export function SignalIndicatorsPanel({
  signals,
  loading = false,
}: SignalIndicatorsPanelProps) {
  const { t } = useTranslation("components");
  const themeColors = useThemeColors();
  const { isMobile } = useBreakpoint();
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
    <Card style={styles.card} loading={loading} fullBleed={isMobile}>
      <View style={[styles.content, isMobile && styles.contentMobile]}>
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
              icon="i"
              color={Colors.accent.primary}
              priority={14}
              width={420}
              inline
            >
              <TooltipContainer>
                <TooltipText>
                  Individual indicator values with their Buy/Sell/Hold signals. Each indicator is scored from -100 to +100.
                </TooltipText>
                <TooltipSection title="Categories">
                  <TooltipListItem icon="trending-up" color={Colors.data.violet}>
                    Trend — Moving averages, trend strength (EMA, SMA, ADX)
                  </TooltipListItem>
                  <TooltipListItem icon="activity" color={Colors.data.cyan}>
                    Momentum — Speed of changes, overbought/oversold (RSI, MACD, Stochastic)
                  </TooltipListItem>
                  <TooltipListItem icon="bar-chart-2" color={Colors.data.amber}>
                    Volatility — Price fluctuation range (Bollinger, ATR)
                  </TooltipListItem>
                  <TooltipListItem icon="layers" color={Colors.data.emerald}>
                    Volume — Trading activity confirmation (OBV, Volume MA)
                  </TooltipListItem>
                </TooltipSection>
                <TooltipDivider />
                <TooltipSection title="Accuracy Score">
                  <TooltipText>
                    Shows how often each indicator correctly predicted price direction based on historical data.
                  </TooltipText>
                </TooltipSection>
              </TooltipContainer>
            </HintIndicator>
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
    padding: spacing.lg,
  },
  contentMobile: {
    padding: spacing.sm,
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
  segmentContainer: {
    marginBottom: spacing.md,
  },
  categoryExplanation: {
    marginBottom: spacing.md,
  },
  indicatorsList: {
    gap: spacing.xs,
  },
  indicatorHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: spacing.xs,
    gap: spacing.sm,
  },
  indicatorName: {
    flex: 2,
    minWidth: 100,
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
  indicatorDirection: {
    minWidth: 60,
    alignItems: "center",
  },
  indicatorAccuracy: {
    minWidth: 65,
    alignItems: "flex-end",
  },
  emptyState: {
    paddingVertical: spacing.xxl,
    alignItems: "center",
  },
  legend: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
});
