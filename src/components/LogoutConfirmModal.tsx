/**
 * LogoutConfirmModal Component
 *
 * Confirmation modal for logging out with a warning about backing up keys.
 */

import React from "react";
import { View, StyleSheet, Modal, Pressable } from "react-native";
import { Card, Text, Button, Icon } from "@wraith/ghost/components";
import { Size, TextAppearance, Shape, Appearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";

type Props = {
  visible: boolean;
  hasBackedUpKey: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onBackupKey: () => void;
};

export function LogoutConfirmModal({
  visible,
  hasBackedUpKey,
  onConfirm,
  onCancel,
  onBackupKey,
}: Props) {
  const themeColors = useThemeColors();

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
              <View style={[styles.iconContainer, { backgroundColor: "rgba(239, 68, 68, 0.1)" }]}>
                <Icon name="alert-triangle" size={Size.Large} color="#EF4444" />
              </View>

              {/* Title */}
              <Text size={Size.Large} weight="bold" style={styles.title}>
                Log Out?
              </Text>

              {/* Warning message */}
              <Text
                size={Size.Medium}
                appearance={TextAppearance.Muted}
                style={styles.message}
              >
                Are you sure you want to log out? You will need your private key to
                access this account again.
              </Text>

              {/* Key backup warning */}
              <View
                style={[
                  styles.warningBox,
                  { backgroundColor: hasBackedUpKey ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)" },
                ]}
              >
                <Icon
                  name={hasBackedUpKey ? "check-circle" : "alert-circle"}
                  size={Size.Small}
                  color={hasBackedUpKey ? "#22C55E" : "#EF4444"}
                />
                <View style={styles.warningText}>
                  {hasBackedUpKey ? (
                    <Text size={Size.Small} style={{ color: "#22C55E" }}>
                      Key backup confirmed
                    </Text>
                  ) : (
                    <>
                      <Text size={Size.Small} weight="semibold" style={{ color: "#EF4444" }}>
                        Back up your private key!
                      </Text>
                      <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                        Without it, you will permanently lose access to this account.
                      </Text>
                    </>
                  )}
                </View>
              </View>

              {/* Action buttons */}
              <View style={styles.actions}>
                {!hasBackedUpKey && (
                  <Button
                    label="Back Up Key"
                    onPress={onBackupKey}
                    size={Size.Small}
                    shape={Shape.Rounded}
                    appearance={Appearance.Secondary}
                    leadingIcon="download"
                    style={styles.backupButton}
                  />
                )}

                <View style={styles.confirmActions}>
                  <Button
                    label="Cancel"
                    onPress={onCancel}
                    size={Size.Small}
                    shape={Shape.Rounded}
                    appearance={Appearance.Secondary}
                  />
                  <Button
                    label="Log Out"
                    onPress={onConfirm}
                    size={Size.Small}
                    shape={Shape.Rounded}
                    style={[styles.logoutButton, { backgroundColor: "#EF4444" }]}
                  />
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
    padding: 24,
  },
  modal: {
    width: "100%",
    maxWidth: 400,
  },
  content: {
    padding: 24,
    alignItems: "center",
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    textAlign: "center",
    marginBottom: 20,
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderRadius: 8,
    width: "100%",
    marginBottom: 24,
  },
  warningText: {
    flex: 1,
    gap: 4,
  },
  actions: {
    width: "100%",
    gap: 12,
  },
  backupButton: {
    width: "100%",
  },
  confirmActions: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
  },
  logoutButton: {
    minWidth: 100,
  },
});
