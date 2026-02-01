import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { LightweightChart, type ChartDataPoint } from "@wraith/ghost/components";

type MiniChartProps = {
  data: number[];
  isPositive: boolean;
  width?: number | string;
  height?: number;
  /** Enable glow effect (default true) */
  glow?: boolean;
};

export function MiniChart({
  data,
  isPositive,
  width = "100%",
  height = 40,
  glow = true,
}: MiniChartProps) {
  // Convert number[] to ChartDataPoint[] with 1-minute intervals (past hour)
  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (!data || data.length < 2) return [];

    // Use 1-minute intervals to show more recent data
    const now = Math.floor(Date.now() / 1000);
    const interval = 60; // 1 minute
    const baseTime = now - data.length * interval;

    return data.map((value, index) => ({
      time: baseTime + index * interval,
      value,
    }));
  }, [data]);

  const containerStyle = typeof width === "number"
    ? { width, height }
    : { width: "100%" as const, height };

  if (chartData.length < 2) {
    return <View style={[styles.container, containerStyle]} />;
  }

  return (
    <View style={[styles.container, containerStyle]}>
      <LightweightChart
        data={chartData}
        type="area"
        width={width}
        height={height}
        isPositive={isPositive}
        glow={glow}
        glowIntensity={0.6}
        lineWidth={1.5}
        showPriceScale={false}
        showTimeScale={false}
        showCrosshair={false}
        interactive={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
});
