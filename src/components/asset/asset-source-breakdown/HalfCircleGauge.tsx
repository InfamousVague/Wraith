/**
 * HalfCircleGauge Component - SVG gauge visualization for confidence score
 */

import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { Text } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { spacing } from "../../../styles/tokens";
import type { HalfCircleGaugeProps } from "./types";

export function HalfCircleGauge({ score, color, label, mutedColor, trackColor }: HalfCircleGaugeProps) {
  // SVG half-circle gauge
  const size = 140;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // Half circle
  const progress = (score / 100) * circumference;

  return (
    <View style={styles.container}>
      {Platform.OS === "web" ? (
        <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
          {/* Background arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Progress arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${progress} ${circumference}`}
            style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}
          />
          {/* Score text */}
          <text
            x={size / 2}
            y={size / 2 - 8}
            textAnchor="middle"
            fill={color}
            fontSize="28"
            fontWeight="bold"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            {score}
          </text>
          {/* Label text */}
          <text
            x={size / 2}
            y={size / 2 + 14}
            textAnchor="middle"
            fill={mutedColor}
            fontSize="12"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            {label}
          </text>
        </svg>
      ) : (
        <View style={styles.fallback}>
          <Text size={Size.TwoXLarge} weight="bold" style={{ color }}>
            {score}
          </Text>
          <Text size={Size.Small} appearance={TextAppearance.Muted}>
            {label}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  fallback: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },
});
