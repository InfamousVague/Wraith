/**
 * @file TradeReceiptModal.tsx
 * @description Modal shown after an order is filled with trade details.
 *
 * Shows execution details, fees, and resulting position info.
 */

import React from "react";
import { View, StyleSheet, Modal, Pressable } from "react-native";
import { Text, Button, Icon, Card } from "@wraith/ghost/components";
import { Size, Appearance, TextAppearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { spacing, radii } from "../../../styles/tokens";
import type { OrderUpdate } from "../../../hooks/useHauntSocket";

export interface TradeReceiptModalProps {
  visible: boolean;
  trade: OrderUpdate | null;
  onClose: () => void;
}

function formatPrice(value: number): string {
  if (value >= 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (value >= 1) return value.toFixed(2);
  return value.toPrecision(4);
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function TradeReceiptModal({
  visible,
  trade,
  onClose,
}: TradeReceiptModalProps) {
  if (!trade) return null;

  const isBuy = trade.side === "buy";
  const isSuccess = trade.status === "filled";
  const isPnlPositive = (trade.pnl ?? 0) >= 0;

  const statusConfig = {
    filled: { color: Colors.status.success, icon: "check-circle" as const, label: "Order Filled" },
    partial: { color: Colors.status.warning, icon: "clock" as const, label: "Partially Filled" },
    cancelled: { color: Colors.status.danger, icon: "x-circle" as const, label: "Order Cancelled" },
    rejected: { color: Colors.status.danger, icon: "alert-circle" as const, label: "Order Rejected" },
  };

  const status = statusConfig[trade.status as keyof typeof statusConfig] || statusConfig.filled;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Card style={styles.modal}>
          {/* Header with status */}
          <View style={[styles.header, { borderBottomColor: status.color }]}>
            <View style={styles.statusIcon}>
              <Icon name={status.icon} size={Size.ExtraLarge} color={status.color} />
            </View>
            <Text size={Size.Large} weight="bold">
              {status.label}
            </Text>
            <Text size={Size.Small} appearance={TextAppearance.Muted}>
              {formatTime(trade.timestamp)}
            </Text>
          </View>

          {/* Trade Details */}
          <View style={styles.content}>
            <View style={styles.tradeHeader}>
              <View style={[
                styles.sideBadge,
                { backgroundColor: isBuy ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)" }
              ]}>
                <Icon
                  name={isBuy ? "arrow-up" : "arrow-down"}
                  size={Size.Small}
                  color={isBuy ? Colors.status.success : Colors.status.danger}
                />
                <Text
                  size={Size.Small}
                  weight="semibold"
                  style={{ color: isBuy ? Colors.status.success : Colors.status.danger }}
                >
                  {isBuy ? "BUY" : "SELL"}
                </Text>
              </View>
              <Text size={Size.Large} weight="bold">
                {trade.symbol.toUpperCase()}
              </Text>
            </View>

            <View style={styles.detailsGrid}>
              <DetailRow
                label="Size"
                value={`${trade.size.toFixed(6)}`}
              />
              {trade.executionPrice && (
                <DetailRow
                  label="Execution Price"
                  value={`$${formatPrice(trade.executionPrice)}`}
                  highlight
                />
              )}
              {trade.price && trade.executionPrice && (
                <DetailRow
                  label="Slippage"
                  value={`${(((trade.executionPrice - trade.price) / trade.price) * 100).toFixed(3)}%`}
                  muted
                />
              )}
              <DetailRow
                label="Filled"
                value={`${trade.filledSize.toFixed(6)} / ${trade.size.toFixed(6)}`}
              />
              {trade.fee !== undefined && (
                <DetailRow
                  label="Fee"
                  value={`$${formatPrice(trade.fee)}`}
                  muted
                />
              )}
            </View>

            {/* P&L Section (if closing a position) */}
            {trade.pnl !== undefined && (
              <View style={[
                styles.pnlSection,
                { backgroundColor: isPnlPositive ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)" }
              ]}>
                <Text size={Size.Small} appearance={TextAppearance.Muted}>
                  Realized P&L
                </Text>
                <Text
                  size={Size.Large}
                  weight="bold"
                  style={{ color: isPnlPositive ? Colors.status.success : Colors.status.danger }}
                >
                  {isPnlPositive ? "+" : ""}{formatPrice(trade.pnl)} USD
                </Text>
              </View>
            )}

            {/* Trade ID */}
            <View style={styles.tradeId}>
              <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                Order ID: {trade.id}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              label="Close"
              appearance={Appearance.Secondary}
              size={Size.Medium}
              onPress={onClose}
              style={styles.actionButton}
            />
          </View>
        </Card>
      </View>
    </Modal>
  );
}

function DetailRow({
  label,
  value,
  muted = false,
  highlight = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
  highlight?: boolean;
}) {
  return (
    <View style={styles.detailRow}>
      <Text size={Size.Small} appearance={TextAppearance.Muted}>
        {label}
      </Text>
      <Text
        size={highlight ? Size.Medium : Size.Small}
        weight={highlight ? "bold" : muted ? "regular" : "medium"}
        appearance={muted ? TextAppearance.Muted : TextAppearance.Primary}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modal: {
    width: "100%",
    maxWidth: 400,
    padding: 0,
    overflow: "hidden",
  },
  header: {
    alignItems: "center",
    padding: spacing.lg,
    borderBottomWidth: 3,
    gap: spacing.sm,
  },
  statusIcon: {
    marginBottom: spacing.xs,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  tradeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  sideBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
  },
  detailsGrid: {
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border.subtle,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pnlSection: {
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radii.md,
    gap: spacing.xxs,
  },
  tradeId: {
    alignItems: "center",
  },
  actions: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.subtle,
  },
  actionButton: {
    width: "100%",
  },
});
