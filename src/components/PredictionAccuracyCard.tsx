/**
 * PredictionAccuracyCard Component
 *
 * Displays recommendation, prediction accuracy statistics, and recent predictions
 * with compact indicator cards showing green/red outcomes.
 */

import React, { useMemo, useState, useEffect } from "react";
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
import Svg, { Path } from "react-native-svg";
import type { SignalAccuracy, SignalPrediction, Recommendation, PredictionOutcome } from "../types/signals";
import { getRecommendationColor } from "../types/signals";
import { CountdownTimer } from "./CountdownTimer";
import { HeartbeatChart } from "./HeartbeatChart";
import { HintIndicator } from "./HintIndicator";
import { IndicatorTooltip } from "./IndicatorTooltip";
import { useBreakpoint } from "../hooks/useBreakpoint";

type PredictionAccuracyCardProps = {
  accuracies: SignalAccuracy[];
  predictions: SignalPrediction[];
  pendingPredictions?: SignalPrediction[];
  recommendation?: Recommendation | null;
  loading?: boolean;
  generating?: boolean;
  onGeneratePredictions?: () => void;
};

/**
 * Get color based on accuracy percentage.
 */
function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 70) return Colors.status.success;
  if (accuracy >= 55) return Colors.status.warning;
  return Colors.status.danger;
}

/** Get color for outcome */
function getOutcomeColor(outcome: PredictionOutcome | undefined | null): string | null {
  if (!outcome) return null;
  switch (outcome) {
    case "correct": return Colors.status.success;
    case "incorrect": return Colors.status.danger;
    case "neutral": return Colors.text.muted;
    default: return null;
  }
}

/** Get direction color */
function getDirectionColor(direction: string): string {
  switch (direction) {
    case "strong_buy": return Colors.status.success;
    case "buy": return Colors.status.successDim;
    case "sell": return Colors.status.dangerDim;
    case "strong_sell": return Colors.status.danger;
    default: return Colors.text.muted;
  }
}

/** Get direction label */
function getDirectionLabel(direction: string): string {
  switch (direction) {
    case "strong_buy":
    case "buy":
      return "BUY";
    case "sell":
    case "strong_sell":
      return "SELL";
    default:
      return "HOLD";
  }
}

/** Format relative time compactly */
function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return "now";
}

/** Check if prediction has any validated outcomes */
function hasValidatedOutcome(prediction: SignalPrediction): boolean {
  return !!(prediction.outcome5m || prediction.outcome1h || prediction.outcome4h);
}

/** Half-circle gauge component */
function HalfCircleGauge({
  value,
  max = 100,
  size = 120,
  strokeWidth = 10,
  color,
  label,
  valueLabel,
}: {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  label: string;
  valueLabel: string;
}) {
  const themeColors = useThemeColors();
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius;
  const percentage = Math.min(Math.max(value / max, 0), 1);
  const strokeDashoffset = circumference * (1 - percentage);

  // Center point
  const cx = size / 2;
  const cy = size / 2;

  // Create arc path (semicircle from left to right)
  const startX = cx - radius;
  const startY = cy;
  const endX = cx + radius;
  const endY = cy;

  const backgroundPath = `M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`;

  return (
    <View style={styles.gaugeContainer}>
      <Svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2 + 10}`}>
        {/* Background arc */}
        <Path
          d={backgroundPath}
          fill="none"
          stroke={themeColors.border.subtle}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Value arc */}
        <Path
          d={backgroundPath}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </Svg>
      <View style={styles.gaugeValueContainer}>
        <Text size={Size.ExtraLarge} weight="bold" style={{ color }}>
          {valueLabel}
        </Text>
      </View>
      <Text size={Size.Small} appearance={TextAppearance.Muted} style={styles.gaugeLabel}>
        {label}
      </Text>
    </View>
  );
}

/** Single prediction row in compact format */
function CompactPredictionRow({
  prediction,
  opacity,
}: {
  prediction: SignalPrediction;
  opacity: number;
}) {
  const themeColors = useThemeColors();
  const directionColor = getDirectionColor(prediction.direction);

  const color5m = getOutcomeColor(prediction.outcome5m);
  const color1h = getOutcomeColor(prediction.outcome1h);
  const color4h = getOutcomeColor(prediction.outcome4h);

  return (
    <View style={[styles.compactRow, { opacity }]}>
      {/* Direction */}
      <Text
        size={Size.TwoXSmall}
        weight="bold"
        style={[styles.direction, { color: directionColor }]}
      >
        {getDirectionLabel(prediction.direction)}
      </Text>

      {/* Timeframe outcomes */}
      <View style={styles.timeframes}>
        <Text
          size={Size.TwoXSmall}
          weight="semibold"
          style={[
            styles.timeframe,
            { color: color5m || themeColors.text.muted, opacity: color5m ? 1 : 0.3 },
          ]}
        >
          5m
        </Text>
        <Text
          size={Size.TwoXSmall}
          weight="semibold"
          style={[
            styles.timeframe,
            { color: color1h || themeColors.text.muted, opacity: color1h ? 1 : 0.3 },
          ]}
        >
          1h
        </Text>
        <Text
          size={Size.TwoXSmall}
          weight="semibold"
          style={[
            styles.timeframe,
            { color: color4h || themeColors.text.muted, opacity: color4h ? 1 : 0.3 },
          ]}
        >
          4h
        </Text>
      </View>

      {/* Time ago */}
      <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted} style={styles.timeAgo}>
        {formatTimeAgo(prediction.timestamp)}
      </Text>
    </View>
  );
}

/** Get icon for outcome */
function getOutcomeIcon(outcome: PredictionOutcome | undefined | null): { name: string; color: string } {
  if (!outcome) return { name: "clock", color: Colors.text.muted };
  switch (outcome) {
    case "correct": return { name: "check", color: Colors.status.success };
    case "incorrect": return { name: "x", color: Colors.status.danger };
    case "neutral": return { name: "minus", color: Colors.text.muted };
    default: return { name: "clock", color: Colors.text.muted };
  }
}

/** Format countdown remaining */
function formatCountdown(ms: number): string {
  if (ms <= 0) return "Ready";
  const totalSec = Math.floor(ms / 1000);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}:${secs.toString().padStart(2, "0")}`;
  return `0:${secs.toString().padStart(2, "0")}`;
}

/** Single timeframe row showing result, accuracy, and countdown */
function TimeframeRow({
  label,
  outcome,
  accuracy,
  targetTime,
}: {
  label: string;
  outcome: PredictionOutcome | undefined | null;
  accuracy: number | null;
  targetTime: number | null;
}) {
  const themeColors = useThemeColors();
  const icon = getOutcomeIcon(outcome);
  const [remaining, setRemaining] = useState(() => targetTime ? targetTime - Date.now() : 0);

  useEffect(() => {
    if (!targetTime) return;
    setRemaining(targetTime - Date.now());
    const interval = setInterval(() => {
      setRemaining(targetTime - Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  const showCountdown = targetTime && remaining > 0 && !outcome;
  const isReady = targetTime && remaining <= 0 && !outcome;

  return (
    <View style={styles.timeframeRow}>
      {/* Timeframe label */}
      <View style={styles.timeframeLabelContainer}>
        <Text size={Size.TwoXSmall} weight="semibold" style={{ color: themeColors.text.muted }}>
          {label}
        </Text>
      </View>

      {/* Outcome icon */}
      <View style={[styles.outcomeIconSmall, { backgroundColor: `${icon.color}15` }]}>
        <Icon name={icon.name as any} size={Size.TwoXSmall} color={icon.color} />
      </View>

      {/* Accuracy */}
      <View style={styles.timeframeAccuracy}>
        {accuracy !== null ? (
          <Text
            size={Size.TwoXSmall}
            weight="medium"
            style={{ color: accuracy >= 50 ? Colors.status.success : Colors.status.danger }}
          >
            {accuracy.toFixed(0)}%
          </Text>
        ) : (
          <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>—</Text>
        )}
      </View>

      {/* Countdown or status */}
      <View style={styles.timeframeCountdown}>
        {showCountdown ? (
          <View style={styles.countdownBadge}>
            <Icon name="clock" size={Size.TwoXSmall} color={Colors.data.blue} />
            <Text size={Size.TwoXSmall} style={{ color: Colors.data.blue }}>
              {formatCountdown(remaining)}
            </Text>
          </View>
        ) : isReady ? (
          <View style={[styles.countdownBadge, { backgroundColor: `${Colors.status.success}15` }]}>
            <Icon name="zap" size={Size.TwoXSmall} color={Colors.status.success} />
            <Text size={Size.TwoXSmall} style={{ color: Colors.status.success }}>
              Ready
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

/** Unified indicator card showing accuracy and all timeframes */
function IndicatorGroup({
  indicator,
  predictions,
  pendingPrediction,
  accuracyByTimeframe,
  overallAccuracy,
  index,
}: {
  indicator: string;
  predictions: SignalPrediction[];
  pendingPrediction?: SignalPrediction;
  accuracyByTimeframe: Record<string, number | null>;
  overallAccuracy: number | null;
  index: number;
}) {
  const themeColors = useThemeColors();

  // Get latest prediction for each timeframe outcome
  const latestPrediction = predictions[0];
  const outcome5m = latestPrediction?.outcome5m;
  const outcome1h = latestPrediction?.outcome1h;
  const outcome4h = latestPrediction?.outcome4h;

  // Calculate target times for pending predictions
  const pendingTimestamp = pendingPrediction?.timestamp ?? latestPrediction?.timestamp;
  const target5m = pendingTimestamp && !outcome5m ? pendingTimestamp + 300_000 : null;
  const target1h = pendingTimestamp && !outcome1h ? pendingTimestamp + 3_600_000 : null;
  const target4h = pendingTimestamp && !outcome4h ? pendingTimestamp + 14_400_000 : null;

  return (
    <View style={[styles.indicatorGroup, { borderColor: themeColors.border.subtle }]}>
      {/* Header: Indicator name + overall accuracy */}
      <View style={styles.indicatorHeader}>
        <View style={styles.indicatorNameRow}>
          <Text size={Size.Small} weight="semibold">
            {indicator}
          </Text>
          <IndicatorTooltip
            indicatorName={indicator}
            priority={20 + index}
          />
        </View>
        {overallAccuracy !== null && (
          <View style={[styles.accuracyBadge, { backgroundColor: `${overallAccuracy >= 50 ? Colors.status.success : Colors.status.danger}15` }]}>
            <Text
              size={Size.TwoXSmall}
              weight="bold"
              style={{ color: overallAccuracy >= 50 ? Colors.status.success : Colors.status.danger }}
            >
              {overallAccuracy.toFixed(0)}%
            </Text>
          </View>
        )}
      </View>

      {/* Direction badge if pending */}
      {pendingPrediction && (
        <View style={styles.directionRow}>
          <Icon name="trending-up" size={Size.TwoXSmall} color={getDirectionColor(pendingPrediction.direction)} />
          <Text
            size={Size.TwoXSmall}
            weight="bold"
            style={{ color: getDirectionColor(pendingPrediction.direction) }}
          >
            {getDirectionLabel(pendingPrediction.direction)}
          </Text>
          <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
            {formatTimeAgo(pendingPrediction.timestamp)}
          </Text>
        </View>
      )}

      {/* Timeframe rows */}
      <View style={styles.timeframesList}>
        <TimeframeRow
          label="5m"
          outcome={outcome5m}
          accuracy={accuracyByTimeframe["5m"]}
          targetTime={target5m}
        />
        <TimeframeRow
          label="1h"
          outcome={outcome1h}
          accuracy={accuracyByTimeframe["1h"]}
          targetTime={target1h}
        />
        <TimeframeRow
          label="4h"
          outcome={outcome4h}
          accuracy={accuracyByTimeframe["4h"]}
          targetTime={target4h}
        />
      </View>
    </View>
  );
}

/** Pending prediction row with countdown timers */
function PendingPredictionRow({
  prediction,
}: {
  prediction: SignalPrediction;
}) {
  const themeColors = useThemeColors();
  const directionColor = getDirectionColor(prediction.direction);

  return (
    <View style={[styles.pendingRow, { borderColor: themeColors.border.subtle }]}>
      {/* Indicator name */}
      <Text size={Size.Small} weight="semibold" style={styles.pendingIndicator}>
        {prediction.indicator}
      </Text>

      {/* Direction */}
      <Text
        size={Size.TwoXSmall}
        weight="bold"
        style={{ color: directionColor, minWidth: 32 }}
      >
        {getDirectionLabel(prediction.direction)}
      </Text>

      {/* Countdown timers */}
      <View style={styles.countdowns}>
        {!prediction.outcome5m && (
          <CountdownTimer
            targetTime={prediction.timestamp + 300_000}
            label="5m"
          />
        )}
        {!prediction.outcome1h && (
          <CountdownTimer
            targetTime={prediction.timestamp + 3_600_000}
            label="1h"
          />
        )}
        {!prediction.outcome4h && (
          <CountdownTimer
            targetTime={prediction.timestamp + 14_400_000}
            label="4h"
          />
        )}
      </View>
    </View>
  );
}

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
