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
    // Clear previous data when auth conditions change
    if (!isAuthenticated) {
      setPerformance(null);
      setError("Not authenticated");
      return;
    }

    if (!sessionToken) {
      setPerformance(null);
      setError("No session token - please log in again");
      return;
    }

    if (!portfolioId) {
      setPerformance(null);
      setError(null); // No error, just no portfolio selected
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await hauntClient.getPerformance(sessionToken, portfolioId, range);
      setPerformance(response.data);
    } catch (err) {
      console.warn("Failed to fetch performance:", err);
      // Check for auth-related errors
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch performance";
      if (errorMessage.includes("401") || errorMessage.includes("403") || errorMessage.includes("Unauthorized")) {
        setError("Session expired - please log in again");
      } else if (errorMessage.includes("404")) {
        // 404 might mean no performance data yet, return empty response
        setPerformance({
          range,
          data: [],
          startValue: 0,
          endValue: 0,
          totalPnl: 0,
          totalPnlPercent: 0,
          timestamp: Date.now(),
        });
        setError(null);
      } else {
        setError(errorMessage);
      }
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
