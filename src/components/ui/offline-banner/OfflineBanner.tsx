/**
 * @file OfflineBanner.tsx
 * @description Banner shown when the user goes offline.
 *
 * Features:
 * - Detects online/offline status
 * - Shows banner when offline
 * - Auto-hides when back online
 */

import React, { useState, useEffect } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { Text, Icon } from "@wraith/ghost/components";
import { Colors } from "@wraith/ghost/tokens";
import { Size } from "@wraith/ghost/enums";
import { spacing } from "../../../styles/tokens";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [slideAnim] = useState(new Animated.Value(isOffline ? 0 : -50));

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 300,
        useNativeDriver: true,
      }).start();
    };

    const handleOffline = () => {
      setIsOffline(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Set initial state
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [slideAnim]);

  if (!isOffline) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      <Icon name="wifi-off" size={Size.Small} color="#FFFFFF" />
      <Text size={Size.Small} weight="semibold" style={styles.text}>
        You're offline. Some features may be unavailable.
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.status.warning,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.sm,
    gap: spacing.sm,
    zIndex: 10000,
  },
  text: {
    color: "#FFFFFF",
  },
});
