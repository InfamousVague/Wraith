/**
 * @file ClosePositionModal.tsx
 * @description Modal shown before closing a position for confirmation.
 *
 * Shows position details and current P&L before closing.
 */

import React from "react";
import { View, StyleSheet, Modal, Pressable } from "react-native";
import { Text, Button, Icon, Card } from "@wraith/ghost/components";
import { Size, Appearance, TextAppearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { spacing, radii } from "../../../styles/tokens";
import type { Position } from "../../../services/haunt";

export interface ClosePositionModalProps {
  visible: boolean;
  position: Position | null;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

function formatPrice(value: number): string {
  if (value >= 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (value >= 1) return value.toFixed(2);
  return value.toPrecision(4);
}

export function ClosePositionModal({
  visible,
  position,
  onConfirm,
  onCancel,
  loading = false,
}: ClosePositionModalProps) {
  if (!position) return null;

  const isLong = position.side === "long";
  const isPnlPositive = position.unrealizedPnl >= 0;
  const notionalValue = position.size * position.markPrice;

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
                name="alert-triangle"
                size={Size.Medium}
                color={Colors.status.warning}
              />
              <Text size={Size.Large} weight="bold">
                Close Position
              </Text>
            </View>
            <Pressable onPress={onCancel} style={styles.closeButton}>
              <Icon name="x" size={Size.Medium} color={Colors.text.muted} />
            </Pressable>
          </View>

          {/* Position Summary */}
          <View style={styles.content}>
            <View style={styles.positionHeader}>
              <View style={[
                styles.sideBadge,
                { backgroundColor: isLong ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)" }
              ]}>
                <Icon
                  name={isLong ? "arrow-up" : "arrow-down"}
                  size={Size.Small}
                  color={isLong ? Colors.status.success : Colors.status.danger}
                />
                <Text
                  size={Size.Small}
                  weight="semibold"
                  style={{ color: isLong ? Colors.status.success : Colors.status.danger }}
                >
                  {isLong ? "LONG" : "SHORT"}
                </Text>
              </View>
              <Text size={Size.Large} weight="bold">
                {position.symbol.toUpperCase()}
              </Text>
              <Text size={Size.Small} appearance={TextAppearance.Muted}>
                {position.leverage}x
              </Text>
            </View>

            {/* P&L Display */}
            <View style={[
              styles.pnlSection,
              { backgroundColor: isPnlPositive ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)" }
            ]}>
              <Text size={Size.Small} appearance={TextAppearance.Muted}>
                Unrealized P&L
              </Text>
              <Text
                size={Size.ExtraLarge}
                weight="bold"
                style={{ color: isPnlPositive ? Colors.status.success : Colors.status.danger }}
              >
                {isPnlPositive ? "+" : ""}{formatPrice(position.unrealizedPnl)} USD
              </Text>
              <Text
                size={Size.Small}
                style={{ color: isPnlPositive ? Colors.status.success : Colors.status.danger }}
              >
                {isPnlPositive ? "+" : ""}{position.unrealizedPnlPercent.toFixed(2)}%
              </Text>
            </View>

            {/* Details Grid */}
            <View style={styles.detailsGrid}>
              <DetailRow
                label="Size"
                value={`${position.size.toFixed(6)} ${position.symbol.toUpperCase()}`}
              />
              <DetailRow
                label="Entry Price"
                value={`$${formatPrice(position.entryPrice)}`}
              />
              <DetailRow
                label="Mark Price"
                value={`$${formatPrice(position.markPrice)}`}
                highlight
              />
              <DetailRow
                label="Notional Value"
                value={`$${formatPrice(notionalValue)}`}
              />
              <DetailRow
                label="Liquidation Price"
                value={`$${formatPrice(position.liquidationPrice)}`}
                muted
              />
            </View>

            {/* Warning */}
            <View style={styles.warning}>
              <Icon name="info" size={Size.Small} color={Colors.text.muted} />
              <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={{ flex: 1 }}>
                This will close your position at market price. The final P&L may differ
                slightly from the current value shown above.
              </Text>
            </View>
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
              label={loading ? "Closing..." : "Close Position"}
              appearance={isPnlPositive ? Appearance.Success : Appearance.Danger}
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
  positionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  sideBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
  },
  pnlSection: {
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radii.md,
    gap: spacing.xxs,
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
    backgroundColor: Colors.background.raised,
    borderRadius: radii.md,
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
