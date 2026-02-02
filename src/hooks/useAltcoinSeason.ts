import { useState, useEffect, useCallback } from "react";
import { hauntClient } from "../services/haunt";
import { useMarketSubscription, type MarketUpdate } from "./useHauntSocket";
import { logger } from "../utils/logger";

type AltcoinSeasonData = {
  /** 0 = full BTC season, 100 = full Altcoin season */
  value: number;
  /** BTC dominance percentage */
  btcDominance: number;
  /** BTC dominance change (24h) */
  btcDominanceChange: number;
  /** Altcoin market cap */
  altcoinMarketCap: number;
};

type UseAltcoinSeasonResult = {
  data: AltcoinSeasonData | null;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
};

/**
 * Calculate altcoin season index from BTC dominance.
 * Scale: 0 = Bitcoin Season, 100 = Altcoin Season
 *
 * Traditional thresholds:
 * - BTC dominance > 60%: Bitcoin Season
 * - BTC dominance 40-60%: Neutral
 * - BTC dominance < 40%: Altcoin Season
 */
function calculateAltcoinSeasonIndex(btcDominance: number): number {
  // 70% dominance -> 0, 50% -> 50, 30% -> 100
  const dominanceIndex = (70 - btcDominance) * 2.5;
  return Math.round(Math.max(0, Math.min(100, dominanceIndex)));
}

/**
 * Hook to calculate Altcoin Season index from Haunt API global metrics.
 * Receives real-time updates via WebSocket.
 */
export function useAltcoinSeason(): UseAltcoinSeasonResult {
  const [data, setData] = useState<AltcoinSeasonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAltcoinSeason = useCallback(async (isInitial = false) => {
    try {
      // Only show loading skeleton on initial fetch, not refetches
      if (isInitial) {
        setLoading(true);
      }
      setError(null);

      logger.request("/api/market/global");
      const startTime = performance.now();

      const response = await hauntClient.getGlobalMetrics();
      const duration = Math.round(performance.now() - startTime);

      const metrics = response.data;
      const btcDominance = metrics.btcDominance;
      const btcDominanceChange = metrics.marketCapChange24h; // Approximate
      const totalMarketCap = metrics.totalMarketCap;
      const altcoinMarketCap = totalMarketCap * (1 - btcDominance / 100);

      const result: AltcoinSeasonData = {
        value: calculateAltcoinSeasonIndex(btcDominance),
        btcDominance,
        btcDominanceChange,
        altcoinMarketCap,
      };

      logger.data("Altcoin Season (Haunt)", {
        ...result,
        cached: response.meta.cached,
        duration: `${duration}ms`,
      });

      setData(result);
    } catch (err) {
      logger.error("useAltcoinSeason failed", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle real-time market updates
  const handleMarketUpdate = useCallback((update: MarketUpdate) => {
    setData((prev) => {
      if (!prev) return prev;

      const altcoinMarketCap = update.totalMarketCap * (1 - update.btcDominance / 100);

      return {
        ...prev,
        value: calculateAltcoinSeasonIndex(update.btcDominance),
        btcDominance: update.btcDominance,
        altcoinMarketCap,
      };
    });
  }, []);

  // Subscribe to market updates via WebSocket
  useMarketSubscription(handleMarketUpdate);

  useEffect(() => {
    fetchAltcoinSeason(true); // Initial fetch shows loading

    // Refresh every 1 minute (server caches for 1 minute) - no loading flash
    const interval = setInterval(() => fetchAltcoinSeason(false), 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAltcoinSeason]);

  return { data, loading, error, refresh: () => fetchAltcoinSeason(false) };
}
