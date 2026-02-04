/**
 * @file useLeaderboard.ts
 * @description Hook for fetching trading leaderboard data.
 *
 * Provides ranked trader performance data with timeframe filtering.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  hauntClient,
  type LeaderboardResponse,
  type LeaderboardEntry,
  type LeaderboardTimeframe,
} from "../services/haunt";
import { useAuth } from "../context/AuthContext";

/** Polling interval in milliseconds (5 seconds for real-time updates) */
const POLL_INTERVAL = 5000;

export type UseLeaderboardResult = {
  /** Array of leaderboard entries with computed rank */
  entries: LeaderboardEntry[];
  /** Current user's entry if on leaderboard */
  myEntry: LeaderboardEntry | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  setTimeframe: (timeframe: LeaderboardTimeframe) => void;
  timeframe: LeaderboardTimeframe;
  /** Whether polling is active */
  isPolling: boolean;
};

export function useLeaderboard(
  initialTimeframe: LeaderboardTimeframe = "weekly",
  limit: number = 50,
  /** Enable real-time polling (default: true) */
  enablePolling: boolean = true
): UseLeaderboardResult {
  const { sessionToken, isAuthenticated, user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myEntry, setMyEntry] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<LeaderboardTimeframe>(initialTimeframe);
  const [isPolling, setIsPolling] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLeaderboard = useCallback(async (isInitialLoad = false) => {
    // Only show loading spinner on initial load, not during polling
    if (isInitialLoad) {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await hauntClient.getLeaderboard(timeframe, limit);

      // API returns array directly - add rank based on position
      const rankedEntries = (response.data || []).map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

      setEntries(rankedEntries);

      // Find current user's entry if authenticated
      if (isAuthenticated && user?.id) {
        const userEntry = rankedEntries.find(e => e.userId === user.id);
        setMyEntry(userEntry || null);
      }
    } catch (err) {
      console.warn("Failed to fetch leaderboard:", err);
      // Only set error on initial load, not during polling
      if (isInitialLoad) {
        setError(err instanceof Error ? err.message : "Failed to fetch leaderboard");
      }
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  }, [timeframe, limit, isAuthenticated, user?.id]);

  // Initial fetch
  useEffect(() => {
    fetchLeaderboard(true);
  }, [fetchLeaderboard]);

  // Polling effect
  useEffect(() => {
    if (!enablePolling) {
      setIsPolling(false);
      return;
    }

    setIsPolling(true);

    // Start polling
    pollRef.current = setInterval(() => {
      fetchLeaderboard(false);
    }, POLL_INTERVAL);

    // Cleanup
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      setIsPolling(false);
    };
  }, [fetchLeaderboard, enablePolling]);

  return {
    entries,
    myEntry,
    loading,
    error,
    refetch: () => fetchLeaderboard(false),
    setTimeframe,
    timeframe,
    isPolling,
  };
}
