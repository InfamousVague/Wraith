/**
 * @file useTrades.ts
 * @description Hook for fetching paginated trade history.
 *
 * Uses offset-based pagination with the API's meta.total
 * to calculate real page counts. Exposes page/totalPages/setPage
 * for use with Pagination component.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { hauntClient, type Trade } from "../services/haunt";
import { useAuth } from "../context/AuthContext";

export type UseTradesResult = {
  trades: Trade[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
  hasMore: boolean;
};

const DEFAULT_LIMIT = 10;

export function useTrades(
  portfolioId: string | null,
  pageSize: number = DEFAULT_LIMIT
): UseTradesResult {
  const { sessionToken, isAuthenticated } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPageState] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  // Use ref so fetchTrades doesn't recreate on every page change
  const pageRef = useRef(page);

  const setPage = useCallback((newPage: number) => {
    pageRef.current = newPage;
    setPageState(newPage);
  }, []);

  const fetchTrades = useCallback(async () => {
    if (!isAuthenticated || !sessionToken || !portfolioId) {
      setTrades([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const offset = (pageRef.current - 1) * pageSize;
      const response = await hauntClient.getTrades(sessionToken, portfolioId, pageSize, offset);
      setTrades(response.data);

      // Use API total count for accurate pagination
      if (response.meta?.total != null) {
        setTotalCount(response.meta.total);
      }

      setHasMore(response.data.length >= pageSize);
    } catch (err) {
      console.warn("Failed to fetch trades:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch trades");
    } finally {
      setLoading(false);
    }
  }, [sessionToken, isAuthenticated, portfolioId, pageSize]);

  // Re-fetch when fetchTrades changes OR when page changes
  useEffect(() => {
    fetchTrades();
  }, [fetchTrades, page]);

  const totalPages = useMemo(() => {
    if (totalCount != null) {
      return Math.max(1, Math.ceil(totalCount / pageSize));
    }
    // Fallback: estimate from hasMore
    return hasMore ? page + 1 : page;
  }, [totalCount, pageSize, hasMore, page]);

  return {
    trades,
    loading,
    error,
    refetch: fetchTrades,
    page,
    totalPages,
    setPage,
    hasMore,
  };
}
