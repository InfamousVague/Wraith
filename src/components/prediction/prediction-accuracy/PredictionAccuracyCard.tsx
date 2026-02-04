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
import { spacing, radii } from "../../../styles/tokens";
import { getRecommendationColor } from "../../../types/signals";
import { HeartbeatChart } from "../../chart/heartbeat-chart";
import {
  HintIndicator,
  TooltipContainer,
  TooltipSection,
  TooltipText,
  TooltipMetric,
  TooltipSignal,
  TooltipDivider,
  TooltipListItem,
} from "../../ui/hint-indicator";
import { useBreakpoint } from "../../../hooks/useBreakpoint";

// Import from modular structure
import type { PredictionAccuracyCardProps } from "./types";
import { HalfCircleGauge } from "./HalfCircleGauge";
import { IndicatorGroup } from "./IndicatorGroup";
import { getAccuracyColor } from "./utils/predictionHelpers";
import { hasValidatedOutcome } from "./utils/predictionFormatters";

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
            icon="?"
            color={Colors.accent.primary}
            priority={12}
            width={420}
            inline
          >
            <TooltipContainer>
              <TooltipText>
                AI-generated predictions based on weighted technical indicator analysis.
              </TooltipText>
              <TooltipSection title="Recommendation">
                <TooltipSignal type="bullish" text="BUY — Indicators suggest price will rise" />
                <TooltipSignal type="neutral" text="HOLD — No clear direction, wait" />
                <TooltipSignal type="bearish" text="SELL — Indicators suggest price will fall" />
              </TooltipSection>
              <TooltipDivider />
              <TooltipSection title="Metrics">
                <TooltipMetric label="Confidence" value="How strong the signal is" valueColor={Colors.accent.primary} />
                <TooltipMetric label="Accuracy" value="% of decisive predictions correct" valueColor={Colors.status.success} />
                <TooltipMetric label="Win Rate" value="% of all predictions correct" valueColor={Colors.data.cyan} />
              </TooltipSection>
            </TooltipContainer>
          </HintIndicator>
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
                    icon="?"
                    color={Colors.accent.primary}
                    priority={13}
                    width={420}
                    inline
                  >
                    <TooltipContainer>
                      <TooltipText>
                        Shows the last 3 predictions for each indicator with their outcomes.
                      </TooltipText>
                      <TooltipSection title="Timeframes">
                        <TooltipMetric label="5m" value="5-minute price direction" />
                        <TooltipMetric label="1h" value="1-hour price direction" />
                        <TooltipMetric label="4h" value="4-hour price direction" />
                      </TooltipSection>
                      <TooltipDivider />
                      <TooltipSection title="Outcome Colors">
                        <TooltipListItem icon="check-circle" color={Colors.status.success}>
                          Green — Prediction was correct
                        </TooltipListItem>
                        <TooltipListItem icon="x-circle" color={Colors.status.danger}>
                          Red — Prediction was incorrect
                        </TooltipListItem>
                        <TooltipListItem icon="clock" color={Colors.data.blue}>
                          Blue — Awaiting validation
                        </TooltipListItem>
                      </TooltipSection>
                    </TooltipContainer>
                  </HintIndicator>
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
    padding: spacing.xl,
  },
  contentMobile: {
    padding: spacing.md,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  topRowMobile: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: spacing.sm,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  actionBadge: {
    paddingHorizontal: 48,
    paddingVertical: spacing.xl,
    borderRadius: radii.lg,
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
    marginTop: spacing.xxs,
  },
  predictionCount: {
    marginTop: spacing.md,
  },
  divider: {
    height: 1,
    marginVertical: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  indicatorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  indicatorGroup: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.sm,
    minWidth: 180,
    flex: 1,
    maxWidth: 220,
  },
  indicatorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  indicatorNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
  },
  accuracyBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  directionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  timeframesList: {
    gap: spacing.sm,
  },
  timeframeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
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
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.soft,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
  },
  predictionsStack: {
    gap: spacing.xxs,
  },
  compactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  direction: {
    width: 32,
  },
  timeframes: {
    flexDirection: "row",
    gap: spacing.sm,
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
    paddingVertical: spacing.xxxl,
    gap: spacing.sm,
  },
  emptyText: {
    textAlign: "center",
  },
  emptySubtext: {
    textAlign: "center",
    maxWidth: 280,
  },
  generateButton: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
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
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    marginBottom: spacing.xs,
  },
  generatingHeartbeat: {
    marginRight: spacing.xs,
    backgroundColor: "transparent",
    borderRadius: 0,
  },
  pendingGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  pendingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.md,
    minWidth: 280,
    flex: 1,
  },
  pendingIndicator: {
    minWidth: 80,
  },
  countdowns: {
    flexDirection: "row",
    gap: spacing.sm,
    flex: 1,
    justifyContent: "flex-end",
  },
});
