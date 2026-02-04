/**
 * @file usePortfolio.ts
 * @description Hook for fetching and managing portfolio data.
 *
 * Fetches the user's portfolios and provides the default (first) portfolio.
 * Creates a portfolio if the user doesn't have one yet.
 * Requires authentication token from AuthContext.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { hauntClient, type Portfolio } from "../services/haunt";
import { useAuth } from "../context/AuthContext";

export type UsePortfolioResult = {
  portfolio: Portfolio | null;
  portfolioId: string | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  /** Clear portfolio cache and force re-fetch (useful after auth errors) */
  clearAndRefetch: () => void;
  /** Reset portfolio (restore balance, clear positions, unstop if stopped) */
  resetPortfolio: () => Promise<void>;
};

const DEFAULT_POLL_INTERVAL = 30000; // 30 seconds

export function usePortfolio(pollInterval: number = DEFAULT_POLL_INTERVAL): UsePortfolioResult {
  const { sessionToken, isAuthenticated, serverProfile } = useAuth();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [portfolioId, setPortfolioId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initializingRef = useRef(false);

  const fetchPortfolio = useCallback(async () => {
    // Require full authentication including server profile with publicKey
    // Without publicKey, we can't properly filter portfolios by user
    if (!isAuthenticated || !sessionToken || !serverProfile?.publicKey) {
      setPortfolio(null);
      setPortfolioId(null);
      return;
    }

    // Prevent multiple initialization attempts
    if (initializingRef.current) return;

    setLoading(true);
    setError(null);

    try {
      // List portfolios for the current user (use publicKey to match backend's user_id field)
      const listResponse = await hauntClient.listPortfolios(sessionToken, serverProfile?.publicKey);
      let portfolios = listResponse.data;

      // If user has no portfolios, create a default one
      if (!portfolios || portfolios.length === 0) {
        initializingRef.current = true;
        try {
          const createResponse = await hauntClient.createPortfolio(sessionToken, {
            name: "Default Portfolio",
            initialBalance: 100000, // $100k paper trading balance
            userId: serverProfile?.publicKey, // Use publicKey, not id - backend checks against public_key
          });
          portfolios = [createResponse.data];
        } finally {
          initializingRef.current = false;
        }
      }

      // Use the first portfolio as default
      // The listPortfolios response already includes all portfolio data (balance, margin, P&L)
      const defaultPortfolio = portfolios[0];
      console.log("[usePortfolio] Using portfolio:", defaultPortfolio.id, "userId:", defaultPortfolio.userId, "serverProfile.publicKey:", serverProfile?.publicKey);
      setPortfolioId(defaultPortfolio.id);
      setPortfolio(defaultPortfolio);
    } catch (err) {
      console.warn("Failed to fetch portfolio:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch portfolio");
    } finally {
      setLoading(false);
    }
  }, [sessionToken, isAuthenticated, serverProfile?.publicKey]);

  // Initial fetch and polling
  useEffect(() => {
    fetchPortfolio();

    if (pollInterval > 0 && isAuthenticated) {
      const poll = () => {
        pollTimeoutRef.current = setTimeout(() => {
          fetchPortfolio();
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
  }, [fetchPortfolio, pollInterval, isAuthenticated]);

  // Clear portfolio cache and force re-fetch (useful after auth errors)
  const clearAndRefetch = useCallback(() => {
    setPortfolio(null);
    setPortfolioId(null);
    setError(null);
    initializingRef.current = false; // Allow re-initialization
    fetchPortfolio();
  }, [fetchPortfolio]);

  // Reset portfolio (restore balance, clear positions, unstop if stopped)
  const resetPortfolio = useCallback(async () => {
    if (!sessionToken || !portfolioId) {
      throw new Error("Not authenticated or no portfolio");
    }

    setLoading(true);
    setError(null);

    try {
      const response = await hauntClient.resetPortfolio(sessionToken, portfolioId);
      setPortfolio(response.data);
      console.log("[usePortfolio] Portfolio reset successfully:", response.data);
    } catch (err) {
      console.error("Failed to reset portfolio:", err);
      setError(err instanceof Error ? err.message : "Failed to reset portfolio");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sessionToken, portfolioId]);

  return {
    portfolio,
    portfolioId,
    loading,
    error,
    refetch: fetchPortfolio,
    clearAndRefetch,
    resetPortfolio,
  };
}
