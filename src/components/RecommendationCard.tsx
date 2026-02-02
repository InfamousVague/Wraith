/**
 * RecommendationCard Component
 *
 * Displays a prominent Buy/Sell/Hold recommendation
 * based on accuracy-weighted indicator analysis.
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, Text, ProgressBar } from "@wraith/ghost/components";
import { Size, TextAppearance, Brightness } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import type { Recommendation } from "../types/signals";
import { getRecommendationColor } from "../types/signals";

type RecommendationCardProps = {
  recommendation: Recommendation | null;
  loading?: boolean;
};

export function RecommendationCard({
  recommendation,
  loading = false,
}: RecommendationCardProps) {
  const themeColors = useThemeColors();

  if (!recommendation && !loading) {
    return null;
  }

  const action = recommendation?.action ?? "hold";
  const actionLabel = action.toUpperCase();
  const color = getRecommendationColor(action);
  const confidence = recommendation?.confidence ?? 0;

  return (
    <Card style={styles.card} loading={loading}>
      <View style={styles.content}>
        {/* Main recommendation */}
        <View style={[styles.actionContainer, { backgroundColor: `${color}15` }]}>
          <Text
            size={Size.TwoXLarge}
            weight="bold"
            style={{ color }}
          >
            {actionLabel}
          </Text>
        </View>

        {/* Confidence bar */}
        <View style={styles.confidenceSection}>
          <View style={styles.confidenceHeader}>
            <Text size={Size.Small} appearance={TextAppearance.Muted}>
              Confidence
            </Text>
            <Text size={Size.Medium} weight="semibold" style={{ color }}>
              {Math.round(confidence)}%
            </Text>
          </View>
          <ProgressBar
            value={confidence}
            max={100}
            size={Size.Medium}
            color={color}
            brightness={Brightness.Base}
          />
        </View>

        {/* Description */}
        {recommendation?.description && (
          <Text
            size={Size.Small}
            appearance={TextAppearance.Muted}
            style={styles.description}
          >
            {recommendation.description}
          </Text>
        )}

        {/* Stats */}
        {recommendation && (
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                Indicators Used
              </Text>
              <Text size={Size.Small} weight="medium">
                {recommendation.indicatorsWithAccuracy}/{recommendation.totalIndicators}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                Avg Accuracy
              </Text>
              <Text size={Size.Small} weight="medium">
                {Math.round(recommendation.averageAccuracy)}%
              </Text>
            </View>
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    minWidth: 200,
  },
  content: {
    padding: 20,
    alignItems: "center",
    gap: 16,
  },
  actionContainer: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  confidenceSection: {
    width: "100%",
    gap: 8,
  },
  confidenceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  description: {
    textAlign: "center",
  },
  stats: {
    flexDirection: "row",
    gap: 24,
    marginTop: 8,
  },
  stat: {
    alignItems: "center",
    gap: 4,
  },
});
