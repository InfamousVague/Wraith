import { useState, useEffect, useCallback, useRef } from "react";
import { hauntClient, type OhlcPoint } from "../services/haunt";
import { useAssetSubscription, type PriceUpdate } from "./useHauntSocket";

export type SeedingStatus = "idle" | "in_progress" | "complete" | "failed";

export type ChartDataState = {
  chartData: OhlcPoint[];
  isLoading: boolean;
  seedingStatus: SeedingStatus;
  seedingProgress: number;
  dataCompleteness: number;
  error: Error | null;
  refetch: () => void;
};

type UseChartDataOptions = {
  /** Asset ID */
  assetId: number | null;
  /** Asset symbol for real-time updates */
  symbol: string | null;
  /** Time range string (e.g., "1h", "1d", "1w") */
  range: string;
  /** Whether to enable real-time updates via WebSocket */
  enableRealtime?: boolean;
  /** Polling interval while seeding (ms). Set to 0 to disable polling. */
  pollingInterval?: number;
};

/**
 * Manages chart data fetching, seeding status, and real-time updates.
 *
 * @remarks
 * This hook encapsulates all chart data management:
 * - Initial chart data fetch from the API
 * - WebSocket seeding status subscription
 * - Real-time price updates
 * - Data adequacy tracking
 * - Polling fallback when WebSocket is unavailable
 *
 * @example
 * ```tsx
 * const {
 *   chartData,
 *   isLoading,
 *   seedingStatus,
 *   seedingProgress,
 *   error,
 *   refetch
 * } = useChartData({
 *   assetId: asset.id,
 *   symbol: asset.symbol,
 *   range: "1d"
 * });
 * ```
 */
export function useChartData({
  assetId,
  symbol,
  range,
  enableRealtime = true,
  pollingInterval = 3000,
}: UseChartDataOptions): ChartDataState {
  const [chartData, setChartData] = useState<OhlcPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [seedingStatus, setSeedingStatus] = useState<SeedingStatus>("idle");
  const [seedingProgress, setSeedingProgress] = useState(0);
  const [dataCompleteness, setDataCompleteness] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [initialFetchComplete, setInitialFetchComplete] = useState(false);

  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rangeRef = useRef(range);

  // Keep range ref in sync
  useEffect(() => {
    rangeRef.current = range;
  }, [range]);

  // Handle real-time price updates from WebSocket
  const handlePriceUpdate = useCallback(
    (update: PriceUpdate) => {
      setChartData((prev) => {
        if (prev.length === 0) return prev;

        // Determine bucket interval based on range
        const intervalSeconds = getIntervalSecondsForRange(rangeRef.current);
        const now = Math.floor(Date.now() / 1000);
        const currentBucketTime =
          Math.floor(now / intervalSeconds) * intervalSeconds;
        const lastCandle = prev[prev.length - 1];

        // Check if we need to create a new candle (new time bucket)
        if (lastCandle.time < currentBucketTime) {
          const newCandle: OhlcPoint = {
            time: currentBucketTime,
            open: update.price,
            high: update.price,
            low: update.price,
            close: update.price,
            volume: undefined,
          };
          return [...prev, newCandle];
        }

        // Update the last candle's close/high/low
        const updatedCandle: OhlcPoint = {
          ...lastCandle,
          close: update.price,
          high: Math.max(lastCandle.high, update.price),
          low: Math.min(lastCandle.low, update.price),
        };
        return [...prev.slice(0, -1), updatedCandle];
      });
    },
    []
  );

  // Subscribe to real-time price updates for the current asset
  useAssetSubscription(
    enableRealtime && symbol ? [symbol] : [],
    handlePriceUpdate
  );

  // Fetch chart data from API
  const fetchData = useCallback(async () => {
    if (!assetId) return;

    try {
      const response = await hauntClient.getChart(assetId, range);
      const data = response.data.data || [];

      setChartData(data);
      setError(null);

      // Update seeding status from response
      const statusStr = response.data.seedingStatus;
      if (statusStr === "in_progress") {
        setSeedingStatus("in_progress");
      } else if (statusStr === "complete") {
        setSeedingStatus("complete");
      } else if (statusStr === "failed") {
        setSeedingStatus("failed");
      } else {
        setSeedingStatus("idle");
      }

      // Update progress metrics
      setSeedingProgress(response.data.seedingProgress ?? 0);
      setDataCompleteness(response.data.dataCompleteness ?? 0);

      // Mark initial fetch as complete
      if (!initialFetchComplete) {
        setInitialFetchComplete(true);
      }

      // Determine if we should continue polling
      const shouldPoll =
        pollingInterval > 0 &&
        (response.data.seeding ||
          statusStr === "in_progress" ||
          (data.length === 0 && statusStr !== "failed"));

      if (shouldPoll) {
        pollTimeoutRef.current = setTimeout(fetchData, pollingInterval);
      }
    } catch (err) {
      console.warn("Failed to fetch chart data:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setChartData([]);

      // Still mark as complete on error
      if (!initialFetchComplete) {
        setInitialFetchComplete(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [assetId, range, pollingInterval, initialFetchComplete]);

  // Refetch function for manual refresh
  const refetch = useCallback(() => {
    setIsLoading(true);
    fetchData();
  }, [fetchData]);

  // Fetch data when asset or range changes
  useEffect(() => {
    // Reset state when asset or range changes
    setIsLoading(true);
    setInitialFetchComplete(false);
    setSeedingStatus("idle");
    setSeedingProgress(0);

    // Clear any pending poll
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }

    fetchData();

    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
    };
  }, [assetId, range]); // Note: fetchData is intentionally not a dependency

  return {
    chartData,
    isLoading,
    seedingStatus,
    seedingProgress,
    dataCompleteness,
    error,
    refetch,
  };
}

/**
 * Get the bucket interval in seconds for a given time range.
 */
function getIntervalSecondsForRange(range: string): number {
  switch (range) {
    case "1h":
      return 60;
    case "4h":
      return 300;
    case "1d":
      return 300;
    case "1w":
      return 3600;
    case "1m":
      return 3600;
    default:
      return 3600;
  }
}
