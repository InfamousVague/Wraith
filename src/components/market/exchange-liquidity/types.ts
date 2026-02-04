/**
 * Types for exchange liquidity components
 */

export type ExchangeStats = {
  source: string;
  updateCount: number;
  updatePercent: number;
  online: boolean;
  lastError?: string;
};

export type ExchangeRowProps = {
  exchange: ExchangeStats;
  maxCount: number;
};

export type ExchangeLiquidityProps = {
  loading?: boolean;
  pollInterval?: number;
};
