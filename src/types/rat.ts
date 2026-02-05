/**
 * @file rat.ts
 * @description Types for the Random Auto Trader (RAT) developer tool.
 */

/**
 * RAT operational status.
 */
export type RatStatus = "idle" | "active" | "error" | "stopping";

/**
 * RAT configuration for a portfolio.
 */
export interface RatConfig {
  /** Unique RAT config ID */
  id: string;
  /** Portfolio this RAT operates on */
  portfolioId: string;
  /** Whether RAT is currently enabled */
  enabled: boolean;
  /** Trade interval in seconds */
  tradeIntervalSecs: number;
  /** Maximum concurrent open positions */
  maxOpenPositions: number;
  /** Symbols available for trading (empty = all available) */
  symbols: string[];
  /** Minimum position hold time in seconds */
  minHoldTimeSecs: number;
  /** Position size range as percentage of margin [min, max] */
  sizeRangePct: [number, number];
  /** Probability of setting stop loss (0-1) */
  stopLossProbability: number;
  /** Probability of setting take profit (0-1) */
  takeProfitProbability: number;
  /** Stop loss distance range [min, max] */
  stopLossRangePct: [number, number];
  /** Take profit distance range [min, max] */
  takeProfitRangePct: [number, number];
  /** Created timestamp */
  createdAt: number;
  /** Updated timestamp */
  updatedAt: number;
}

/**
 * RAT runtime statistics.
 */
export interface RatStats {
  /** Unique stats ID */
  id: string;
  /** Portfolio ID */
  portfolioId: string;
  /** Total trades executed */
  totalTrades: number;
  /** Winning trades */
  winningTrades: number;
  /** Losing trades */
  losingTrades: number;
  /** Total P&L */
  totalPnl: number;
  /** Error count */
  errors: number;
  /** Last trade timestamp */
  lastTradeAt: number | null;
  /** Started timestamp */
  startedAt: number | null;
  /** Updated timestamp */
  updatedAt: number;
}

/**
 * Combined RAT state for API responses.
 */
export interface RatState {
  /** Current configuration */
  config: RatConfig;
  /** Runtime statistics */
  stats: RatStats;
  /** Operational status */
  status: RatStatus;
  /** Current number of open positions */
  openPositions: number;
}

/**
 * Request to start RAT.
 */
export interface StartRatRequest {
  /** Portfolio ID to start RAT for */
  portfolioId: string;
  /** Optional configuration updates */
  config?: RatConfigUpdate;
}

/**
 * Request to stop RAT.
 */
export interface StopRatRequest {
  /** Portfolio ID to stop RAT for */
  portfolioId: string;
}

/**
 * Configuration update fields.
 */
export interface RatConfigUpdate {
  tradeIntervalSecs?: number;
  maxOpenPositions?: number;
  symbols?: string[];
  minHoldTimeSecs?: number;
  sizeRangePct?: [number, number];
  stopLossProbability?: number;
  takeProfitProbability?: number;
  stopLossRangePct?: [number, number];
  takeProfitRangePct?: [number, number];
}

/**
 * WebSocket RAT status update payload.
 */
export interface RatStatusUpdateData {
  portfolioId: string;
  status: RatStatus;
  stats: RatStats;
  config: RatConfig;
  openPositions: number;
  timestamp: number;
}

/**
 * Default RAT configuration values.
 */
export const DEFAULT_RAT_CONFIG: Partial<RatConfig> = {
  tradeIntervalSecs: 60,
  maxOpenPositions: 5,
  symbols: [],
  minHoldTimeSecs: 30,
  sizeRangePct: [0.05, 0.15],
  stopLossProbability: 0.7,
  takeProfitProbability: 0.6,
  stopLossRangePct: [0.02, 0.05],
  takeProfitRangePct: [0.03, 0.08],
};

/**
 * Calculate win rate from stats.
 */
export function calculateWinRate(stats: RatStats): number {
  if (stats.totalTrades === 0) return 0;
  return (stats.winningTrades / stats.totalTrades) * 100;
}
