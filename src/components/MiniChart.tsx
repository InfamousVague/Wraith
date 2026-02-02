import React, { useMemo, useRef } from "react";
import { View, StyleSheet } from "react-native";
import { LightweightChart, type ChartDataPoint } from "@wraith/ghost/components";
import { HeartbeatChart } from "./HeartbeatChart";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";

type MiniChartProps = {
  data: number[];
  isPositive: boolean;
  width?: number | string;
  height?: number;
  /** Enable glow effect (default true) */
  glow?: boolean;
  /** Show loading animation when data is not available */
  loading?: boolean;
};

// Stable base time to prevent unnecessary recalculations
const getStableBaseTime = () => Math.floor(Date.now() / 60000) * 60;

export const MiniChart = React.memo(function MiniChart({
  data,
  isPositive,
  width = "100%",
  height = 40,
  glow = true,
  loading = false,
}: MiniChartProps) {
  const themeColors = useThemeColors();
  // Cache the base time to avoid recalculating on every render
  const baseTimeRef = useRef(getStableBaseTime());

  // Convert number[] to ChartDataPoint[] with 1-minute intervals (past hour)
  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (!data || data.length < 2) return [];

    const interval = 60; // 1 minute
    const baseTime = baseTimeRef.current - data.length * interval;

    return data.map((value, index) => ({
      time: baseTime + index * interval,
      value,
    }));
  }, [data]);

  const containerStyle = useMemo(() =>
    typeof width === "number"
      ? { width, height }
      : { width: "100%" as const, height },
    [width, height]
  );

  // Show heartbeat animation when loading or no data available
  if (chartData.length < 2 || loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, containerStyle]} pointerEvents="none">
        <HeartbeatChart
          width={typeof width === "number" ? width : 100}
          height={height}
          color={themeColors.text.muted}
          animationDuration={2000}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, containerStyle]} pointerEvents="none">
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
}, (prevProps, nextProps) => {
  // Custom comparator - compare data arrays by reference first, then by content
  if (prevProps.data !== nextProps.data) {
    if (prevProps.data.length !== nextProps.data.length) return false;
    for (let i = 0; i < prevProps.data.length; i++) {
      if (prevProps.data[i] !== nextProps.data[i]) return false;
    }
  }
  return (
    prevProps.isPositive === nextProps.isPositive &&
    prevProps.width === nextProps.width &&
    prevProps.height === nextProps.height &&
    prevProps.glow === nextProps.glow &&
    prevProps.loading === nextProps.loading
  );
});

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.5,
  },
});
