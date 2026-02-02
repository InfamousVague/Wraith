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
  /** Recent validated predictions for the symbol */
  predictions: SignalPrediction[];
  /** Pending predictions awaiting validation */
  pendingPredictions: SignalPrediction[];
  /** Accuracy-weighted recommendation */
  recommendation: Recommendation | null;
  /** Whether initial data is loading */
  loading: boolean;
  /** Whether predictions are being generated */
  generating: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Manually refresh data */
  refresh: () => Promise<void>;
  /** Generate predictions for this symbol immediately */
  generatePredictions: () => Promise<void>;
};

/**
 * Get poll interval based on trading timeframe.
 * Faster updates for scalping, slower for position trading.
 */
function getDefaultPollInterval(timeframe: TradingTimeframe): number {
  switch (timeframe) {
    case "scalping":
      return 5000; // 5 seconds - very fast for quick trades
    case "day_trading":
      return 10000; // 10 seconds
    case "swing_trading":
      return 30000; // 30 seconds
    case "position_trading":
      return 60000; // 1 minute
    default:
      return 10000;
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
  const [pendingPredictions, setPendingPredictions] = useState<SignalPrediction[]>([]);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [awaitingPredictions, setAwaitingPredictions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track if initial load has completed
  const initialLoadRef = useRef(false);

  const fetchSignals = useCallback(async () => {
    if (!symbol) {
      setSignals(null);
      setAccuracies([]);
      setPredictions([]);
      setPendingPredictions([]);
      setRecommendation(null);
      setLoading(false);
      return;
    }

    // Only show loading on initial fetch
    if (!initialLoadRef.current) {
      setLoading(true);
    }

    try {
      // Fetch signals, accuracy, all recent predictions, and recommendation in parallel
      const [signalsResponse, accuracyResponse, allPredictionsResponse, recommendationResponse] = await Promise.all([
        hauntClient.getSignals(symbol, timeframe),
        hauntClient.getSignalAccuracy(symbol),
        hauntClient.getSignalPredictions(symbol, { limit: 200 }),
        hauntClient.getRecommendation(symbol, timeframe),
      ]);

      const allPredictions = allPredictionsResponse.data.predictions;

      // Validated predictions = has at least one outcome (for history grid)
      const validatedPredictions = allPredictions.filter(
        (p) => p.outcome5m || p.outcome1h || p.outcome4h
      );

      // For pending, only keep the most recent prediction per indicator
      // that doesn't have all outcomes yet
      const pendingByIndicator = new Map<string, SignalPrediction>();
      for (const p of allPredictions) {
        // Skip if fully validated (has all 3 main outcomes)
        if (p.outcome5m && p.outcome1h && p.outcome4h) continue;

        const existing = pendingByIndicator.get(p.indicator);
        // Keep the most recent prediction for each indicator
        if (!existing || p.timestamp > existing.timestamp) {
          pendingByIndicator.set(p.indicator, p);
        }
      }
      const stillPending = Array.from(pendingByIndicator.values())
        .sort((a, b) => a.indicator.localeCompare(b.indicator));

      setSignals(signalsResponse.data);
      setAccuracies(accuracyResponse.data.accuracies);
      setPredictions(validatedPredictions);
      setPendingPredictions(stillPending);
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

  // Use ref to track generating state to avoid dependency issues
  const generatingRef = useRef(false);

  const generatePredictions = useCallback(async () => {
    if (!symbol || generatingRef.current) return;

    generatingRef.current = true;
    setGenerating(true);
    setAwaitingPredictions(true);
    try {
      await hauntClient.generatePredictions(symbol, timeframe);
      // Refresh data after generating predictions
      await fetchSignals();
    } catch (err) {
      console.error("Failed to generate predictions:", err);
      setError(err instanceof Error ? err.message : "Failed to generate predictions");
      setAwaitingPredictions(false);
    } finally {
      generatingRef.current = false;
      setGenerating(false);
    }
  }, [symbol, timeframe, fetchSignals]);

  // Clear awaitingPredictions when we actually get predictions
  useEffect(() => {
    if (awaitingPredictions && pendingPredictions.length > 0) {
      setAwaitingPredictions(false);
    }
  }, [awaitingPredictions, pendingPredictions.length]);

  // Also clear awaitingPredictions after a timeout (in case no predictions are created)
  useEffect(() => {
    if (!awaitingPredictions) return;

    const timeout = setTimeout(() => {
      setAwaitingPredictions(false);
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [awaitingPredictions]);

  // Track if we've attempted auto-generation for this symbol
  const autoGenerateAttemptedRef = useRef<string | null>(null);

  // Initial fetch and polling setup
  useEffect(() => {
    initialLoadRef.current = false;
    autoGenerateAttemptedRef.current = null;
    fetchSignals();

    if (!enablePolling || !symbol) {
      return;
    }

    const interval = setInterval(fetchSignals, pollInterval);
    return () => clearInterval(interval);
  }, [fetchSignals, pollInterval, enablePolling, symbol]);

  // Auto-generate predictions when there are none
  useEffect(() => {
    // Only auto-generate if:
    // - Initial load is complete
    // - We have a symbol
    // - Not already generating
    // - No pending predictions exist
    // - We haven't already attempted for this symbol
    if (
      initialLoadRef.current &&
      symbol &&
      !generatingRef.current &&
      pendingPredictions.length === 0 &&
      predictions.length === 0 &&
      autoGenerateAttemptedRef.current !== symbol
    ) {
      autoGenerateAttemptedRef.current = symbol;
      generatePredictions();
    }
  }, [symbol, pendingPredictions.length, predictions.length, generatePredictions]);

  // Combined generating state - true if API call in progress OR waiting for predictions to appear
  const isGenerating = generating || awaitingPredictions;

  return {
    signals,
    accuracies,
    predictions,
    pendingPredictions,
    recommendation,
    loading,
    generating: isGenerating,
    error,
    refresh: fetchSignals,
    generatePredictions,
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
