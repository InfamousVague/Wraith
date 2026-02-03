/**
 * PredictionAccuracyCard Component
 *
 * Displays recommendation, prediction accuracy statistics, and recent predictions
 * with compact indicator cards showing green/red outcomes.
 */

import React, { useMemo } from "react";
import { View, StyleSheet, TouchableOpacity, type ViewStyle } from "react-native";
import { useTranslation } from "react-i18next";
import {
  Card,
  Text,
  Icon,
} from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { Colors } from "@wraith/ghost/tokens";
import { getRecommendationColor } from "../types/signals";
import { HeartbeatChart } from "./HeartbeatChart";
import { HintIndicator } from "./HintIndicator";
import { useBreakpoint } from "../hooks/useBreakpoint";

// Import from modular structure
import type { PredictionAccuracyCardProps } from "./prediction-accuracy/types";
import { HalfCircleGauge } from "./prediction-accuracy/HalfCircleGauge";
import { IndicatorGroup } from "./prediction-accuracy/IndicatorGroup";
import { getAccuracyColor } from "./prediction-accuracy/utils/predictionHelpers";
import { hasValidatedOutcome } from "./prediction-accuracy/utils/predictionFormatters";

export function PredictionAccuracyCard({
  accuracies,
  predictions,
  pendingPredictions,
  recommendation,
  loading = false,
  generating = false,
  onGeneratePredictions,
}: PredictionAccuracyCardProps) {
  const { t } = useTranslation(["components", "common"]);
  const themeColors = useThemeColors();
  const { isMobile } = useBreakpoint();

  // Calculate overall accuracy
  const overallAccuracy = useMemo(() => {
    if (accuracies.length === 0) return 0;
    let totalCorrect = 0;
    let totalDecisive = 0;
    for (const acc of accuracies) {
      totalCorrect += acc.correctPredictions;
      totalDecisive += acc.correctPredictions + acc.incorrectPredictions;
    }
    return totalDecisive > 0 ? (totalCorrect / totalDecisive) * 100 : 0;
  }, [accuracies]);

  const totalPredictions = useMemo(() => {
    return accuracies.reduce((sum, acc) => sum + acc.totalPredictions, 0);
  }, [accuracies]);

  // Calculate win rate (correct / total including neutral)
  const winRate = useMemo(() => {
    if (accuracies.length === 0) return 0;
    let totalCorrect = 0;
    let total = 0;
    for (const acc of accuracies) {
      totalCorrect += acc.correctPredictions;
      total += acc.totalPredictions;
    }
    return total > 0 ? (totalCorrect / total) * 100 : 0;
  }, [accuracies]);

  // Group validated predictions by indicator and get last 3 for each
  const groupedPredictions = useMemo(() => {
    const groups: Record<string, SignalPrediction[]> = {};

    // Filter to only validated predictions and sort by timestamp descending
    const validated = predictions
      .filter(hasValidatedOutcome)
      .sort((a, b) => b.timestamp - a.timestamp);

    for (const prediction of validated) {
      const key = prediction.indicator;
      if (!groups[key]) {
        groups[key] = [];
      }
      if (groups[key].length < 3) {
        groups[key].push(prediction);
      }
    }

    return groups;
  }, [predictions]);

  // Get LIFETIME accuracy for each indicator (aggregate across all timeframes)
  const indicatorAccuracies = useMemo(() => {
    const map: Record<string, { correct: number; incorrect: number }> = {};

    // Aggregate across all timeframes for each indicator
    for (const acc of accuracies) {
      if (!map[acc.indicator]) {
        map[acc.indicator] = { correct: 0, incorrect: 0 };
      }
      map[acc.indicator].correct += acc.correctPredictions;
      map[acc.indicator].incorrect += acc.incorrectPredictions;
    }

    // Calculate percentage for each
    const result: Record<string, number> = {};
    for (const [indicator, stats] of Object.entries(map)) {
      const total = stats.correct + stats.incorrect;
      result[indicator] = total > 0 ? (stats.correct / total) * 100 : 0;
    }

    return result;
  }, [accuracies]);

  // Get accuracy by timeframe for each indicator
  const indicatorAccuraciesByTimeframe = useMemo(() => {
    const result: Record<string, Record<string, number | null>> = {};

    for (const acc of accuracies) {
      if (!result[acc.indicator]) {
        result[acc.indicator] = { "5m": null, "1h": null, "4h": null };
      }
      const total = acc.correctPredictions + acc.incorrectPredictions;
      if (total > 0) {
        result[acc.indicator][acc.timeframe] = (acc.correctPredictions / total) * 100;
      }
    }

    return result;
  }, [accuracies]);

  // Map pending predictions by indicator
  const pendingByIndicator = useMemo(() => {
    const result: Record<string, SignalPrediction> = {};
    if (pendingPredictions) {
      for (const pred of pendingPredictions) {
        // Keep the most recent pending prediction for each indicator
        if (!result[pred.indicator] || pred.timestamp > result[pred.indicator].timestamp) {
          result[pred.indicator] = pred;
        }
      }
    }
    return result;
  }, [pendingPredictions]);

  // Combine indicators from both validated and pending predictions
  const indicators = useMemo(() => {
    const allIndicators = new Set([
      ...Object.keys(groupedPredictions),
      ...Object.keys(pendingByIndicator),
    ]);
    return Array.from(allIndicators).sort();
  }, [groupedPredictions, pendingByIndicator]);

  // Recommendation display
  const action = recommendation?.action ?? "hold";
  const actionLabel = action.toUpperCase();
  const actionColor = getRecommendationColor(action);
  const confidence = recommendation?.confidence ?? 0;

  // Flatten style arrays for web compatibility
  const cardStyle = StyleSheet.flatten([styles.card, isMobile && styles.cardMobile]) as ViewStyle;

  return (
    <Card style={cardStyle} loading={loading} fullBleed={isMobile}>
      <View style={[styles.content, isMobile && styles.contentMobile]}>
        {/* Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text size={Size.Medium} appearance={TextAppearance.Muted}>
            {t("components:prediction.title")}
          </Text>
          <HintIndicator
            id="market-prediction-hint"
            title={t("components:prediction.hint.title")}
            content={t("components:prediction.hint.content")}
            icon="?"
            color={Colors.accent.primary}
            priority={12}
            inline
          />
        </View>

        {/* Top Row: Recommendation + Gauges - all inline */}
        <View style={[styles.topRow, isMobile && styles.topRowMobile]}>
          {/* Recommendation Badge */}
          <View style={[styles.actionBadge, { backgroundColor: `${actionColor}15` }]}>
            <Text
              size={Size.ThreeXLarge}
              weight="bold"
              style={{ color: actionColor }}
            >
              {actionLabel}
            </Text>
          </View>

          {/* Three Half-Circle Gauges */}
          <HalfCircleGauge
            value={confidence}
            max={100}
            color={actionColor}
            label={t("components:prediction.confidence")}
            valueLabel={`${Math.round(confidence)}%`}
          />
          <HalfCircleGauge
            value={overallAccuracy}
            max={100}
            color={getAccuracyColor(overallAccuracy)}
            label={t("components:prediction.accuracy")}
            valueLabel={`${overallAccuracy.toFixed(1)}%`}
          />
          <HalfCircleGauge
            value={winRate}
            max={100}
            color={getAccuracyColor(winRate)}
            label={t("components:prediction.winRate")}
            valueLabel={`${winRate.toFixed(1)}%`}
          />
        </View>

        {/* Predictions count */}
        <Text
          size={Size.Small}
          appearance={TextAppearance.Muted}
          style={styles.predictionCount}
        >
          {t("components:prediction.basedOn", { count: totalPredictions.toLocaleString() })}
        </Text>

        {indicators.length > 0 && (
          <>
            <View
              style={[
                styles.divider,
                { backgroundColor: themeColors.border.subtle },
              ]}
            />

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderRow}>
                  <Text
                    size={Size.Medium}
                    appearance={TextAppearance.Muted}
                  >
                    {t("components:prediction.history.title")}
                  </Text>
                  <HintIndicator
                    id="prediction-history-hint"
                    title={t("components:prediction.historyHint.title")}
                    content={t("components:prediction.historyHint.content")}
                    icon="?"
                    color={Colors.accent.primary}
                    priority={13}
                    inline
                  />
                </View>
                <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                  {t("components:prediction.history.legend")}
                </Text>
              </View>

              {/* Grid of indicator groups */}
              <View style={styles.indicatorGrid}>
                {indicators.map((indicator, index) => (
                  <IndicatorGroup
                    key={indicator}
                    indicator={indicator}
                    predictions={groupedPredictions[indicator] ?? []}
                    pendingPrediction={pendingByIndicator[indicator]}
                    accuracyByTimeframe={indicatorAccuraciesByTimeframe[indicator] ?? { "5m": null, "1h": null, "4h": null }}
                    overallAccuracy={indicatorAccuracies[indicator] ?? null}
                    index={index}
                  />
                ))}
              </View>
            </View>
          </>
        )}

        {/* Generating State - show heartbeat animation while generating */}
        {generating && indicators.length === 0 && (!pendingPredictions || pendingPredictions.length === 0) && (
          <>
            <View style={styles.generatingBanner}>
              <HeartbeatChart
                height={20}
                width={40}
                color={Colors.data.blue}
                animationDuration={1500}
                style={styles.generatingHeartbeat}
              />
              <Text size={Size.Small} style={{ color: Colors.data.blue }}>
                {t("components:prediction.generating")}
              </Text>
            </View>
            <View style={styles.emptyState}>
              <HeartbeatChart
                height={80}
                width={120}
                color={Colors.data.blue}
                animationDuration={1500}
              />
              <Text
                size={Size.Medium}
                appearance={TextAppearance.Muted}
                style={[styles.emptySubtext, { marginTop: 16 }]}
              >
                {t("components:prediction.analyzingMarket")}
              </Text>
            </View>
          </>
        )}

        {/* Empty State - show when no predictions at all and not generating */}
        {!generating && indicators.length === 0 && (!pendingPredictions || pendingPredictions.length === 0) && (
          <View style={styles.emptyState}>
            <Icon name="zap" size={Size.TwoXLarge} color={themeColors.text.muted} />
            <Text
              size={Size.Large}
              appearance={TextAppearance.Muted}
              style={styles.emptyText}
            >
              {t("components:prediction.empty.title")}
            </Text>
            <Text
              size={Size.Medium}
              appearance={TextAppearance.Muted}
              style={styles.emptySubtext}
            >
              {t("components:prediction.empty.description")}
            </Text>
            {onGeneratePredictions && (
              <TouchableOpacity
                onPress={onGeneratePredictions}
                style={styles.generateButton}
              >
                <Text weight="semibold" style={{ color: Colors.data.blue }}>
                  {t("common:buttons.generatePredictions")}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 2,
    minWidth: 560,
  },
  cardMobile: {
    minWidth: 0,
    flex: 1,
  },
  content: {
    padding: 24,
  },
  contentMobile: {
    padding: 16,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  topRowMobile: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 12,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionBadge: {
    paddingHorizontal: 48,
    paddingVertical: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    height: 90,
    minWidth: 160,
  },
  gaugeContainer: {
    alignItems: "center",
  },
  gaugeValueContainer: {
    marginTop: -28,
    alignItems: "center",
  },
  gaugeLabel: {
    marginTop: 4,
  },
  predictionCount: {
    marginTop: 16,
  },
  divider: {
    height: 1,
    marginVertical: 20,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  indicatorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  indicatorGroup: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minWidth: 180,
    flex: 1,
    maxWidth: 220,
  },
  indicatorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  indicatorNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  accuracyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  directionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  timeframesList: {
    gap: 6,
  },
  timeframeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeframeLabelContainer: {
    minWidth: 24,
  },
  outcomeIconSmall: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  timeframeAccuracy: {
    minWidth: 32,
    alignItems: "flex-end",
  },
  timeframeCountdown: {
    flex: 1,
    alignItems: "flex-end",
  },
  countdownBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
  },
  predictionsStack: {
    gap: 4,
  },
  compactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  direction: {
    width: 32,
  },
  timeframes: {
    flexDirection: "row",
    gap: 6,
    flex: 1,
  },
  timeframe: {
    fontFamily: "monospace",
  },
  timeAgo: {
    minWidth: 24,
    textAlign: "right",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    textAlign: "center",
  },
  emptySubtext: {
    textAlign: "center",
    maxWidth: 280,
  },
  generateButton: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "Colors.data.blueSurface",
  },
  generateButtonDisabled: {
    backgroundColor: "rgba(107, 114, 128, 0.1)",
  },
  generatingBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "Colors.data.blueSurface",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  generatingHeartbeat: {
    marginRight: 8,
    backgroundColor: "transparent",
    borderRadius: 0,
  },
  pendingGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pendingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
    minWidth: 280,
    flex: 1,
  },
  pendingIndicator: {
    minWidth: 80,
  },
  countdowns: {
    flexDirection: "row",
    gap: 12,
    flex: 1,
    justifyContent: "flex-end",
  },
});
