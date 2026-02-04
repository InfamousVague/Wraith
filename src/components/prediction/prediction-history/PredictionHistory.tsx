/**
 * PredictionHistory Component
 *
 * Displays prediction history with filter tabs and overall accuracy.
 * Shows predictions with outcomes using PredictionRow.
 */

import React, { useState, useMemo } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Card, Text } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { Colors } from "@wraith/ghost/tokens";
import { spacing, radii } from "../../../styles/tokens";
import { PredictionRow } from "../prediction-row";
import { filterPredictions, calculateOverallAccuracy } from "./utils/filters";
import { FILTER_TABS, MAX_PREDICTIONS_DISPLAY } from "./constants";
import type { FilterTab, PredictionHistoryProps } from "./types";

export function PredictionHistory({
  predictions,
  accuracies,
  loading,
}: PredictionHistoryProps) {
  const themeColors = useThemeColors();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  const filteredPredictions = useMemo(
    () => filterPredictions(predictions, activeFilter),
    [predictions, activeFilter]
  );

  const overallAccuracy = useMemo(
    () => calculateOverallAccuracy(accuracies),
    [accuracies]
  );

  if (loading) {
    return (
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text size={Size.Medium} weight="semibold">
            PREDICTION HISTORY
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text size={Size.Small} appearance={TextAppearance.Muted}>
            Loading predictions...
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      {/* Header with tabs */}
      <View style={styles.header}>
        <Text size={Size.Medium} weight="semibold">
          PREDICTION HISTORY
        </Text>

        <View style={styles.tabs}>
          {FILTER_TABS.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveFilter(tab.key)}
              style={[
                styles.tab,
                activeFilter === tab.key && {
                  backgroundColor: themeColors.background.secondary,
                },
              ]}
            >
              <Text
                size={Size.ExtraSmall}
                weight={activeFilter === tab.key ? "medium" : "regular"}
                appearance={activeFilter === tab.key ? TextAppearance.Default : TextAppearance.Muted}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: themeColors.border.subtle }]} />

      {/* Predictions list */}
      <View style={styles.listContainer}>
        {filteredPredictions.length > 0 ? (
          filteredPredictions.slice(0, MAX_PREDICTIONS_DISPLAY).map((prediction) => (
            <PredictionRow key={prediction.id} prediction={prediction} />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text size={Size.Small} appearance={TextAppearance.Muted}>
              No {activeFilter === "all" ? "" : activeFilter} predictions yet
            </Text>
          </View>
        )}
      </View>

      {/* Overall accuracy footer */}
      {overallAccuracy && (
        <>
          <View style={[styles.divider, { backgroundColor: themeColors.border.subtle }]} />
          <View style={styles.footer}>
            <Text size={Size.Small} appearance={TextAppearance.Muted}>
              Overall Accuracy (1h):
            </Text>
            <Text
              size={Size.Small}
              weight="semibold"
              style={{
                color: overallAccuracy.percentage >= 50 ? Colors.status.success : Colors.status.danger,
              }}
            >
              {overallAccuracy.percentage.toFixed(1)}%
            </Text>
            <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
              ({overallAccuracy.correct}/{overallAccuracy.total} correct)
            </Text>
          </View>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
  },
  tabs: {
    flexDirection: "row",
    gap: spacing.xxs,
  },
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
  },
  divider: {
    height: 1,
  },
  listContainer: {
    minHeight: 100,
    maxHeight: 400,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: "center",
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: "center",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    padding: spacing.md,
  },
});
