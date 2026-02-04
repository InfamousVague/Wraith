/**
 * @file useSearch.ts
 * @description Hook for searching assets with debouncing and recent search history.
 *
 * Features:
 * - Debounced API calls to avoid excessive requests
 * - Recent searches stored in localStorage
 * - Loading and error states
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { hauntClient } from "../services/haunt";
import type { Asset } from "../types/asset";

const RECENT_SEARCHES_KEY = "wraith_recent_searches";
const MAX_RECENT_SEARCHES = 5;
const DEBOUNCE_MS = 300;

export type UseSearchResult = {
  query: string;
  setQuery: (query: string) => void;
  results: Asset[];
  loading: boolean;
  error: string | null;
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  clearResults: () => void;
};

function getStoredRecentSearches(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function storeRecentSearches(searches: string[]): void {
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
  } catch {
    // Ignore storage errors
  }
}

export function useSearch(limit: number = 10): UseSearchResult {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>(getStoredRecentSearches);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounced search
  useEffect(() => {
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Clear previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Don't search for empty or too short queries
    if (!query || query.length < 2) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    debounceRef.current = setTimeout(async () => {
      abortControllerRef.current = new AbortController();

      try {
        const response = await hauntClient.search(query, limit);
        setResults(response.data);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // Request was cancelled, ignore
          return;
        }
        console.warn("Search failed:", err);
        setError(err instanceof Error ? err.message : "Search failed");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, limit]);

  const addRecentSearch = useCallback((searchQuery: string) => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed) return;

    setRecentSearches((prev) => {
      // Remove if already exists, add to front
      const filtered = prev.filter((s) => s.toLowerCase() !== trimmed);
      const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      storeRecentSearches(updated);
      return updated;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    storeRecentSearches([]);
  }, []);

  const clearResults = useCallback(() => {
    setQuery("");
    setResults([]);
    setError(null);
  }, []);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    clearResults,
  };
}
