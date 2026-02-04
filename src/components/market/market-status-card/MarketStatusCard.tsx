/**
 * @file MarketStatusCard.tsx
 * @description Card showing real-time market open/closed status with countdown timers.
 *
 * ## Features:
 * - US Stocks (NYSE/NASDAQ): Shows open/closed status with countdown
 * - Crypto: Always shows 24/7 open status
 * - Updates every second for accurate countdown
 * - Color-coded status badges (green=open, red=closed)
 *
 * ## Dependencies:
 * - `../utils/marketHours`: Market status and time calculations
 * - `isUSMarketOpen()` - Check if US market currently trading
 * - `getTimeUntilMarketEvent()` - Get next open/close time
 * - `formatDuration()` - Format ms to HH:MM:SS string
 */
import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Card, Text, Icon } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { spacing, radii } from "../../../styles/tokens";
import {
  isUSMarketOpen,
  getTimeUntilMarketEvent,
  formatDuration,
} from "../../../utils/marketHours";

export function MarketStatusCard() {
  const themeColors = useThemeColors();
  const [, setTick] = useState(0);
  const [marketOpen, setMarketOpen] = useState(isUSMarketOpen());

  // Update every second for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
      setMarketOpen(isUSMarketOpen());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const marketEvent = getTimeUntilMarketEvent();
  const stockStatusColor = marketOpen ? Colors.status.success : Colors.status.danger;

  return (
    <Card style={styles.card}>
      <View style={styles.content}>
        {/* Header - matching ApiStatsCard style */}
        <View style={styles.header}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
            MARKET STATUS
          </Text>
          <View style={[styles.badge, { backgroundColor: `${stockStatusColor}20` }]}>
            <View style={[styles.statusDot, { backgroundColor: stockStatusColor }]} />
            <Text size={Size.TwoXSmall} style={{ color: stockStatusColor }}>
              {marketOpen ? "Trading" : "After Hours"}
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: themeColors.border.subtle }]} />

        {/* US Stocks Row */}
        <View style={styles.marketRow}>
          <View style={styles.marketInfo}>
            <Icon name="building-2" size={Size.Small} color={stockStatusColor} />
            <View style={styles.marketText}>
              <Text size={Size.Small} weight="semibold">US Stocks</Text>
              <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                NYSE / NASDAQ
              </Text>
            </View>
          </View>
          <View style={styles.marketStatus}>
            <View style={[styles.statusBadge, { backgroundColor: marketOpen ? "rgba(47, 213, 117, 0.15)" : "rgba(255, 92, 122, 0.15)" }]}>
              <Text size={Size.ExtraSmall} weight="semibold" style={{ color: stockStatusColor }}>
                {marketOpen ? "Open" : "Closed"}
              </Text>
            </View>
            {marketEvent && (
              <View style={styles.countdown}>
                <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                  {marketEvent.event === "open" ? "Opens" : "Closes"}
                </Text>
                <Text size={Size.Small} weight="bold" style={{ color: stockStatusColor }}>
                  {formatDuration(marketEvent.msUntil)}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: themeColors.border.subtle }]} />

        {/* Crypto Row */}
        <View style={styles.marketRow}>
          <View style={styles.marketInfo}>
            <Icon name="coins" size={Size.Small} color={Colors.status.success} />
            <View style={styles.marketText}>
              <Text size={Size.Small} weight="semibold">Crypto</Text>
              <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                All Exchanges
              </Text>
            </View>
          </View>
          <View style={styles.marketStatus}>
            <View style={[styles.statusBadge, { backgroundColor: "rgba(47, 213, 117, 0.15)" }]}>
              <Text size={Size.ExtraSmall} weight="semibold" style={{ color: Colors.status.success }}>
                24/7
              </Text>
            </View>
            <View style={styles.countdown}>
              <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                Always
              </Text>
              <Text size={Size.Small} weight="bold" style={{ color: Colors.status.success }}>
                Open
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 340,
    flexShrink: 0,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: radii.lg,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  divider: {
    height: 1,
    marginBottom: spacing.sm,
  },
  marketRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  marketInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  marketText: {
    gap: 2,
  },
  marketStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.soft,
  },
  countdown: {
    alignItems: "flex-end",
    minWidth: 60,
  },
});
