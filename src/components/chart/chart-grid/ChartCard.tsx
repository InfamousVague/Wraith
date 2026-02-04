/**
 * ChartCard Component - Individual asset card with mini chart
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Link } from "react-router-dom";
import { Card, Text, Avatar, PercentChange, Currency } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { Typography } from "@wraith/ghost/tokens";
import { spacing } from "../../../styles/tokens";
import { MiniChart } from "../mini-chart";
import { HighlightedText } from "../../ui/highlighted-text";
import type { ChartCardProps } from "./types";
import { getChartHeight, isCompactSize } from "./utils/chartHelpers";

export const ChartCard = React.memo(function ChartCard({ asset, cardSize, themeColors, searchQuery, volLabel }: ChartCardProps) {
  const isPositive = asset.change24h >= 0;
  const chartHeight = getChartHeight(cardSize);
  const compact = isCompactSize(cardSize);

  return (
    <View style={styles.cardWrapper}>
      <Link to={`/asset/${asset.id}`} style={{ textDecoration: "none", flex: 1 }}>
        <Card style={styles.chartCard}>
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={styles.assetInfo}>
                <Avatar
                  uri={asset.image}
                  initials={asset.symbol.slice(0, 2)}
                  size={compact ? Size.Small : Size.Medium}
                />
                <View style={styles.assetName}>
                  <HighlightedText
                    text={asset.symbol}
                    highlight={searchQuery}
                    style={{
                      fontSize: compact ? 14 : 16,
                      fontWeight: Typography.fontWeight.semibold as "600",
                      color: themeColors.text.primary,
                    }}
                  />
                  {!compact && (
                    <HighlightedText
                      text={asset.name}
                      highlight={searchQuery}
                      style={{
                        fontSize: 14,
                        color: themeColors.text.muted,
                      }}
                    />
                  )}
                </View>
              </View>
              <View style={styles.priceInfo}>
                <Currency
                  value={asset.price}
                  size={compact ? Size.Small : Size.Medium}
                  weight="semibold"
                  decimals={asset.price < 1 ? 4 : 2}
                />
                <PercentChange
                  value={asset.change24h}
                  size={Size.Medium}
                />
              </View>
            </View>

            <View style={[styles.chartArea, { minHeight: chartHeight }]}>
              {asset.sparkline.length >= 2 ? (
                <MiniChart
                  data={asset.sparkline}
                  isPositive={isPositive}
                  width="100%"
                  height={chartHeight}
                />
              ) : (
                <View style={[styles.chartPlaceholder, { backgroundColor: themeColors.background.raised }]} />
              )}
            </View>

            {!compact && (
              <View style={[styles.cardFooter, { borderTopColor: themeColors.border.subtle }]}>
                <View style={styles.stat}>
                  <Text size={Size.Medium} appearance={TextAppearance.Muted}>
                    {volLabel}
                  </Text>
                  <Currency
                    value={asset.volume24h}
                    size={Size.Medium}
                    compact
                    decimals={1}
                  />
                </View>
                <View style={styles.stat}>
                  <Text size={Size.Medium} appearance={TextAppearance.Muted}>
                    7d
                  </Text>
                  <PercentChange
                    value={asset.change7d}
                    size={Size.Medium}
                  />
                </View>
              </View>
            )}
          </View>
        </Card>
      </Link>
    </View>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.asset.id === nextProps.asset.id &&
    prevProps.asset.price === nextProps.asset.price &&
    prevProps.asset.change24h === nextProps.asset.change24h &&
    prevProps.asset.change7d === nextProps.asset.change7d &&
    prevProps.asset.sparkline === nextProps.asset.sparkline &&
    prevProps.cardSize === nextProps.cardSize &&
    prevProps.searchQuery === nextProps.searchQuery
  );
});

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
    padding: spacing.sm,
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
    gap: spacing.xxs,
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
  chartPlaceholder: {
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: spacing.xs,
    borderTopWidth: 1,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
  },
});
