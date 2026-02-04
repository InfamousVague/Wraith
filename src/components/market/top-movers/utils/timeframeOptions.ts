/**
 * Timeframe configuration for top movers
 */

import type { TimeframeOption } from "../types";

/** Time range options for top movers */
export const TIMEFRAME_OPTIONS: TimeframeOption[] = [
  { value: "5m", label: "5m" },
  { value: "15m", label: "15m" },
  { value: "1h", label: "1H" },
  { value: "4h", label: "4H" },
  { value: "24h", label: "24H" },
];
