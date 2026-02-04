/**
 * IndicatorGroup Component
 *
 * Unified indicator card showing accuracy and all timeframes.
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Icon } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { Colors } from "@wraith/ghost/tokens";
import { spacing, radii } from "../../../styles/tokens";
import type { IndicatorGroupProps } from "./types";
import { TimeframeRow } from "./TimeframeRow";
import { IndicatorTooltip } from "../../signal/indicator-tooltip";
import { getDirectionColor, getDirectionLabel } from "./utils/predictionHelpers";
import { formatTimeAgo } from "./utils/predictionFormatters";

export function IndicatorGroup({
  indicator,
  predictions,
  pendingPrediction,
  accuracyByTimeframe,
  overallAccuracy,
  index,
}: IndicatorGroupProps) {
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

const styles = StyleSheet.create({
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
});
