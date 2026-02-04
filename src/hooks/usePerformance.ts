/**
 * @file usePerformance.ts
 * @description Hook for fetching portfolio performance history.
 *
 * Provides equity curve data over a specified time range.
 * Requires authentication token from AuthContext.
 */

import { useState, useEffect, useCallback } from "react";
import { hauntClient, type PerformanceResponse } from "../services/haunt";
import { useAuth } from "../context/AuthContext";

export type PerformanceRange = "1d" | "1w" | "1m" | "3m" | "1y" | "all";

export type UsePerformanceResult = {
  performance: PerformanceResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

export function usePerformance(
  portfolioId: string | null,
  range: PerformanceRange = "1m"
): UsePerformanceResult {
  const { sessionToken, isAuthenticated } = useAuth();
  const [performance, setPerformance] = useState<PerformanceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPerformance = useCallback(async () => {
    if (!isAuthenticated || !sessionToken || !portfolioId) {
      setPerformance(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await hauntClient.getPerformance(sessionToken, portfolioId, range);
      setPerformance(response.data);
    } catch (err) {
      console.warn("Failed to fetch performance:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch performance");
    } finally {
      setLoading(false);
    }
  }, [sessionToken, isAuthenticated, portfolioId, range]);

  useEffect(() => {
    fetchPerformance();
  }, [fetchPerformance]);

  return {
    performance,
    loading,
    error,
    refetch: fetchPerformance,
  };
}
