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
    // Clear previous data when auth conditions change
    if (!isAuthenticated) {
      setHoldings(null);
      setError("Not authenticated");
      return;
    }

    if (!sessionToken) {
      setHoldings(null);
      setError("No session token - please log in again");
      return;
    }

    if (!portfolioId) {
      setHoldings(null);
      setError(null); // No error, just no portfolio selected
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await hauntClient.getHoldings(sessionToken, portfolioId);
      setHoldings(response.data);
    } catch (err) {
      console.warn("Failed to fetch holdings:", err);
      // Check for auth-related errors
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch holdings";
      if (errorMessage.includes("401") || errorMessage.includes("403") || errorMessage.includes("Unauthorized")) {
        setError("Session expired - please log in again");
      } else if (errorMessage.includes("404")) {
        // 404 might mean no holdings exist yet, which is fine
        setHoldings({ holdings: [], totalValue: 0, totalPnl: 0, timestamp: Date.now() });
        setError(null);
      } else {
        setError(errorMessage);
      }
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
