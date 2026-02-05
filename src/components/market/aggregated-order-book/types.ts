/**
 * Types for aggregated order book components
 */

import type { AggregatedOrderBook, AggregatedLevel } from "../../../types/orderbook";

export type { AggregatedOrderBook, AggregatedLevel };

export type AggregatedOrderBookProps = {
  symbol: string | undefined;
  loading?: boolean;
  /** When provided, clicking a price level will call this with the selected price and side */
  onPriceSelect?: (price: number, side: "bid" | "ask") => void;
};

export type OrderBookRowProps = {
  level: AggregatedLevel;
  maxQuantity: number;
  side: "bid" | "ask";
  priceDecimals: number;
  quantityDecimals: number;
  onPriceSelect?: (price: number, side: "bid" | "ask") => void;
};

export type SpreadDisplayProps = {
  orderBook: AggregatedOrderBook;
};

export type ExchangeBreakdownProps = {
  orderBook: AggregatedOrderBook;
};
