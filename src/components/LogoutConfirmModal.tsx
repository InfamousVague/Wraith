/**
 * LogoutConfirmModal Component
 *
 * Confirmation modal for logging out with a warning about backing up keys.
 */

import React from "react";
import { View, StyleSheet, Modal, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { Card, Text, Button, Icon } from "@wraith/ghost/components";
import { Size, TextAppearance, Shape, Appearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { Colors } from "@wraith/ghost/tokens";

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
  const { t } = useTranslation(["auth", "common"]);
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
              <View style={[styles.iconContainer, { backgroundColor: Colors.status.dangerSurface }]}>
                <Icon name="alert-triangle" size={Size.Large} color={Colors.status.danger} />
              </View>

              {/* Title */}
              <Text size={Size.Large} weight="bold" style={styles.title}>
                {t("auth:logout.title")}
              </Text>

              {/* Warning message */}
              <Text
                size={Size.Medium}
                appearance={TextAppearance.Muted}
                style={styles.message}
              >
                {t("auth:logout.message")}
              </Text>

              {/* Key backup warning */}
              <View
                style={[
                  styles.warningBox,
                  { backgroundColor: hasBackedUpKey ? Colors.status.successSurface : Colors.status.dangerSurface },
                ]}
              >
                <Icon
                  name={hasBackedUpKey ? "check-circle" : "alert-circle"}
                  size={Size.Small}
                  color={hasBackedUpKey ? Colors.status.success : Colors.status.danger}
                />
                <View style={styles.warningText}>
                  {hasBackedUpKey ? (
                    <Text size={Size.Small} style={{ color: Colors.status.success }}>
                      {t("auth:logout.keyBackupConfirmed")}
                    </Text>
                  ) : (
                    <>
                      <Text size={Size.Small} weight="semibold" style={{ color: Colors.status.danger }}>
                        {t("auth:logout.backUpWarning")}
                      </Text>
                      <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                        {t("auth:logout.loseAccessWarning")}
                      </Text>
                    </>
                  )}
                </View>
              </View>

              {/* Action buttons */}
              <View style={styles.actions}>
                {!hasBackedUpKey && (
                  <Button
                    label={t("common:buttons.backUpKey")}
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
                    label={t("common:buttons.cancel")}
                    onPress={onCancel}
                    size={Size.Small}
                    shape={Shape.Rounded}
                    appearance={Appearance.Secondary}
                  />
                  <Button
                    label={t("common:buttons.logOut")}
                    onPress={onConfirm}
                    size={Size.Small}
                    shape={Shape.Rounded}
                    style={[styles.logoutButton, { backgroundColor: Colors.status.danger }]}
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
