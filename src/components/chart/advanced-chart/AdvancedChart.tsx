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
import { View, StyleSheet, Platform, type ViewStyle } from "react-native";
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
import { Card, Skeleton, Text, Icon, SegmentedControl, FilterChip } from "@wraith/ghost/components";
import { Colors } from "@wraith/ghost/tokens";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { spacing, radii } from "../../../styles/tokens";
import { hauntClient, type OhlcPoint } from "../../../services/haunt";
import { useAssetSubscription, type PriceUpdate } from "../../../hooks/useHauntSocket";
import { HeartbeatChart } from "../heartbeat-chart";
import { useBreakpoint } from "../../../hooks/useBreakpoint";

// Import from modular structure
import type {
  TimeRange,
  ChartType,
  Indicator,
  AdvancedChartProps,
  ChartDataPoint,
  OHLCData,
  CrosshairData,
} from "./types";
import { ChartLegend } from "./ChartLegend";
import { ChartSettingsButton, DEFAULT_CHART_SETTINGS, type ChartSettings } from "./ChartSettings";
import { calculateSMA, calculateEMA, calculateBollingerBands } from "./utils/chartIndicators";
import { generateOHLCData, generateLineData } from "./utils/dataGenerators";
import {
  CHART_TYPE_OPTIONS,
  TIME_RANGE_OPTIONS,
  INDICATORS,
  API_RANGE_MAP,
  getIntervalSecondsForRange,
  removeWatermark,
} from "./utils/chartConfig";

// Re-export types for backward compatibility
export type { TimeRange, ChartType, Indicator } from "./types";

export function AdvancedChart({ asset, loading, height }: AdvancedChartProps) {
  const themeColors = useThemeColors();
  const { isMobile } = useBreakpoint();
  const [timeRange, setTimeRange] = useState<TimeRange>("1W");
  const [chartType, setChartType] = useState<ChartType>("area");
  const [activeIndicators, setActiveIndicators] = useState<Set<Indicator>>(new Set(["volume"]));
  const [chartSettings, setChartSettings] = useState<ChartSettings>(DEFAULT_CHART_SETTINGS);
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
  // Track chart configuration to detect when we need full recreation vs just data update
  const lastChartTypeRef = useRef<ChartType | null>(null);
  const lastTimeRangeRef = useRef<TimeRange | null>(null);
  // Track data for incremental updates - use first timestamp as signature for dataset
  const lastDataSignatureRef = useRef<number | null>(null);
  const lastDataLengthRef = useRef(0);
  const isInitialDataLoadRef = useRef(true);
  // Track last data point for detecting real-time updates
  const lastDataPointRef = useRef<{ time: number; close: number } | null>(null);
  // Track visible time range to preserve zoom across chart type changes
  const savedVisibleRangeRef = useRef<{ from: number; to: number } | null>(null);

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

    let pollTimeout: ReturnType<typeof setTimeout> | null = null;
    let isFirstFetch = true;

    // Reset state when time range changes
    setFetchingChart(true);
    setInitialFetchComplete(false);
    setBuildingTimeoutReached(false);

    const fetchData = async () => {
      try {
        const response = await hauntClient.getChart(asset.id, API_RANGE_MAP[timeRange]);
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

  // Memoize theme colors to prevent unnecessary re-renders
  // We only need specific color values, not the whole object
  const chartThemeColors = useMemo(() => ({
    textMuted: themeColors.text.muted,
    backgroundRaised: themeColors.background.raised,
  }), [themeColors.text.muted, themeColors.background.raised]);

  // Track if we have enough data - used to trigger chart creation when data loads
  const hasData = lineData.length >= 2;

  // Initialize chart - this effect only runs when chart type or indicators change
  // Data updates are handled in a separate effect below
  useEffect(() => {
    if (Platform.OS !== "web" || !containerRef.current) return;

    const container = containerRef.current;

    // Check if chart already exists and type hasn't changed
    // This allows us to skip recreation for pure data updates
    if (chartRef.current && lastChartTypeRef.current === chartType) {
      // Chart exists and type hasn't changed - skip recreation
      // Data updates will be handled by the separate data effect
      return;
    }

    // Note: Visible range is saved in the cleanup function of the previous effect run
    // This ensures it's captured right before the old chart is destroyed

    // Update tracking refs
    lastChartTypeRef.current = chartType;
    lastTimeRangeRef.current = timeRange;

    // Full chart creation needed
    // Clean up existing chart if it exists
    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch {
        // Ignore cleanup errors
      }
    }
    chartRef.current = null;
    mainSeriesRef.current = null;
    volumeSeriesRef.current = null;
    indicatorSeriesRef.current.clear();

    // Measure the container's actual height (important for flex layouts)
    // Use getBoundingClientRect for more accurate measurement in flex contexts
    const rect = container.getBoundingClientRect();
    const measuredContainerHeight = rect.height || container.clientHeight || container.offsetHeight || 400;

    // Use prop height if provided, otherwise use measured height
    // Note: Volume histogram is rendered inside the chart via scaleMargins, so no height reduction needed
    const effectiveHeight = height ?? measuredContainerHeight;
    const chartHeight = Math.max(200, effectiveHeight);

    // Reset error state
    setChartError(null);

    // Map crosshair mode setting to TradingView CrosshairMode enum
    const crosshairModeMap = {
      normal: CrosshairMode.Normal,
      magnet: CrosshairMode.Magnet,
      hidden: CrosshairMode.Hidden,
    };

    const chartOptions: DeepPartial<ChartOptions> = {
      width: container.clientWidth || 800,
      height: chartHeight,
      layout: {
        background: { color: "transparent" },
        textColor: chartThemeColors.textMuted,
        fontFamily: "'Inter', -apple-system, sans-serif",
      },
      grid: {
        vertLines: {
          color: chartSettings.showVerticalGrid ? "rgba(255,255,255,0.03)" : "transparent",
          visible: chartSettings.showVerticalGrid,
        },
        horzLines: {
          color: chartSettings.showHorizontalGrid ? "rgba(255,255,255,0.03)" : "transparent",
          visible: chartSettings.showHorizontalGrid,
        },
      },
      crosshair: {
        mode: crosshairModeMap[chartSettings.crosshairMode],
        vertLine: {
          color: "rgba(255,255,255,0.2)",
          width: 1,
          style: 2,
          labelBackgroundColor: chartThemeColors.backgroundRaised,
        },
        horzLine: {
          color: "rgba(255,255,255,0.2)",
          width: 1,
          style: 2,
          labelBackgroundColor: chartThemeColors.backgroundRaised,
        },
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { mouseWheel: true, pinch: true },
      rightPriceScale: {
        visible: !isMobile,
        borderVisible: false,
        scaleMargins: { top: 0.1, bottom: activeIndicators.has("volume") ? 0.2 : 0.1 },
        autoScale: chartSettings.autoScale,
        invertScale: chartSettings.invertScale,
        mode: chartSettings.logScale ? 1 : 0, // 0 = Normal, 1 = Logarithmic
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

    // Add main series based on chart type (data will be set by separate effect)
    if (chartType === "candle") {
      const series = chart.addSeries(CandlestickSeries, {
        upColor: positiveColor,
        downColor: negativeColor,
        borderUpColor: positiveColor,
        borderDownColor: negativeColor,
        wickUpColor: positiveColor,
        wickDownColor: negativeColor,
      });
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
      mainSeriesRef.current = series;
    }

    // Reset data signature so data effect will load initial data
    lastDataSignatureRef.current = null;
    lastDataLengthRef.current = 0;

    // Add volume histogram (data will be set by separate effect)
    if (activeIndicators.has("volume")) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: "rgba(107, 114, 128, 0.5)",
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
      });

      chart.priceScale("volume").applyOptions({
        scaleMargins: { top: 0.85, bottom: 0 },
        visible: false,
      });

      volumeSeriesRef.current = volumeSeries;
    }

    // Add SMA indicator series (data will be set by separate effect)
    if (activeIndicators.has("sma")) {
      const smaSeries = chart.addSeries(LineSeries, {
        color: Colors.data.blue,
        lineWidth: 1 as LineWidth,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      indicatorSeriesRef.current.set("sma", smaSeries);
    }

    // Add EMA indicator series (data will be set by separate effect)
    if (activeIndicators.has("ema")) {
      const emaSeries = chart.addSeries(LineSeries, {
        color: Colors.data.violet,
        lineWidth: 1 as LineWidth,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      indicatorSeriesRef.current.set("ema", emaSeries);
    }

    // Add Bollinger Bands series (data will be set by separate effect)
    if (activeIndicators.has("bollinger")) {
      const upperSeries = chart.addSeries(LineSeries, {
        color: Colors.data.amber + "99", // 60% opacity
        lineWidth: 1 as LineWidth,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      indicatorSeriesRef.current.set("bb-upper", upperSeries);

      const middleSeries = chart.addSeries(LineSeries, {
        color: Colors.data.amber,
        lineWidth: 1 as LineWidth,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      indicatorSeriesRef.current.set("bb-middle", middleSeries);

      const lowerSeries = chart.addSeries(LineSeries, {
        color: Colors.data.amber + "99", // 60% opacity
        lineWidth: 1 as LineWidth,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      indicatorSeriesRef.current.set("bb-lower", lowerSeries);
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

    // Set initial data immediately if available (fixes blank chart on initial load)
    // This is necessary because the data effect may have already run before this effect
    if (lineData.length >= 2 && mainSeriesRef.current) {
      if (chartType === "candle" && ohlcData.length > 0) {
        mainSeriesRef.current.setData(ohlcData as CandlestickData<Time>[]);
      } else {
        mainSeriesRef.current.setData(lineData as (LineData<Time>[] | AreaData<Time>[]));
      }

      // Set volume data if available
      if (volumeSeriesRef.current && ohlcData.length > 0) {
        const volumeData: HistogramData<Time>[] = ohlcData.map((d) => ({
          time: d.time as Time,
          value: d.volume ?? 0,
          color: d.close >= d.open ? "rgba(47, 213, 117, 0.4)" : "rgba(255, 92, 122, 0.4)",
        }));
        volumeSeriesRef.current.setData(volumeData);
      }

      // Set indicator data
      const smaSeries = indicatorSeriesRef.current.get("sma");
      if (smaSeries) {
        const smaData = calculateSMA(lineData, 20);
        if (smaData.length > 0) {
          smaSeries.setData(smaData as LineData<Time>[]);
        }
      }

      const emaSeries = indicatorSeriesRef.current.get("ema");
      if (emaSeries) {
        const emaData = calculateEMA(lineData, 20);
        if (emaData.length > 0) {
          emaSeries.setData(emaData as LineData<Time>[]);
        }
      }

      const bbUpper = indicatorSeriesRef.current.get("bb-upper");
      const bbMiddle = indicatorSeriesRef.current.get("bb-middle");
      const bbLower = indicatorSeriesRef.current.get("bb-lower");
      if (bbUpper && bbMiddle && bbLower) {
        const bb = calculateBollingerBands(lineData, 20, 2);
        if (bb.upper.length > 0) {
          bbUpper.setData(bb.upper as LineData<Time>[]);
          bbMiddle.setData(bb.middle as LineData<Time>[]);
          bbLower.setData(bb.lower as LineData<Time>[]);
        }
      }

      // Update data tracking refs
      const currentDataSignature = ohlcData.length > 0 ? ohlcData[0].time : lineData[0].time;
      const lastOhlc = ohlcData.length > 0 ? ohlcData[ohlcData.length - 1] : null;
      const lastLine = lineData[lineData.length - 1];
      lastDataSignatureRef.current = currentDataSignature;
      lastDataLengthRef.current = lineData.length;
      lastDataPointRef.current = {
        time: lastOhlc?.time ?? lastLine.time,
        close: lastOhlc?.close ?? lastLine.value,
      };

      // Restore saved visible range if we have one (preserves zoom when switching chart types)
      // Otherwise fit content for initial load
      if (savedVisibleRangeRef.current) {
        try {
          chart.timeScale().setVisibleRange({
            from: savedVisibleRangeRef.current.from as Time,
            to: savedVisibleRangeRef.current.to as Time,
          });
          // Clear after successful restore
          savedVisibleRangeRef.current = null;
        } catch {
          chart.timeScale().fitContent();
        }
      } else {
        chart.timeScale().fitContent();
      }
    } else {
      // No data yet - reset refs so data effect will handle initial load
      lastDataSignatureRef.current = null;
      lastDataLengthRef.current = 0;
      lastDataPointRef.current = null;
    }

    isInitialDataLoadRef.current = false;

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
        // Don't fitContent on resize - preserve user's zoom/scroll position
      }
    });
    resizeObserver.observe(container);

    // Store references for cleanup
    const currentChart = chart;
    const currentObserver = observer;
    const currentResizeObserver = resizeObserver;

    return () => {
      currentObserver.disconnect();
      currentResizeObserver.disconnect();

      // Save visible range BEFORE destroying the chart
      // This is critical for preserving zoom when switching chart types
      try {
        const visibleRange = currentChart.timeScale().getVisibleRange();
        if (visibleRange) {
          savedVisibleRangeRef.current = {
            from: visibleRange.from as number,
            to: visibleRange.to as number,
          };
        }
      } catch {
        // Ignore errors - chart may already be destroyed
      }

      // Now destroy the chart
      try {
        currentChart.remove();
      } catch {
        // Ignore cleanup errors
      }
      // Reset refs on cleanup so next creation works
      chartRef.current = null;
      mainSeriesRef.current = null;
      volumeSeriesRef.current = null;
      indicatorSeriesRef.current.clear();
    };
  // IMPORTANT: hasData is included so chart gets created when data first loads
  // Other data updates are handled by separate effect, preventing zoom reset
  // chartSettings is included to apply settings changes (log scale, auto-scale, grid, crosshair)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartType, activeIndicators, height, isMobile, hasData, chartSettings]);

  // Handle data updates separately from chart creation
  // This effect runs when data changes but doesn't recreate the chart
  useEffect(() => {
    if (!chartRef.current || !mainSeriesRef.current) return;
    if (lineData.length < 2) return;

    // Use first data point timestamp as signature to detect if dataset changed (e.g., time range change)
    const currentDataSignature = ohlcData.length > 0 ? ohlcData[0].time : (lineData.length > 0 ? lineData[0].time : null);
    const datasetChanged = lastDataSignatureRef.current !== currentDataSignature;

    // Detect if just the last point changed (real-time update)
    // We check both time and the close/value to detect price changes
    const lastOhlc = ohlcData.length > 0 ? ohlcData[ohlcData.length - 1] : null;
    const lastLine = lineData.length > 0 ? lineData[lineData.length - 1] : null;
    const lastPointTime = lastOhlc?.time ?? lastLine?.time ?? 0;
    const lastPointValue = lastOhlc?.close ?? lastLine?.value ?? 0;

    const lastPointChanged = !lastDataPointRef.current ||
      lastDataPointRef.current.time !== lastPointTime ||
      lastDataPointRef.current.close !== lastPointValue;

    const lastPoint = { time: lastPointTime, close: lastPointValue };

    if (datasetChanged) {
      // Dataset changed (e.g., new time range) - reload all data and fit
      if (chartType === "candle" && ohlcData.length > 0) {
        mainSeriesRef.current.setData(ohlcData as CandlestickData<Time>[]);
      } else {
        mainSeriesRef.current.setData(lineData as (LineData<Time>[] | AreaData<Time>[]));
      }

      // Update volume if present
      if (volumeSeriesRef.current && ohlcData.length > 0) {
        const volumeData: HistogramData<Time>[] = ohlcData.map((d) => ({
          time: d.time as Time,
          value: d.volume ?? 0,
          color: d.close >= d.open ? "rgba(47, 213, 117, 0.4)" : "rgba(255, 92, 122, 0.4)",
        }));
        volumeSeriesRef.current.setData(volumeData);
      }

      // Update indicator series data
      if (lineData.length > 0) {
        const smaSeries = indicatorSeriesRef.current.get("sma");
        if (smaSeries) {
          const smaData = calculateSMA(lineData, 20);
          if (smaData.length > 0) {
            smaSeries.setData(smaData as LineData<Time>[]);
          }
        }

        const emaSeries = indicatorSeriesRef.current.get("ema");
        if (emaSeries) {
          const emaData = calculateEMA(lineData, 20);
          if (emaData.length > 0) {
            emaSeries.setData(emaData as LineData<Time>[]);
          }
        }

        const bbUpper = indicatorSeriesRef.current.get("bb-upper");
        const bbMiddle = indicatorSeriesRef.current.get("bb-middle");
        const bbLower = indicatorSeriesRef.current.get("bb-lower");
        if (bbUpper && bbMiddle && bbLower) {
          const bb = calculateBollingerBands(lineData, 20, 2);
          if (bb.upper.length > 0) {
            bbUpper.setData(bb.upper as LineData<Time>[]);
            bbMiddle.setData(bb.middle as LineData<Time>[]);
            bbLower.setData(bb.lower as LineData<Time>[]);
          }
        }
      }

      lastDataSignatureRef.current = currentDataSignature;
      lastDataLengthRef.current = lineData.length;
      lastDataPointRef.current = lastPoint;

      // Restore saved visible range if we have one (preserves zoom when switching chart types)
      // Otherwise fit content for initial load or time range changes
      if (savedVisibleRangeRef.current) {
        try {
          chartRef.current.timeScale().setVisibleRange({
            from: savedVisibleRangeRef.current.from as Time,
            to: savedVisibleRangeRef.current.to as Time,
          });
          // Clear the saved range after restoring so future dataset changes fit content
          savedVisibleRangeRef.current = null;
        } catch {
          // If restoring fails, fit content instead
          chartRef.current.timeScale().fitContent();
        }
      } else {
        // No saved range - this is a real dataset change (time range change or initial load)
        chartRef.current.timeScale().fitContent();
      }
    } else if (lastPointChanged) {
      // Same dataset but last point updated (real-time price update)
      // Use update() to preserve zoom/scroll position
      if (chartType === "candle" && ohlcData.length > 0) {
        const lastCandle = ohlcData[ohlcData.length - 1];
        mainSeriesRef.current.update(lastCandle as CandlestickData<Time>);
      } else if (lineData.length > 0) {
        const lastLinePoint = lineData[lineData.length - 1];
        mainSeriesRef.current.update(lastLinePoint as LineData<Time> | AreaData<Time>);
      }

      // Update volume last bar if present
      if (volumeSeriesRef.current && ohlcData.length > 0) {
        const lastOhlc = ohlcData[ohlcData.length - 1];
        volumeSeriesRef.current.update({
          time: lastOhlc.time as Time,
          value: lastOhlc.volume ?? 0,
          color: lastOhlc.close >= lastOhlc.open ? "rgba(47, 213, 117, 0.4)" : "rgba(255, 92, 122, 0.4)",
        });
      }

      lastDataLengthRef.current = lineData.length;
      lastDataPointRef.current = lastPoint;
    }
    // If neither datasetChanged nor lastPointChanged, do nothing - prevents unnecessary updates
  }, [lineData, ohlcData, chartType]);

  // Set initial crosshair data
  useEffect(() => {
    setCrosshairData(stats);
  }, [stats]);

  // Flatten card styles for mobile
  const cardStyle = StyleSheet.flatten([styles.card, isMobile && styles.cardMobile]) as any;

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

          {/* Settings button */}
          {!isMobile && (
            <ChartSettingsButton
              settings={chartSettings}
              onSettingsChange={setChartSettings}
              size={Size.Small}
            />
          )}
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
    padding: spacing.lg,
    gap: spacing.md,
    flex: 1, // Fill available space
    display: "flex",
    flexDirection: "column",
  },
  cardMobile: {
    padding: spacing.none,
    gap: spacing.xs,
    borderRadius: radii.none,
    borderWidth: 0,
    backgroundColor: "transparent",
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xl,
    paddingBottom: spacing.xs,
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
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  controlsContainerMobile: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  leftControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  leftControlsMobile: {
    width: "100%",
    justifyContent: "center",
  },
  rightControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  rightControlsMobile: {
    width: "100%",
    justifyContent: "center",
  },
  indicatorGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
  },
  divider: {
    width: 1,
    height: spacing.xl,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  chartContainer: {
    flex: 1, // Fill remaining space in card
    width: "100%",
    minHeight: 200, // Minimum chart height
    borderRadius: radii.md,
    overflow: "hidden",
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: radii.md,
  },
  indicatorLegend: {
    flexDirection: "row",
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
  legendTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
  },
  legendDot: {
    width: spacing.xs,
    height: spacing.xs,
    borderRadius: radii.soft,
  },
  seedingBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    marginBottom: spacing.xs,
  },
  seedingBannerMobile: {
    marginHorizontal: spacing.sm,
    borderRadius: radii.sm,
  },
  seedingHeartbeat: {
    marginRight: spacing.xs,
    backgroundColor: "transparent",
    borderRadius: radii.none,
  },
});
