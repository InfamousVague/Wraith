import React from "react";
import { View, StyleSheet } from "react-native";
import { Colors } from "@wraith/ghost/tokens";

type MiniChartProps = {
  data: number[];
  isPositive: boolean;
  width?: number;
  height?: number;
};

export function MiniChart({
  data,
  isPositive,
  width = 120,
  height = 40,
}: MiniChartProps) {
  if (!data || data.length < 2) {
    return <View style={[styles.container, { width, height }]} />;
  }

  const color = isPositive ? Colors.status.success : Colors.status.danger;

  // Normalize data to fit within the chart
  const minValue = Math.min(...data);
  const maxValue = Math.max(...data);
  const range = maxValue - minValue || 1;
  const padding = 4;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = data
    .map((value, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((value - minValue) / range) * chartHeight;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <View style={[styles.container, { width, height }]}>
      <svg width={width} height={height}>
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
});
