/**
 * useOrderBook Hook
 *
 * Fetches aggregated order book data from multiple exchanges.
 * Polls every 2 seconds for real-time updates.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { hauntClient } from "../services/haunt";
import type { AggregatedOrderBook } from "../types/orderbook";

type UseOrderBookOptions = {
  /** Number of price levels to fetch (default: 50, max: 100) */
  depth?: number;
  /** Polling interval in milliseconds (default: 2000 = 2 seconds) */
  pollInterval?: number;
  /** Whether to enable polling (default: true) */
  enablePolling?: boolean;
};

type UseOrderBookResult = {
  /** Order book data */
  orderBook: AggregatedOrderBook | null;
  /** Whether initial data is loading */
  loading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Manually refresh data */
  refresh: () => Promise<void>;
};

/**
 * Hook to fetch and manage aggregated order book data for a symbol.
 */
export function useOrderBook(
  symbol: string | undefined,
  options: UseOrderBookOptions = {}
): UseOrderBookResult {
  const { depth = 50, pollInterval = 2000, enablePolling = true } = options;

  const [orderBook, setOrderBook] = useState<AggregatedOrderBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track if initial load has completed
  const initialLoadRef = useRef(false);

  const fetchOrderBook = useCallback(async () => {
    if (!symbol) {
      setOrderBook(null);
      setLoading(false);
      return;
    }

    // Only show loading on initial fetch
    if (!initialLoadRef.current) {
      setLoading(true);
    }

    try {
      const response = await hauntClient.getOrderBook(symbol, depth);
      setOrderBook(response.data);
      setError(null);
      initialLoadRef.current = true;
    } catch (err) {
      console.error("Failed to fetch order book:", err);
      setError(err instanceof Error ? err.message : "Failed to load order book");
      // Keep existing data on error (don't clear)
    } finally {
      setLoading(false);
    }
  }, [symbol, depth]);

  // Initial fetch and polling setup
  useEffect(() => {
    initialLoadRef.current = false;
    fetchOrderBook();

    if (!enablePolling || !symbol) {
      return;
    }

    const interval = setInterval(fetchOrderBook, pollInterval);
    return () => clearInterval(interval);
  }, [fetchOrderBook, pollInterval, enablePolling, symbol]);

  return {
    orderBook,
    loading,
    error,
    refresh: fetchOrderBook,
  };
}
