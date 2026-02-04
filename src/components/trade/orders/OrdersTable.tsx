/**
 * @file OrdersTable.tsx
 * @description Table displaying open orders with status and actions.
 *
 * Columns:
 * - Symbol
 * - Type (Market/Limit/Stop Loss/Take Profit)
 * - Side (Buy/Sell)
 * - Price
 * - Size
 * - Status
 * - Actions (Cancel)
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button, Skeleton, Currency } from "@wraith/ghost/components";
import { Size, TextAppearance, Appearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { spacing, radii } from "../../../styles/tokens";
import { useBreakpoint } from "../../../hooks/useBreakpoint";
import type { OrdersTableProps, Order } from "./types";

const ORDER_TYPE_LABELS: Record<Order["type"], string> = {
  market: "Market",
  limit: "Limit",
  stop_loss: "Stop Loss",
  take_profit: "Take Profit",
};

const STATUS_COLORS: Record<Order["status"], string> = {
  pending: Colors.status.warning,
  partial: Colors.status.info || Colors.text.primary,
  filled: Colors.status.success,
  cancelled: Colors.text.muted,
};

export function OrdersTable({
  orders,
  loading = false,
  onCancelOrder,
  onCancelAllOrders,
  onModifyOrder,
}: OrdersTableProps) {
  const { isMobile } = useBreakpoint();
  const pendingOrders = orders.filter((o) => o.status === "pending" || o.status === "partial");
  const hasPendingOrders = pendingOrders.length > 0;

  if (loading) {
    return (
      <View style={styles.container}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} height={48} style={{ marginBottom: spacing.xs }} />
        ))}
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text appearance={TextAppearance.Muted} size={Size.Small}>
          No open orders
        </Text>
      </View>
    );
  }

  if (isMobile) {
    return (
      <View style={styles.container}>
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onCancel={() => onCancelOrder?.(order.id)}
          />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Batch Actions */}
      {hasPendingOrders && onCancelAllOrders && (
        <View style={styles.batchActions}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
            {pendingOrders.length} pending order{pendingOrders.length !== 1 ? "s" : ""}
          </Text>
          <Button
            label="Cancel All"
            icon="x"
            size={Size.ExtraSmall}
            appearance={Appearance.Danger}
            onPress={onCancelAllOrders}
          />
        </View>
      )}

      {/* Header Row */}
      <View style={styles.headerRow}>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.cell}>
          Symbol
        </Text>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.cell}>
          Type
        </Text>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.cell}>
          Side
        </Text>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.cell}>
          Price
        </Text>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.cell}>
          Size
        </Text>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.cell}>
          Filled
        </Text>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.cell}>
          Status
        </Text>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.cellActions}>
          Actions
        </Text>
      </View>

      {/* Data Rows */}
      {orders.map((order) => (
        <OrderRow
          key={order.id}
          order={order}
          onCancel={() => onCancelOrder?.(order.id)}
        />
      ))}
    </View>
  );
}

interface OrderRowProps {
  order: Order;
  onCancel?: () => void;
}

function OrderRow({ order, onCancel }: OrderRowProps) {
  const sideColor = order.side === "buy" ? Colors.status.success : Colors.status.danger;
  const statusColor = STATUS_COLORS[order.status];
  const canCancel = order.status === "pending" || order.status === "partial";

  return (
    <View style={styles.row}>
      <Text size={Size.Small} style={[styles.cell, styles.symbolCell]}>
        {order.symbol}
      </Text>
      <Text size={Size.Small} style={styles.cell}>
        {ORDER_TYPE_LABELS[order.type]}
      </Text>
      <Text size={Size.Small} style={[styles.cell, { color: sideColor }]}>
        {order.side.toUpperCase()}
      </Text>
      <View style={styles.cell}>
        {order.price ? (
          <Currency value={order.price} decimals={2} size={Size.Small} />
        ) : (
          <Text size={Size.Small}>Market</Text>
        )}
      </View>
      <Text size={Size.Small} style={styles.cell}>
        {order.size}
      </Text>
      <Text size={Size.Small} style={styles.cell}>
        {order.filledSize} / {order.size}
      </Text>
      <View style={styles.cell}>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text size={Size.ExtraSmall} style={styles.statusText}>
            {order.status.toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={[styles.cellActions, styles.actionsCell]}>
        {canCancel && (
          <Button
            label="Cancel"
            icon="x"
            size={Size.ExtraSmall}
            appearance={Appearance.Secondary}
            onPress={onCancel}
          />
        )}
      </View>
    </View>
  );
}

// Mobile card layout
function OrderCard({ order, onCancel }: OrderRowProps) {
  const sideColor = order.side === "buy" ? Colors.status.success : Colors.status.danger;
  const statusColor = STATUS_COLORS[order.status];
  const canCancel = order.status === "pending" || order.status === "partial";

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text size={Size.Medium} style={styles.symbolCell}>
            {order.symbol}
          </Text>
          <View style={[styles.sideBadge, { backgroundColor: sideColor }]}>
            <Text size={Size.ExtraSmall} style={styles.sideBadgeText}>
              {order.side.toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text size={Size.ExtraSmall} style={styles.statusText}>
            {order.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.cardDetailRow}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>Type</Text>
          <Text size={Size.Small}>{ORDER_TYPE_LABELS[order.type]}</Text>
        </View>
        <View style={styles.cardDetailRow}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>Price</Text>
          {order.price ? (
            <Currency value={order.price} decimals={2} size={Size.Small} />
          ) : (
            <Text size={Size.Small}>Market</Text>
          )}
        </View>
        <View style={styles.cardDetailRow}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>Size</Text>
          <Text size={Size.Small}>{order.size}</Text>
        </View>
        <View style={styles.cardDetailRow}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>Filled</Text>
          <Text size={Size.Small}>{order.filledSize} / {order.size}</Text>
        </View>
      </View>

      {canCancel && (
        <View style={styles.cardActions}>
          <View style={styles.cardButton}>
            <Button
              label="Cancel"
              icon="x"
              size={Size.Small}
              appearance={Appearance.Secondary}
              onPress={onCancel}
            />
          </View>
        </View>
      )}
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
  batchActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.xs,
    backgroundColor: Colors.background.raised,
    borderRadius: radii.md,
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
  cellActions: {
    flex: 1,
    paddingHorizontal: spacing.xxs,
  },
  symbolCell: {
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radii.soft,
    alignSelf: "flex-start",
  },
  statusText: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  actionsCell: {
    flexDirection: "row",
    gap: spacing.xs,
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
    marginBottom: spacing.sm,
  },
  cardDetailRow: {
    width: "45%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  cardButton: {
    flex: 1,
  },
});
