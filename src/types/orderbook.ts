/**
 * Order Book Types
 *
 * Type definitions for aggregated order book data from multiple exchanges.
 */

import { Colors } from "@wraith/ghost/tokens";

/** A single price level in the aggregated order book */
export type AggregatedLevel = {
  /** Price at this level */
  price: number;
  /** Total quantity across all exchanges */
  totalQuantity: number;
  /** Quantity breakdown by exchange */
  exchanges: Record<string, number>;
};

/** Aggregated order book from multiple exchanges */
export type AggregatedOrderBook = {
  /** Symbol this order book is for */
  symbol: string;
  /** Bid levels (buy orders), sorted by price descending */
  bids: AggregatedLevel[];
  /** Ask levels (sell orders), sorted by price ascending */
  asks: AggregatedLevel[];
  /** Total bid volume (sum of all bid quantities) */
  bidTotal: number;
  /** Total ask volume (sum of all ask quantities) */
  askTotal: number;
  /** Order book imbalance: (bidTotal - askTotal) / (bidTotal + askTotal) */
  imbalance: number;
  /** Best bid price */
  bestBid: number;
  /** Best ask price */
  bestAsk: number;
  /** Spread: bestAsk - bestBid */
  spread: number;
  /** Spread as percentage of mid price */
  spreadPct: number;
  /** Mid price: (bestBid + bestAsk) / 2 */
  midPrice: number;
  /** Number of exchanges contributing to this book */
  exchangeCount: number;
  /** List of contributing exchanges */
  exchanges: string[];
  /** Timestamp when aggregated (unix ms) */
  timestamp: number;
};

/** API response wrapper for order book */
export type OrderBookResponse = {
  data: AggregatedOrderBook;
};

/** Get color based on imbalance value */
export function getImbalanceColor(imbalance: number): string {
  if (imbalance > 0.3) return Colors.status.success;
  if (imbalance > 0.1) return Colors.status.successDim;
  if (imbalance > -0.1) return Colors.text.muted;
  if (imbalance > -0.3) return Colors.status.dangerDim;
  return Colors.status.danger;
}

/** Get label for imbalance value */
export function getImbalanceLabel(imbalance: number): string {
  if (imbalance > 0.5) return "Strong Buy Pressure";
  if (imbalance > 0.2) return "Buy Pressure";
  if (imbalance > -0.2) return "Balanced";
  if (imbalance > -0.5) return "Sell Pressure";
  return "Strong Sell Pressure";
}

/** Format spread percentage for display */
export function formatSpreadPct(spreadPct: number): string {
  return `${spreadPct.toFixed(3)}%`;
}
