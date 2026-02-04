/**
 * CategoryRow Component - Individual category score row with progress bar
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, ProgressBar } from "@wraith/ghost/components";
import { Size, TextAppearance, Brightness } from "@wraith/ghost/enums";
import { spacing } from "../../../styles/tokens";
import { getScoreColor } from "../../../types/signals";
import type { CategoryScore } from "./types";

export const CategoryRow = React.memo(function CategoryRow({
  label,
  score,
  color,
}: CategoryScore) {
  // Normalize score from -100..+100 to 0..100 for progress bar
  const normalizedValue = (score + 100) / 2;

  return (
    <View style={styles.categoryRow}>
      <View style={styles.categoryLabel}>
        <Text size={Size.Small} appearance={TextAppearance.Muted}>
          {label}
        </Text>
      </View>
      <View style={styles.categoryBar}>
        <ProgressBar
          value={normalizedValue}
          max={100}
          size={Size.Medium}
          color={color}
          brightness={Brightness.Soft}
          style={styles.progressBar}
        />
      </View>
      <View style={styles.categoryScore}>
        <Text
          size={Size.Small}
          weight="semibold"
          style={{ color: getScoreColor(score) }}
        >
          {score > 0 ? "+" : ""}
          {score}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  categoryLabel: {
    width: 80,
  },
  categoryBar: {
    flex: 1,
  },
  progressBar: {
    width: "100%",
  },
  categoryScore: {
    width: 50,
    alignItems: "flex-end",
  },
});
