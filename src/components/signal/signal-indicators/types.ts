/**
 * Types for signal indicators components
 */

import type { SignalOutput } from "../../types/signals";

export type SignalIndicatorsPanelProps = {
  /** All indicator signals */
  signals: SignalOutput[];
  /** Whether data is loading */
  loading?: boolean;
};

export type IndicatorRowProps = {
  signal: SignalOutput;
  /** Index for hint priority ordering */
  index: number;
};
