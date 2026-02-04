/**
 * @file Toast.tsx
 * @description Toast notification component.
 *
 * Displays temporary notifications for:
 * - Success messages (order filled, alert triggered)
 * - Error messages (trade failed, network error)
 * - Warning messages (liquidation warning)
 * - Info messages (general notifications)
 */

import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Pressable } from "react-native";
import { Text, Icon } from "@wraith/ghost/components";
import { Colors } from "@wraith/ghost/tokens";
import { Size } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { spacing, radii } from "../../../styles/tokens";

export type ToastType = "success" | "error" | "warning" | "info";

export type ToastProps = {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onDismiss: (id: string) => void;
};

const TOAST_CONFIG: Record<ToastType, { icon: string; color: string; bgColor: string }> = {
  success: {
    icon: "check-circle",
    color: Colors.status.success,
    bgColor: "rgba(16, 185, 129, 0.15)",
  },
  error: {
    icon: "x-circle",
    color: Colors.status.danger,
    bgColor: "rgba(239, 68, 68, 0.15)",
  },
  warning: {
    icon: "alert-triangle",
    color: Colors.status.warning,
    bgColor: "rgba(245, 158, 11, 0.15)",
  },
  info: {
    icon: "info",
    color: Colors.accent.primary,
    bgColor: "rgba(139, 92, 246, 0.15)",
  },
};

export function Toast({
  id,
  type,
  title,
  message,
  duration = 5000,
  onDismiss,
}: ToastProps) {
  const themeColors = useThemeColors();
  const config = TOAST_CONFIG[type];
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss
    const timer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -20,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(id);
    });
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: themeColors.background.raised,
          borderLeftColor: config.color,
          opacity: fadeAnim,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
        <Icon name={config.icon} size={Size.Medium} color={config.color} />
      </View>
      <View style={styles.content}>
        <Text size={Size.Small} weight="semibold">
          {title}
        </Text>
        {message && (
          <Text size={Size.ExtraSmall} style={{ color: themeColors.text.muted }}>
            {message}
          </Text>
        )}
      </View>
      <Pressable onPress={handleDismiss} style={styles.closeButton}>
        <Icon name="x" size={Size.Small} color={themeColors.text.muted} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    borderRadius: radii.md,
    borderLeftWidth: 4,
    marginBottom: spacing.xs,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    maxWidth: 400,
  },
  iconContainer: {
    padding: spacing.xs,
    borderRadius: radii.md,
    marginRight: spacing.sm,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  closeButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
});
