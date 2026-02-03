/**
 * AdvancedChart Component
 *
 * @fileoverview Full-featured trading chart powered by TradingView Lightweight Charts.
 * Displays price history with multiple visualization options and technical indicators.
 *
 * @description
 * Core features:
 * - **Chart Types**: Area, Line, and Candlestick visualizations
 * - **Time Ranges**: 1H, 4H, 1D, 1W, 1M, 3M, 1Y, and ALL historical periods
 * - **Technical Indicators**: SMA(20), EMA(20), Bollinger Bands(20,2), and Volume histogram
 * - **Real-time Updates**: WebSocket subscription for live price updates
 * - **API Integration**: Fetches OHLC data from backend with automatic seeding/polling
 * - **Crosshair Legend**: Shows price, change, high, low, volume at cursor position
 * - **Responsive Design**: Adapts controls and visibility for mobile/desktop
 *
 * Data flow:
 * 1. Component fetches chart data from `/api/chart/:id/:range` endpoint
 * 2. If data is empty, backend auto-triggers seeding; component polls until ready
 * 3. Falls back to sparkline generation if API fails or times out (30s)
 * 4. WebSocket updates the latest candle in real-time
 *
 * Helper functions:
 * - `generateOHLCData`: Creates OHLC candles from sparkline array
 * - `generateLineData`: Interpolates sparkline to chart data points
 * - `calculateSMA/EMA/BollingerBands`: Technical indicator calculations
 * - `removeWatermark`: Removes TradingView branding from chart
 *
 * @example
 * <AdvancedChart
 *   asset={selectedAsset}
 *   loading={isLoading}
 *   height={400}
 * />
 *
 * @exports AdvancedChart - Main chart component
 * @exports TimeRange - Union type of time range options
 * @exports ChartType - Union type of chart visualization types
 * @exports Indicator - Union type of technical indicator types
 */

import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { View, StyleSheet, Pressable, Platform, type ViewStyle } from "react-native";
import {
  createChart,
  AreaSeries,
  LineSeries,
  CandlestickSeries,
  HistogramSeries,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type AreaData,
  type LineData,
  type HistogramData,
  type DeepPartial,
  type ChartOptions,
  type LineWidth,
  type Time,
} from "lightweight-charts";
import { Card, Skeleton, Text, Icon, SegmentedControl, FilterChip, Currency, PercentChange } from "@wraith/ghost/components";
import { Colors } from "@wraith/ghost/tokens";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import type { Asset } from "../types/asset";
import { hauntClient, type OhlcPoint } from "../services/haunt";
import { useAssetSubscription, type PriceUpdate } from "../hooks/useHauntSocket";
import { HeartbeatChart } from "./HeartbeatChart";
import { useBreakpoint } from "../hooks/useBreakpoint";

// Types
export type TimeRange = "1H" | "4H" | "1D" | "1W" | "1M" | "3M" | "1Y" | "ALL";
export type ChartType = "line" | "area" | "candle" | "baseline";
export type Indicator = "sma" | "ema" | "bollinger" | "volume";

type AdvancedChartProps = {
  asset: Asset | null;
  loading?: boolean;
  height?: number; // Optional - if not provided, flex to fill container
};

type ChartDataPoint = {
  time: number;
  value: number;
};

type OHLCData = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

// Chart type options with icons
const CHART_TYPE_OPTIONS = [
  { value: "area" as const, label: "Area", icon: "trending-up" as const },
  { value: "line" as const, label: "Line", icon: "activity" as const },
  { value: "candle" as const, label: "Candle", icon: "bar-chart-2" as const },
];

// Time range options
const TIME_RANGE_OPTIONS = [
  { value: "1H" as const, label: "1H" },
  { value: "4H" as const, label: "4H" },
  { value: "1D" as const, label: "1D" },
  { value: "1W" as const, label: "1W" },
  { value: "1M" as const, label: "1M" },
  { value: "3M" as const, label: "3M" },
  { value: "1Y" as const, label: "1Y" },
  { value: "ALL" as const, label: "All" },
];

// Indicator definitions
const INDICATORS = [
  { id: "sma" as const, label: "SMA", color: Colors.data.blue },
  { id: "ema" as const, label: "EMA", color: Colors.data.violet },
  { id: "bollinger" as const, label: "BB", color: Colors.data.amber },
  { id: "volume" as const, label: "Vol", color: Colors.text.muted },
];

// Generate OHLC data from sparkline
function generateOHLCData(sparkline: number[], timeRange: TimeRange): OHLCData[] {
  if (!sparkline || sparkline.length < 2) return [];

  const pointCount = getPointCountForRange(timeRange);
  const now = Math.floor(Date.now() / 1000);
  const intervalSeconds = getIntervalSecondsForRange(timeRange);

  const data: OHLCData[] = [];
  const step = Math.max(1, Math.floor(sparkline.length / pointCount));

  for (let i = 0; i < sparkline.length; i += step) {
    const slice = sparkline.slice(i, Math.min(i + step, sparkline.length));
    if (slice.length === 0) continue;

    const open = slice[0];
    const close = slice[slice.length - 1];
    const high = Math.max(...slice) * (1 + Math.random() * 0.005);
    const low = Math.min(...slice) * (1 - Math.random() * 0.005);
    const baseVolume = Math.abs(close - open) * 1000000 + Math.random() * 500000;

    data.push({
      time: now - (sparkline.length - i) * (intervalSeconds / step),
      open,
      high,
      low,
      close,
      volume: baseVolume,
    });
  }

  return data;
}

// Generate line/area data from sparkline
function generateLineData(sparkline: number[], timeRange: TimeRange): ChartDataPoint[] {
  if (!sparkline || sparkline.length < 2) return [];

  const pointCount = getPointCountForRange(timeRange);
  const now = Math.floor(Date.now() / 1000);
  const intervalSeconds = getIntervalSecondsForRange(timeRange);

  const data: ChartDataPoint[] = [];
  for (let i = 0; i < pointCount; i++) {
    const sparklineIndex = (i / pointCount) * (sparkline.length - 1);
    const lowerIndex = Math.floor(sparklineIndex);
    const upperIndex = Math.ceil(sparklineIndex);
    const fraction = sparklineIndex - lowerIndex;

    const value =
      lowerIndex === upperIndex
        ? sparkline[lowerIndex]
        : sparkline[lowerIndex] * (1 - fraction) + sparkline[upperIndex] * fraction;

    const noise = (Math.random() - 0.5) * value * 0.001;

    data.push({
      time: now - (pointCount - 1 - i) * intervalSeconds,
      value: value + noise,
    });
  }

  return data;
}

// Calculate SMA
function calculateSMA(data: ChartDataPoint[], period: number): ChartDataPoint[] {
  const result: ChartDataPoint[] = [];
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((acc, d) => acc + d.value, 0);
    result.push({ time: data[i].time, value: sum / period });
  }
  return result;
}

// Calculate EMA
function calculateEMA(data: ChartDataPoint[], period: number): ChartDataPoint[] {
  const result: ChartDataPoint[] = [];
  const multiplier = 2 / (period + 1);

  if (data.length === 0) return result;

  // Start with SMA for first value
  let ema = data.slice(0, period).reduce((acc, d) => acc + d.value, 0) / period;
  result.push({ time: data[period - 1].time, value: ema });

  for (let i = period; i < data.length; i++) {
    ema = (data[i].value - ema) * multiplier + ema;
    result.push({ time: data[i].time, value: ema });
  }

  return result;
}

// Calculate Bollinger Bands
function calculateBollingerBands(
  data: ChartDataPoint[],
  period: number = 20,
  stdDev: number = 2
): { upper: ChartDataPoint[]; middle: ChartDataPoint[]; lower: ChartDataPoint[] } {
  const upper: ChartDataPoint[] = [];
  const middle: ChartDataPoint[] = [];
  const lower: ChartDataPoint[] = [];

  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const sma = slice.reduce((acc, d) => acc + d.value, 0) / period;
    const variance = slice.reduce((acc, d) => acc + Math.pow(d.value - sma, 2), 0) / period;
    const std = Math.sqrt(variance);

    middle.push({ time: data[i].time, value: sma });
    upper.push({ time: data[i].time, value: sma + stdDev * std });
    lower.push({ time: data[i].time, value: sma - stdDev * std });
  }

  return { upper, middle, lower };
}

function getPointCountForRange(range: TimeRange): number {
  switch (range) {
    case "1H": return 60;
    case "4H": return 48;
    case "1D": return 288;  // 24 hours / 5 minutes = 288 points (matches backend 5-min buckets)
    case "1W": return 168;
    case "1M": return 30;
    case "3M": return 90;
    case "1Y": return 365;
    case "ALL": return 500;
    default: return 100;
  }
}

function getIntervalSecondsForRange(range: TimeRange): number {
  switch (range) {
    case "1H": return 60;
    case "4H": return 300;
    case "1D": return 300;  // 5-minute intervals to match backend
    case "1W": return 3600;
    case "1M": return 86400;
    case "3M": return 86400;
    case "1Y": return 86400;
    case "ALL": return 604800;
    default: return 3600;
  }
}

// Remove TradingView watermark
function removeWatermark(container: HTMLElement) {
  const targets = container.querySelectorAll('[title*="TradingView"]');
  targets.forEach((node) => {
    const removable = node.closest("a") ?? node.closest("svg") ?? node;
    removable.remove();
  });
  const svgTitles = container.querySelectorAll("svg title");
  svgTitles.forEach((titleNode) => {
    if (titleNode.textContent?.includes("TradingView")) {
      const removable = titleNode.closest("a") ?? titleNode.closest("svg") ?? titleNode;
      removable.remove();
    }
  });
}

// Chart Legend component
function ChartLegend({
  price,
  change,
  high,
  low,
  volume,
}: {
  price?: number;
  change?: number;
  high?: number;
  low?: number;
  volume?: number;
}) {
  return (
    <View style={styles.legend}>
      <View style={styles.legendItem}>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>Price</Text>
        {price !== undefined ? (
          <Currency value={price} size={Size.Medium} weight="semibold" decimals={price < 1 ? 6 : 2} mono />
        ) : (
          <Text size={Size.Medium} weight="semibold">—</Text>
        )}
      </View>
      <View style={styles.legendItem}>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>Change</Text>
        {change !== undefined && Number.isFinite(change) ? (
          <PercentChange value={change} size={Size.Medium} weight="semibold" />
        ) : (
          <Text size={Size.Medium} weight="semibold">—</Text>
        )}
      </View>
      <View style={styles.legendItem}>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>High</Text>
        {high !== undefined ? (
          <Currency value={high} size={Size.Medium} weight="semibold" decimals={high < 1 ? 6 : 2} mono />
        ) : (
          <Text size={Size.Medium} weight="semibold">—</Text>
        )}
      </View>
      <View style={styles.legendItem}>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>Low</Text>
        {low !== undefined ? (
          <Currency value={low} size={Size.Medium} weight="semibold" decimals={low < 1 ? 6 : 2} mono />
        ) : (
          <Text size={Size.Medium} weight="semibold">—</Text>
        )}
      </View>
      {volume !== undefined && (
        <View style={styles.legendItem}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>Volume</Text>
          <Currency value={volume} size={Size.Medium} weight="semibold" compact mono />
        </View>
      )}
    </View>
  );
}

export function AdvancedChart({ asset, loading, height }: AdvancedChartProps) {
  const themeColors = useThemeColors();
  const { isMobile } = useBreakpoint();
  const [timeRange, setTimeRange] = useState<TimeRange>("1W");
  const [chartType, setChartType] = useState<ChartType>("area");
  const [activeIndicators, setActiveIndicators] = useState<Set<Indicator>>(new Set(["volume"]));
  const [crosshairData, setCrosshairData] = useState<{
    price?: number;
    change?: number;
    high?: number;
    low?: number;
    volume?: number;
  }>({});
  const [chartError, setChartError] = useState<string | null>(null);
  const [apiChartData, setApiChartData] = useState<OhlcPoint[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedingStatus, setSeedingStatus] = useState<string | null>(null);
  const [fetchingChart, setFetchingChart] = useState(true); // Start true for initial load
  const [initialFetchComplete, setInitialFetchComplete] = useState(false);
  const [buildingTimeoutReached, setBuildingTimeoutReached] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<"Area" | "Line" | "Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const indicatorSeriesRef = useRef<Map<string, ISeriesApi<"Line">>>(new Map());
  const [containerHeight, setContainerHeight] = useState(height ?? 400);

  const isPositive = asset ? asset.change7d >= 0 : true;
  const positiveColor = Colors.status.success;
  const negativeColor = Colors.status.danger;
  const lineColor = isPositive ? positiveColor : negativeColor;

  // Handle real-time price updates from WebSocket
  const handlePriceUpdate = useCallback((update: PriceUpdate) => {
    setApiChartData(prev => {
      if (prev.length === 0) return prev;

      const intervalSeconds = getIntervalSecondsForRange(timeRange);
      const now = Math.floor(Date.now() / 1000);
      const currentBucketTime = Math.floor(now / intervalSeconds) * intervalSeconds;
      const lastCandle = prev[prev.length - 1];

      // Check if we need to create a new candle (new time bucket)
      if (lastCandle.time < currentBucketTime) {
        // Create a new candle for the current bucket
        const newCandle: OhlcPoint = {
          time: currentBucketTime,
          open: update.price,
          high: update.price,
          low: update.price,
          close: update.price,
          volume: undefined,
        };
        return [...prev, newCandle];
      }

      // Update the last candle's close/high/low
      const updatedCandle: OhlcPoint = {
        ...lastCandle,
        close: update.price,
        high: Math.max(lastCandle.high, update.price),
        low: Math.min(lastCandle.low, update.price),
      };
      return [...prev.slice(0, -1), updatedCandle];
    });
  }, [timeRange]);

  // Subscribe to real-time price updates for the current asset
  useAssetSubscription(asset ? [asset.symbol] : [], handlePriceUpdate);

  // Timeout for building state - fall back to sparkline after 30 seconds
  useEffect(() => {
    if (!initialFetchComplete || apiChartData.length > 0) {
      setBuildingTimeoutReached(false);
      return;
    }

    const timeout = setTimeout(() => {
      setBuildingTimeoutReached(true);
    }, 30000);

    return () => clearTimeout(timeout);
  }, [initialFetchComplete, apiChartData.length, timeRange]);

  // Determine if we're actively building chart data
  // Show "Building" loading state when:
  // 1. Initial fetch hasn't completed yet
  // 2. OR seeding is explicitly in progress with no data yet
  // 3. OR API returned empty data and seeding hasn't failed (waiting for seeding to complete)
  // BUT NOT if timeout has been reached (fall back to sparkline)
  const seedingInProgress = isSeeding || seedingStatus === "in_progress";
  const apiReturnedEmpty = apiChartData.length === 0;
  const seedingNotFailed = seedingStatus !== "failed";
  const isActivelyBuilding =
    !buildingTimeoutReached && (
      !initialFetchComplete ||
      (seedingInProgress && apiReturnedEmpty) ||
      (apiReturnedEmpty && seedingNotFailed && initialFetchComplete)
    );

  // Generate chart data - prefer API data if available
  const { lineData, ohlcData } = useMemo(() => {
    // If we're actively building data, don't fall back to sparkline - show loading state instead
    if (isActivelyBuilding) {
      return { lineData: [], ohlcData: [] };
    }

    // If we have API OHLC data, use it
    if (apiChartData.length > 0) {
      // Sort by time and deduplicate (lightweight-charts requires ascending order)
      const sortedData = [...apiChartData]
        .sort((a, b) => a.time - b.time)
        .filter((item, index, arr) => index === 0 || item.time !== arr[index - 1].time);

      const ohlcConverted: OHLCData[] = sortedData.map((p) => ({
        time: p.time,
        open: p.open,
        high: p.high,
        low: p.low,
        close: p.close,
        volume: p.volume,
      }));

      const lineConverted: ChartDataPoint[] = sortedData.map((p) => ({
        time: p.time,
        value: p.close,
      }));

      return { lineData: lineConverted, ohlcData: ohlcConverted };
    }

    // Fall back to generating from sparkline
    if (!asset?.sparkline) return { lineData: [], ohlcData: [] };
    return {
      lineData: generateLineData(asset.sparkline, timeRange),
      ohlcData: generateOHLCData(asset.sparkline, timeRange),
    };
  }, [asset?.sparkline, timeRange, apiChartData, isActivelyBuilding]);

  // Calculate stats
  const stats = useMemo(() => {
    if (lineData.length === 0) return {};
    const prices = lineData.map((d) => d.value);
    const volumes = ohlcData.map((d) => d.volume ?? 0);
    return {
      price: asset?.price ?? prices[prices.length - 1],
      change: asset?.change24h,
      high: Math.max(...prices),
      low: Math.min(...prices),
      volume: volumes.reduce((a, b) => a + b, 0),
    };
  }, [lineData, ohlcData, asset]);

  // Toggle indicator
  const toggleIndicator = useCallback((indicator: Indicator) => {
    setActiveIndicators((prev) => {
      const next = new Set(prev);
      if (next.has(indicator)) {
        next.delete(indicator);
      } else {
        next.add(indicator);
      }
      return next;
    });
  }, []);

  // Fetch chart data from API when time range changes
  useEffect(() => {
    if (!asset?.id) return;

    const rangeMap: Record<TimeRange, string> = {
      "1H": "1h",
      "4H": "4h",
      "1D": "1d",
      "1W": "1w",
      "1M": "1m",
      "3M": "1m", // Use 1m for 3M, we'll filter client-side
      "1Y": "1m",  // Use 1m for 1Y
      "ALL": "1m", // Use 1m for ALL
    };

    let pollTimeout: ReturnType<typeof setTimeout> | null = null;
    let isFirstFetch = true;

    // Reset state when time range changes
    setFetchingChart(true);
    setInitialFetchComplete(false);
    setBuildingTimeoutReached(false);

    const fetchData = async () => {
      try {
        const response = await hauntClient.getChart(asset.id, rangeMap[timeRange]);
        const data = response.data.data || [];
        setApiChartData(data);
        setIsSeeding(response.data.seeding || false);
        setSeedingStatus(response.data.seedingStatus || null);

        // Mark initial fetch as complete
        if (isFirstFetch) {
          isFirstFetch = false;
          setInitialFetchComplete(true);
        }

        // Poll while seeding OR when data is empty (backend auto-triggers seeding for empty data)
        const shouldPoll =
          response.data.seeding ||
          response.data.seedingStatus === "in_progress" ||
          (data.length === 0 && response.data.seedingStatus !== "failed");

        if (shouldPoll) {
          pollTimeout = setTimeout(fetchData, 3000);
        }
      } catch (err) {
        console.warn("Failed to fetch chart data from API, using sparkline:", err);
        setApiChartData([]);
        setSeedingStatus(null);
        // Still mark as complete on error so we can fall back to sparkline
        if (isFirstFetch) {
          isFirstFetch = false;
          setInitialFetchComplete(true);
        }
      } finally {
        setFetchingChart(false);
      }
    };

    fetchData();

    return () => {
      if (pollTimeout) {
        clearTimeout(pollTimeout);
      }
    };
  }, [asset?.id, timeRange]);

  // Initialize and update chart
  useEffect(() => {
    if (Platform.OS !== "web" || !containerRef.current) return;
    if (lineData.length < 2) return;

    const container = containerRef.current;

    // Clean up existing chart
    try {
      chartRef.current?.remove();
    } catch {
      // Ignore cleanup errors
    }
    chartRef.current = null;
    mainSeriesRef.current = null;
    volumeSeriesRef.current = null;
    indicatorSeriesRef.current.clear();

    // Measure the container's actual height (important for flex layouts)
    const measuredContainerHeight = container.clientHeight || container.offsetHeight || 400;

    // Use prop height if provided, otherwise use measured height
    // Note: Volume histogram is rendered inside the chart via scaleMargins, so no height reduction needed
    const effectiveHeight = height ?? measuredContainerHeight;
    const chartHeight = Math.max(200, effectiveHeight);

    // Reset error state
    setChartError(null);

    const chartOptions: DeepPartial<ChartOptions> = {
      width: container.clientWidth || 800,
      height: chartHeight,
      layout: {
        background: { color: "transparent" },
        textColor: themeColors.text.muted,
        fontFamily: "'Inter', -apple-system, sans-serif",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.03)" },
        horzLines: { color: "rgba(255,255,255,0.03)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "rgba(255,255,255,0.2)",
          width: 1,
          style: 2,
          labelBackgroundColor: themeColors.background.raised,
        },
        horzLine: {
          color: "rgba(255,255,255,0.2)",
          width: 1,
          style: 2,
          labelBackgroundColor: themeColors.background.raised,
        },
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { mouseWheel: true, pinch: true },
      rightPriceScale: {
        visible: !isMobile,
        borderVisible: false,
        scaleMargins: { top: 0.1, bottom: activeIndicators.has("volume") ? 0.2 : 0.1 },
      },
      timeScale: {
        visible: !isMobile,
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
    };

    const chart = createChart(container, chartOptions);
    chartRef.current = chart;

    // Add main series based on chart type
    if (chartType === "candle" && ohlcData.length > 0) {
      const series = chart.addSeries(CandlestickSeries, {
        upColor: positiveColor,
        downColor: negativeColor,
        borderUpColor: positiveColor,
        borderDownColor: negativeColor,
        wickUpColor: positiveColor,
        wickDownColor: negativeColor,
      });
      series.setData(ohlcData as CandlestickData<Time>[]);
      mainSeriesRef.current = series;
    } else if (chartType === "line") {
      const series = chart.addSeries(LineSeries, {
        color: lineColor,
        lineWidth: 2 as LineWidth,
        priceLineVisible: false,
        lastValueVisible: true,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
      });
      series.setData(lineData as LineData<Time>[]);
      mainSeriesRef.current = series;
    } else {
      // Area chart
      const series = chart.addSeries(AreaSeries, {
        lineColor,
        topColor: isPositive ? "rgba(47, 213, 117, 0.4)" : "rgba(255, 92, 122, 0.4)",
        bottomColor: isPositive ? "rgba(47, 213, 117, 0.02)" : "rgba(255, 92, 122, 0.02)",
        lineWidth: 2 as LineWidth,
        priceLineVisible: false,
        lastValueVisible: true,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
      });
      series.setData(lineData as AreaData<Time>[]);
      mainSeriesRef.current = series;
    }

    // Add volume histogram
    if (activeIndicators.has("volume") && ohlcData.length > 0) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: "rgba(107, 114, 128, 0.5)",
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
      });

      chart.priceScale("volume").applyOptions({
        scaleMargins: { top: 0.85, bottom: 0 },
        visible: false,
      });

      const volumeData: HistogramData<Time>[] = ohlcData.map((d) => ({
        time: d.time as Time,
        value: d.volume ?? 0,
        color: d.close >= d.open ? "rgba(47, 213, 117, 0.4)" : "rgba(255, 92, 122, 0.4)",
      }));

      volumeSeries.setData(volumeData);
      volumeSeriesRef.current = volumeSeries;
    }

    // Add SMA indicator
    if (activeIndicators.has("sma")) {
      const smaData = calculateSMA(lineData, 20);
      if (smaData.length > 0) {
        const smaSeries = chart.addSeries(LineSeries, {
          color: Colors.data.blue,
          lineWidth: 1 as LineWidth,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        smaSeries.setData(smaData as LineData<Time>[]);
        indicatorSeriesRef.current.set("sma", smaSeries);
      }
    }

    // Add EMA indicator
    if (activeIndicators.has("ema")) {
      const emaData = calculateEMA(lineData, 20);
      if (emaData.length > 0) {
        const emaSeries = chart.addSeries(LineSeries, {
          color: Colors.data.violet,
          lineWidth: 1 as LineWidth,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        emaSeries.setData(emaData as LineData<Time>[]);
        indicatorSeriesRef.current.set("ema", emaSeries);
      }
    }

    // Add Bollinger Bands
    if (activeIndicators.has("bollinger")) {
      const bb = calculateBollingerBands(lineData, 20, 2);
      if (bb.upper.length > 0) {
        const upperSeries = chart.addSeries(LineSeries, {
          color: Colors.data.amber + "99", // 60% opacity
          lineWidth: 1 as LineWidth,
          lineStyle: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        upperSeries.setData(bb.upper as LineData<Time>[]);
        indicatorSeriesRef.current.set("bb-upper", upperSeries);

        const middleSeries = chart.addSeries(LineSeries, {
          color: Colors.data.amber,
          lineWidth: 1 as LineWidth,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        middleSeries.setData(bb.middle as LineData<Time>[]);
        indicatorSeriesRef.current.set("bb-middle", middleSeries);

        const lowerSeries = chart.addSeries(LineSeries, {
          color: Colors.data.amber + "99", // 60% opacity
          lineWidth: 1 as LineWidth,
          lineStyle: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        lowerSeries.setData(bb.lower as LineData<Time>[]);
        indicatorSeriesRef.current.set("bb-lower", lowerSeries);
      }
    }

    // Crosshair move handler
    chart.subscribeCrosshairMove((param) => {
      if (!param.point || !param.time || !mainSeriesRef.current) {
        setCrosshairData(stats);
        return;
      }

      try {
        const mainData = param.seriesData.get(mainSeriesRef.current);
        if (mainData) {
          if ("close" in mainData) {
            // Candlestick data
            const candle = mainData as CandlestickData;
            setCrosshairData({
              price: candle.close,
              high: candle.high,
              low: candle.low,
            });
          } else if ("value" in mainData) {
            // Line/Area data
            setCrosshairData({
              price: (mainData as { value: number }).value,
            });
          }
        }
      } catch {
        setCrosshairData(stats);
      }
    });

    chart.timeScale().fitContent();
    removeWatermark(container);

    // Observe for watermark re-additions
    const observer = new MutationObserver(() => removeWatermark(container));
    observer.observe(container, { subtree: true, childList: true });

    // Resize handler - updates chart size when container changes
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      const width = entry.contentRect.width;
      const measuredHeight = entry.contentRect.height;

      if (width > 0 && measuredHeight > 0) {
        // Calculate new chart height (volume is rendered inside via scaleMargins)
        const newChartHeight = Math.max(200, height ?? measuredHeight);

        chart.resize(width, newChartHeight);
        chart.timeScale().fitContent();
      }
    });
    resizeObserver.observe(container);

    return () => {
      try {
        chart.remove();
      } catch {
        // Ignore cleanup errors
      }
      chartRef.current = null;
      mainSeriesRef.current = null;
      volumeSeriesRef.current = null;
      indicatorSeriesRef.current.clear();
      observer.disconnect();
      resizeObserver.disconnect();
    };
  }, [lineData, ohlcData, chartType, activeIndicators, height, containerHeight, themeColors, isPositive, lineColor, stats, isMobile]);

  // Set initial crosshair data
  useEffect(() => {
    setCrosshairData(stats);
  }, [stats]);

  // Flatten card styles for mobile
  const cardStyle = StyleSheet.flatten([styles.card, isMobile && styles.cardMobile]) as ViewStyle;

  if (loading) {
    return (
      <Card style={cardStyle}>
        <View style={[styles.controlsContainer, isMobile && styles.controlsContainerMobile]}>
          <Skeleton width={isMobile ? "100%" : 400} height={36} borderRadius={8} />
          {!isMobile && <Skeleton width={200} height={36} borderRadius={8} />}
        </View>
        <View style={[styles.chartContainer, height ? { height } : undefined]}>
          <Skeleton width="100%" height="100%" borderRadius={8} />
        </View>
      </Card>
    );
  }

  if (chartError) {
    return (
      <Card style={cardStyle}>
        <View style={[styles.placeholder, height ? { height } : undefined]}>
          <Icon name="skull" size={Size.TwoXLarge} color={Colors.status.danger} />
          <Text appearance={TextAppearance.Danger} style={{ marginTop: 12 }}>
            Chart Error
          </Text>
          <Text appearance={TextAppearance.Muted} size={Size.Small} style={{ marginTop: 4 }}>
            {chartError}
          </Text>
        </View>
      </Card>
    );
  }

  if (!asset || lineData.length < 2) {
    // Determine the loading state
    const showInitialLoading = !initialFetchComplete;
    const showBuildingState = initialFetchComplete && isActivelyBuilding;

    const placeholderHeight = height ?? 400;
    return (
      <Card style={cardStyle}>
        {showInitialLoading ? (
          <HeartbeatChart
            height={placeholderHeight}
            color={themeColors.accent.primary}
            bannerText="Loading chart..."
          />
        ) : showBuildingState ? (
          <HeartbeatChart
            height={placeholderHeight}
            color={themeColors.accent.primary}
            bannerText={`Building chart data for ${asset?.symbol || "this asset"}...`}
          />
        ) : seedingStatus === "failed" ? (
          <View style={[styles.placeholder, { height: placeholderHeight }]}>
            <Icon name="warning" size={Size.TwoXLarge} color={Colors.status.warning} />
            <Text appearance={TextAppearance.Warning} style={{ marginTop: 12 }}>
              Unable to load chart data
            </Text>
            <Text size={Size.Small} appearance={TextAppearance.Muted} style={{ marginTop: 4 }}>
              Historical data is not available for this asset
            </Text>
          </View>
        ) : (
          <View style={[styles.placeholder, { height: placeholderHeight }]}>
            <Icon name="grid" size={Size.TwoXLarge} appearance={TextAppearance.Muted} />
            <Text appearance={TextAppearance.Muted} style={{ marginTop: 12 }}>
              No chart data available
            </Text>
          </View>
        )}
      </Card>
    );
  }

  return (
    <Card style={cardStyle}>
      {/* Seeding banner - shows when we have some data but still updating more */}
      {isSeeding && apiChartData.length > 0 && (
        <View style={[styles.seedingBanner, isMobile && styles.seedingBannerMobile]}>
          <HeartbeatChart
            height={20}
            width={40}
            color={Colors.data.blue}
            animationDuration={1500}
            style={styles.seedingHeartbeat}
          />
          <Text size={Size.TwoXSmall} style={{ color: Colors.data.blue }}>
            Updating chart data in background...
          </Text>
        </View>
      )}

      {/* Header with stats - hidden on mobile */}
      {!isMobile && <ChartLegend {...crosshairData} />}

      {/* Controls */}
      <View style={[styles.controlsContainer, isMobile && styles.controlsContainerMobile]}>
        <View style={[styles.leftControls, isMobile && styles.leftControlsMobile]}>
          <SegmentedControl
            options={TIME_RANGE_OPTIONS}
            value={timeRange}
            onChange={setTimeRange}
            size={Size.Small}
          />
        </View>

        <View style={[styles.rightControls, isMobile && styles.rightControlsMobile]}>
          {/* Indicators - hidden on mobile to save space */}
          {!isMobile && (
            <>
              <View style={styles.indicatorGroup}>
                {INDICATORS.map((ind) => (
                  <FilterChip
                    key={ind.id}
                    label={ind.label}
                    selected={activeIndicators.has(ind.id)}
                    onPress={() => toggleIndicator(ind.id)}
                    size={Size.Small}
                  />
                ))}
              </View>

              <View style={styles.divider} />
            </>
          )}

          {/* Chart type */}
          <SegmentedControl
            options={CHART_TYPE_OPTIONS}
            value={chartType}
            onChange={setChartType}
            size={Size.Small}
          />
        </View>
      </View>

      {/* Chart */}
      <View style={[styles.chartContainer, height ? { height } : undefined]}>
        {Platform.OS === "web" ? (
          <div
            ref={containerRef}
            style={{
              width: "100%",
              height: "100%",
              filter: chartType !== "candle" ? `drop-shadow(0 0 8px ${lineColor}40)` : undefined,
            }}
          />
        ) : (
          <View style={styles.placeholder}>
            <Text appearance={TextAppearance.Muted}>Charts only available on web</Text>
          </View>
        )}
      </View>

      {/* Indicator Legend */}
      {(activeIndicators.has("sma") || activeIndicators.has("ema") || activeIndicators.has("bollinger")) && (
        <View style={styles.indicatorLegend}>
          {activeIndicators.has("sma") && (
            <View style={styles.legendTag}>
              <View style={[styles.legendDot, { backgroundColor: Colors.data.blue }]} />
              <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>SMA(20)</Text>
            </View>
          )}
          {activeIndicators.has("ema") && (
            <View style={styles.legendTag}>
              <View style={[styles.legendDot, { backgroundColor: Colors.data.violet }]} />
              <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>EMA(20)</Text>
            </View>
          )}
          {activeIndicators.has("bollinger") && (
            <View style={styles.legendTag}>
              <View style={[styles.legendDot, { backgroundColor: Colors.data.amber }]} />
              <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>BB(20,2)</Text>
            </View>
          )}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    gap: 16,
    flex: 1, // Fill available space
    display: "flex",
    flexDirection: "column",
  },
  cardMobile: {
    padding: 0,
    gap: 8,
    borderRadius: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 24,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  legendItem: {
    gap: 2,
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    paddingVertical: 12,
  },
  controlsContainerMobile: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  leftControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  leftControlsMobile: {
    width: "100%",
    justifyContent: "center",
  },
  rightControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rightControlsMobile: {
    width: "100%",
    justifyContent: "center",
  },
  indicatorGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  chartContainer: {
    flex: 1, // Fill remaining space in card
    width: "100%",
    minHeight: 200, // Minimum chart height
    borderRadius: 8,
    overflow: "hidden",
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 8,
  },
  indicatorLegend: {
    flexDirection: "row",
    gap: 16,
    paddingTop: 8,
  },
  legendTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  seedingBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  seedingBannerMobile: {
    marginHorizontal: 12,
    borderRadius: 6,
  },
  seedingHeartbeat: {
    marginRight: 8,
    backgroundColor: "transparent",
    borderRadius: 0,
  },
});
