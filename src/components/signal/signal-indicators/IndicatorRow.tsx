/**
 * Individual indicator row component
 */

import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Text, ProgressBar } from "@wraith/ghost/components";
import { Size, TextAppearance, Brightness } from "@wraith/ghost/enums";
import { spacing, radii } from "../../../styles/tokens";
import { getScoreColor } from "../../../types/signals";
import { AccuracyTag } from "../accuracy-tag";
import { IndicatorTooltip } from "../indicator-tooltip";
import { formatIndicatorValue, getSignalDirection } from "./utils/formatters";
import type { IndicatorRowProps } from "./types";

export const IndicatorRow = React.memo(function IndicatorRow({
  signal,
  index,
}: IndicatorRowProps) {
  const scoreColor = getScoreColor(signal.score);

  const formattedValue = useMemo(
    () => formatIndicatorValue(signal.value, signal.name),
    [signal.value, signal.name]
  );

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
            {getSignalDirection(signal.score)}
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

const styles = StyleSheet.create({
  indicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  indicatorName: {
    flex: 2,
    minWidth: 100,
  },
  indicatorNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
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
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.sm,
  },
  indicatorAccuracy: {
    minWidth: 65,
    alignItems: "flex-end",
  },
});
