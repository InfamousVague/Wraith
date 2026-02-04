/**
 * Types for aggregated order book components
 */

import type { AggregatedOrderBook, AggregatedLevel } from "../../types/orderbook";

export type { AggregatedOrderBook, AggregatedLevel };

export type AggregatedOrderBookProps = {
  symbol: string | undefined;
  loading?: boolean;
};

export type OrderBookRowProps = {
  level: AggregatedLevel;
  maxQuantity: number;
  side: "bid" | "ask";
  priceDecimals: number;
  quantityDecimals: number;
};

export type SpreadDisplayProps = {
  orderBook: AggregatedOrderBook;
};

export type ExchangeBreakdownProps = {
  orderBook: AggregatedOrderBook;
};
