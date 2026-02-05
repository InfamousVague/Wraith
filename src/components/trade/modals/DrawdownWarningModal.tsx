/**
 * DrawdownWarningModal Component
 *
 * Warning modal shown when portfolio is stopped due to drawdown protection.
 * Shows current drawdown status and allows users to bypass protection,
 * reset portfolio, or adjust settings.
 */

import React from "react";
import { View, StyleSheet, Modal, Pressable } from "react-native";
import { Card, Text, Button, Icon, ProgressBar } from "@wraith/ghost/components";
import { Size, TextAppearance, Shape, Appearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { spacing, radii } from "../../../styles/tokens";
import { useTradingSettings } from "../../../hooks/useTradingSettings";

export type DrawdownWarningModalProps = {
  /** Whether the modal is visible */
  visible: boolean;
  /** Current drawdown percentage */
  currentDrawdown?: number;
  /** Maximum allowed drawdown percentage (from settings) */
  maxDrawdown?: number;
  /** Callback when user chooses to bypass for this trade */
  onBypassOnce: () => void;
  /** Callback when user chooses to reset portfolio */
  onResetPortfolio: () => void;
  /** Callback when user cancels */
  onCancel: () => void;
  /** Callback to navigate to settings */
  onOpenSettings?: () => void;
  /** Whether an action is in progress */
  loading?: boolean;
};

export function DrawdownWarningModal({
  visible,
  currentDrawdown,
  maxDrawdown,
  onBypassOnce,
  onResetPortfolio,
  onCancel,
  onOpenSettings,
  loading = false,
}: DrawdownWarningModalProps) {
  const { settings } = useTradingSettings();
  const { drawdownProtection } = settings;

  // Use props if provided, otherwise fall back to settings
  const displayCurrentDrawdown = currentDrawdown ?? 0;
  const displayMaxDrawdown = maxDrawdown ?? drawdownProtection.maxDrawdownPercent;

  // Calculate progress (0-1 scale)
  const progress = displayMaxDrawdown > 0
    ? Math.min(1, displayCurrentDrawdown / displayMaxDrawdown)
    : 0;

  // Determine severity for visual styling
  const isCritical = progress >= 1;
  const isWarning = progress >= 0.75 && progress < 1;

  // Whether bypass is allowed by settings
  const canBypass = drawdownProtection.allowBypass;

  // Merge styles to avoid array (Ghost Card doesn't handle style arrays in react-native-web)
  const modalStyle = isCritical
    ? { ...styles.modal, ...styles.modalCritical }
    : styles.modal;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <Card style={modalStyle}>
            <View style={styles.content}>
              {/* Warning icon */}
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: isCritical
                      ? Colors.status.dangerSurface
                      : Colors.status.warningSurface,
                  },
                ]}
              >
                <Icon
                  name={isCritical ? "error" : "warning"}
                  size={Size.Large}
                  color={isCritical ? Colors.status.danger : Colors.status.warning}
                />
              </View>

              {/* Title */}
              <Text size={Size.Large} weight="bold" style={styles.title}>
                Drawdown Protection Triggered
              </Text>

              {/* Drawdown Status */}
              <View style={styles.drawdownStatus}>
                <View style={styles.drawdownRow}>
                  <View style={styles.drawdownItem}>
                    <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                      Current
                    </Text>
                    <Text
                      size={Size.Large}
                      weight="bold"
                      style={{ color: Colors.status.danger }}
                    >
                      -{displayCurrentDrawdown.toFixed(1)}%
                    </Text>
                  </View>
                  <View style={styles.drawdownDivider} />
                  <View style={styles.drawdownItem}>
                    <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                      Limit
                    </Text>
                    <Text size={Size.Large} weight="bold">
                      -{displayMaxDrawdown}%
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <ProgressBar
                    value={progress * 100}
                    max={100}
                    size={Size.Small}
                    appearance={isCritical ? TextAppearance.Danger : TextAppearance.Warning}
                  />
                  <View style={styles.progressLabels}>
                    <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                      0%
                    </Text>
                    <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                      -{displayMaxDrawdown}%
                    </Text>
                  </View>
                </View>
              </View>

              {/* Warning message */}
              <Text
                size={Size.Small}
                appearance={TextAppearance.Muted}
                style={styles.message}
              >
                {isCritical
                  ? "Your portfolio has been stopped to protect against further losses."
                  : "You are approaching the maximum drawdown limit."}
              </Text>

              {/* Info box */}
              {canBypass ? (
                <View
                  style={[
                    styles.infoBox,
                    { backgroundColor: Colors.status.infoSurface },
                  ]}
                >
                  <Icon name="info" size={Size.Small} color={Colors.status.info} />
                  <View style={styles.infoText}>
                    <Text size={Size.Small} style={{ color: Colors.status.info }}>
                      You can bypass this protection for a single trade.
                    </Text>
                  </View>
                </View>
              ) : (
                <View
                  style={[
                    styles.infoBox,
                    { backgroundColor: Colors.status.warningSurface },
                  ]}
                >
                  <Icon name="lock" size={Size.Small} color={Colors.status.warning} />
                  <View style={styles.infoText}>
                    <Text size={Size.Small} style={{ color: Colors.status.warning }}>
                      Bypass is disabled in your settings. Adjust settings to enable it.
                    </Text>
                  </View>
                </View>
              )}

              {/* Action buttons */}
              <View style={styles.actions}>
                {canBypass && (
                  <View style={styles.fullWidthButton}>
                    <Button
                      label="Bypass for This Trade"
                      onPress={onBypassOnce}
                      size={Size.Small}
                      shape={Shape.Rounded}
                      appearance={Appearance.Secondary}
                      leadingIcon="unlock"
                      disabled={loading}
                      fullWidth
                    />
                  </View>
                )}

                <View style={styles.inlineButtons}>
                  {onOpenSettings && (
                    <View style={styles.inlineButton}>
                      <Button
                        label="Adjust Settings"
                        onPress={onOpenSettings}
                        size={Size.Small}
                        shape={Shape.Rounded}
                        appearance={Appearance.Secondary}
                        leadingIcon="settings"
                        disabled={loading}
                        fullWidth
                      />
                    </View>
                  )}

                  <View style={styles.inlineButton}>
                    <Button
                      label="Cancel"
                      onPress={onCancel}
                      size={Size.Small}
                      shape={Shape.Rounded}
                      appearance={Appearance.Tertiary}
                      disabled={loading}
                      fullWidth
                    />
                  </View>
                </View>
              </View>
            </View>
          </Card>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  modal: {
    width: "100%",
    maxWidth: 420,
  },
  modalCritical: {
    borderColor: Colors.status.danger,
    borderWidth: 1,
  },
  content: {
    padding: spacing.xl,
    alignItems: "center",
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: {
    marginBottom: spacing.md,
    textAlign: "center",
  },
  drawdownStatus: {
    width: "100%",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  drawdownRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  drawdownItem: {
    alignItems: "center",
    gap: spacing.xxs,
  },
  drawdownDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  progressContainer: {
    width: "100%",
    gap: spacing.xs,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  message: {
    textAlign: "center",
    marginBottom: spacing.md,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    width: "100%",
    marginBottom: spacing.lg,
  },
  infoText: {
    flex: 1,
    gap: spacing.xxs,
  },
  actions: {
    width: "100%",
    gap: spacing.sm,
    alignItems: "center",
  },
  fullWidthButton: {
    width: "100%",
  },
  inlineButtons: {
    flexDirection: "row",
    gap: spacing.sm,
    width: "100%",
  },
  inlineButton: {
    flex: 1,
  },
});
