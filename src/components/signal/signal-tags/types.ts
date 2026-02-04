/**
 * Types for signal tags components
 */

import type { SymbolSignals } from "../../types/signals";

export type SignalTag = {
  label: string;
  color: string;
  bgColor: string;
};

export type SignalTagsProps = {
  signals: SymbolSignals | null;
  /** Optional price change percentage for context */
  priceChange24h?: number;
  loading?: boolean;
};
