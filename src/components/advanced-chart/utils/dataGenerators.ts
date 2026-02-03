/**
 * Data generation utilities for charts
 *
 * @fileoverview Functions for generating chart data from sparkline arrays:
 * - generateOHLCData - Creates OHLC candles from sparkline
 * - generateLineData - Interpolates sparkline to chart data points
 */

import type { ChartDataPoint, OHLCData, TimeRange } from "../types";
import { getPointCountForRange, getIntervalSecondsForRange } from "./chartConfig";

/**
 * Generate OHLC (candlestick) data from a sparkline array
 * @param sparkline - Array of price values
 * @param timeRange - Time range for the chart
 * @returns Array of OHLC data points
 */
export function generateOHLCData(sparkline: number[], timeRange: TimeRange): OHLCData[] {
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

/**
 * Generate line/area chart data from a sparkline array
 * Uses linear interpolation for smooth data points
 * @param sparkline - Array of price values
 * @param timeRange - Time range for the chart
 * @returns Array of chart data points
 */
export function generateLineData(sparkline: number[], timeRange: TimeRange): ChartDataPoint[] {
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

    // Add small noise for visual variation
    const noise = (Math.random() - 0.5) * value * 0.001;

    data.push({
      time: now - (pointCount - 1 - i) * intervalSeconds,
      value: value + noise,
    });
  }

  return data;
}
