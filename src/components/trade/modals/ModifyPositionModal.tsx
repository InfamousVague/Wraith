/**
 * @file ModifyPositionModal.tsx
 * @description Modal for modifying position stop loss, take profit, and trailing stop.
 */

import React, { useState, useEffect } from "react";
import { View, StyleSheet, Modal, Pressable, TextInput } from "react-native";
import { Text, Button, Icon, Card } from "@wraith/ghost/components";
import { Size, Appearance, TextAppearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { spacing, radii } from "../../../styles/tokens";
import type { Position } from "../../../services/haunt";

export interface ModifyPositionModalProps {
  visible: boolean;
  position: Position | null;
  onSave: (changes: { stopLoss?: number | null; takeProfit?: number | null; trailingStop?: number | null }) => void;
  onCancel: () => void;
  loading?: boolean;
}

function formatPrice(value: number): string {
  if (value >= 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (value >= 1) return value.toFixed(2);
  return value.toPrecision(4);
}

export function ModifyPositionModal({
  visible,
  position,
  onSave,
  onCancel,
  loading = false,
}: ModifyPositionModalProps) {
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [trailingStop, setTrailingStop] = useState("");

  // Initialize form when position changes
  useEffect(() => {
    if (position) {
      setStopLoss(position.stopLoss?.toString() || "");
      setTakeProfit(position.takeProfit?.toString() || "");
      setTrailingStop(position.trailingStop?.toString() || "");
    }
  }, [position]);

  if (!position) return null;

  const isLong = position.side === "long";
  const isPnlPositive = position.unrealizedPnl >= 0;

  const handleSave = () => {
    const changes: { stopLoss?: number | null; takeProfit?: number | null; trailingStop?: number | null } = {};

    // Parse values, treating empty string as null (remove)
    if (stopLoss !== (position.stopLoss?.toString() || "")) {
      changes.stopLoss = stopLoss ? parseFloat(stopLoss) : null;
    }
    if (takeProfit !== (position.takeProfit?.toString() || "")) {
      changes.takeProfit = takeProfit ? parseFloat(takeProfit) : null;
    }
    if (trailingStop !== (position.trailingStop?.toString() || "")) {
      changes.trailingStop = trailingStop ? parseFloat(trailingStop) : null;
    }

    onSave(changes);
  };

  // Validate stop loss and take profit based on position side
  const stopLossNum = parseFloat(stopLoss) || 0;
  const takeProfitNum = parseFloat(takeProfit) || 0;

  let stopLossError = "";
  let takeProfitError = "";

  if (stopLoss && stopLossNum > 0) {
    if (isLong && stopLossNum >= position.markPrice) {
      stopLossError = "Stop loss must be below current price for long positions";
    } else if (!isLong && stopLossNum <= position.markPrice) {
      stopLossError = "Stop loss must be above current price for short positions";
    }
  }

  if (takeProfit && takeProfitNum > 0) {
    if (isLong && takeProfitNum <= position.markPrice) {
      takeProfitError = "Take profit must be above current price for long positions";
    } else if (!isLong && takeProfitNum >= position.markPrice) {
      takeProfitError = "Take profit must be below current price for short positions";
    }
  }

  const hasErrors = !!stopLossError || !!takeProfitError;

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
              <Icon name="edit-2" size={Size.Medium} color={Colors.accent.primary} />
              <Text size={Size.Large} weight="bold">
                Modify Position
              </Text>
            </View>
            <Pressable onPress={onCancel} style={styles.closeButton}>
              <Icon name="x" size={Size.Medium} color={Colors.text.muted} />
            </Pressable>
          </View>

          {/* Position Info */}
          <View style={styles.content}>
            <View style={styles.positionInfo}>
              <View style={styles.positionHeader}>
                <View style={[
                  styles.sideBadge,
                  { backgroundColor: isLong ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)" }
                ]}>
                  <Text
                    size={Size.Small}
                    weight="semibold"
                    style={{ color: isLong ? Colors.status.success : Colors.status.danger }}
                  >
                    {isLong ? "LONG" : "SHORT"} {position.leverage}x
                  </Text>
                </View>
                <Text size={Size.Large} weight="bold">
                  {position.symbol.toUpperCase()}
                </Text>
              </View>
              <View style={styles.positionStats}>
                <View style={styles.statItem}>
                  <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>Entry</Text>
                  <Text size={Size.Small}>${formatPrice(position.entryPrice)}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>Mark</Text>
                  <Text size={Size.Small}>${formatPrice(position.markPrice)}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>P&L</Text>
                  <Text
                    size={Size.Small}
                    style={{ color: isPnlPositive ? Colors.status.success : Colors.status.danger }}
                  >
                    {isPnlPositive ? "+" : ""}{formatPrice(position.unrealizedPnl)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Form Fields */}
            <View style={styles.form}>
              {/* Stop Loss */}
              <View style={styles.fieldGroup}>
                <View style={styles.fieldHeader}>
                  <Text size={Size.Small} weight="medium">Stop Loss</Text>
                  {position.stopLoss && (
                    <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                      Current: ${formatPrice(position.stopLoss)}
                    </Text>
                  )}
                </View>
                <View style={[styles.inputContainer, stopLossError && styles.inputError]}>
                  <Text size={Size.Small} appearance={TextAppearance.Muted}>$</Text>
                  <TextInput
                    style={styles.input}
                    value={stopLoss}
                    onChangeText={setStopLoss}
                    placeholder="Enter price"
                    placeholderTextColor={Colors.text.muted}
                    keyboardType="decimal-pad"
                  />
                  {stopLoss && (
                    <Pressable onPress={() => setStopLoss("")}>
                      <Icon name="x" size={Size.Small} color={Colors.text.muted} />
                    </Pressable>
                  )}
                </View>
                {stopLossError && (
                  <Text size={Size.ExtraSmall} style={styles.errorText}>{stopLossError}</Text>
                )}
              </View>

              {/* Take Profit */}
              <View style={styles.fieldGroup}>
                <View style={styles.fieldHeader}>
                  <Text size={Size.Small} weight="medium">Take Profit</Text>
                  {position.takeProfit && (
                    <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                      Current: ${formatPrice(position.takeProfit)}
                    </Text>
                  )}
                </View>
                <View style={[styles.inputContainer, takeProfitError && styles.inputError]}>
                  <Text size={Size.Small} appearance={TextAppearance.Muted}>$</Text>
                  <TextInput
                    style={styles.input}
                    value={takeProfit}
                    onChangeText={setTakeProfit}
                    placeholder="Enter price"
                    placeholderTextColor={Colors.text.muted}
                    keyboardType="decimal-pad"
                  />
                  {takeProfit && (
                    <Pressable onPress={() => setTakeProfit("")}>
                      <Icon name="x" size={Size.Small} color={Colors.text.muted} />
                    </Pressable>
                  )}
                </View>
                {takeProfitError && (
                  <Text size={Size.ExtraSmall} style={styles.errorText}>{takeProfitError}</Text>
                )}
              </View>

              {/* Trailing Stop */}
              <View style={styles.fieldGroup}>
                <View style={styles.fieldHeader}>
                  <Text size={Size.Small} weight="medium">Trailing Stop (%)</Text>
                  {position.trailingStop && (
                    <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                      Current: {position.trailingStop}%
                    </Text>
                  )}
                </View>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={trailingStop}
                    onChangeText={setTrailingStop}
                    placeholder="e.g., 5"
                    placeholderTextColor={Colors.text.muted}
                    keyboardType="decimal-pad"
                  />
                  <Text size={Size.Small} appearance={TextAppearance.Muted}>%</Text>
                </View>
              </View>
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
              label={loading ? "Saving..." : "Save Changes"}
              appearance={Appearance.Primary}
              size={Size.Medium}
              onPress={handleSave}
              disabled={loading || hasErrors}
              style={styles.actionButton}
            />
          </View>
        </Card>
      </View>
    </Modal>
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
    maxWidth: 440,
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
  positionInfo: {
    backgroundColor: Colors.background.raised,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  positionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sideBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
  },
  positionStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
    gap: 2,
  },
  form: {
    gap: spacing.md,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  fieldHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background.raised,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  inputError: {
    borderColor: Colors.status.danger,
  },
  input: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: 14,
    padding: 0,
  },
  errorText: {
    color: Colors.status.danger,
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
