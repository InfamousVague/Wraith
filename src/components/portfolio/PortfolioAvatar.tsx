/**
 * Portfolio Avatar Component
 *
 * A smart avatar component for portfolio/user profiles that:
 * - Shows a custom image if available
 * - Falls back to a deterministic hashicon based on wallet address or username
 * - Supports various sizes and styles
 */

import React from "react";
import { View, Image, StyleSheet, Pressable } from "react-native";
import { Text } from "@wraith/ghost/components";
import { Size } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { Hashicon } from "../ui/hashicon";
import { radii } from "../../styles/tokens";

export type PortfolioAvatarProps = {
  /** Custom image URI */
  imageUri?: string | null;
  /** Wallet address (used for hashicon generation) */
  walletAddress?: string;
  /** Username (fallback for hashicon generation) */
  username?: string;
  /** Size of the avatar */
  size?: Size;
  /** Custom pixel size (overrides size prop) */
  customSize?: number;
  /** Show as square instead of circle */
  square?: boolean;
  /** Show online indicator */
  showOnlineIndicator?: boolean;
  /** Is user online */
  isOnline?: boolean;
  /** Show verification badge */
  showVerified?: boolean;
  /** Is verified */
  isVerified?: boolean;
  /** On press callback */
  onPress?: () => void;
};

// Size mapping in pixels
const SIZE_MAP: Record<Size, number> = {
  [Size.TwoXSmall]: 20,
  [Size.ExtraSmall]: 24,
  [Size.Small]: 32,
  [Size.Medium]: 40,
  [Size.Large]: 48,
  [Size.ExtraLarge]: 64,
  [Size.TwoXLarge]: 80,
};

// Online indicator size relative to avatar
const INDICATOR_SIZE_RATIO = 0.25;

export function PortfolioAvatar({
  imageUri,
  walletAddress,
  username,
  size = Size.Medium,
  customSize,
  square = false,
  showOnlineIndicator = false,
  isOnline = false,
  showVerified = false,
  isVerified = false,
  onPress,
}: PortfolioAvatarProps) {
  const themeColors = useThemeColors();
  const pixelSize = customSize ?? SIZE_MAP[size];
  const indicatorSize = Math.max(8, pixelSize * INDICATOR_SIZE_RATIO);

  // Get the seed for hashicon
  const hashSeed = walletAddress || username || "default";

  // Get initials for fallback if no hashicon seed
  const initials = username ? username.slice(0, 2).toUpperCase() : "?";

  const borderRadius = square ? radii.md : pixelSize / 2;

  const content = imageUri ? (
    <Image
      source={{ uri: imageUri }}
      style={[
        styles.image,
        {
          width: pixelSize,
          height: pixelSize,
          borderRadius,
        },
      ]}
      resizeMode="cover"
    />
  ) : walletAddress || username ? (
    <Hashicon value={hashSeed} customSize={pixelSize} circular={!square} />
  ) : (
    <View
      style={[
        styles.fallback,
        {
          width: pixelSize,
          height: pixelSize,
          borderRadius,
          backgroundColor: themeColors.background.surface,
        },
      ]}
    >
      <Text
        size={pixelSize > 32 ? Size.Medium : Size.ExtraSmall}
        weight="semibold"
        style={{ color: themeColors.text.muted }}
      >
        {initials}
      </Text>
    </View>
  );

  const avatar = (
    <View style={[styles.container, { width: pixelSize, height: pixelSize }]}>
      {content}

      {/* Online indicator */}
      {showOnlineIndicator && (
        <View
          style={[
            styles.indicator,
            {
              width: indicatorSize,
              height: indicatorSize,
              borderRadius: indicatorSize / 2,
              backgroundColor: isOnline ? "#2FD575" : "#9096AB",
              borderColor: themeColors.background.canvas,
              bottom: 0,
              right: 0,
            },
          ]}
        />
      )}

      {/* Verified badge */}
      {showVerified && isVerified && (
        <View
          style={[
            styles.verifiedBadge,
            {
              width: indicatorSize,
              height: indicatorSize,
              borderRadius: indicatorSize / 2,
              backgroundColor: "#3B82F6",
              borderColor: themeColors.background.canvas,
              bottom: 0,
              right: showOnlineIndicator ? indicatorSize + 2 : 0,
            },
          ]}
        >
          <Text
            size={Size.TwoXSmall}
            style={{ color: "#FFFFFF", fontSize: indicatorSize * 0.6 }}
          >
            ✓
          </Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
        {avatar}
      </Pressable>
    );
  }

  return avatar;
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  image: {
    overflow: "hidden",
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  indicator: {
    position: "absolute",
    borderWidth: 2,
  },
  verifiedBadge: {
    position: "absolute",
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.8,
  },
});

export default PortfolioAvatar;
