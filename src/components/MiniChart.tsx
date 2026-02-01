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
  // Convert number[] to ChartDataPoint[] with synthetic timestamps
  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (!data || data.length < 2) return [];

    const baseTime = Math.floor(Date.now() / 1000) - data.length * 3600;
    return data.map((value, index) => ({
      time: baseTime + index * 3600,
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
        lineWidth={1}
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
