/**
 * Chart configuration constants and helper functions
 */

import { Colors } from "@wraith/ghost/tokens";
import type { TimeRange, ChartType, ChartTypeOption, TimeRangeOption, IndicatorConfig } from "../types";

/**
 * Chart type options with icons
 */
export const CHART_TYPE_OPTIONS: ChartTypeOption[] = [
  { value: "area", label: "Area", icon: "trending-up" },
  { value: "line", label: "Line", icon: "activity" },
  { value: "candle", label: "Candle", icon: "bar-chart-2" },
];

/**
 * Time range options
 */
export const TIME_RANGE_OPTIONS: TimeRangeOption[] = [
  { value: "1H", label: "1H" },
  { value: "4H", label: "4H" },
  { value: "1D", label: "1D" },
  { value: "1W", label: "1W" },
  { value: "1M", label: "1M" },
  { value: "3M", label: "3M" },
  { value: "1Y", label: "1Y" },
  { value: "ALL", label: "All" },
];

/**
 * Technical indicator definitions
 */
export const INDICATORS: IndicatorConfig[] = [
  { id: "sma", label: "SMA", color: Colors.data.blue },
  { id: "ema", label: "EMA", color: Colors.data.violet },
  { id: "bollinger", label: "BB", color: Colors.data.amber },
  { id: "volume", label: "Vol", color: Colors.text.muted },
];

/**
 * API range mapping for backend requests
 */
export const API_RANGE_MAP: Record<TimeRange, string> = {
  "1H": "1h",
  "4H": "4h",
  "1D": "1d",
  "1W": "1w",
  "1M": "1m",
  "3M": "1m", // Use 1m for 3M, filter client-side
  "1Y": "1m", // Use 1m for 1Y
  "ALL": "1m", // Use 1m for ALL
};

/**
 * Get the number of data points for a given time range
 */
export function getPointCountForRange(range: TimeRange): number {
  switch (range) {
    case "1H": return 60;
    case "4H": return 48;
    case "1D": return 288; // 24 hours / 5 minutes = 288 points
    case "1W": return 168;
    case "1M": return 30;
    case "3M": return 90;
    case "1Y": return 365;
    case "ALL": return 500;
    default: return 100;
  }
}

/**
 * Get the interval in seconds between data points for a given time range
 */
export function getIntervalSecondsForRange(range: TimeRange): number {
  switch (range) {
    case "1H": return 60;
    case "4H": return 300;
    case "1D": return 300; // 5-minute intervals to match backend
    case "1W": return 3600;
    case "1M": return 86400;
    case "3M": return 86400;
    case "1Y": return 86400;
    case "ALL": return 604800;
    default: return 3600;
  }
}

/**
 * Remove TradingView watermark from chart container
 */
export function removeWatermark(container: HTMLElement): void {
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
