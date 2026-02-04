/**
 * Ping Indicator Component
 *
 * Animated visualization showing latency as a dot traveling between towers.
 * Animation speed reflects actual latency - faster ping = faster dot.
 * Color-coded based on latency thresholds.
 */

import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Easing } from "react-native";
import Svg, { Path, Circle, Line } from "react-native-svg";
import { Text } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { spacing } from "../../../styles/tokens";

const AnimatedView = Animated.View;

export type PingIndicatorProps = {
  /** Latency in milliseconds. Null means checking/unknown. */
  latencyMs: number | null;
  /** Size variant */
  size?: Size;
  /** Whether to show the latency value below */
  showValue?: boolean;
};

/**
 * Get the color for a given latency value.
 */
function getLatencyColor(latencyMs: number | null): string {
  if (latencyMs === null) return Colors.text.muted;
  if (latencyMs < 50) return Colors.status.success;
  if (latencyMs < 150) return Colors.data.amber;
  if (latencyMs < 300) return Colors.status.warning;
  return Colors.status.danger;
}

/**
 * Size configuration for the indicator.
 */
const SIZE_CONFIG: Record<Size, { width: number; height: number; towerSize: number; dotSize: number }> = {
  [Size.TwoXSmall]: { width: 40, height: 16, towerSize: 10, dotSize: 4 },
  [Size.ExtraSmall]: { width: 50, height: 18, towerSize: 12, dotSize: 5 },
  [Size.Small]: { width: 60, height: 20, towerSize: 14, dotSize: 6 },
  [Size.Medium]: { width: 80, height: 24, towerSize: 16, dotSize: 7 },
  [Size.Large]: { width: 100, height: 28, towerSize: 18, dotSize: 8 },
  [Size.ExtraLarge]: { width: 120, height: 32, towerSize: 20, dotSize: 9 },
  [Size.TwoXLarge]: { width: 140, height: 36, towerSize: 22, dotSize: 10 },
};

/**
 * Mini tower icon component.
 */
function TowerIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
      <Path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
      <Circle cx="12" cy="12" r="2" />
      <Path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
      <Path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" />
    </Svg>
  );
}

/**
 * PingIndicator displays an animated dot traveling between two tower icons.
 * The animation speed corresponds to the latency value - lower latency = faster animation.
 */
export function PingIndicator({
  latencyMs,
  size = Size.Small,
  showValue = false,
}: PingIndicatorProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const config = SIZE_CONFIG[size];
  const color = getLatencyColor(latencyMs);

  // Calculate animation duration based on latency
  // Map latency to animation duration: lower latency = faster animation
  // Clamp between 300ms (very fast) and 3000ms (very slow)
  const getAnimationDuration = (latency: number | null): number => {
    if (latency === null) return 1500; // Default for unknown
    // Scale: 0ms latency -> 300ms animation, 500ms+ latency -> 3000ms animation
    const scaled = Math.min(Math.max(latency, 10), 500);
    return 300 + (scaled / 500) * 2700;
  };

  useEffect(() => {
    const duration = getAnimationDuration(latencyMs);

    // Create looping animation: dot travels left to right, then right to left
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [latencyMs, animatedValue]);

  // Calculate dot position along the track
  const trackWidth = config.width - config.towerSize * 2 - config.dotSize;
  const dotTranslateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, trackWidth],
  });

  return (
    <View style={styles.container}>
      <View style={[styles.indicatorRow, { width: config.width, height: config.height }]}>
        {/* Left tower */}
        <TowerIcon size={config.towerSize} color={color} />

        {/* Track with animated dot */}
        <View style={[styles.track, { flex: 1, height: 2, backgroundColor: `${color}30` }]}>
          {/* Connection line */}
          <View style={[styles.line, { backgroundColor: `${color}50` }]} />

          {/* Animated dot */}
          <AnimatedView
            style={[
              styles.dot,
              {
                width: config.dotSize,
                height: config.dotSize,
                borderRadius: config.dotSize / 2,
                backgroundColor: color,
                transform: [{ translateX: dotTranslateX }],
                shadowColor: color,
              },
            ]}
          />
        </View>

        {/* Right tower */}
        <TowerIcon size={config.towerSize} color={color} />
      </View>

      {/* Optional latency value display */}
      {showValue && (
        <Text
          size={size === Size.TwoXSmall ? Size.TwoXSmall : Size.ExtraSmall}
          appearance={TextAppearance.Muted}
          style={[styles.valueText, { color }]}
        >
          {latencyMs !== null ? `${Math.round(latencyMs)}ms` : "..."}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  indicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  track: {
    marginHorizontal: spacing.xxs,
    position: "relative",
    justifyContent: "center",
  },
  line: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
  },
  dot: {
    position: "absolute",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  valueText: {
    marginTop: spacing.xxs,
    fontWeight: "600",
  },
});
