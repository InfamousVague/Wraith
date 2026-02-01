import { useState, useEffect, useCallback, useRef } from "react";
import { hauntClient, type ListingsParams } from "../services/haunt";
import { useHauntSocket, type PriceUpdate } from "./useHauntSocket";
import { MOCK_ASSETS } from "../data/mockAssets";
import { logger } from "../utils/logger";
import type { Asset } from "../types/asset";

type UseCryptoDataOptions = {
  /** Number of cryptocurrencies to fetch per page */
  limit?: number;
  /** Sort field */
  sort?: ListingsParams["sort"];
  /** Sort direction */
  sortDir?: ListingsParams["sort_dir"];
  /** Auto-refresh interval in milliseconds (0 to disable, default uses WebSocket) */
  refreshInterval?: number;
  /** Use mock data instead of API (default: false, falls back to mock on error) */
  useMock?: boolean;
};

type UseCryptoDataResult = {
  assets: Asset[];
  loading: boolean;
  loadingMore: boolean;
  error: Error | null;
  hasMore: boolean;
  refresh: () => void;
  loadMore: () => void;
  search: (query: string) => Asset[];
};

/**
 * Hook to fetch cryptocurrency listings from Haunt API.
 * Supports pagination, search, and real-time WebSocket updates.
 * Falls back to mock data when API is unavailable.
 */
export function useCryptoData(options: UseCryptoDataOptions = {}): UseCryptoDataResult {
  const {
    limit = 20,
    sort = "market_cap",
    sortDir = "desc",
    refreshInterval = 0,
    useMock = false,
  } = options;

  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(1);

  // Get WebSocket context for real-time updates
  const { connected, subscribe, onPriceUpdate } = useHauntSocket();

  // Subscribe to price updates and update assets in real-time
  useEffect(() => {
    if (!connected || assets.length === 0) return;

    // Subscribe to all loaded assets
    const symbols = assets.map((a) => a.symbol.toLowerCase());
    subscribe(symbols);

    // Handle price updates
    const unsubscribe = onPriceUpdate((update: PriceUpdate) => {
      setAssets((prev) =>
        prev.map((asset) =>
          asset.symbol.toLowerCase() === update.symbol.toLowerCase()
            ? {
                ...asset,
                price: update.price,
                change24h: update.change24h,
                volume24h: update.volume24h,
              }
            : asset
        )
      );
    });

    return unsubscribe;
  }, [connected, assets.length, subscribe, onPriceUpdate]);

  const fetchData = useCallback(async (append = false) => {
    // Mock data path
    if (useMock) {
      logger.data("useCryptoData", { mode: "MOCK", append, page: pageRef.current });

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        pageRef.current = 1;
      }

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, append ? 500 : 800));

      const start = append ? (pageRef.current - 1) * limit : 0;
      const end = start + limit;
      const pageData = MOCK_ASSETS.slice(start, end);

      logger.data("Mock Data Loaded", {
        range: `${start}-${end}`,
        count: pageData.length,
        hasMore: end < MOCK_ASSETS.length,
      });

      if (append) {
        setAssets((prev) => [...prev, ...pageData]);
      } else {
        setAssets(pageData);
      }

      setHasMore(end < MOCK_ASSETS.length);
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    // Haunt API path
    try {
      logger.data("useCryptoData", { mode: "HAUNT", append, page: pageRef.current });

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        pageRef.current = 1;
      }
      setError(null);

      const response = await hauntClient.getListings({
        limit,
        start: append ? (pageRef.current - 1) * limit + 1 : 1,
        sort,
        sort_dir: sortDir,
      });

      const fetchedAssets = response.data;

      logger.data("Haunt Data Loaded", {
        count: fetchedAssets.length,
        cached: response.meta.cached,
        sample: fetchedAssets.slice(0, 3).map((a) => ({ symbol: a.symbol, price: a.price })),
      });

      if (append) {
        setAssets((prev) => [...prev, ...fetchedAssets]);
      } else {
        setAssets(fetchedAssets);
      }

      setHasMore(fetchedAssets.length === limit);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(err instanceof Error ? err : new Error("Failed to fetch data"));
      logger.error("useCryptoData Haunt API failed", err);
      logger.data("useCryptoData", {
        reason: errorMessage,
        mode: "ERROR",
      });
      // Don't fall back to mock data - show error state instead
      if (!append) {
        setAssets([]);
        setHasMore(false);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [limit, sort, sortDir, useMock]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    pageRef.current += 1;
    fetchData(true);
  }, [fetchData, loadingMore, hasMore]);

  useEffect(() => {
    fetchData();

    if (refreshInterval > 0) {
      const interval = setInterval(() => fetchData(false), refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, refreshInterval]);

  const search = useCallback(
    (query: string): Asset[] => {
      if (!query) return assets;

      const queryLower = query.toLowerCase();
      return assets.filter(
        (asset) =>
          asset.name.toLowerCase().includes(queryLower) ||
          asset.symbol.toLowerCase().includes(queryLower)
      );
    },
    [assets]
  );

  return {
    assets,
    loading,
    loadingMore,
    error,
    hasMore,
    refresh: () => fetchData(false),
    loadMore,
    search,
  };
}
