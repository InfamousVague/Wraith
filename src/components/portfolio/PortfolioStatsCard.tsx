/**
 * @file PortfolioStatsCard.tsx
 * @description Card component displaying detailed trading statistics.
 *
 * Shows:
 * - Total trades, win rate, profit factor
 * - Best/worst trades
 * - Current and longest streaks
 * - Advanced metrics (Sharpe, Sortino, avg hold time)
 */

import React, { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Card, Text, Icon, Skeleton } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import type { PortfolioStats } from "../../services/haunt";
import { spacing, radii } from "../../styles/tokens";

/**
 * Props for PortfolioStatsCard
 */
export type PortfolioStatsCardProps = {
  /** Trading statistics data */
  stats: PortfolioStats | null;
  /** Whether data is loading */
  loading?: boolean;
  /** Error message if any */
  error?: string | null;
};

/**
 * Format win rate as percentage
 */
function formatWinRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

/**
 * Format profit factor
 */
function formatProfitFactor(pf: number): string {
  if (!isFinite(pf)) return "N/A";
  return pf.toFixed(2);
}

/**
 * Format currency
 */
function formatCurrency(amount: number): string {
  const absAmount = Math.abs(amount);
  const prefix = amount >= 0 ? "+$" : "-$";
  return `${prefix}${absAmount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format compact currency for large numbers
 */
function formatCompactCurrency(amount: number): string {
  const absAmount = Math.abs(amount);
  const prefix = amount >= 0 ? "+$" : "-$";

  if (absAmount >= 1000000) {
    return `${prefix}${(absAmount / 1000000).toFixed(1)}M`;
  }
  if (absAmount >= 1000) {
    return `${prefix}${(absAmount / 1000).toFixed(1)}K`;
  }
  return `${prefix}${absAmount.toFixed(2)}`;
}

/**
 * Format duration in milliseconds to human readable
 */
function formatDuration(ms: number): string {
  const seconds = ms / 1000;
  const minutes = seconds / 60;
  const hours = minutes / 60;
  const days = hours / 24;

  if (days >= 1) return `${days.toFixed(1)} days`;
  if (hours >= 1) return `${hours.toFixed(1)}h`;
  if (minutes >= 1) return `${Math.round(minutes)}m`;
  return `${Math.round(seconds)}s`;
}

/**
 * Format streak with emoji
 */
function formatStreak(type: "win" | "loss" | "none", count: number): string {
  if (type === "none" || count === 0) return "—";
  const emoji = type === "win" ? "🔥" : "❄️";
  const label = type === "win" ? "Wins" : "Losses";
  return `${emoji} ${count} ${label}`;
}

/**
 * Format ratio with null handling
 */
function formatRatio(value: number | null): string {
  if (value === null || !isFinite(value)) return "N/A";
  return value.toFixed(2);
}

/**
 * Stat item sub-component
 */
function StatItem({
  label,
  value,
  subValue,
  color,
  size = "normal",
}: {
  label: string;
  value: string;
  subValue?: string;
  color?: string;
  size?: "normal" | "large";
}) {
  return (
    <View style={styles.statItem}>
      <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
        {label}
      </Text>
      <Text
        size={size === "large" ? Size.Large : Size.Medium}
        weight="bold"
        style={color ? { color } : undefined}
      >
        {value}
      </Text>
      {subValue && (
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
          {subValue}
        </Text>
      )}
    </View>
  );
}

/**
 * Trading statistics card showing comprehensive performance metrics.
 */
export function PortfolioStatsCard({
  stats,
  loading = false,
  error = null,
}: PortfolioStatsCardProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Loading state
  if (loading) {
    return (
      <Card style={styles.card}>
        <View style={styles.content}>
          <Text size={Size.Medium} weight="bold" style={styles.title}>
            Trading Statistics
          </Text>
          <View style={styles.statsRow}>
            <Skeleton width={80} height={50} />
            <Skeleton width={80} height={50} />
            <Skeleton width={80} height={50} />
          </View>
          <View style={styles.statsRow}>
            <Skeleton width={100} height={50} />
            <Skeleton width={100} height={50} />
          </View>
        </View>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card style={styles.card}>
        <View style={styles.content}>
          <View style={styles.errorContainer}>
            <Icon name="alert-circle" size={Size.Large} color={Colors.status.danger} />
            <Text size={Size.Medium} appearance={TextAppearance.Danger}>
              {error}
            </Text>
          </View>
        </View>
      </Card>
    );
  }

  // Empty state
  if (!stats || stats.totalTrades === 0) {
    return (
      <Card style={styles.card}>
        <View style={styles.content}>
          <Text size={Size.Medium} weight="bold" style={styles.title}>
            Trading Statistics
          </Text>
          <View style={styles.emptyContainer}>
            <Icon name="bar-chart-2" size={Size.ExtraLarge} color={Colors.text.muted} />
            <Text size={Size.Medium} appearance={TextAppearance.Muted}>
              No trades yet
            </Text>
            <Text size={Size.Small} appearance={TextAppearance.Muted}>
              Place your first trade to see statistics
            </Text>
          </View>
        </View>
      </Card>
    );
  }

  const winRateColor =
    stats.winRate >= 0.5 ? Colors.status.success : Colors.status.danger;

  return (
    <Card style={styles.card}>
      <View style={styles.content}>
        <Text size={Size.Medium} weight="bold" style={styles.title}>
          Trading Statistics
        </Text>

        {/* Row 1: Overview */}
        <View style={styles.statsRow}>
          <StatItem
            label="Total Trades"
            value={stats.totalTrades.toString()}
            size="large"
          />
          <StatItem
            label="Win Rate"
            value={formatWinRate(stats.winRate)}
            color={winRateColor}
            size="large"
          />
          <StatItem
            label="Profit Factor"
            value={formatProfitFactor(stats.profitFactor)}
            color={stats.profitFactor >= 1 ? Colors.status.success : Colors.status.danger}
            size="large"
          />
        </View>

        <View style={styles.divider} />

        {/* Row 2: Win/Loss Breakdown */}
        <View style={styles.statsRow}>
          <StatItem
            label="Winning"
            value={stats.winningTrades.toString()}
            subValue={`Avg: ${formatCompactCurrency(stats.averageWin)}`}
            color={Colors.status.success}
          />
          <StatItem
            label="Losing"
            value={stats.losingTrades.toString()}
            subValue={`Avg: ${formatCompactCurrency(-stats.averageLoss)}`}
            color={Colors.status.danger}
          />
          <StatItem
            label="W/L Ratio"
            value={
              stats.averageLoss > 0
                ? (stats.averageWin / stats.averageLoss).toFixed(2)
                : "N/A"
            }
          />
        </View>

        <View style={styles.divider} />

        {/* Row 3: Best/Worst Trades */}
        <View style={styles.statsRow}>
          <View style={styles.tradeItem}>
            <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
              Best Trade
            </Text>
            {stats.bestTrade ? (
              <>
                <Text size={Size.Small} weight="medium">
                  {stats.bestTrade.symbol}
                </Text>
                <Text
                  size={Size.Medium}
                  weight="bold"
                  style={{ color: Colors.status.success }}
                >
                  {formatCurrency(stats.bestTrade.pnl)}
                </Text>
                <Text size={Size.ExtraSmall} style={{ color: Colors.status.success }}>
                  +{stats.bestTrade.pnlPercent.toFixed(1)}%
                </Text>
              </>
            ) : (
              <Text size={Size.Small} appearance={TextAppearance.Muted}>
                —
              </Text>
            )}
          </View>
          <View style={styles.tradeItem}>
            <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
              Worst Trade
            </Text>
            {stats.worstTrade ? (
              <>
                <Text size={Size.Small} weight="medium">
                  {stats.worstTrade.symbol}
                </Text>
                <Text
                  size={Size.Medium}
                  weight="bold"
                  style={{ color: Colors.status.danger }}
                >
                  {formatCurrency(stats.worstTrade.pnl)}
                </Text>
                <Text size={Size.ExtraSmall} style={{ color: Colors.status.danger }}>
                  {stats.worstTrade.pnlPercent.toFixed(1)}%
                </Text>
              </>
            ) : (
              <Text size={Size.Small} appearance={TextAppearance.Muted}>
                —
              </Text>
            )}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Row 4: Streaks */}
        <View style={styles.statsRow}>
          <StatItem
            label="Current Streak"
            value={formatStreak(stats.currentStreak.type, stats.currentStreak.count)}
          />
          <StatItem
            label="Best Win Streak"
            value={`${stats.longestWinStreak}`}
            subValue="consecutive"
            color={Colors.status.success}
          />
          <StatItem
            label="Worst Loss Streak"
            value={`${stats.longestLossStreak}`}
            subValue="consecutive"
            color={Colors.status.danger}
          />
        </View>

        {/* Advanced Metrics Toggle */}
        <Pressable
          style={styles.advancedToggle}
          onPress={() => setShowAdvanced(!showAdvanced)}
        >
          <Text size={Size.Small} appearance={TextAppearance.Muted}>
            {showAdvanced ? "Hide" : "Show"} Advanced Metrics
          </Text>
          <Icon
            name={showAdvanced ? "chevron-up" : "chevron-down"}
            size={Size.Small}
            color={Colors.text.muted}
          />
        </Pressable>

        {/* Row 5: Advanced Metrics (Collapsible) */}
        {showAdvanced && (
          <View style={styles.advancedSection}>
            <View style={styles.statsRow}>
              <StatItem
                label="Sharpe Ratio"
                value={formatRatio(stats.sharpeRatio)}
                subValue="risk-adjusted"
              />
              <StatItem
                label="Sortino Ratio"
                value={formatRatio(stats.sortinoRatio)}
                subValue="downside risk"
              />
              <StatItem
                label="Avg Hold Time"
                value={formatDuration(stats.averageHoldTime)}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.statsRow}>
              <StatItem
                label="Max Drawdown"
                value={`-${stats.maxDrawdownPercent.toFixed(1)}%`}
                subValue={formatCompactCurrency(-stats.maxDrawdownHit)}
                color={Colors.status.danger}
              />
              <StatItem
                label="Largest Win"
                value={formatCompactCurrency(stats.largestWin)}
                color={Colors.status.success}
              />
              <StatItem
                label="Largest Loss"
                value={formatCompactCurrency(-stats.largestLoss)}
                color={Colors.status.danger}
              />
            </View>
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    marginBottom: spacing.xs,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  statItem: {
    flex: 1,
    gap: 2,
  },
  tradeItem: {
    flex: 1,
    gap: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  advancedToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  advancedSection: {
    gap: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  emptyContainer: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  errorContainer: {
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.lg,
  },
});
