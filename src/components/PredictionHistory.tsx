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
import { PredictionRow } from "./PredictionRow";
import type { SignalPrediction, SignalAccuracy } from "../types/signals";

type FilterTab = "all" | "validated" | "pending";

type Props = {
  predictions: SignalPrediction[];
  accuracies: SignalAccuracy[];
  loading?: boolean;
};

export function PredictionHistory({ predictions, accuracies, loading }: Props) {
  const themeColors = useThemeColors();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  // Filter predictions based on active tab
  const filteredPredictions = useMemo(() => {
    switch (activeFilter) {
      case "validated":
        return predictions.filter(
          (p) => p.validated || p.outcome5m || p.outcome1h || p.outcome4h || p.outcome24h
        );
      case "pending":
        return predictions.filter(
          (p) => !p.validated && !p.outcome5m && !p.outcome1h && !p.outcome4h && !p.outcome24h
        );
      default:
        return predictions;
    }
  }, [predictions, activeFilter]);

  // Calculate overall accuracy from accuracies array
  const overallAccuracy = useMemo(() => {
    // Use 1h timeframe as the primary accuracy metric
    const hourlyAccuracies = accuracies.filter((a) => a.timeframe === "1h");
    if (hourlyAccuracies.length === 0) return null;

    let totalCorrect = 0;
    let totalIncorrect = 0;

    for (const acc of hourlyAccuracies) {
      totalCorrect += acc.correctPredictions;
      totalIncorrect += acc.incorrectPredictions;
    }

    const total = totalCorrect + totalIncorrect;
    if (total === 0) return null;

    return {
      percentage: (totalCorrect / total) * 100,
      correct: totalCorrect,
      total,
    };
  }, [accuracies]);

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "validated", label: "Validated" },
    { key: "pending", label: "Pending" },
  ];

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
          {tabs.map((tab) => (
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
          filteredPredictions.slice(0, 20).map((prediction) => (
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
    padding: 16,
  },
  tabs: {
    flexDirection: "row",
    gap: 4,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  divider: {
    height: 1,
  },
  listContainer: {
    minHeight: 100,
    maxHeight: 400,
  },
  emptyContainer: {
    padding: 24,
    alignItems: "center",
  },
  loadingContainer: {
    padding: 24,
    alignItems: "center",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 16,
  },
});
