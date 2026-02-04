/**
 * Technical indicator calculations for charts
 *
 * @fileoverview Pure functions for calculating technical indicators:
 * - SMA (Simple Moving Average)
 * - EMA (Exponential Moving Average)
 * - Bollinger Bands
 */

import type { ChartDataPoint } from "../types";

/**
 * Calculate Simple Moving Average (SMA)
 * @param data - Array of chart data points
 * @param period - Number of periods for the moving average (default: 20)
 * @returns Array of SMA values
 */
export function calculateSMA(data: ChartDataPoint[], period: number = 20): ChartDataPoint[] {
  const result: ChartDataPoint[] = [];
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((acc, d) => acc + d.value, 0);
    result.push({ time: data[i].time, value: sum / period });
  }
  return result;
}

/**
 * Calculate Exponential Moving Average (EMA)
 * @param data - Array of chart data points
 * @param period - Number of periods for the moving average (default: 20)
 * @returns Array of EMA values
 */
export function calculateEMA(data: ChartDataPoint[], period: number = 20): ChartDataPoint[] {
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

/**
 * Bollinger Bands result type
 */
export type BollingerBandsResult = {
  upper: ChartDataPoint[];
  middle: ChartDataPoint[];
  lower: ChartDataPoint[];
};

/**
 * Calculate Bollinger Bands
 * @param data - Array of chart data points
 * @param period - Number of periods for the moving average (default: 20)
 * @param stdDev - Number of standard deviations (default: 2)
 * @returns Object containing upper, middle, and lower band data
 */
export function calculateBollingerBands(
  data: ChartDataPoint[],
  period: number = 20,
  stdDev: number = 2
): BollingerBandsResult {
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
