/**
 * Leverage Update Modal
 *
 * Modal for updating position leverage. Shows current leverage,
 * allows selection of new leverage, and displays the impact
 * on margin and liquidation price.
 */

import React, { useState, useMemo } from "react";
import { View, StyleSheet, Pressable, Modal, ScrollView } from "react-native";
import {
  Text,
  Icon,
  Button,
  Currency,
  Badge,
} from "@wraith/ghost/components";
import { Size, TextAppearance, Appearance, Shape } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { Colors } from "@wraith/ghost/tokens";
import { spacing, radii } from "../../styles/tokens";
import type { Position } from "../../services/haunt";

export type LeverageUpdateModalProps = {
  visible: boolean;
  position: Position;
  onClose: () => void;
  onConfirm: (newLeverage: number) => Promise<void>;
  maxLeverage?: number;
};

// Common leverage presets
const LEVERAGE_PRESETS = [1, 2, 3, 5, 10, 20, 25, 50, 75, 100, 125];

// Calculate estimated new liquidation price
function calculateLiquidationPrice(
  entryPrice: number,
  leverage: number,
  side: "long" | "short",
  maintenanceMargin: number = 0.005 // 0.5% default
): number {
  const marginRatio = 1 / leverage;

  if (side === "long") {
    // For long: liq price = entry * (1 - marginRatio + maintenanceMargin)
    return entryPrice * (1 - marginRatio + maintenanceMargin);
  } else {
    // For short: liq price = entry * (1 + marginRatio - maintenanceMargin)
    return entryPrice * (1 + marginRatio - maintenanceMargin);
  }
}

// Calculate margin requirement
function calculateMarginRequired(
  positionValue: number,
  leverage: number
): number {
  return positionValue / leverage;
}

export function LeverageUpdateModal({
  visible,
  position,
  onClose,
  onConfirm,
  maxLeverage = 125,
}: LeverageUpdateModalProps) {
  const themeColors = useThemeColors();
  const [selectedLeverage, setSelectedLeverage] = useState(position.leverage);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const markPrice = position.markPrice ?? position.currentPrice ?? 0;
  const quantity = Math.abs(position.size ?? position.quantity ?? 0);
  const positionValue = quantity * markPrice;

  // Filter presets based on max leverage
  const availablePresets = useMemo(() => {
    return LEVERAGE_PRESETS.filter((l) => l <= maxLeverage);
  }, [maxLeverage]);

  // Calculate metrics for selected leverage
  const newLiquidationPrice = useMemo(() => {
    return calculateLiquidationPrice(
      position.entryPrice,
      selectedLeverage,
      position.side
    );
  }, [position.entryPrice, selectedLeverage, position.side]);

  const currentMargin = useMemo(() => {
    return position.marginUsed ?? position.margin ?? positionValue / position.leverage;
  }, [position, positionValue]);

  const newMargin = useMemo(() => {
    return calculateMarginRequired(positionValue, selectedLeverage);
  }, [positionValue, selectedLeverage]);

  const marginDifference = newMargin - currentMargin;

  // Risk assessment
  const riskLevel = useMemo(() => {
    if (selectedLeverage >= 75) return "extreme";
    if (selectedLeverage >= 50) return "high";
    if (selectedLeverage >= 20) return "medium";
    if (selectedLeverage >= 10) return "elevated";
    return "low";
  }, [selectedLeverage]);

  const riskColor = useMemo(() => {
    switch (riskLevel) {
      case "extreme":
        return Colors.status.danger;
      case "high":
        return Colors.data.amber;
      case "medium":
        return Colors.status.warning;
      case "elevated":
        return Colors.status.info;
      default:
        return Colors.status.success;
    }
  }, [riskLevel]);

  const handleConfirm = async () => {
    if (selectedLeverage === position.leverage) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(selectedLeverage);
      onClose();
    } catch (err) {
      console.error("Failed to update leverage:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasChanged = selectedLeverage !== position.leverage;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.modal, { backgroundColor: themeColors.background.raised }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Icon name="sliders" size={Size.Medium} color={themeColors.text.muted} />
              <Text size={Size.Large} weight="semibold">
                Update Leverage
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={Size.Medium} color={themeColors.text.muted} />
            </Pressable>
          </View>

          {/* Position Info */}
          <View style={[styles.positionInfo, { backgroundColor: themeColors.background.surface }]}>
            <View style={styles.positionRow}>
              <Text size={Size.Medium} weight="semibold">
                {position.symbol}
              </Text>
              <Badge
                label={position.side.toUpperCase()}
                variant={position.side === "long" ? "success" : "danger"}
                size={Size.Small}
              />
            </View>
            <View style={styles.positionRow}>
              <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                Position Value
              </Text>
              <Currency value={positionValue} size={Size.Small} decimals={2} />
            </View>
          </View>

          {/* Current vs New Leverage */}
          <View style={styles.leverageComparison}>
            <View style={styles.leverageBox}>
              <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                Current
              </Text>
              <Text size={Size.Large} weight="bold">
                {position.leverage}x
              </Text>
            </View>
            <Icon name="arrow-right" size={Size.Medium} color={themeColors.text.muted} />
            <View style={styles.leverageBox}>
              <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                New
              </Text>
              <Text size={Size.Large} weight="bold" style={{ color: hasChanged ? Colors.accent.primary : themeColors.text.primary }}>
                {selectedLeverage}x
              </Text>
            </View>
          </View>

          {/* Leverage Selector */}
          <View style={styles.section}>
            <Text size={Size.Small} weight="semibold" style={{ marginBottom: spacing.sm }}>
              Select Leverage
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presetsContainer}
            >
              {availablePresets.map((lev) => {
                const isSelected = lev === selectedLeverage;
                const isRisky = lev >= 50;

                return (
                  <Pressable
                    key={lev}
                    style={[
                      styles.presetButton,
                      {
                        backgroundColor: isSelected
                          ? Colors.accent.primary
                          : themeColors.background.surface,
                        borderColor: isSelected
                          ? Colors.accent.primary
                          : themeColors.border.subtle,
                      },
                    ]}
                    onPress={() => setSelectedLeverage(lev)}
                  >
                    <Text
                      size={Size.Small}
                      weight={isSelected ? "semibold" : "regular"}
                      style={{
                        color: isSelected
                          ? Colors.text.primary
                          : isRisky
                          ? Colors.data.amber
                          : themeColors.text.primary,
                      }}
                    >
                      {lev}x
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Risk Indicator */}
          <View style={[styles.riskBanner, { backgroundColor: `${riskColor}15`, borderColor: riskColor }]}>
            <Icon
              name={riskLevel === "extreme" || riskLevel === "high" ? "alert-triangle" : "info"}
              size={Size.Small}
              color={riskColor}
            />
            <View style={{ flex: 1 }}>
              <Text size={Size.Small} weight="semibold" style={{ color: riskColor }}>
                {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
              </Text>
              <Text size={Size.TwoXSmall} style={{ color: riskColor, opacity: 0.8 }}>
                {riskLevel === "extreme"
                  ? "Extremely high liquidation risk. Only for experienced traders."
                  : riskLevel === "high"
                  ? "High leverage increases liquidation risk significantly."
                  : riskLevel === "medium"
                  ? "Moderate leverage. Monitor position closely."
                  : riskLevel === "elevated"
                  ? "Slightly elevated risk. Suitable for most strategies."
                  : "Conservative leverage with lower liquidation risk."}
              </Text>
            </View>
          </View>

          {/* Impact Preview */}
          <View style={styles.section}>
            <Text size={Size.Small} weight="semibold" style={{ marginBottom: spacing.sm }}>
              Impact Preview
            </Text>
            <View style={[styles.impactCard, { backgroundColor: themeColors.background.surface }]}>
              <View style={styles.impactRow}>
                <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                  Margin Required
                </Text>
                <View style={styles.impactValues}>
                  <Currency value={currentMargin} size={Size.Small} decimals={2} />
                  <Icon name="arrow-right" size={Size.ExtraSmall} color={themeColors.text.muted} />
                  <Currency
                    value={newMargin}
                    size={Size.Small}
                    decimals={2}
                    style={{ color: marginDifference > 0 ? Colors.status.danger : Colors.status.success }}
                  />
                </View>
              </View>
              <View style={styles.impactRow}>
                <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                  Margin Change
                </Text>
                <Text
                  size={Size.Small}
                  style={{ color: marginDifference > 0 ? Colors.status.danger : Colors.status.success }}
                >
                  {marginDifference >= 0 ? "+" : ""}
                  <Currency value={marginDifference} size={Size.Small} decimals={2} />
                </Text>
              </View>
              <View style={[styles.divider, { backgroundColor: themeColors.border.subtle }]} />
              <View style={styles.impactRow}>
                <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                  Est. Liquidation Price
                </Text>
                <View style={styles.impactValues}>
                  <Currency value={position.liquidationPrice ?? 0} size={Size.Small} decimals={2} />
                  <Icon name="arrow-right" size={Size.ExtraSmall} color={themeColors.text.muted} />
                  <Currency
                    value={newLiquidationPrice}
                    size={Size.Small}
                    decimals={2}
                    style={{
                      color:
                        position.side === "long"
                          ? newLiquidationPrice > (position.liquidationPrice ?? 0)
                            ? Colors.status.danger
                            : Colors.status.success
                          : newLiquidationPrice < (position.liquidationPrice ?? 0)
                          ? Colors.status.danger
                          : Colors.status.success,
                    }}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              label="Cancel"
              appearance={Appearance.Secondary}
              shape={Shape.Rounded}
              onPress={onClose}
              disabled={isSubmitting}
            />
            <Button
              label={hasChanged ? "Confirm" : "No Change"}
              appearance={hasChanged ? Appearance.Primary : Appearance.Secondary}
              shape={Shape.Rounded}
              onPress={handleConfirm}
              loading={isSubmitting}
              disabled={!hasChanged || isSubmitting}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  modal: {
    width: "100%",
    maxWidth: 480,
    borderRadius: radii.lg,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  closeButton: {
    padding: spacing.xs,
  },
  positionInfo: {
    padding: spacing.md,
    borderRadius: radii.md,
    gap: spacing.xs,
  },
  positionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leverageComparison: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.xl,
  },
  leverageBox: {
    alignItems: "center",
    gap: spacing.xs,
  },
  section: {
    gap: spacing.xs,
  },
  presetsContainer: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  presetButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    minWidth: 48,
    alignItems: "center",
  },
  riskBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  impactCard: {
    padding: spacing.md,
    borderRadius: radii.md,
    gap: spacing.sm,
  },
  impactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  impactValues: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  divider: {
    height: 1,
    marginVertical: spacing.xs,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});

export default LeverageUpdateModal;
