/**
 * HalfCircleGauge Component
 *
 * Renders a semicircular gauge showing a value within a range.
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import Svg, { Path } from "react-native-svg";
import type { HalfCircleGaugeProps } from "./types";

export function HalfCircleGauge({
  value,
  max = 100,
  size = 120,
  strokeWidth = 10,
  color,
  label,
  valueLabel,
}: HalfCircleGaugeProps) {
  const themeColors = useThemeColors();
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius;
  const percentage = Math.min(Math.max(value / max, 0), 1);
  const strokeDashoffset = circumference * (1 - percentage);

  // Center point
  const cx = size / 2;
  const cy = size / 2;

  // Create arc path (semicircle from left to right)
  const startX = cx - radius;
  const startY = cy;
  const endX = cx + radius;
  const endY = cy;

  const backgroundPath = `M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`;

  return (
    <View style={styles.gaugeContainer}>
      <Svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2 + 10}`}>
        {/* Background arc */}
        <Path
          d={backgroundPath}
          fill="none"
          stroke={themeColors.border.subtle}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Value arc */}
        <Path
          d={backgroundPath}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </Svg>
      <View style={styles.gaugeValueContainer}>
        <Text size={Size.ExtraLarge} weight="bold" style={{ color }}>
          {valueLabel}
        </Text>
      </View>
      <Text size={Size.Small} appearance={TextAppearance.Muted} style={styles.gaugeLabel}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  gaugeContainer: {
    alignItems: "center",
  },
  gaugeValueContainer: {
    marginTop: -28,
    alignItems: "center",
  },
  gaugeLabel: {
    marginTop: 4,
  },
});
