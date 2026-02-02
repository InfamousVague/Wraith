/**
 * AccuracyTag Component
 *
 * Displays historical accuracy percentage for a signal indicator.
 * Color coded based on accuracy level.
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";

type AccuracyTagProps = {
  /** Accuracy percentage (0-100) */
  accuracy: number;
  /** Number of predictions in sample */
  sampleSize: number;
  /** Minimum samples required to show accuracy (default: 10) */
  minSamples?: number;
};

/**
 * Get color based on accuracy percentage.
 * >= 70%: Green (good)
 * >= 55%: Yellow (fair)
 * < 55%: Muted (poor)
 */
function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 70) return "#22C55E"; // Green
  if (accuracy >= 55) return "#EAB308"; // Yellow
  return "#6B7280"; // Muted gray
}

export function AccuracyTag({
  accuracy,
  sampleSize,
  minSamples = 10,
}: AccuracyTagProps) {
  // Show "New" if not enough samples
  if (sampleSize < minSamples) {
    return (
      <View style={styles.container}>
        <Text size={Size.Small} appearance={TextAppearance.Muted}>
          New
        </Text>
      </View>
    );
  }

  const color = getAccuracyColor(accuracy);

  return (
    <View style={[styles.container, { backgroundColor: `${color}15` }]}>
      <Text
        size={Size.Small}
        weight="medium"
        style={{ color }}
      >
        {Math.round(accuracy)}%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 48,
    alignItems: "center",
  },
});
