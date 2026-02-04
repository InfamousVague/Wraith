/**
 * Types for asset source breakdown components
 */

import type { SymbolSourceStat, ConfidenceResponse } from "../../services/haunt";

export type { SymbolSourceStat, ConfidenceResponse };

export type AssetSourceBreakdownProps = {
  symbol: string | undefined;
  loading?: boolean;
  pollInterval?: number;
};

export type HalfCircleGaugeProps = {
  score: number;
  color: string;
  label: string;
  mutedColor: string;
  trackColor: string;
};

export type SourceRowProps = {
  source: SymbolSourceStat;
  maxCount: number;
};

/** Exchange display configuration */
export type ExchangeConfig = {
  name: string;
  color: string;
};
