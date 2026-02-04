/**
 * @file useHoldings.ts
 * @description Hook for fetching portfolio holdings breakdown.
 *
 * Provides asset holdings with allocation percentages.
 * Requires authentication token from AuthContext.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { hauntClient, type HoldingsResponse } from "../services/haunt";
import { useAuth } from "../context/AuthContext";

export type UseHoldingsResult = {
  holdings: HoldingsResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

const DEFAULT_POLL_INTERVAL = 60000; // 1 minute

export function useHoldings(
  portfolioId: string | null,
  pollInterval: number = DEFAULT_POLL_INTERVAL
): UseHoldingsResult {
  const { sessionToken, isAuthenticated } = useAuth();
  const [holdings, setHoldings] = useState<HoldingsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchHoldings = useCallback(async () => {
    if (!isAuthenticated || !sessionToken || !portfolioId) {
      setHoldings(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await hauntClient.getHoldings(sessionToken, portfolioId);
      setHoldings(response.data);
    } catch (err) {
      console.warn("Failed to fetch holdings:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch holdings");
    } finally {
      setLoading(false);
    }
  }, [sessionToken, isAuthenticated, portfolioId]);

  // Initial fetch and polling
  useEffect(() => {
    fetchHoldings();

    if (pollInterval > 0 && isAuthenticated && portfolioId) {
      const poll = () => {
        pollTimeoutRef.current = setTimeout(() => {
          fetchHoldings();
          poll();
        }, pollInterval);
      };
      poll();
    }

    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, [fetchHoldings, pollInterval, isAuthenticated, portfolioId]);

  return {
    holdings,
    loading,
    error,
    refetch: fetchHoldings,
  };
}
