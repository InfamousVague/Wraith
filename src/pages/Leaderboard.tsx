/**
 * @file Leaderboard.tsx
 * @description Trading leaderboard showing top performers.
 *
 * ## Features:
 * - Ranked list of top traders
 * - Timeframe filtering (daily, weekly, monthly, all-time)
 * - Performance metrics (P&L, win rate, trades)
 * - User's own rank highlighted
 * - Badges for achievements
 */

import React, { useMemo } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { Card, Text, Avatar, Skeleton, SegmentedControl } from "@wraith/ghost/components";
import { Colors } from "@wraith/ghost/tokens";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { useLeaderboard } from "../hooks/useLeaderboard";
import { Navbar } from "../components/ui";
import { spacing, radii } from "../styles/tokens";
import type { LeaderboardEntry, LeaderboardTimeframe } from "../services/haunt";

const themes = {
  dark: {
    background: "#050608",
  },
  light: {
    background: "#f8fafc",
  },
};

const TIMEFRAME_OPTIONS = [
  { value: "daily", label: "24h" },
  { value: "weekly", label: "7d" },
  { value: "monthly", label: "30d" },
  { value: "all_time", label: "All Time" },
];

// Rank colors for top 3
const RANK_COLORS: Record<number, string> = {
  1: "#FFD700", // Gold
  2: "#C0C0C0", // Silver
  3: "#CD7F32", // Bronze
};

// Badge icons
const BADGE_ICONS: Record<string, string> = {
  whale: "🐋",
  diamond_hands: "💎",
  hot_streak: "🔥",
  consistent: "📈",
  risk_taker: "🎲",
  early_bird: "🐦",
  night_owl: "🦉",
  top_10: "🏆",
  top_100: "🥇",
  verified: "✓",
};

function formatPnl(pnl: number): string {
  const abs = Math.abs(pnl);
  if (abs >= 1000000) return `${(pnl / 1000000).toFixed(2)}M`;
  if (abs >= 1000) return `${(pnl / 1000).toFixed(1)}K`;
  return pnl.toFixed(2);
}

function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function RankBadge({ rank }: { rank: number }) {
  const isTop3 = rank <= 3;
  const color = RANK_COLORS[rank] || Colors.text.muted;

  if (isTop3) {
    return (
      <View style={[styles.rankBadge, styles.rankBadgeTop, { borderColor: color }]}>
        <Text size={Size.Medium} weight="bold" style={{ color }}>
          {rank}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.rankBadge}>
      <Text size={Size.Small} appearance={TextAppearance.Muted}>
        #{rank}
      </Text>
    </View>
  );
}

function TraderRow({
  entry,
  isCurrentUser,
  isMobile,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  isMobile: boolean;
}) {
  const totalPnl = entry.realizedPnl + entry.unrealizedPnl;
  const pnlPositive = totalPnl >= 0;
  const rank = entry.rank || 0;
  const displayName = entry.name || entry.userId;

  return (
    <Pressable
      style={[
        styles.traderRow,
        isCurrentUser && styles.traderRowHighlight,
        rank <= 3 && styles.traderRowTop,
      ]}
    >
      <RankBadge rank={rank} />

      <Avatar
        uri={entry.avatar}
        initials={displayName.slice(0, 2).toUpperCase()}
        size={Size.Medium}
      />

      <View style={styles.traderInfo}>
        <View style={styles.traderNameRow}>
          <Text size={Size.Small} weight="semibold">
            {displayName}
          </Text>
          {entry.badges && entry.badges.length > 0 && (
            <View style={styles.badgesRow}>
              {entry.badges.slice(0, 3).map((badge) => (
                <Text key={badge} size={Size.ExtraSmall}>
                  {BADGE_ICONS[badge] || "🏅"}
                </Text>
              ))}
            </View>
          )}
        </View>
        <View style={styles.traderStats}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
            {entry.totalTrades} trades
          </Text>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
            •
          </Text>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
            {entry.openPositions} open
          </Text>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
            •
          </Text>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
            {(entry.winRate * 100).toFixed(0)}% win
          </Text>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
            •
          </Text>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
            ${formatPnl(entry.totalValue)} value
          </Text>
        </View>
      </View>

      <View style={styles.traderPnl}>
        <Text
          size={isMobile ? Size.Small : Size.Medium}
          weight="bold"
          style={{ color: pnlPositive ? Colors.status.success : Colors.status.danger }}
        >
          {pnlPositive ? "+" : "-"}${formatPnl(Math.abs(totalPnl))}
        </Text>
        <Text
          size={Size.ExtraSmall}
          style={{ color: pnlPositive ? Colors.status.success : Colors.status.danger }}
        >
          {formatPercent(entry.totalReturnPct)}
        </Text>
      </View>
    </Pressable>
  );
}

function LeaderboardSkeleton() {
  return (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={styles.skeletonRow}>
          <Skeleton width={40} height={40} style={{ borderRadius: 20 }} />
          <Skeleton width={40} height={40} style={{ borderRadius: 20 }} />
          <View style={{ flex: 1, gap: 4 }}>
            <Skeleton width={120} height={16} />
            <Skeleton width={80} height={12} />
          </View>
          <View style={{ alignItems: "flex-end", gap: 4 }}>
            <Skeleton width={80} height={20} />
            <Skeleton width={50} height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

function StatsCard({ label, value, subValue, positive }: {
  label: string;
  value: string;
  subValue?: string;
  positive?: boolean;
}) {
  return (
    <Card style={styles.statsCard}>
      <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
        {label}
      </Text>
      <Text
        size={Size.Large}
        weight="bold"
        style={positive !== undefined ? { color: positive ? Colors.status.success : Colors.status.danger } : undefined}
      >
        {value}
      </Text>
      {subValue && (
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
          {subValue}
        </Text>
      )}
    </Card>
  );
}

export function Leaderboard() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const colors = isDark ? themes.dark : themes.light;
  const { isMobile, isNarrow } = useBreakpoint();

  const {
    entries,
    myEntry,
    loading,
    error,
    timeframe,
    setTimeframe,
  } = useLeaderboard("weekly", 100);

  const sectionPadding = isMobile ? 12 : isNarrow ? 16 : 24;

  // Calculate stats from leaderboard
  const stats = useMemo(() => {
    if (!entries.length) return null;
    const totalPnl = entries.reduce((sum, e) => sum + e.realizedPnl + e.unrealizedPnl, 0);
    const avgWinRate = entries.reduce((sum, e) => sum + e.winRate, 0) / entries.length;
    const topTrader = entries[0];
    return { totalPnl, avgWinRate, topTrader, totalTraders: entries.length };
  }, [entries]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Navbar />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Page Header */}
        <View style={[styles.header, { paddingHorizontal: sectionPadding }]}>
          <View>
            <Text size={Size.ExtraLarge} weight="bold">
              Leaderboard
            </Text>
            <Text size={Size.Small} appearance={TextAppearance.Muted}>
              Top traders by performance
            </Text>
          </View>
        </View>

        {/* Timeframe Selector */}
        <View style={[styles.section, { paddingHorizontal: sectionPadding }]}>
          <SegmentedControl
            options={TIMEFRAME_OPTIONS}
            value={timeframe}
            onChange={(val) => setTimeframe(val as LeaderboardTimeframe)}
          />
        </View>

        {/* Stats Overview */}
        {stats && (
          <View style={[styles.section, { paddingHorizontal: sectionPadding }]}>
            <View style={styles.statsGrid}>
              <StatsCard
                label="Top Trader"
                value={stats.topTrader.name || stats.topTrader.userId}
                subValue={`+$${formatPnl(stats.topTrader.realizedPnl + stats.topTrader.unrealizedPnl)}`}
              />
              <StatsCard
                label="Avg Win Rate"
                value={`${(stats.avgWinRate * 100).toFixed(0)}%`}
              />
              <StatsCard
                label="Total Traders"
                value={stats.totalTraders.toLocaleString()}
              />
              {myEntry && (
                <StatsCard
                  label="Your Rank"
                  value={`#${myEntry.rank}`}
                  subValue={formatPercent(myEntry.totalReturnPct)}
                  positive={myEntry.realizedPnl + myEntry.unrealizedPnl >= 0}
                />
              )}
            </View>
          </View>
        )}

        {/* Leaderboard List */}
        <View style={[styles.section, { paddingHorizontal: sectionPadding }]}>
          <Card style={styles.leaderboardCard}>
            {loading && <LeaderboardSkeleton />}

            {error && (
              <View style={styles.errorState}>
                <Text appearance={TextAppearance.Muted}>{error}</Text>
              </View>
            )}

            {!loading && !error && entries.length === 0 && (
              <View style={styles.emptyState}>
                <Text size={Size.Large}>🏆</Text>
                <Text appearance={TextAppearance.Muted}>
                  No traders on the leaderboard yet
                </Text>
              </View>
            )}

            {!loading && !error && entries.map((entry) => (
              <TraderRow
                key={entry.portfolioId}
                entry={entry}
                isCurrentUser={entry.userId === user?.id}
                isMobile={isMobile}
              />
            ))}
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    paddingVertical: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  statsCard: {
    flex: 1,
    minWidth: 140,
    padding: spacing.md,
    gap: spacing.xxs,
  },
  leaderboardCard: {
    padding: 0,
    overflow: "hidden",
  },
  traderRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  traderRowHighlight: {
    backgroundColor: "rgba(139, 92, 246, 0.1)",
  },
  traderRowTop: {
    backgroundColor: "rgba(255, 215, 0, 0.05)",
  },
  rankBadge: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  rankBadgeTop: {
    borderWidth: 2,
    borderRadius: 20,
  },
  traderInfo: {
    flex: 1,
    gap: 2,
  },
  traderNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  badgesRow: {
    flexDirection: "row",
    gap: 2,
  },
  traderStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  traderPnl: {
    alignItems: "flex-end",
    gap: 2,
  },
  skeletonContainer: {
    padding: spacing.md,
    gap: spacing.md,
  },
  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  errorState: {
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
});
