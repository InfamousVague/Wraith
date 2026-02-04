/**
 * LoadingCard Component - Skeleton placeholder for chart cards
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, Skeleton } from "@wraith/ghost/components";
import { spacing } from "../../../styles/tokens";
import type { LoadingCardProps } from "./types";
import { getChartHeight, isCompactSize } from "./utils/chartHelpers";

export function LoadingCard({ cardSize, themeColors }: LoadingCardProps) {
  const chartHeight = getChartHeight(cardSize);
  const compact = isCompactSize(cardSize);

  return (
    <View style={styles.cardWrapper}>
      <Card style={styles.chartCard}>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.assetInfo}>
              <Skeleton width={compact ? 32 : 40} height={compact ? 32 : 40} borderRadius={20} />
              <View style={styles.assetName}>
                <Skeleton width={50} height={16} />
                {!compact && <Skeleton width={70} height={14} style={{ marginTop: 4 }} />}
              </View>
            </View>
            <View style={styles.priceInfo}>
              <Skeleton width={60} height={16} />
              <Skeleton width={45} height={14} style={{ marginTop: 4 }} />
            </View>
          </View>
          <View style={[styles.chartArea, { minHeight: chartHeight }]}>
            <Skeleton width="100%" height={chartHeight} />
          </View>
          {!compact && (
            <View style={[styles.cardFooter, { borderTopColor: themeColors.border.subtle }]}>
              <Skeleton width={60} height={14} />
              <Skeleton width={50} height={14} />
            </View>
          )}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    // Uses CSS grid or flex basis from parent
  },
  chartCard: {
    flex: 1,
    padding: spacing.none,
    overflow: "hidden",
  },
  cardContent: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  assetInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flex: 1,
  },
  assetName: {
    gap: 1,
    flex: 1,
  },
  priceInfo: {
    alignItems: "flex-end",
    gap: 1,
  },
  chartArea: {
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: spacing.xs,
    borderTopWidth: 1,
  },
});
