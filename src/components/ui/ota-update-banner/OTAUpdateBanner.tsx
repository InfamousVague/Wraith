/**
 * OTA Update Banner Component
 *
 * Displays a notification banner when an OTA update is available
 * or ready to be applied.
 */

import React, { useEffect, useState } from "react";
import { View, StyleSheet, Pressable, Animated } from "react-native";
import { Text, Icon, Button } from "@wraith/ghost/components";
import { Size, Appearance, Shape } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { Colors } from "@wraith/ghost/tokens";
import { spacing, radii } from "../../../styles/tokens";
import { useOTAUpdates, type UpdateStatus } from "../../../hooks/useOTAUpdates";

export type OTAUpdateBannerProps = {
  /** Whether to auto-download updates when available */
  autoDownload?: boolean;
  /** Callback when update is applied */
  onUpdateApplied?: () => void;
};

export function OTAUpdateBanner({ autoDownload = false, onUpdateApplied }: OTAUpdateBannerProps) {
  const themeColors = useThemeColors();
  const [dismissed, setDismissed] = useState(false);
  const slideAnim = useState(() => new Animated.Value(-100))[0];

  const {
    status,
    isUpdateAvailable,
    isUpdateReady,
    isLoading,
    error,
    updateInfo,
    checkForUpdate,
    downloadUpdate,
    applyUpdate,
  } = useOTAUpdates({
    checkOnMount: true,
    checkInterval: 5 * 60 * 1000, // 5 minutes
  });

  // Show/hide animation
  const shouldShow = !dismissed && (isUpdateAvailable || isUpdateReady);

  useEffect(() => {
    if (shouldShow) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [shouldShow, slideAnim]);

  // Auto-download when update is available
  useEffect(() => {
    if (autoDownload && isUpdateAvailable && !isLoading) {
      downloadUpdate();
    }
  }, [autoDownload, isUpdateAvailable, isLoading, downloadUpdate]);

  const handleApplyUpdate = async () => {
    await applyUpdate();
    onUpdateApplied?.();
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  const handleDownload = () => {
    downloadUpdate();
  };

  if (!shouldShow) {
    return null;
  }

  const getStatusMessage = (): string => {
    switch (status) {
      case "available":
        return "A new update is available";
      case "downloading":
        return "Downloading update...";
      case "ready":
        return "Update ready to install";
      case "error":
        return error || "Update failed";
      default:
        return "";
    }
  };

  const getStatusIcon = (): string => {
    switch (status) {
      case "available":
        return "download";
      case "downloading":
        return "loader";
      case "ready":
        return "check-circle";
      case "error":
        return "alert-circle";
      default:
        return "info";
    }
  };

  const getStatusColor = (): string => {
    switch (status) {
      case "available":
        return Colors.status.info;
      case "downloading":
        return Colors.accent.primary;
      case "ready":
        return Colors.status.success;
      case "error":
        return Colors.status.danger;
      default:
        return themeColors.text.muted;
    }
  };

  const statusColor = getStatusColor();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: themeColors.background.raised,
          borderColor: statusColor,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Icon
            name={getStatusIcon() as any}
            size={Size.Medium}
            color={statusColor}
          />
        </View>

        <View style={styles.textContainer}>
          <Text size={Size.Small} weight="semibold">
            {getStatusMessage()}
          </Text>
          {updateInfo && (
            <Text size={Size.TwoXSmall} style={{ color: themeColors.text.muted }}>
              Version: {updateInfo.runtimeVersion}
            </Text>
          )}
        </View>

        <View style={styles.actions}>
          {status === "available" && (
            <Button
              label="Download"
              size={Size.Small}
              shape={Shape.Rounded}
              appearance={Appearance.Primary}
              onPress={handleDownload}
              loading={isLoading}
            />
          )}

          {status === "ready" && (
            <Button
              label="Restart"
              size={Size.Small}
              shape={Shape.Rounded}
              appearance={Appearance.Primary}
              onPress={handleApplyUpdate}
            />
          )}

          {status === "error" && (
            <Button
              label="Retry"
              size={Size.Small}
              shape={Shape.Rounded}
              appearance={Appearance.Secondary}
              onPress={checkForUpdate}
            />
          )}
        </View>

        <Pressable onPress={handleDismiss} style={styles.closeButton}>
          <Icon name="close" size={Size.Small} color={themeColors.text.muted} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    borderBottomWidth: 2,
    zIndex: 1000,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
    gap: spacing.xxs,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  closeButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
});

export default OTAUpdateBanner;
