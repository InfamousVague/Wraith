/**
 * Types for AdvancedChart component
 */

import type { Asset } from "../../../types/asset";

// Time range options for chart display
export type TimeRange = "1H" | "4H" | "1D" | "1W" | "1M" | "3M" | "1Y" | "ALL";

// Chart visualization types
export type ChartType = "line" | "area" | "candle" | "baseline";

// Technical indicator types
export type Indicator = "sma" | "ema" | "bollinger" | "volume";

// Props for AdvancedChart component
export type AdvancedChartProps = {
  asset: Asset | null;
  loading?: boolean;
  height?: number; // Optional - if not provided, flex to fill container
};

// Generic data point for line/area charts
export type ChartDataPoint = {
  time: number;
  value: number;
};

// OHLC data structure for candlestick charts
export type OHLCData = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

// Crosshair data for legend display
export type CrosshairData = {
  price?: number;
  change?: number;
  high?: number;
  low?: number;
  volume?: number;
};

// Chart option configuration
export type ChartTypeOption = {
  value: ChartType;
  label: string;
  icon: "trending-up" | "activity" | "bar-chart-2";
};

export type TimeRangeOption = {
  value: TimeRange;
  label: string;
};

export type IndicatorConfig = {
  id: Indicator;
  label: string;
  color: string;
};
