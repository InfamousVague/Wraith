/**
 * @file NotificationBanner.tsx
 * @description Top-center notification banners for Tap Trading.
 *
 * Win banners: "You won $X.XX" with green accent, 4s auto-dismiss
 * Error banners: "Insufficient balance", amber accent, 3s auto-dismiss
 * Max 3 banners stacked at once. No loss banners (silent fade only).
 */

import React, { useEffect, useRef } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Text, Icon } from "@wraith/ghost/components";
import { Size } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { spacing } from "../../styles/tokens";
import type { TapNotification } from "../../types/tap-trading";

type NotificationBannerProps = {
  notifications: TapNotification[];
  onDismiss: (id: string) => void;
};

export function NotificationBanner({ notifications, onDismiss }: NotificationBannerProps) {
  // Auto-dismiss timers
  const timersRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    for (const notif of notifications) {
      if (timersRef.current.has(notif.id)) continue;
      const duration = notif.type === "win" ? 4000 : 3000;
      const timer = window.setTimeout(() => {
        onDismiss(notif.id);
        timersRef.current.delete(notif.id);
      }, duration);
      timersRef.current.set(notif.id, timer);
    }

    // Cleanup on unmount
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, [notifications, onDismiss]);

  if (notifications.length === 0) return null;

  // Show max 3
  const visible = notifications.slice(-3);

  return (
    <View style={styles.container} pointerEvents="box-none">
      {visible.map((notif) => {
        const isWin = notif.type === "win";
        const accentColor = isWin ? Colors.status.success : Colors.status.warning;
        const surfaceColor = isWin ? Colors.status.successSurface : Colors.status.warningSurface;

        return (
          <Pressable
            key={notif.id}
            onPress={() => onDismiss(notif.id)}
            style={[
              styles.banner,
              {
                backgroundColor: surfaceColor,
                borderColor: `${accentColor}40`,
              },
            ]}
          >
            <Icon
              name={isWin ? "coins" : "alert-circle"}
              size={Size.ExtraSmall}
              color={accentColor}
            />
            <Text size={Size.Small} weight="semibold" style={{ color: accentColor }}>
              {notif.message}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: spacing.xs,
    left: 0,
    right: 0,
    alignItems: "center",
    gap: spacing.xxs,
    zIndex: 100,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
  },
});
