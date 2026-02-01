import { useState, useEffect, useCallback } from "react";
import { cmcClient, cmcToAsset, type ListingsParams } from "../services/coinmarketcap";
import type { Asset } from "../types/asset";

type UseCryptoDataOptions = {
  /** Number of cryptocurrencies to fetch */
  limit?: number;
  /** Sort field */
  sort?: ListingsParams["sort"];
  /** Sort direction */
  sortDir?: ListingsParams["sort_dir"];
  /** Auto-refresh interval in milliseconds (0 to disable) */
  refreshInterval?: number;
  /** Whether to use mock data instead of API */
  useMock?: boolean;
};

type UseCryptoDataResult = {
  assets: Asset[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
  search: (query: string) => Asset[];
};

// Mock data for development without API key
const MOCK_ASSETS: Asset[] = [
  {
    id: 1,
    rank: 1,
    name: "Bitcoin",
    symbol: "BTC",
    price: 97432.15,
    change1h: 0.23,
    change24h: 2.45,
    change7d: 5.67,
    marketCap: 1920000000000,
    volume24h: 45600000000,
    circulatingSupply: 19700000,
    maxSupply: 21000000,
    sparkline: [96000, 96500, 97000, 96800, 97200, 97432],
  },
  {
    id: 2,
    rank: 2,
    name: "Ethereum",
    symbol: "ETH",
    price: 3456.78,
    change1h: -0.12,
    change24h: 1.89,
    change7d: 8.23,
    marketCap: 415000000000,
    volume24h: 18900000000,
    circulatingSupply: 120000000,
    sparkline: [3400, 3420, 3450, 3440, 3460, 3456],
  },
  {
    id: 3,
    rank: 3,
    name: "Tether",
    symbol: "USDT",
    price: 1.0,
    change1h: 0.01,
    change24h: 0.02,
    change7d: -0.01,
    marketCap: 95000000000,
    volume24h: 78000000000,
    circulatingSupply: 95000000000,
    sparkline: [1, 1, 1, 1, 1, 1],
  },
  {
    id: 4,
    rank: 4,
    name: "BNB",
    symbol: "BNB",
    price: 623.45,
    change1h: 0.45,
    change24h: -1.23,
    change7d: 3.45,
    marketCap: 93000000000,
    volume24h: 1200000000,
    circulatingSupply: 149000000,
    maxSupply: 200000000,
    sparkline: [610, 620, 625, 618, 622, 623],
  },
  {
    id: 5,
    rank: 5,
    name: "Solana",
    symbol: "SOL",
    price: 198.34,
    change1h: 1.23,
    change24h: 5.67,
    change7d: 12.34,
    marketCap: 86000000000,
    volume24h: 4500000000,
    circulatingSupply: 433000000,
    sparkline: [180, 185, 190, 195, 197, 198],
  },
  {
    id: 6,
    rank: 6,
    name: "XRP",
    symbol: "XRP",
    price: 2.34,
    change1h: -0.34,
    change24h: -2.56,
    change7d: -5.12,
    marketCap: 82000000000,
    volume24h: 8900000000,
    circulatingSupply: 35000000000,
    maxSupply: 100000000000,
    sparkline: [2.5, 2.45, 2.4, 2.38, 2.35, 2.34],
  },
  {
    id: 7,
    rank: 7,
    name: "Cardano",
    symbol: "ADA",
    price: 1.12,
    change1h: 0.78,
    change24h: 4.23,
    change7d: 15.67,
    marketCap: 39000000000,
    volume24h: 1800000000,
    circulatingSupply: 35000000000,
    maxSupply: 45000000000,
    sparkline: [0.95, 1.0, 1.05, 1.08, 1.1, 1.12],
  },
  {
    id: 8,
    rank: 8,
    name: "Avalanche",
    symbol: "AVAX",
    price: 42.56,
    change1h: -0.56,
    change24h: -3.45,
    change7d: 2.34,
    marketCap: 17000000000,
    volume24h: 890000000,
    circulatingSupply: 394000000,
    maxSupply: 720000000,
    sparkline: [44, 43.5, 43, 42.8, 42.6, 42.56],
  },
  {
    id: 9,
    rank: 9,
    name: "Dogecoin",
    symbol: "DOGE",
    price: 0.38,
    change1h: 0.12,
    change24h: 1.45,
    change7d: 8.9,
    marketCap: 56000000000,
    volume24h: 3200000000,
    circulatingSupply: 147000000000,
    sparkline: [0.35, 0.36, 0.37, 0.375, 0.378, 0.38],
  },
  {
    id: 10,
    rank: 10,
    name: "Polkadot",
    symbol: "DOT",
    price: 8.45,
    change1h: -0.23,
    change24h: 2.1,
    change7d: 6.78,
    marketCap: 12000000000,
    volume24h: 450000000,
    circulatingSupply: 1420000000,
    sparkline: [8.1, 8.2, 8.3, 8.35, 8.4, 8.45],
  },
];

export function useCryptoData(options: UseCryptoDataOptions = {}): UseCryptoDataResult {
  const {
    limit = 100,
    sort = "market_cap",
    sortDir = "desc",
    refreshInterval = 0,
    useMock = true, // Default to mock data until API key is configured
  } = options;

  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (useMock) {
      // Use mock data
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate loading
      setAssets(MOCK_ASSETS);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await cmcClient.getListings({
        limit,
        sort,
        sort_dir: sortDir,
      });

      const convertedAssets = response.data.map(cmcToAsset);
      setAssets(convertedAssets);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch data"));
      // Fall back to mock data on error
      setAssets(MOCK_ASSETS);
    } finally {
      setLoading(false);
    }
  }, [limit, sort, sortDir, useMock]);

  useEffect(() => {
    fetchData();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval);
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
    error,
    refresh: fetchData,
    search,
  };
}

export function useGlobalMetrics() {
  const [metrics, setMetrics] = useState<{
    totalMarketCap: number;
    totalVolume24h: number;
    btcDominance: number;
    ethDominance: number;
    activeCryptocurrencies: number;
    marketCapChange24h: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true);
        // For now, use mock data
        // When API key is configured, uncomment the API call below
        // const response = await cmcClient.getGlobalMetrics();
        // setMetrics({
        //   totalMarketCap: response.data.quote.USD.total_market_cap,
        //   totalVolume24h: response.data.quote.USD.total_volume_24h,
        //   btcDominance: response.data.btc_dominance,
        //   ethDominance: response.data.eth_dominance,
        //   activeCryptocurrencies: response.data.active_cryptocurrencies,
        //   marketCapChange24h: response.data.quote.USD.total_market_cap_yesterday_percentage_change,
        // });

        // Mock data
        setMetrics({
          totalMarketCap: 3420000000000,
          totalVolume24h: 98500000000,
          btcDominance: 52.4,
          ethDominance: 17.8,
          activeCryptocurrencies: 24520,
          marketCapChange24h: 2.34,
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch metrics"));
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, []);

  return { metrics, loading, error };
}
