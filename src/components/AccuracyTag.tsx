/**
 * @file AccuracyTag.tsx
 * @description Badge displaying historical accuracy percentage for signal indicators.
 *
 * ## Features:
 * - Color-coded based on accuracy level (green >= 70%, yellow >= 55%, muted < 55%)
 * - Shows "New" if sample size below minimum threshold
 * - Rounded percentage display
 *
 * ## Props:
 * - `accuracy`: Accuracy percentage (0-100)
 * - `sampleSize`: Number of predictions in sample
 * - `minSamples`: Minimum samples required (default: 10)
 *
 * ## Helper Functions:
 * - `getAccuracyColor(accuracy)`: Returns color based on percentage
 */
import React from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Text } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";

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
  if (accuracy >= 70) return Colors.status.success;
  if (accuracy >= 55) return Colors.status.warning;
  return Colors.text.muted;
}

export function AccuracyTag({
  accuracy,
  sampleSize,
  minSamples = 10,
}: AccuracyTagProps) {
  const { t } = useTranslation("common");

  // Show "New" if not enough samples
  if (sampleSize < minSamples) {
    return (
      <View style={styles.container}>
        <Text size={Size.Small} appearance={TextAppearance.Muted}>
          {t("status.new")}
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
