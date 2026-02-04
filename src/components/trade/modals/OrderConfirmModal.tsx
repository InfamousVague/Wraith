/**
 * @file OrderConfirmModal.tsx
 * @description Modal shown before placing an order for confirmation.
 *
 * Shows order details and estimated fees for review before submission.
 */

import React, { useState } from "react";
import { View, StyleSheet, Modal, Pressable } from "react-native";
import { Text, Button, Icon, Card } from "@wraith/ghost/components";
import { Size, Appearance, TextAppearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { spacing, radii } from "../../../styles/tokens";
import type { OrderFormState } from "../order-form/types";

export interface OrderConfirmModalProps {
  visible: boolean;
  order: OrderFormState | null;
  symbol: string;
  currentPrice?: number;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

// Estimated fee rate (0.1%)
const FEE_RATE = 0.001;

function formatPrice(value: number): string {
  if (value >= 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (value >= 1) return value.toFixed(2);
  return value.toPrecision(4);
}

export function OrderConfirmModal({
  visible,
  order,
  symbol,
  currentPrice,
  onConfirm,
  onCancel,
  loading = false,
}: OrderConfirmModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!order) return null;

  const size = parseFloat(order.size) || 0;
  const price = order.orderType === "market"
    ? currentPrice
    : parseFloat(order.price) || currentPrice;
  const notionalValue = size * (price || 0);
  const estimatedFee = notionalValue * FEE_RATE;
  const marginRequired = notionalValue / order.leverage;
  const isBuy = order.side === "buy";

  const orderTypeLabels: Record<string, string> = {
    market: "Market Order",
    limit: "Limit Order",
    stop_loss: "Stop Loss",
    take_profit: "Take Profit",
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <Card style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitle}>
              <Icon
                name={isBuy ? "trending-up" : "trending-down"}
                size={Size.Medium}
                color={isBuy ? Colors.status.success : Colors.status.danger}
              />
              <Text size={Size.Large} weight="bold">
                Confirm Order
              </Text>
            </View>
            <Pressable onPress={onCancel} style={styles.closeButton}>
              <Icon name="x" size={Size.Medium} color={Colors.text.muted} />
            </Pressable>
          </View>

          {/* Order Summary */}
          <View style={styles.content}>
            <View style={styles.orderHeader}>
              <Text size={Size.Medium} weight="semibold">
                {isBuy ? "Buy" : "Sell"} {symbol}
              </Text>
              <View style={[
                styles.orderTypeBadge,
                { backgroundColor: isBuy ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)" }
              ]}>
                <Text
                  size={Size.ExtraSmall}
                  style={{ color: isBuy ? Colors.status.success : Colors.status.danger }}
                >
                  {orderTypeLabels[order.orderType]}
                </Text>
              </View>
            </View>

            {/* Details Grid */}
            <View style={styles.detailsGrid}>
              <DetailRow label="Side" value={isBuy ? "Long" : "Short"} />
              <DetailRow label="Size" value={`${size.toFixed(6)} ${symbol}`} />
              <DetailRow
                label={order.orderType === "market" ? "Est. Price" : "Limit Price"}
                value={price ? `$${formatPrice(price)}` : "-"}
              />
              <DetailRow label="Leverage" value={`${order.leverage}x`} />
              <DetailRow
                label="Notional Value"
                value={`$${formatPrice(notionalValue)}`}
              />
              <DetailRow
                label="Margin Required"
                value={`$${formatPrice(marginRequired)}`}
              />
              <DetailRow
                label="Est. Fee"
                value={`$${formatPrice(estimatedFee)}`}
                muted
              />
            </View>

            {/* Warning for market orders */}
            {order.orderType === "market" && (
              <View style={styles.warning}>
                <Icon name="alert-circle" size={Size.Small} color={Colors.status.warning} />
                <Text size={Size.ExtraSmall} style={{ color: Colors.status.warning, flex: 1 }}>
                  Market orders execute immediately at the best available price.
                  Actual execution price may differ from estimate.
                </Text>
              </View>
            )}

            {/* Don't show again checkbox */}
            <Pressable
              style={styles.checkbox}
              onPress={() => setDontShowAgain(!dontShowAgain)}
            >
              <View style={[styles.checkboxBox, dontShowAgain && styles.checkboxChecked]}>
                {dontShowAgain && (
                  <Icon name="check" size={Size.ExtraSmall} color={Colors.text.inverse} />
                )}
              </View>
              <Text size={Size.Small} appearance={TextAppearance.Muted}>
                Don't show confirmation for this session
              </Text>
            </Pressable>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              label="Cancel"
              appearance={Appearance.Secondary}
              size={Size.Medium}
              onPress={onCancel}
              style={styles.actionButton}
            />
            <Button
              label={loading ? "Placing..." : "Confirm Order"}
              appearance={isBuy ? Appearance.Success : Appearance.Danger}
              size={Size.Medium}
              onPress={onConfirm}
              disabled={loading}
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
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <View style={styles.detailRow}>
      <Text size={Size.Small} appearance={TextAppearance.Muted}>
        {label}
      </Text>
      <Text
        size={Size.Small}
        weight={muted ? "regular" : "medium"}
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
    maxWidth: 420,
    padding: 0,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  orderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  orderTypeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.sm,
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
  warning: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderRadius: radii.md,
  },
  checkbox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border.default,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: Colors.accent.primary,
    borderColor: Colors.accent.primary,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.subtle,
  },
  actionButton: {
    flex: 1,
  },
});
