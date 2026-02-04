/**
 * TimeframeRow Component
 *
 * Displays a single timeframe row showing result, accuracy, and countdown.
 */

import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Text, Icon } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { Colors } from "@wraith/ghost/tokens";
import { spacing, radii } from "../../../styles/tokens";
import type { TimeframeRowProps } from "./types";
import { getOutcomeIcon } from "./utils/predictionHelpers";
import { formatCountdown } from "./utils/predictionFormatters";

export function TimeframeRow({
  label,
  outcome,
  accuracy,
  targetTime,
}: TimeframeRowProps) {
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

const styles = StyleSheet.create({
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
});
