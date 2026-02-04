/**
 * Types for TradeHistory components
 */

import type { Trade } from "../../../services/haunt";

export type { Trade };

export interface TradeHistoryTableProps {
  trades: Trade[];
  loading?: boolean;
}

export interface TradeRowProps {
  trade: Trade;
}
