/**
 * Types for price feed components
 */

import type { Animated } from "react-native";
import type { PriceSourceId } from "../../../hooks/useHauntSocket";

export type { PriceSourceId };

export type FeedEvent = {
  id: string;
  symbol: string;
  name: string;
  action: "rose" | "dropped";
  price: number;
  previousPrice?: number;
  percentChange?: number;
  source?: PriceSourceId;
  timestamp: Date;
  opacity: Animated.Value;
};

export type StatsData = {
  tps: number;
  uptimeSecs: number;
  activeSymbols: number;
  onlineSources: number;
  totalSources: number;
};

export type PriceFeedCardProps = {
  maxEvents?: number;
  eventLifetime?: number; // ms before event starts fading
  loading?: boolean;
};

export type FeedEventLineProps = {
  event: FeedEvent;
};
