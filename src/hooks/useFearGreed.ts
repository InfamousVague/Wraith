import { useState, useEffect, useCallback } from "react";
import { hauntClient } from "../services/haunt";
import { logger } from "../utils/logger";

type FearGreedData = {
  value: number;
  valueClassification: string;
  timestamp: string;
  updateTime: string;
};

type UseFearGreedResult = {
  data: FearGreedData | null;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
};

/**
 * Hook to fetch the Fear & Greed Index from Haunt API.
 * Data is cached on the server and refreshed automatically.
 */
export function useFearGreed(): UseFearGreedResult {
  const [data, setData] = useState<FearGreedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFearGreed = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      logger.request("/api/market/fear-greed");
      const startTime = performance.now();

      const response = await hauntClient.getFearGreed();
      const duration = Math.round(performance.now() - startTime);

      const result: FearGreedData = {
        value: response.data.value,
        valueClassification: response.data.classification,
        timestamp: response.data.timestamp,
        updateTime: response.data.timestamp,
      };

      logger.data("Fear & Greed (Haunt)", {
        ...result,
        cached: response.meta.cached,
        duration: `${duration}ms`,
      });

      setData(result);
    } catch (err) {
      logger.error("useFearGreed failed", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFearGreed();

    // Refresh every 5 minutes (server caches for 5 minutes)
    const interval = setInterval(fetchFearGreed, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchFearGreed]);

  return { data, loading, error, refresh: fetchFearGreed };
}

/**
 * Get classification label from numeric value (fallback)
 */
export function getClassification(value: number): string {
  if (value <= 25) return "Extreme Fear";
  if (value <= 45) return "Fear";
  if (value <= 55) return "Neutral";
  if (value <= 75) return "Greed";
  return "Extreme Greed";
}
