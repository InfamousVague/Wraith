/**
 * useSignals Hook
 *
 * Fetches trading signals and accuracy data for a symbol.
 * Polls periodically for updates.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { hauntClient } from "../services/haunt";
import type {
  SymbolSignals,
  SignalAccuracy,
  TradingTimeframe,
  SignalPrediction,
  Recommendation,
} from "../types/signals";

type UseSignalsOptions = {
  /** Trading timeframe (default: day_trading) */
  timeframe?: TradingTimeframe;
  /** Polling interval in milliseconds (default: 30000 = 30 seconds) */
  pollInterval?: number;
  /** Whether to enable polling (default: true) */
  enablePolling?: boolean;
};

type UseSignalsResult = {
  /** Signal data for the symbol */
  signals: SymbolSignals | null;
  /** Accuracy data for the symbol's indicators */
  accuracies: SignalAccuracy[];
  /** Recent predictions for the symbol */
  predictions: SignalPrediction[];
  /** Accuracy-weighted recommendation */
  recommendation: Recommendation | null;
  /** Whether initial data is loading */
  loading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Manually refresh data */
  refresh: () => Promise<void>;
};

/**
 * Get poll interval based on trading timeframe.
 * Faster updates for scalping, slower for position trading.
 */
function getDefaultPollInterval(timeframe: TradingTimeframe): number {
  switch (timeframe) {
    case "scalping":
      return 10000; // 10 seconds - very fast for quick trades
    case "day_trading":
      return 30000; // 30 seconds
    case "swing_trading":
      return 60000; // 1 minute
    case "position_trading":
      return 120000; // 2 minutes
    default:
      return 30000;
  }
}

/**
 * Hook to fetch and manage trading signals for a symbol.
 */
export function useSignals(
  symbol: string | undefined,
  options: UseSignalsOptions = {}
): UseSignalsResult {
  const { timeframe = "day_trading", enablePolling = true } = options;

  // Use provided poll interval or compute from timeframe
  const pollInterval = options.pollInterval ?? getDefaultPollInterval(timeframe);

  const [signals, setSignals] = useState<SymbolSignals | null>(null);
  const [accuracies, setAccuracies] = useState<SignalAccuracy[]>([]);
  const [predictions, setPredictions] = useState<SignalPrediction[]>([]);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track if initial load has completed
  const initialLoadRef = useRef(false);

  const fetchSignals = useCallback(async () => {
    if (!symbol) {
      setSignals(null);
      setAccuracies([]);
      setPredictions([]);
      setRecommendation(null);
      setLoading(false);
      return;
    }

    // Only show loading on initial fetch
    if (!initialLoadRef.current) {
      setLoading(true);
    }

    try {
      // Fetch signals, accuracy, predictions, and recommendation in parallel
      const [signalsResponse, accuracyResponse, predictionsResponse, recommendationResponse] = await Promise.all([
        hauntClient.getSignals(symbol, timeframe),
        hauntClient.getSignalAccuracy(symbol),
        hauntClient.getSignalPredictions(symbol),
        hauntClient.getRecommendation(symbol, timeframe),
      ]);

      setSignals(signalsResponse.data);
      setAccuracies(accuracyResponse.data.accuracies);
      setPredictions(predictionsResponse.data.predictions);
      setRecommendation(recommendationResponse.data);
      setError(null);
      initialLoadRef.current = true;
    } catch (err) {
      console.error("Failed to fetch signals:", err);
      setError(err instanceof Error ? err.message : "Failed to load signals");
      // Keep existing data on error (don't clear)
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe]);

  // Initial fetch and polling setup
  useEffect(() => {
    initialLoadRef.current = false;
    fetchSignals();

    if (!enablePolling || !symbol) {
      return;
    }

    const interval = setInterval(fetchSignals, pollInterval);
    return () => clearInterval(interval);
  }, [fetchSignals, pollInterval, enablePolling, symbol]);

  return {
    signals,
    accuracies,
    predictions,
    recommendation,
    loading,
    error,
    refresh: fetchSignals,
  };
}

/**
 * Get accuracy for a specific indicator from the accuracies array.
 * Prefers 4h timeframe if available, falls back to others.
 */
export function getIndicatorAccuracy(
  accuracies: SignalAccuracy[],
  indicatorName: string,
  preferredTimeframe: string = "4h"
): SignalAccuracy | undefined {
  // Try preferred timeframe first
  const preferred = accuracies.find(
    (a) =>
      a.indicator.toLowerCase().includes(indicatorName.toLowerCase()) &&
      a.timeframe === preferredTimeframe
  );

  if (preferred) return preferred;

  // Fall back to any timeframe
  return accuracies.find((a) =>
    a.indicator.toLowerCase().includes(indicatorName.toLowerCase())
  );
}
