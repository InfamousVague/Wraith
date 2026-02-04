/**
 * @file MoversWidget.tsx
 * @description Widget showing top gainers and losers.
 *
 * Features:
 * - Tabbed view for gainers/losers
 * - Mini sparkline charts
 * - Click to navigate to asset
 * - Auto-refresh with polling
 */

import React, { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useNavigate } from "react-router-dom";
import { Card, Text, Avatar, PercentChange, Currency, Skeleton, SegmentedControl } from "@wraith/ghost/components";
import { Colors } from "@wraith/ghost/tokens";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { useMovers } from "../../../hooks/useMovers";
import { spacing, radii } from "../../../styles/tokens";
import type { Mover, MoverTimeframe } from "../../../services/haunt";

type MoversWidgetProps = {
  initialTimeframe?: MoverTimeframe;
  limit?: number;
};

type TabId = "gainers" | "losers";

const TAB_OPTIONS = [
  { value: "gainers", label: "Gainers" },
  { value: "losers", label: "Losers" },
];

const TIMEFRAME_OPTIONS = [
  { value: "1h", label: "1H" },
  { value: "24h", label: "24H" },
];

function MoverRow({
  mover,
  rank,
  onPress,
}: {
  mover: Mover;
  rank: number;
  onPress: () => void;
}) {
  const themeColors = useThemeColors();
  const isPositive = mover.changePercent >= 0;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.moverRow, { backgroundColor: themeColors.background.sunken }]}
    >
      <Text size={Size.Small} appearance={TextAppearance.Muted} style={styles.rank}>
        {rank}
      </Text>
      <Avatar
        initials={mover.symbol.slice(0, 2).toUpperCase()}
        size={Size.Small}
      />
      <View style={styles.moverInfo}>
        <Text size={Size.Small} weight="semibold">
          {mover.symbol.toUpperCase()}
        </Text>
        <Currency value={mover.price} size={Size.ExtraSmall} decimals={mover.price < 1 ? 4 : 2} />
      </View>
      <View style={styles.moverChange}>
        <PercentChange value={mover.changePercent} size={Size.Small} />
      </View>
    </Pressable>
  );
}

function MoverSkeleton() {
  return (
    <View style={styles.moverRow}>
      <Skeleton width={16} height={16} />
      <Skeleton width={28} height={28} borderRadius={14} />
      <View style={styles.moverInfo}>
        <Skeleton width={50} height={14} />
        <Skeleton width={60} height={12} style={{ marginTop: 2 }} />
      </View>
      <Skeleton width={60} height={18} />
    </View>
  );
}

export function MoversWidget({
  initialTimeframe = "1h",
  limit = 5,
}: MoversWidgetProps) {
  const navigate = useNavigate();
  const themeColors = useThemeColors();
  const [activeTab, setActiveTab] = useState<TabId>("gainers");
  const { movers, loading, timeframe, setTimeframe } = useMovers(
    initialTimeframe,
    limit
  );

  const displayMovers = activeTab === "gainers"
    ? movers?.gainers ?? []
    : movers?.losers ?? [];

  const handleMoverPress = (symbol: string) => {
    // Navigate to search for this symbol since we don't have the ID
    // In a real app, the movers API would return IDs
    navigate(`/?search=${symbol}`);
  };

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Text size={Size.Small} weight="semibold">
          Top Movers
        </Text>
        <SegmentedControl
          options={TIMEFRAME_OPTIONS}
          value={timeframe}
          onChange={(val) => setTimeframe(val as MoverTimeframe)}
          size={Size.Small}
        />
      </View>

      <View style={styles.tabs}>
        <SegmentedControl
          options={TAB_OPTIONS}
          value={activeTab}
          onChange={(val) => setActiveTab(val as TabId)}
          size={Size.Small}
        />
      </View>

      <View style={styles.content}>
        {loading ? (
          <>
            <MoverSkeleton />
            <MoverSkeleton />
            <MoverSkeleton />
            <MoverSkeleton />
            <MoverSkeleton />
          </>
        ) : displayMovers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text size={Size.Small} appearance={TextAppearance.Muted}>
              No movers data available
            </Text>
          </View>
        ) : (
          displayMovers.map((mover, index) => (
            <MoverRow
              key={mover.symbol}
              mover={mover}
              rank={index + 1}
              onPress={() => handleMoverPress(mover.symbol)}
            />
          ))
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  tabs: {
    padding: spacing.sm,
    paddingTop: 0,
  },
  content: {
    padding: spacing.sm,
    paddingTop: 0,
    gap: spacing.xs,
  },
  moverRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    borderRadius: radii.md,
    gap: spacing.sm,
  },
  rank: {
    width: 16,
    textAlign: "center",
  },
  moverInfo: {
    flex: 1,
    gap: 2,
  },
  moverChange: {
    alignItems: "flex-end",
  },
  emptyState: {
    padding: spacing.lg,
    alignItems: "center",
  },
});
