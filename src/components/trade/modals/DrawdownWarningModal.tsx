/**
 * DrawdownWarningModal Component
 *
 * Warning modal shown when portfolio is stopped due to drawdown protection.
 * Allows users to bypass protection for a single trade, disable it, or reset portfolio.
 */

import React from "react";
import { View, StyleSheet, Modal, Pressable } from "react-native";
import { Card, Text, Button, Icon } from "@wraith/ghost/components";
import { Size, TextAppearance, Shape, Appearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { spacing, radii } from "../../../styles/tokens";

type Props = {
  visible: boolean;
  onBypassOnce: () => void;
  onResetPortfolio: () => void;
  onCancel: () => void;
  loading?: boolean;
};

export function DrawdownWarningModal({
  visible,
  onBypassOnce,
  onResetPortfolio,
  onCancel,
  loading = false,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <Card style={styles.modal}>
            <View style={styles.content}>
              {/* Warning icon */}
              <View style={[styles.iconContainer, { backgroundColor: Colors.status.warningSurface }]}>
                <Icon name="alert-triangle" size={Size.Large} color={Colors.status.warning} />
              </View>

              {/* Title */}
              <Text size={Size.Large} weight="bold" style={styles.title}>
                Drawdown Protection Triggered
              </Text>

              {/* Warning message */}
              <Text
                size={Size.Medium}
                appearance={TextAppearance.Muted}
                style={styles.message}
              >
                Your portfolio has been stopped to protect against further losses.
                You have exceeded the maximum drawdown limit.
              </Text>

              {/* Info box */}
              <View style={[styles.infoBox, { backgroundColor: Colors.status.warningSurface }]}>
                <Icon name="info" size={Size.Small} color={Colors.status.warning} />
                <View style={styles.infoText}>
                  <Text size={Size.Small} style={{ color: Colors.status.warning }}>
                    You can bypass this protection for a single trade, or reset your portfolio to start fresh.
                  </Text>
                </View>
              </View>

              {/* Action buttons */}
              <View style={styles.actions}>
                <Button
                  label="Bypass for This Trade"
                  onPress={onBypassOnce}
                  size={Size.Small}
                  shape={Shape.Rounded}
                  appearance={Appearance.Secondary}
                  leadingIcon="unlock"
                  style={styles.fullWidthButton}
                  disabled={loading}
                />

                <Button
                  label="Reset Portfolio"
                  onPress={onResetPortfolio}
                  size={Size.Small}
                  shape={Shape.Rounded}
                  style={[styles.fullWidthButton, { backgroundColor: Colors.status.warning }]}
                  leadingIcon="refresh-cw"
                  disabled={loading}
                />

                <Button
                  label="Cancel"
                  onPress={onCancel}
                  size={Size.Small}
                  shape={Shape.Rounded}
                  appearance={Appearance.Secondary}
                  disabled={loading}
                />
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
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  message: {
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    width: "100%",
    marginBottom: spacing.xl,
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
});
