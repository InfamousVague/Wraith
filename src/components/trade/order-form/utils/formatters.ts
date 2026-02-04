/**
 * @file formatters.ts
 * @description Formatting utilities for order form display.
 */

/**
 * Formats a price value for display.
 * @param value - The price value
 * @param options - Formatting options
 * @returns Formatted price string
 */
export function formatPrice(
  value: number,
  options: {
    currency?: string;
    decimals?: number;
    showSign?: boolean;
  } = {}
): string {
  const { currency = "USD", decimals, showSign = false } = options;

  // Auto-determine decimals based on value magnitude
  let decimalPlaces = decimals;
  if (decimalPlaces === undefined) {
    if (value >= 10000) decimalPlaces = 0;
    else if (value >= 100) decimalPlaces = 2;
    else if (value >= 1) decimalPlaces = 4;
    else decimalPlaces = 6;
  }

  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(Math.abs(value));

  if (showSign && value !== 0) {
    return value > 0 ? `+${formatted}` : `-${formatted.replace("-", "")}`;
  }

  return value < 0 ? `-${formatted}` : formatted;
}

/**
 * Formats a quantity/size value for display.
 * @param value - The quantity value
 * @param options - Formatting options
 * @returns Formatted quantity string
 */
export function formatQuantity(
  value: number,
  options: {
    decimals?: number;
    symbol?: string;
  } = {}
): string {
  const { decimals, symbol } = options;

  // Auto-determine decimals based on value magnitude
  let decimalPlaces = decimals;
  if (decimalPlaces === undefined) {
    if (value >= 1000) decimalPlaces = 2;
    else if (value >= 1) decimalPlaces = 4;
    else decimalPlaces = 6;
  }

  const formatted = value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimalPlaces,
  });

  return symbol ? `${formatted} ${symbol}` : formatted;
}

/**
 * Formats a percentage value for display.
 * @param value - The percentage value (0.05 = 5%)
 * @param options - Formatting options
 * @returns Formatted percentage string
 */
export function formatPercent(
  value: number,
  options: {
    decimals?: number;
    showSign?: boolean;
    multiply?: boolean;
  } = {}
): string {
  const { decimals = 2, showSign = false, multiply = false } = options;

  const pct = multiply ? value * 100 : value;

  const formatted = pct.toFixed(decimals);
  const withSymbol = `${formatted}%`;

  if (showSign && pct !== 0) {
    return pct > 0 ? `+${withSymbol}` : withSymbol;
  }

  return withSymbol;
}

/**
 * Formats leverage for display.
 * @param value - The leverage value
 * @returns Formatted leverage string
 */
export function formatLeverage(value: number): string {
  return `${value}x`;
}

/**
 * Formats a USD value with compact notation for large values.
 * @param value - The USD value
 * @param options - Formatting options
 * @returns Formatted compact USD string
 */
export function formatCompactUsd(
  value: number,
  options: { showSign?: boolean } = {}
): string {
  const { showSign = false } = options;

  const absValue = Math.abs(value);
  let formatted: string;

  if (absValue >= 1_000_000_000) {
    formatted = `$${(absValue / 1_000_000_000).toFixed(2)}B`;
  } else if (absValue >= 1_000_000) {
    formatted = `$${(absValue / 1_000_000).toFixed(2)}M`;
  } else if (absValue >= 1_000) {
    formatted = `$${(absValue / 1_000).toFixed(2)}K`;
  } else {
    formatted = `$${absValue.toFixed(2)}`;
  }

  if (value < 0) {
    formatted = `-${formatted}`;
  } else if (showSign && value > 0) {
    formatted = `+${formatted}`;
  }

  return formatted;
}

/**
 * Parses a number string with possible commas and currency symbols.
 * @param value - The string to parse
 * @returns Parsed number or NaN
 */
export function parseNumber(value: string): number {
  // Remove currency symbols, commas, and whitespace
  const cleaned = value.replace(/[$,\s]/g, "");
  return parseFloat(cleaned);
}

/**
 * Formats an input value to show only valid decimal characters.
 * @param value - The input value
 * @param maxDecimals - Maximum decimal places
 * @returns Cleaned input value
 */
export function formatInputValue(value: string, maxDecimals: number = 8): string {
  // Remove non-numeric characters except decimal point
  let cleaned = value.replace(/[^0-9.]/g, "");

  // Only allow one decimal point
  const parts = cleaned.split(".");
  if (parts.length > 2) {
    cleaned = parts[0] + "." + parts.slice(1).join("");
  }

  // Limit decimal places
  if (parts.length === 2 && parts[1].length > maxDecimals) {
    cleaned = parts[0] + "." + parts[1].slice(0, maxDecimals);
  }

  return cleaned;
}

/**
 * Calculates and formats the USD equivalent of a crypto amount.
 * @param size - The crypto amount
 * @param price - The current price
 * @returns Formatted USD equivalent string
 */
export function formatUsdEquivalent(size: number, price: number): string {
  const usdValue = size * price;
  return formatPrice(usdValue, { decimals: 2 });
}

/**
 * Formats a timestamp for trade history display.
 * @param timestamp - ISO timestamp, Unix timestamp (ms), or Date
 * @returns Formatted date/time string
 */
export function formatTradeTime(timestamp: string | number | Date): string {
  const date = typeof timestamp === "number"
    ? new Date(timestamp)
    : typeof timestamp === "string"
      ? new Date(timestamp)
      : timestamp;

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
