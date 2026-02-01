/**
 * CoinMarketCap API Service
 *
 * To use this service, you need a CoinMarketCap API key.
 * Get one at: https://coinmarketcap.com/api/
 *
 * Set your API key in the environment variable VITE_CMC_API_KEY
 * or pass it to the createCMCClient function.
 */

const BASE_URL = "https://pro-api.coinmarketcap.com";

// For development, we can use a proxy to avoid CORS issues
const PROXY_URL = "/api/cmc";

export type CMCCryptocurrency = {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  cmc_rank: number;
  num_market_pairs: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number | null;
  infinite_supply: boolean;
  last_updated: string;
  date_added: string;
  tags: string[];
  platform: {
    id: number;
    name: string;
    symbol: string;
    slug: string;
    token_address: string;
  } | null;
  self_reported_circulating_supply: number | null;
  self_reported_market_cap: number | null;
  quote: {
    USD: {
      price: number;
      volume_24h: number;
      volume_change_24h: number;
      percent_change_1h: number;
      percent_change_24h: number;
      percent_change_7d: number;
      percent_change_30d: number;
      market_cap: number;
      market_cap_dominance: number;
      fully_diluted_market_cap: number;
      last_updated: string;
    };
  };
};

export type CMCListingsResponse = {
  status: {
    timestamp: string;
    error_code: number;
    error_message: string | null;
    elapsed: number;
    credit_count: number;
  };
  data: CMCCryptocurrency[];
};

export type CMCGlobalMetrics = {
  active_cryptocurrencies: number;
  total_cryptocurrencies: number;
  active_market_pairs: number;
  active_exchanges: number;
  total_exchanges: number;
  eth_dominance: number;
  btc_dominance: number;
  eth_dominance_yesterday: number;
  btc_dominance_yesterday: number;
  eth_dominance_24h_percentage_change: number;
  btc_dominance_24h_percentage_change: number;
  defi_volume_24h: number;
  defi_volume_24h_reported: number;
  defi_market_cap: number;
  defi_24h_percentage_change: number;
  stablecoin_volume_24h: number;
  stablecoin_volume_24h_reported: number;
  stablecoin_market_cap: number;
  stablecoin_24h_percentage_change: number;
  derivatives_volume_24h: number;
  derivatives_volume_24h_reported: number;
  derivatives_24h_percentage_change: number;
  quote: {
    USD: {
      total_market_cap: number;
      total_volume_24h: number;
      total_volume_24h_reported: number;
      altcoin_volume_24h: number;
      altcoin_volume_24h_reported: number;
      altcoin_market_cap: number;
      defi_volume_24h: number;
      defi_volume_24h_reported: number;
      defi_24h_percentage_change: number;
      defi_market_cap: number;
      stablecoin_volume_24h: number;
      stablecoin_volume_24h_reported: number;
      stablecoin_24h_percentage_change: number;
      stablecoin_market_cap: number;
      derivatives_volume_24h: number;
      derivatives_volume_24h_reported: number;
      derivatives_24h_percentage_change: number;
      total_market_cap_yesterday: number;
      total_volume_24h_yesterday: number;
      total_market_cap_yesterday_percentage_change: number;
      total_volume_24h_yesterday_percentage_change: number;
      last_updated: string;
    };
  };
  last_updated: string;
};

export type CMCSearchResult = {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  rank: number;
  tokens: string[] | null;
  platform: {
    id: number;
    name: string;
    symbol: string;
  } | null;
};

export type ListingsParams = {
  start?: number;
  limit?: number;
  sort?: "market_cap" | "name" | "symbol" | "date_added" | "price" | "circulating_supply" | "total_supply" | "max_supply" | "num_market_pairs" | "volume_24h" | "percent_change_1h" | "percent_change_24h" | "percent_change_7d";
  sort_dir?: "asc" | "desc";
  cryptocurrency_type?: "all" | "coins" | "tokens";
  tag?: string;
  aux?: string;
};

export class CoinMarketCapClient {
  private apiKey: string;
  private useProxy: boolean;

  constructor(apiKey?: string, useProxy = true) {
    this.apiKey = apiKey || import.meta.env.VITE_CMC_API_KEY || "";
    this.useProxy = useProxy;
  }

  private getBaseUrl(): string {
    return this.useProxy ? PROXY_URL : BASE_URL;
  }

  private async fetch<T>(endpoint: string, params?: Record<string, string | number>): Promise<T> {
    const url = new URL(`${this.getBaseUrl()}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const headers: HeadersInit = {
      Accept: "application/json",
    };

    // Only add API key header if not using proxy (proxy handles it)
    if (!this.useProxy && this.apiKey) {
      headers["X-CMC_PRO_API_KEY"] = this.apiKey;
    }

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      throw new Error(`CoinMarketCap API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get a paginated list of all active cryptocurrencies with latest market data.
   */
  async getListings(params: ListingsParams = {}): Promise<CMCListingsResponse> {
    return this.fetch("/v1/cryptocurrency/listings/latest", {
      start: params.start || 1,
      limit: params.limit || 100,
      sort: params.sort || "market_cap",
      sort_dir: params.sort_dir || "desc",
      cryptocurrency_type: params.cryptocurrency_type || "all",
      ...(params.tag && { tag: params.tag }),
      ...(params.aux && { aux: params.aux }),
    });
  }

  /**
   * Get global cryptocurrency market metrics.
   */
  async getGlobalMetrics(): Promise<{ data: CMCGlobalMetrics }> {
    return this.fetch("/v1/global-metrics/quotes/latest");
  }

  /**
   * Search for cryptocurrencies by name or symbol.
   * Note: This uses the map endpoint which returns basic info.
   * For full data, get the IDs and use getQuotes.
   */
  async search(query: string, limit = 20): Promise<CMCSearchResult[]> {
    // CoinMarketCap doesn't have a direct search endpoint in the free tier
    // We'll implement client-side search from the listings
    const listings = await this.getListings({ limit: 5000 });

    const queryLower = query.toLowerCase();
    const results = listings.data.filter(
      (crypto) =>
        crypto.name.toLowerCase().includes(queryLower) ||
        crypto.symbol.toLowerCase().includes(queryLower)
    );

    return results.slice(0, limit).map((crypto) => ({
      id: crypto.id,
      name: crypto.name,
      symbol: crypto.symbol,
      slug: crypto.slug,
      rank: crypto.cmc_rank,
      tokens: crypto.tags,
      platform: crypto.platform
        ? {
            id: crypto.platform.id,
            name: crypto.platform.name,
            symbol: crypto.platform.symbol,
          }
        : null,
    }));
  }

  /**
   * Get metadata for specific cryptocurrencies by ID.
   */
  async getMetadata(ids: number[]): Promise<any> {
    return this.fetch("/v2/cryptocurrency/info", {
      id: ids.join(","),
    });
  }

  /**
   * Get latest quotes for specific cryptocurrencies by ID.
   */
  async getQuotes(ids: number[]): Promise<any> {
    return this.fetch("/v2/cryptocurrency/quotes/latest", {
      id: ids.join(","),
    });
  }
}

// Default client instance
export const cmcClient = new CoinMarketCapClient();

// Convert CMC data to our Asset type
export function cmcToAsset(crypto: CMCCryptocurrency): import("../types/asset").Asset {
  const quote = crypto.quote.USD;
  return {
    id: crypto.id,
    rank: crypto.cmc_rank,
    name: crypto.name,
    symbol: crypto.symbol,
    price: quote.price,
    change1h: quote.percent_change_1h,
    change24h: quote.percent_change_24h,
    change7d: quote.percent_change_7d,
    marketCap: quote.market_cap,
    volume24h: quote.volume_24h,
    circulatingSupply: crypto.circulating_supply,
    maxSupply: crypto.max_supply || undefined,
    sparkline: [], // CMC doesn't provide sparkline in listings
  };
}
