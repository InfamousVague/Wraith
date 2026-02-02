/**
 * PredictionAccuracyCard Component
 *
 * Displays recommendation, prediction accuracy statistics, and recent predictions.
 * Combines the Buy/Sell/Hold recommendation with historical accuracy tracking.
 */

import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import {
  Card,
  Text,
  ProgressBar,
  AnimatedNumber,
  Icon,
} from "@wraith/ghost/components";
import { Size, TextAppearance, Brightness } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import type { SignalAccuracy, SignalPrediction, Recommendation } from "../types/signals";
import { getRecommendationColor } from "../types/signals";

type PredictionAccuracyCardProps = {
  accuracies: SignalAccuracy[];
  predictions: SignalPrediction[];
  recommendation?: Recommendation | null;
  loading?: boolean;
};

/**
 * Get color based on accuracy percentage.
 */
function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 70) return "#22C55E"; // Green
  if (accuracy >= 55) return "#EAB308"; // Yellow
  return "#6B7280"; // Gray
}

/**
 * Get icon for prediction outcome.
 */
function getOutcomeIcon(
  outcome: "correct" | "incorrect" | "neutral" | undefined
): { name: string; color: string } {
  switch (outcome) {
    case "correct":
      return { name: "check-circle", color: "#22C55E" };
    case "incorrect":
      return { name: "x-circle", color: "#EF4444" };
    case "neutral":
      return { name: "minus-circle", color: "#6B7280" };
    default:
      return { name: "clock", color: "#6B7280" };
  }
}

type AccuracyRowProps = {
  accuracy: SignalAccuracy;
};

const AccuracyRow = React.memo(function AccuracyRow({
  accuracy,
}: AccuracyRowProps) {
  const color = getAccuracyColor(accuracy.accuracyPct);

  // Interpretation for this indicator's accuracy
  const interpretation = accuracy.accuracyPct >= 70
    ? "Reliable"
    : accuracy.accuracyPct >= 55
    ? "Moderate"
    : "Low confidence";

  return (
    <View style={styles.accuracyRow}>
      <View style={styles.accuracyLabel}>
        <Text size={Size.Medium} weight="medium">
          {accuracy.indicator}
        </Text>
        <Text size={Size.Small} appearance={TextAppearance.Muted}>
          {accuracy.totalPredictions} predictions - {interpretation}
        </Text>
      </View>
      <View style={styles.accuracyValue}>
        <ProgressBar
          value={accuracy.accuracyPct}
          max={100}
          size={Size.Large}
          color={color}
          brightness={Brightness.Soft}
          style={styles.accuracyBar}
        />
        <Text size={Size.Large} weight="bold" style={{ color }}>
          {Math.round(accuracy.accuracyPct)}%
        </Text>
      </View>
    </View>
  );
});

type PredictionRowProps = {
  prediction: SignalPrediction;
};

const PredictionRow = React.memo(function PredictionRow({
  prediction,
}: PredictionRowProps) {
  // Prefer showing fastest validation (5m) if available, then 1h, then 4h
  const outcome = prediction.outcome5m ?? prediction.outcome1h ?? prediction.outcome4h;
  const timeframeLabel = prediction.outcome5m
    ? "5m"
    : prediction.outcome1h
    ? "1h"
    : prediction.outcome4h
    ? "4h"
    : "";
  const icon = getOutcomeIcon(outcome);
  const timeAgo = useMemo(() => {
    const ms = Date.now() - prediction.timestamp;
    const minutes = Math.floor(ms / 60000);
    if (minutes < 1) return "< 1m ago";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(ms / 3600000);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }, [prediction.timestamp]);

  // Outcome description with timeframe context
  const outcomeText = outcome === "correct"
    ? `Correct after ${timeframeLabel}`
    : outcome === "incorrect"
    ? `Wrong after ${timeframeLabel}`
    : outcome === "neutral"
    ? `No move after ${timeframeLabel}`
    : "Pending (5m, 1h, 4h)";

  return (
    <View style={styles.predictionRow}>
      <Icon name={icon.name as any} size={Size.Large} color={icon.color} />
      <View style={styles.predictionInfo}>
        <Text size={Size.Medium} weight="medium">
          {prediction.indicator}
        </Text>
        <Text size={Size.Small} appearance={TextAppearance.Muted}>
          {prediction.direction.replace("_", " ")} • {timeAgo}
        </Text>
        <Text size={Size.ExtraSmall} style={{ color: icon.color }}>
          {outcomeText}
        </Text>
      </View>
      <View style={styles.predictionOutcomes}>
        {/* Mini outcome indicators for each timeframe */}
        <View style={styles.outcomeRow}>
          <OutcomeBadge label="5m" outcome={prediction.outcome5m} />
          <OutcomeBadge label="1h" outcome={prediction.outcome1h} />
          <OutcomeBadge label="4h" outcome={prediction.outcome4h} />
        </View>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
          ${prediction.priceAtPrediction.toLocaleString(undefined, {
            maximumFractionDigits: 2,
          })}
        </Text>
      </View>
    </View>
  );
});

type OutcomeBadgeProps = {
  label: string;
  outcome?: "correct" | "incorrect" | "neutral";
};

const OutcomeBadge = React.memo(function OutcomeBadge({
  label,
  outcome,
}: OutcomeBadgeProps) {
  const themeColors = useThemeColors();
  const bgColor = outcome === "correct"
    ? "rgba(34, 197, 94, 0.2)"
    : outcome === "incorrect"
    ? "rgba(239, 68, 68, 0.2)"
    : outcome === "neutral"
    ? "rgba(107, 114, 128, 0.2)"
    : "rgba(107, 114, 128, 0.1)";
  const textColor = outcome === "correct"
    ? "#22C55E"
    : outcome === "incorrect"
    ? "#EF4444"
    : themeColors.text.muted;

  return (
    <View style={[styles.outcomeBadge, { backgroundColor: bgColor }]}>
      <Text size={Size.ExtraSmall} style={{ color: textColor }}>
        {label}
      </Text>
    </View>
  );
});

export function PredictionAccuracyCard({
  accuracies,
  predictions,
  recommendation,
  loading = false,
}: PredictionAccuracyCardProps) {
  const themeColors = useThemeColors();

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

  // Get top 5 accuracy entries sorted by prediction count
  const topAccuracies = useMemo(() => {
    return [...accuracies]
      .filter((a) => a.totalPredictions >= 5)
      .sort((a, b) => b.totalPredictions - a.totalPredictions)
      .slice(0, 5);
  }, [accuracies]);

  // Get recent predictions (last 5)
  const recentPredictions = useMemo(() => {
    return [...predictions]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);
  }, [predictions]);

  const overallColor = getAccuracyColor(overallAccuracy);

  // Recommendation display
  const action = recommendation?.action ?? "hold";
  const actionLabel = action.toUpperCase();
  const actionColor = getRecommendationColor(action);
  const confidence = recommendation?.confidence ?? 0;

  // Generate interpretation text based on overall accuracy
  const interpretationText = overallAccuracy >= 70
    ? "Signals have been highly reliable - use with confidence"
    : overallAccuracy >= 55
    ? "Moderate accuracy - combine with other analysis methods"
    : totalPredictions < 10
    ? "Not enough data yet - accuracy will improve over time"
    : "Lower accuracy - use signals as one of many inputs";

  return (
    <Card style={styles.card} loading={loading}>
      <View style={styles.content}>
        {/* Header with Recommendation Badge */}
        <View style={styles.headerRow}>
          {/* Recommendation Badge + Confidence */}
          <View style={styles.recommendationSection}>
            <View style={[styles.actionBadge, { backgroundColor: `${actionColor}15` }]}>
              <Text
                size={Size.TwoXLarge}
                weight="bold"
                style={{ color: actionColor }}
              >
                {actionLabel}
              </Text>
            </View>
            <View style={styles.confidenceSection}>
              <View style={styles.confidenceHeader}>
                <Text size={Size.Small} appearance={TextAppearance.Muted}>
                  Confidence
                </Text>
                <Text size={Size.Medium} weight="semibold" style={{ color: actionColor }}>
                  {Math.round(confidence)}%
                </Text>
              </View>
              <ProgressBar
                value={confidence}
                max={100}
                size={Size.Medium}
                color={actionColor}
                brightness={Brightness.Base}
              />
              {recommendation?.description && (
                <Text
                  size={Size.ExtraSmall}
                  appearance={TextAppearance.Muted}
                  style={styles.recommendationDesc}
                >
                  {recommendation.description}
                </Text>
              )}
            </View>
          </View>

          {/* Overall Accuracy Stats */}
          <View style={styles.accuracyStats}>
            <View style={styles.statItem}>
              <AnimatedNumber
                value={overallAccuracy}
                decimals={1}
                suffix="%"
                size={Size.ExtraLarge}
                weight="bold"
                style={{ color: overallColor }}
                animate
                animationDuration={300}
              />
              <Text size={Size.Small} appearance={TextAppearance.Muted}>
                Overall Accuracy
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text size={Size.ExtraLarge} weight="semibold">
                {totalPredictions.toLocaleString()}
              </Text>
              <Text size={Size.Small} appearance={TextAppearance.Muted}>
                Total Predictions
              </Text>
            </View>
          </View>
        </View>

        {/* Interpretation */}
        <Text
          size={Size.Small}
          appearance={TextAppearance.Muted}
          style={styles.interpretation}
        >
          {interpretationText}
        </Text>

        {topAccuracies.length > 0 && (
          <>
            <View
              style={[
                styles.divider,
                { backgroundColor: themeColors.border.subtle },
              ]}
            />

            <View style={styles.section}>
              <Text
                size={Size.Medium}
                appearance={TextAppearance.Muted}
                style={styles.sectionLabel}
              >
                TOP PERFORMING INDICATORS
              </Text>
              <Text
                size={Size.Small}
                appearance={TextAppearance.Muted}
                style={styles.sectionHint}
              >
                Indicators ranked by prediction count and accuracy
              </Text>
              <View style={styles.accuracyList}>
                {topAccuracies.map((accuracy, index) => (
                  <AccuracyRow
                    key={`${accuracy.indicator}-${accuracy.timeframe}`}
                    accuracy={accuracy}
                  />
                ))}
              </View>
            </View>
          </>
        )}

        {recentPredictions.length > 0 && (
          <>
            <View
              style={[
                styles.divider,
                { backgroundColor: themeColors.border.subtle },
              ]}
            />

            <View style={styles.section}>
              <Text
                size={Size.Medium}
                appearance={TextAppearance.Muted}
                style={styles.sectionLabel}
              >
                RECENT PREDICTIONS
              </Text>
              <Text
                size={Size.Small}
                appearance={TextAppearance.Muted}
                style={styles.sectionHint}
              >
                Latest signal predictions and their outcomes
              </Text>
              <View style={styles.predictionList}>
                {recentPredictions.map((prediction) => (
                  <PredictionRow key={prediction.id} prediction={prediction} />
                ))}
              </View>
            </View>
          </>
        )}

        {topAccuracies.length === 0 && recentPredictions.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="clock" size={Size.TwoXLarge} color={themeColors.text.muted} />
            <Text
              size={Size.Large}
              appearance={TextAppearance.Muted}
              style={styles.emptyText}
            >
              Tracking Predictions
            </Text>
            <Text
              size={Size.Medium}
              appearance={TextAppearance.Muted}
              style={styles.emptySubtext}
            >
              As signals are generated, we'll track their accuracy over time to show which indicators work best for this asset
            </Text>
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
  content: {
    padding: 24,
  },
  headerRow: {
    flexDirection: "row",
    gap: 32,
  },
  recommendationSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  actionBadge: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  confidenceSection: {
    minWidth: 160,
    gap: 6,
  },
  confidenceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recommendationDesc: {
    marginTop: 4,
  },
  accuracyStats: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 32,
  },
  statItem: {
    alignItems: "center",
    gap: 4,
  },
  divider: {
    height: 1,
    marginVertical: 20,
  },
  interpretation: {
    marginTop: 16,
    marginBottom: 4,
  },
  section: {
    gap: 12,
  },
  sectionLabel: {
    marginBottom: 4,
  },
  sectionHint: {
    marginBottom: 8,
  },
  accuracyList: {
    gap: 18,
  },
  accuracyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  accuracyLabel: {
    flex: 1,
    minWidth: 140,
  },
  accuracyValue: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  accuracyBar: {
    flex: 1,
  },
  predictionList: {
    gap: 16,
  },
  predictionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  predictionInfo: {
    flex: 1,
    gap: 2,
  },
  predictionOutcomes: {
    alignItems: "flex-end",
    gap: 4,
  },
  outcomeRow: {
    flexDirection: "row",
    gap: 4,
  },
  outcomeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
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
});
