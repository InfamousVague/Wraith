import React, { useMemo, useState } from "react";
import { View, StyleSheet } from "react-native";
import { LightweightChart, type ChartDataPoint, Card, Skeleton, Text } from "@wraith/ghost/components";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { ChartControls, type TimeRange, type ChartType } from "./ChartControls";
import type { Asset } from "../types/asset";

type AdvancedChartProps = {
  asset: Asset | null;
  loading?: boolean;
  height?: number;
};

/**
 * Generate more detailed chart data from sparkline based on time range.
 * In a real app, this would fetch OHLCV data from the API.
 */
function generateChartData(
  sparkline: number[],
  timeRange: TimeRange
): ChartDataPoint[] {
  if (!sparkline || sparkline.length < 2) return [];

  // For demo purposes, we interpolate the sparkline to more points
  const pointCount = getPointCountForRange(timeRange);
  const now = Math.floor(Date.now() / 1000);
  const intervalSeconds = getIntervalSecondsForRange(timeRange);

  // Interpolate sparkline to desired point count
  const data: ChartDataPoint[] = [];
  for (let i = 0; i < pointCount; i++) {
    const sparklineIndex = (i / pointCount) * (sparkline.length - 1);
    const lowerIndex = Math.floor(sparklineIndex);
    const upperIndex = Math.ceil(sparklineIndex);
    const fraction = sparklineIndex - lowerIndex;

    const value =
      lowerIndex === upperIndex
        ? sparkline[lowerIndex]
        : sparkline[lowerIndex] * (1 - fraction) +
          sparkline[upperIndex] * fraction;

    // Add some random noise for realism
    const noise = (Math.random() - 0.5) * value * 0.002;

    data.push({
      time: now - (pointCount - 1 - i) * intervalSeconds,
      value: value + noise,
    });
  }

  return data;
}

function getPointCountForRange(range: TimeRange): number {
  switch (range) {
    case "1H":
      return 60;
    case "4H":
      return 48;
    case "1D":
      return 96;
    case "1W":
      return 168;
    case "1M":
      return 30;
    case "3M":
      return 90;
    case "1Y":
      return 365;
    case "ALL":
      return 500;
    default:
      return 100;
  }
}

function getIntervalSecondsForRange(range: TimeRange): number {
  switch (range) {
    case "1H":
      return 60; // 1 minute
    case "4H":
      return 300; // 5 minutes
    case "1D":
      return 900; // 15 minutes
    case "1W":
      return 3600; // 1 hour
    case "1M":
      return 86400; // 1 day
    case "3M":
      return 86400; // 1 day
    case "1Y":
      return 86400; // 1 day
    case "ALL":
      return 604800; // 1 week
    default:
      return 3600;
  }
}

export function AdvancedChart({
  asset,
  loading,
  height = 400,
}: AdvancedChartProps) {
  const themeColors = useThemeColors();
  const [timeRange, setTimeRange] = useState<TimeRange>("1W");
  const [chartType, setChartType] = useState<ChartType>("area");

  const chartData = useMemo(() => {
    if (!asset?.sparkline) return [];
    return generateChartData(asset.sparkline, timeRange);
  }, [asset?.sparkline, timeRange]);

  const isPositive = asset ? asset.change7d >= 0 : true;

  if (loading) {
    return (
      <Card style={styles.card}>
        <View style={styles.controlsContainer}>
          <Skeleton width={300} height={32} />
          <Skeleton width={150} height={32} />
        </View>
        <Skeleton width="100%" height={height} style={{ marginTop: 16 }} />
      </Card>
    );
  }

  if (!asset || chartData.length < 2) {
    return (
      <Card style={styles.card}>
        <View style={[styles.placeholder, { height }]}>
          <Text appearance={TextAppearance.Muted}>No chart data available</Text>
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <ChartControls
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        chartType={chartType}
        onChartTypeChange={setChartType}
      />
      <View style={[styles.chartContainer, { height }]}>
        <LightweightChart
          data={chartData}
          type={chartType === "candle" ? "line" : chartType}
          width="100%"
          height={height}
          isPositive={isPositive}
          glow={true}
          glowIntensity={0.4}
          lineWidth={2}
          showPriceScale={true}
          showTimeScale={true}
          showCrosshair={true}
          interactive={true}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    gap: 16,
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
  },
  chartContainer: {
    width: "100%",
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 8,
  },
});
