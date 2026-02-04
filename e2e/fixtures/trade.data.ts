/**
 * @file trade.data.ts
 * @description Test data constants for TradeSandbox E2E tests.
 */

/**
 * Test symbols that are known to exist in the system.
 * Using major cryptos that have reliable liquidity.
 */
export const TEST_SYMBOLS = {
  BTC: "BTC",
  ETH: "ETH",
  SOL: "SOL",
} as const;

/**
 * Default symbol for tests.
 */
export const DEFAULT_SYMBOL = TEST_SYMBOLS.BTC;

/**
 * Test order sizes - using small values to avoid margin issues.
 * These are position sizes, not USD values.
 */
export const TEST_SIZES = {
  /** Small position size for most tests */
  small: "0.01",
  /** Medium position size */
  medium: "0.05",
  /** Large position size for stress tests */
  large: "0.1",
  /** Minimum valid size */
  minimum: "0.001",
} as const;

/**
 * Percentage offsets from market price for limit orders.
 * Positive = above market, Negative = below market.
 */
export const PRICE_OFFSETS = {
  /** 5% below market - for limit buys that won't fill */
  limitBuyOffset: -0.05,
  /** 5% above market - for limit sells that won't fill */
  limitSellOffset: 0.05,
  /** 10% below market - for stop loss orders */
  stopLossOffset: -0.1,
  /** 10% above market - for take profit orders */
  takeProfitOffset: 0.1,
  /** 20% below market - for orders that definitely won't fill */
  farBelowOffset: -0.2,
  /** 20% above market - for orders that definitely won't fill */
  farAboveOffset: 0.2,
} as const;

/**
 * Expected fee rate used in the application.
 */
export const FEE_RATE = 0.001; // 0.1%

/**
 * Test leverage values.
 */
export const TEST_LEVERAGE = {
  /** Default leverage (1x, no leverage) */
  none: 1,
  /** Low leverage */
  low: 2,
  /** Medium leverage */
  medium: 5,
  /** High leverage */
  high: 10,
  /** Max supported leverage */
  max: 100,
} as const;

/**
 * Starting portfolio balance for new accounts.
 */
export const STARTING_BALANCE = 100_000;

/**
 * Order types available in the system.
 */
export const ORDER_TYPES = {
  market: "Market",
  limit: "Limit",
  stopLoss: "Stop Loss",
  takeProfit: "Take Profit",
} as const;

/**
 * Order sides available in the system.
 */
export const ORDER_SIDES = {
  buy: "Buy / Long",
  sell: "Sell / Short",
} as const;

/**
 * Tab labels in the trading interface.
 */
export const TAB_LABELS = {
  positions: "Positions",
  orders: "Orders",
  history: "History",
} as const;

/**
 * Local storage keys used by the application.
 */
export const STORAGE_KEYS = {
  privateKey: "wraith_private_key",
  user: "wraith_user",
  session: "wraith_session_token",
  serverProfile: "wraith_server_profile",
} as const;

/**
 * API endpoints.
 */
export const API_BASE = "http://localhost:3001";

/**
 * Timeout values for various operations.
 */
export const TIMEOUTS = {
  /** Wait for page load */
  pageLoad: 5000,
  /** Wait for API response */
  apiResponse: 10000,
  /** Wait for order to execute */
  orderExecution: 5000,
  /** Wait for WebSocket connection */
  webSocket: 3000,
  /** Wait for price update */
  priceUpdate: 5000,
  /** Wait for modal animation */
  modal: 1000,
  /** Short wait for UI updates */
  short: 500,
} as const;

/**
 * Calculate limit price based on current price and offset.
 */
export function calculateLimitPrice(currentPrice: number, offset: number): string {
  return (currentPrice * (1 + offset)).toFixed(2);
}

/**
 * Parse price from displayed text (removes $ and commas).
 */
export function parsePriceText(priceText: string): number {
  return parseFloat(priceText.replace(/[$,]/g, "")) || 0;
}
