/**
 * Market filter constants
 */

import type { MarketOption } from "./types";

/** Market filter options */
export const MARKET_OPTIONS: MarketOption[] = [
  { value: "all", icon: "layers", labelKey: "all" },
  { value: "crypto", icon: "coins", labelKey: "crypto" },
  { value: "stock", icon: "building-2", labelKey: "stocks" },
];
