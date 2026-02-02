import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { hauntClient, type ListingsParams, type SortField, type SortDirection, type ListingFilter, type AssetType } from "../services/haunt";
import { useHauntSocket, type PriceUpdate } from "./useHauntSocket";
import { MOCK_ASSETS } from "../data/mockAssets";
import type { Asset } from "../types/asset";

// Search debounce delay
const SEARCH_DEBOUNCE_MS = 150;

type UseCryptoDataOptions = {
  /** Number of cryptocurrencies to fetch per page */
  limit?: number;
  /** Sort field */
  sort?: SortField;
  /** Sort direction */
  sortDir?: SortDirection;
  /** Listing filter (gainers, losers, etc.) */
  filter?: ListingFilter;
  /** Asset type filter */
  assetType?: AssetType;
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
    filter = "all",
    assetType = "all",
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

  // Memoize the symbols list to prevent unnecessary re-subscriptions
  const symbolsKey = useMemo(
    () => assets.map((a) => a.symbol.toLowerCase()).join(","),
    [assets]
  );

  // Subscribe to price updates and update assets in real-time
  useEffect(() => {
    if (!connected || !symbolsKey) return;

    // Subscribe to all loaded assets
    const symbols = symbolsKey.split(",").filter(Boolean);
    if (symbols.length === 0) return;

    subscribe(symbols);

    // Handle price updates with structural sharing - only update changed assets
    const unsubscribe = onPriceUpdate((update: PriceUpdate) => {
      setAssets((prev) => {
        const updateSymbol = update.symbol.toLowerCase();
        const assetIndex = prev.findIndex(
          (asset) => asset.symbol.toLowerCase() === updateSymbol
        );

        // Asset not found, return same reference
        if (assetIndex === -1) return prev;

        const asset = prev[assetIndex];

        // Check if anything actually changed to avoid unnecessary updates
        const priceChanged = asset.price !== update.price;
        const change24hChanged = update.change24h !== undefined && asset.change24h !== update.change24h;
        const volumeChanged = update.volume24h !== undefined && asset.volume24h !== update.volume24h;

        if (!priceChanged && !change24hChanged && !volumeChanged) {
          return prev; // No change, return same reference
        }

        // Use trade direction from server if available, otherwise calculate locally
        const tradeDirection = update.tradeDirection
          ?? (update.price > asset.price ? "up" as const
            : update.price < asset.price ? "down" as const
            : asset.tradeDirection);

        // Update sparkline: add new price, keep last 60 points (1 hour at 1-min intervals)
        const newSparkline = priceChanged
          ? [...asset.sparkline, update.price].slice(-60)
          : asset.sparkline;

        // Create new array with only the changed asset replaced (structural sharing)
        // Use WebSocket data for change24h and volume24h since our backend aggregates from all sources
        const newAssets = [...prev];
        newAssets[assetIndex] = {
          ...asset,
          price: update.price,
          change24h: update.change24h ?? asset.change24h,
          volume24h: update.volume24h ?? asset.volume24h,
          sparkline: newSparkline,
          tradeDirection,
        };

        return newAssets;
      });
    });

    return unsubscribe;
  }, [connected, symbolsKey, subscribe, onPriceUpdate]);

  const fetchData = useCallback(async (append = false) => {
    // Mock data path
    if (useMock) {
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
        filter: filter !== "all" ? filter : undefined,
        asset_type: assetType !== "all" ? assetType : undefined,
      });

      const fetchedAssets = response.data;

      if (append) {
        setAssets((prev) => [...prev, ...fetchedAssets]);
      } else {
        setAssets(fetchedAssets);
      }

      setHasMore(fetchedAssets.length === limit);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch data"));
      // Don't fall back to mock data - show error state instead
      if (!append) {
        setAssets([]);
        setHasMore(false);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [limit, sort, sortDir, filter, assetType, useMock]);

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

  // Debounced search with memoization
  const searchCacheRef = useRef<Map<string, Asset[]>>(new Map());
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Clear search cache when assets change
  useEffect(() => {
    searchCacheRef.current.clear();
  }, [assets]);

  const search = useCallback(
    (query: string): Asset[] => {
      if (!query) return assets;

      // Check cache first
      const cached = searchCacheRef.current.get(query);
      if (cached) return cached;

      const queryLower = query.toLowerCase();
      const results = assets.filter(
        (asset) =>
          asset.name.toLowerCase().includes(queryLower) ||
          asset.symbol.toLowerCase().includes(queryLower)
      );

      // Cache the result (limit cache size to prevent memory issues)
      if (searchCacheRef.current.size > 100) {
        searchCacheRef.current.clear();
      }
      searchCacheRef.current.set(query, results);

      return results;
    },
    [assets]
  );

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

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
