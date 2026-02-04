/**
 * @file useTrades.ts
 * @description Hook for fetching trade history.
 *
 * Provides paginated trade history data.
 * Requires authentication token from AuthContext.
 */

import { useState, useEffect, useCallback } from "react";
import { hauntClient, type Trade } from "../services/haunt";
import { useAuth } from "../context/AuthContext";

export type UseTradesResult = {
  trades: Trade[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  loadMore: () => void;
  hasMore: boolean;
};

const DEFAULT_LIMIT = 50;

export function useTrades(
  portfolioId: string | null,
  initialLimit: number = DEFAULT_LIMIT
): UseTradesResult {
  const { sessionToken, isAuthenticated } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(initialLimit);
  const [hasMore, setHasMore] = useState(true);

  const fetchTrades = useCallback(async () => {
    if (!isAuthenticated || !sessionToken || !portfolioId) {
      setTrades([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await hauntClient.getTrades(sessionToken, portfolioId, limit);
      setTrades(response.data);
      // If we got fewer than requested, there's no more
      setHasMore(response.data.length >= limit);
    } catch (err) {
      console.warn("Failed to fetch trades:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch trades");
    } finally {
      setLoading(false);
    }
  }, [sessionToken, isAuthenticated, portfolioId, limit]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      setLimit((prev) => prev + DEFAULT_LIMIT);
    }
  }, [hasMore, loading]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  return {
    trades,
    loading,
    error,
    refetch: fetchTrades,
    loadMore,
    hasMore,
  };
}
