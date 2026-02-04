/**
 * @file validators.ts
 * @description Validation utilities for order form inputs.
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates a price input value.
 * @param value - The input value as string
 * @param options - Validation options
 * @returns Validation result with error message if invalid
 */
export function validatePrice(
  value: string,
  options: { min?: number; max?: number; required?: boolean } = {}
): ValidationResult {
  const { min = 0, max = Infinity, required = false } = options;

  if (!value || value.trim() === "") {
    if (required) {
      return { isValid: false, error: "Price is required" };
    }
    return { isValid: true };
  }

  const num = parseFloat(value);

  if (isNaN(num)) {
    return { isValid: false, error: "Invalid price format" };
  }

  if (num < min) {
    return { isValid: false, error: `Price must be at least ${min}` };
  }

  if (num > max) {
    return { isValid: false, error: `Price must not exceed ${max}` };
  }

  if (num <= 0) {
    return { isValid: false, error: "Price must be positive" };
  }

  return { isValid: true };
}

/**
 * Validates a size/quantity input value.
 * @param value - The input value as string
 * @param options - Validation options
 * @returns Validation result with error message if invalid
 */
export function validateSize(
  value: string,
  options: {
    min?: number;
    max?: number;
    maxDecimals?: number;
    required?: boolean;
  } = {}
): ValidationResult {
  const { min = 0, max = Infinity, maxDecimals = 8, required = true } = options;

  if (!value || value.trim() === "") {
    if (required) {
      return { isValid: false, error: "Size is required" };
    }
    return { isValid: true };
  }

  const num = parseFloat(value);

  if (isNaN(num)) {
    return { isValid: false, error: "Invalid size format" };
  }

  if (num <= 0) {
    return { isValid: false, error: "Size must be positive" };
  }

  if (num < min) {
    return { isValid: false, error: `Size must be at least ${min}` };
  }

  if (num > max) {
    return { isValid: false, error: `Size must not exceed ${max}` };
  }

  // Check decimal places
  const parts = value.split(".");
  if (parts.length > 1 && parts[1].length > maxDecimals) {
    return { isValid: false, error: `Maximum ${maxDecimals} decimal places allowed` };
  }

  return { isValid: true };
}

/**
 * Validates leverage value.
 * @param value - The leverage value
 * @param options - Validation options
 * @returns Validation result with error message if invalid
 */
export function validateLeverage(
  value: number,
  options: { min?: number; max?: number } = {}
): ValidationResult {
  const { min = 1, max = 100 } = options;

  if (!Number.isInteger(value)) {
    return { isValid: false, error: "Leverage must be a whole number" };
  }

  if (value < min) {
    return { isValid: false, error: `Leverage must be at least ${min}x` };
  }

  if (value > max) {
    return { isValid: false, error: `Maximum leverage is ${max}x` };
  }

  return { isValid: true };
}

/**
 * Validates that available margin is sufficient for the order.
 * @param orderValue - The total value of the order in USD
 * @param leverage - The leverage being used
 * @param availableMargin - The available margin
 * @returns Validation result
 */
export function validateMargin(
  orderValue: number,
  leverage: number,
  availableMargin: number
): ValidationResult {
  const requiredMargin = orderValue / leverage;

  if (requiredMargin > availableMargin) {
    return {
      isValid: false,
      error: `Insufficient margin. Required: $${requiredMargin.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
    };
  }

  return { isValid: true };
}

/**
 * Validates stop loss price relative to entry and position side.
 * @param stopLoss - The stop loss price
 * @param entryPrice - The entry price
 * @param side - The position side (buy/long or sell/short)
 * @returns Validation result
 */
export function validateStopLoss(
  stopLoss: number,
  entryPrice: number,
  side: "buy" | "sell"
): ValidationResult {
  if (stopLoss <= 0) {
    return { isValid: false, error: "Stop loss must be positive" };
  }

  if (side === "buy") {
    // For long positions, stop loss must be below entry
    if (stopLoss >= entryPrice) {
      return { isValid: false, error: "Stop loss must be below entry price for long positions" };
    }
  } else {
    // For short positions, stop loss must be above entry
    if (stopLoss <= entryPrice) {
      return { isValid: false, error: "Stop loss must be above entry price for short positions" };
    }
  }

  return { isValid: true };
}

/**
 * Validates take profit price relative to entry and position side.
 * @param takeProfit - The take profit price
 * @param entryPrice - The entry price
 * @param side - The position side (buy/long or sell/short)
 * @returns Validation result
 */
export function validateTakeProfit(
  takeProfit: number,
  entryPrice: number,
  side: "buy" | "sell"
): ValidationResult {
  if (takeProfit <= 0) {
    return { isValid: false, error: "Take profit must be positive" };
  }

  if (side === "buy") {
    // For long positions, take profit must be above entry
    if (takeProfit <= entryPrice) {
      return { isValid: false, error: "Take profit must be above entry price for long positions" };
    }
  } else {
    // For short positions, take profit must be below entry
    if (takeProfit >= entryPrice) {
      return { isValid: false, error: "Take profit must be below entry price for short positions" };
    }
  }

  return { isValid: true };
}
