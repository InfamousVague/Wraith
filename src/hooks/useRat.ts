import { useState, useEffect, useCallback, useRef } from "react";
import { hauntClient } from "../services/haunt";
import { useAuth } from "../context/AuthContext";
import { usePortfolio } from "./usePortfolio";
import type { RatState, RatConfig, RatStats, RatStatus, RatConfigUpdate } from "../types/rat";
import { logger } from "../utils/logger";

// Default poll interval for RAT status (10 seconds)
const DEFAULT_POLL_INTERVAL_MS = 10000;

// Initial stats state
const initialStats: RatStats = {
  id: "",
  portfolioId: "",
  totalTrades: 0,
  winningTrades: 0,
  losingTrades: 0,
  totalPnl: 0,
  lastTradeAt: null,
  startedAt: null,
  errors: 0,
  updatedAt: 0,
};

// Initial config state
const initialConfig: RatConfig = {
  id: "",
  portfolioId: "",
  enabled: false,
  tradeIntervalSecs: 60,
  maxOpenPositions: 5,
  symbols: [],
  minHoldTimeSecs: 30,
  sizeRangePct: [0.05, 0.15],
  stopLossProbability: 0.7,
  takeProfitProbability: 0.6,
  stopLossRangePct: [0.02, 0.05],
  takeProfitRangePct: [0.03, 0.08],
  createdAt: 0,
  updatedAt: 0,
};

export interface UseRatResult {
  // State
  config: RatConfig;
  stats: RatStats;
  status: RatStatus;
  openPositions: number;
  isLoading: boolean;
  error: string | null;

  // Computed
  isActive: boolean;
  winRate: number;

  // Actions
  start: (configUpdate?: RatConfigUpdate) => Promise<void>;
  stop: () => Promise<void>;
  updateConfig: (update: RatConfigUpdate) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing the Random Auto Trader (RAT) for developer testing.
 * Provides state management, API interactions, and polling for status updates.
 */
export function useRat(pollIntervalMs: number = DEFAULT_POLL_INTERVAL_MS): UseRatResult {
  const { sessionToken } = useAuth();
  const { portfolioId } = usePortfolio();

  // State
  const [config, setConfig] = useState<RatConfig>(initialConfig);
  const [stats, setStats] = useState<RatStats>(initialStats);
  const [status, setStatus] = useState<RatStatus>("idle");
  const [openPositions, setOpenPositions] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track if component is mounted to prevent state updates after unmount
  const mountedRef = useRef(true);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update state from API response
  const updateFromState = useCallback((state: RatState) => {
    if (!mountedRef.current) return;
    setConfig(state.config);
    setStats(state.stats);
    setStatus(state.status);
    setOpenPositions(state.openPositions ?? 0);
  }, []);

  // Fetch current RAT status
  const fetchStatus = useCallback(async () => {
    if (!sessionToken || !portfolioId) return;

    try {
      const response = await hauntClient.getRatStatus(sessionToken, portfolioId);
      updateFromState(response.data);
      if (mountedRef.current) {
        setError(null);
      }
    } catch (err) {
      // Don't set error for 404 / "not running" (no RAT config exists yet - this is normal idle state)
      if (err instanceof Error) {
        const isNotRunning = err.message.includes("404") || err.message.includes("not running");
        if (!isNotRunning) {
          logger.error("Failed to fetch RAT status", err);
          if (mountedRef.current) {
            setError(err.message);
          }
        } else if (mountedRef.current) {
          // Clear any previous error when RAT is simply not running
          setError(null);
        }
      }
    }
  }, [sessionToken, portfolioId, updateFromState]);

  // Start RAT
  const start = useCallback(async (configUpdate?: RatConfigUpdate) => {
    if (!sessionToken || !portfolioId) {
      setError("No portfolio selected");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await hauntClient.startRat(sessionToken, portfolioId, configUpdate);
      updateFromState(response.data);
      logger.data("RAT started", { portfolioId });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start RAT";
      logger.error("Failed to start RAT", err);
      if (mountedRef.current) {
        setError(message);
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [sessionToken, portfolioId, updateFromState]);

  // Stop RAT
  const stop = useCallback(async () => {
    if (!sessionToken || !portfolioId) {
      setError("No portfolio selected");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await hauntClient.stopRat(sessionToken, portfolioId);
      updateFromState(response.data);
      logger.data("RAT stopped", { portfolioId });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to stop RAT";
      logger.error("Failed to stop RAT", err);
      if (mountedRef.current) {
        setError(message);
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [sessionToken, portfolioId, updateFromState]);

  // Update RAT configuration
  const updateConfig = useCallback(async (update: RatConfigUpdate) => {
    if (!sessionToken || !portfolioId) {
      setError("No portfolio selected");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await hauntClient.updateRatConfig(sessionToken, portfolioId, update);
      if (mountedRef.current) {
        setConfig(response.data);
      }
      logger.data("RAT config updated", { portfolioId, update });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update RAT config";
      logger.error("Failed to update RAT config", err);
      if (mountedRef.current) {
        setError(message);
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [sessionToken, portfolioId]);

  // Manual refresh
  const refresh = useCallback(async () => {
    setIsLoading(true);
    await fetchStatus();
    if (mountedRef.current) {
      setIsLoading(false);
    }
  }, [fetchStatus]);

  // Initial fetch and polling
  useEffect(() => {
    mountedRef.current = true;

    // Initial fetch
    fetchStatus();

    // Set up polling
    const poll = () => {
      pollTimeoutRef.current = setTimeout(async () => {
        if (mountedRef.current) {
          await fetchStatus();
          poll();
        }
      }, pollIntervalMs);
    };

    poll();

    return () => {
      mountedRef.current = false;
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
    };
  }, [fetchStatus, pollIntervalMs]);

  // Reset state when portfolio changes
  useEffect(() => {
    setConfig(initialConfig);
    setStats(initialStats);
    setStatus("idle");
    setError(null);
  }, [portfolioId]);

  // Computed values
  const isActive = status === "active";
  const winRate = stats.totalTrades > 0
    ? (stats.winningTrades / stats.totalTrades) * 100
    : 0;

  return {
    config,
    stats,
    status,
    openPositions,
    isLoading,
    error,
    isActive,
    winRate,
    start,
    stop,
    updateConfig,
    refresh,
  };
}
