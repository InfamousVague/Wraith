/**
 * @file TradeHistoryTable.tsx
 * @description Table displaying completed trades with full details.
 *
 * Columns:
 * - Symbol
 * - Side (Buy/Sell)
 * - Size
 * - Price
 * - Fee
 * - P&L
 * - Time
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Skeleton, Currency } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { spacing, radii } from "../../../styles/tokens";
import { useBreakpoint } from "../../../hooks/useBreakpoint";
import { formatTradeTime } from "../order-form/utils/formatters";
import type { TradeHistoryTableProps, Trade } from "./types";

export function TradeHistoryTable({
  trades,
  loading = false,
}: TradeHistoryTableProps) {
  const { isMobile } = useBreakpoint();

  if (loading) {
    return (
      <View style={styles.container}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} height={48} style={{ marginBottom: spacing.xs }} />
        ))}
      </View>
    );
  }

  if (trades.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text appearance={TextAppearance.Muted} size={Size.Small}>
          No trade history
        </Text>
      </View>
    );
  }

  if (isMobile) {
    return (
      <View style={styles.container}>
        {trades.map((trade) => (
          <TradeCard key={trade.id} trade={trade} />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.cell}>
          Symbol
        </Text>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.cell}>
          Side
        </Text>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.cell}>
          Size
        </Text>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.cell}>
          Price
        </Text>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.cell}>
          Fee
        </Text>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.cell}>
          P&L
        </Text>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.cellTime}>
          Time
        </Text>
      </View>

      {/* Data Rows */}
      {trades.map((trade) => (
        <TradeRow key={trade.id} trade={trade} />
      ))}
    </View>
  );
}

interface TradeRowProps {
  trade: Trade;
}

function TradeRow({ trade }: TradeRowProps) {
  const sideColor = trade.side === "buy" ? Colors.status.success : Colors.status.danger;
  const pnlColor = trade.pnl >= 0 ? Colors.status.success : Colors.status.danger;

  return (
    <View style={styles.row}>
      <Text size={Size.Small} style={[styles.cell, styles.symbolCell]}>
        {trade.symbol}
      </Text>
      <Text size={Size.Small} style={[styles.cell, { color: sideColor }]}>
        {trade.side.toUpperCase()}
      </Text>
      <Text size={Size.Small} style={styles.cell}>
        {trade.size}
      </Text>
      <View style={styles.cell}>
        <Currency value={trade.price} decimals={2} size={Size.Small} />
      </View>
      <View style={styles.cell}>
        <Currency value={trade.fee} decimals={2} size={Size.Small} appearance={TextAppearance.Muted} />
      </View>
      <View style={[styles.cell, styles.pnlCell]}>
        <Text size={Size.Small} style={{ color: pnlColor, fontWeight: "600" }}>
          {trade.pnl >= 0 ? "+" : "-"}
        </Text>
        <Currency value={Math.abs(trade.pnl)} decimals={2} size={Size.Small} color={pnlColor} />
      </View>
      <Text size={Size.Small} appearance={TextAppearance.Muted} style={styles.cellTime}>
        {formatTradeTime(trade.executedAt)}
      </Text>
    </View>
  );
}

// Mobile card layout
function TradeCard({ trade }: TradeRowProps) {
  const sideColor = trade.side === "buy" ? Colors.status.success : Colors.status.danger;
  const pnlColor = trade.pnl >= 0 ? Colors.status.success : Colors.status.danger;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text size={Size.Medium} style={styles.symbolCell}>
            {trade.symbol}
          </Text>
          <View style={[styles.sideBadge, { backgroundColor: sideColor }]}>
            <Text size={Size.ExtraSmall} style={styles.sideBadgeText}>
              {trade.side.toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={[styles.cardHeaderRight, { flexDirection: "row", alignItems: "center" }]}>
          <Text size={Size.Medium} style={{ color: pnlColor, fontWeight: "700" }}>
            {trade.pnl >= 0 ? "+" : "-"}
          </Text>
          <Currency value={Math.abs(trade.pnl)} decimals={2} size={Size.Medium} color={pnlColor} />
        </View>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.cardDetailRow}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>Size</Text>
          <Text size={Size.Small}>{trade.size}</Text>
        </View>
        <View style={styles.cardDetailRow}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>Price</Text>
          <Currency value={trade.price} decimals={2} size={Size.Small} />
        </View>
        <View style={styles.cardDetailRow}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>Fee</Text>
          <Currency value={trade.fee} decimals={2} size={Size.Small} />
        </View>
        <View style={styles.cardDetailRow}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>Time</Text>
          <Text size={Size.Small}>{formatTradeTime(trade.executedAt)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.sm,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  headerRow: {
    flexDirection: "row",
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  row: {
    flexDirection: "row",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
    alignItems: "center",
  },
  cell: {
    flex: 1,
    paddingHorizontal: spacing.xxs,
  },
  pnlCell: {
    flexDirection: "row",
    alignItems: "center",
  },
  cellTime: {
    flex: 1.5,
    paddingHorizontal: spacing.xxs,
  },
  symbolCell: {
    fontWeight: "600",
  },
  // Mobile card styles
  card: {
    backgroundColor: Colors.background.raised,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  cardHeaderRight: {
    alignItems: "flex-end",
  },
  sideBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radii.soft,
  },
  sideBadgeText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  cardDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  cardDetailRow: {
    width: "45%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
