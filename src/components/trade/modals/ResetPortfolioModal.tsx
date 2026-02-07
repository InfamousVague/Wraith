/**
 * @file ResetPortfolioModal.tsx
 * @description Confirmation modal shown before resetting a portfolio.
 *
 * Warns the user that all positions, orders, and trade history will be wiped
 * and the balance will be restored to the starting amount.
 */

import React from "react";
import { View, StyleSheet, Modal, Pressable } from "react-native";
import { Text, Button, Icon, Card, Currency } from "@wraith/ghost/components";
import { Size, Appearance, TextAppearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { spacing, radii } from "../../../styles/tokens";

export interface ResetPortfolioModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  startingBalance?: number;
  currentBalance?: number;
}

export function ResetPortfolioModal({
  visible,
  onConfirm,
  onCancel,
  loading = false,
  startingBalance = 250000,
  currentBalance,
}: ResetPortfolioModalProps) {
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
                Reset Portfolio
              </Text>
            </View>
            <Pressable onPress={onCancel} style={styles.closeButton}>
              <Icon name="x" size={Size.Medium} color={Colors.text.muted} />
            </Pressable>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <Icon
                  name="refresh-cw"
                  size={Size.Large}
                  color={Colors.status.warning}
                />
              </View>
            </View>

            <Text
              size={Size.Small}
              appearance={TextAppearance.Muted}
              style={styles.description}
            >
              This will permanently reset your portfolio to its starting state. All open positions will be closed, pending orders cancelled, and your balance restored.
            </Text>

            {/* What will happen */}
            <View style={styles.impactSection}>
              <ImpactRow icon="x-circle" label="Close all open positions" />
              <ImpactRow icon="x-circle" label="Cancel all pending orders" />
              <ImpactRow icon="rotate-ccw" label="Clear all trade history" />
              <ImpactRow
                icon="dollar-sign"
                label={`Restore balance to $${startingBalance.toLocaleString()}`}
                highlight
              />
            </View>

            {currentBalance !== undefined && (
              <View style={styles.balanceComparison}>
                <View style={styles.balanceRow}>
                  <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                    Current Balance
                  </Text>
                  <Currency
                    value={currentBalance}
                    size={Size.Small}
                    weight="medium"
                    decimals={2}
                  />
                </View>
                <View style={styles.balanceArrow}>
                  <Icon name="arrow-down" size={Size.Small} color={Colors.text.muted} />
                </View>
                <View style={styles.balanceRow}>
                  <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                    After Reset
                  </Text>
                  <Currency
                    value={startingBalance}
                    size={Size.Small}
                    weight="semibold"
                    color={Colors.status.success}
                    decimals={2}
                  />
                </View>
              </View>
            )}

            {/* Warning */}
            <View style={styles.warning}>
              <Icon name="info" size={Size.Small} color={Colors.status.warning} />
              <Text
                size={Size.ExtraSmall}
                appearance={TextAppearance.Muted}
                style={{ flex: 1 }}
              >
                This action cannot be undone. Your trading history and performance
                data will be permanently erased.
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
              label={loading ? "Resetting..." : "Reset Portfolio"}
              appearance={Appearance.Danger}
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

function ImpactRow({
  icon,
  label,
  highlight = false,
}: {
  icon: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.impactRow}>
      <Icon
        name={icon}
        size={Size.Small}
        color={highlight ? Colors.status.success : Colors.text.muted}
      />
      <Text
        size={Size.Small}
        style={highlight ? { color: Colors.status.success } : undefined}
        appearance={highlight ? undefined : TextAppearance.Muted}
      >
        {label}
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
  iconContainer: {
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  description: {
    textAlign: "center",
    lineHeight: 20,
  },
  impactSection: {
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: Colors.background.raised,
    borderRadius: radii.md,
  },
  impactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  balanceComparison: {
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    borderRadius: radii.md,
    gap: spacing.xs,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceArrow: {
    alignItems: "center",
    paddingVertical: 2,
  },
  warning: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: "rgba(245, 158, 11, 0.08)",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.15)",
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
