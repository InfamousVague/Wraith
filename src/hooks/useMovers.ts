/**
 * @file useMovers.ts
 * @description Hook for fetching top movers (gainers and losers).
 *
 * Provides real-time data about the biggest price movers
 * across different timeframes.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  hauntClient,
  type MoversResponse,
  type MoverTimeframe,
  type AssetType,
} from "../services/haunt";

export type UseMoversResult = {
  movers: MoversResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  setTimeframe: (timeframe: MoverTimeframe) => void;
  timeframe: MoverTimeframe;
};

const DEFAULT_POLL_INTERVAL = 30000; // 30 seconds

export function useMovers(
  initialTimeframe: MoverTimeframe = "1h",
  limit: number = 10,
  assetType?: AssetType,
  pollInterval: number = DEFAULT_POLL_INTERVAL
): UseMoversResult {
  const [movers, setMovers] = useState<MoversResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<MoverTimeframe>(initialTimeframe);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchMovers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await hauntClient.getMovers(timeframe, limit, assetType);
      setMovers(response.data);
    } catch (err) {
      console.warn("Failed to fetch movers:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch movers");
    } finally {
      setLoading(false);
    }
  }, [timeframe, limit, assetType]);

  // Initial fetch and polling
  useEffect(() => {
    fetchMovers();

    if (pollInterval > 0) {
      const poll = () => {
        pollTimeoutRef.current = setTimeout(() => {
          fetchMovers();
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
  }, [fetchMovers, pollInterval]);

  return {
    movers,
    loading,
    error,
    refetch: fetchMovers,
    setTimeframe,
    timeframe,
  };
}
