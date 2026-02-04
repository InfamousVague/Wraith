/**
 * @file CreateAlertModal.tsx
 * @description Modal for creating a new price alert.
 *
 * Allows users to set up price alerts with:
 * - Symbol selection
 * - Condition (above/below/crosses)
 * - Target price input
 */

import React, { useState, useEffect } from "react";
import { View, StyleSheet, Modal, Pressable } from "react-native";
import { Text, Button, Icon, Input, SegmentedControl } from "@wraith/ghost/components";
import { Colors } from "@wraith/ghost/tokens";
import { Size, Appearance, TextAppearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { spacing, radii } from "../../../styles/tokens";
import type { AlertCondition, CreateAlertRequest } from "../../../services/haunt";

type CreateAlertModalProps = {
  visible: boolean;
  symbol: string;
  currentPrice?: number;
  onSubmit: (request: CreateAlertRequest) => Promise<void>;
  onClose: () => void;
  loading?: boolean;
};

const CONDITION_OPTIONS = [
  { value: "above", label: "Above" },
  { value: "below", label: "Below" },
  { value: "crosses", label: "Crosses" },
];

export function CreateAlertModal({
  visible,
  symbol,
  currentPrice,
  onSubmit,
  onClose,
  loading = false,
}: CreateAlertModalProps) {
  const themeColors = useThemeColors();
  const [condition, setCondition] = useState<AlertCondition>("above");
  const [targetPrice, setTargetPrice] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setCondition("above");
      setTargetPrice("");
      setError(null);
    }
  }, [visible]);

  // Set initial target price based on condition and current price
  useEffect(() => {
    if (visible && currentPrice && !targetPrice) {
      const suggestedPrice = condition === "above"
        ? currentPrice * 1.05 // 5% above
        : currentPrice * 0.95; // 5% below
      setTargetPrice(suggestedPrice.toFixed(currentPrice < 1 ? 6 : 2));
    }
  }, [visible, currentPrice, condition, targetPrice]);

  const handleSubmit = async () => {
    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
      setError("Please enter a valid price");
      return;
    }

    // Validate condition vs current price
    if (currentPrice) {
      if (condition === "above" && price <= currentPrice) {
        setError("Target price must be above current price");
        return;
      }
      if (condition === "below" && price >= currentPrice) {
        setError("Target price must be below current price");
        return;
      }
    }

    setError(null);

    try {
      await onSubmit({
        symbol: symbol.toLowerCase(),
        condition,
        targetPrice: price,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create alert");
    }
  };

  const handleConditionChange = (value: string) => {
    setCondition(value as AlertCondition);
    // Recalculate suggested price when condition changes
    if (currentPrice) {
      const suggestedPrice = value === "above"
        ? currentPrice * 1.05
        : currentPrice * 0.95;
      setTargetPrice(suggestedPrice.toFixed(currentPrice < 1 ? 6 : 2));
    }
    setError(null);
  };

  const getConditionDescription = () => {
    switch (condition) {
      case "above":
        return `Alert when ${symbol.toUpperCase()} goes above target price`;
      case "below":
        return `Alert when ${symbol.toUpperCase()} drops below target price`;
      case "crosses":
        return `Alert when ${symbol.toUpperCase()} crosses target price in either direction`;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: themeColors.background.raised }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitle}>
              <Icon name="bell" size={Size.Medium} color={Colors.accent.primary} />
              <Text size={Size.Large} weight="semibold">
                Create Price Alert
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Icon name="x" size={Size.Medium} color={themeColors.text.muted} />
            </Pressable>
          </View>

          {/* Symbol & Current Price */}
          <View style={styles.symbolSection}>
            <Text size={Size.ExtraLarge} weight="bold">
              {symbol.toUpperCase()}
            </Text>
            {currentPrice && (
              <Text size={Size.Medium} appearance={TextAppearance.Muted}>
                Current: ${currentPrice.toLocaleString(undefined, {
                  minimumFractionDigits: currentPrice < 1 ? 6 : 2,
                  maximumFractionDigits: currentPrice < 1 ? 6 : 2,
                })}
              </Text>
            )}
          </View>

          {/* Condition Selector */}
          <View style={styles.section}>
            <Text size={Size.Small} weight="semibold" style={styles.label}>
              Condition
            </Text>
            <SegmentedControl
              options={CONDITION_OPTIONS}
              value={condition}
              onChange={handleConditionChange}
            />
            <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.conditionDesc}>
              {getConditionDescription()}
            </Text>
          </View>

          {/* Target Price Input */}
          <View style={styles.section}>
            <Text size={Size.Small} weight="semibold" style={styles.label}>
              Target Price
            </Text>
            <Input
              value={targetPrice}
              onChangeText={(text) => {
                setTargetPrice(text);
                setError(null);
              }}
              placeholder="Enter target price"
              keyboardType="decimal-pad"
              leadingIcon="dollar-sign"
            />
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle" size={Size.Small} color={Colors.status.danger} />
              <Text size={Size.Small} style={{ color: Colors.status.danger }}>
                {error}
              </Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              label="Cancel"
              onPress={onClose}
              appearance={Appearance.Secondary}
              style={styles.actionButton}
              disabled={loading}
            />
            <Button
              label="Create Alert"
              onPress={handleSubmit}
              appearance={Appearance.Primary}
              style={styles.actionButton}
              loading={loading}
              leadingIcon="bell"
            />
          </View>
        </View>
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
    maxWidth: 400,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  closeButton: {
    padding: spacing.xs,
    borderRadius: radii.md,
  },
  symbolSection: {
    alignItems: "center",
    marginBottom: spacing.lg,
    gap: spacing.xxs,
  },
  section: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: spacing.xs,
  },
  conditionDesc: {
    marginTop: spacing.xs,
    textAlign: "center",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.md,
    padding: spacing.sm,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: radii.md,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});
