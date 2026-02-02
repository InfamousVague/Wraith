/**
 * Haunt API Client
 *
 * Client for interacting with the Haunt backend API.
 * Provides cryptocurrency data and market metrics.
 *
 * In development, requests are proxied through Vite to http://localhost:3001
 * In production, set VITE_HAUNT_URL to your Haunt API server.
 */

import type { Asset } from "../types/asset";
import type {
  SymbolSignals,
  AccuracyResponse,
  PredictionsResponse,
  SignalAccuracy,
  TradingTimeframe,
  Recommendation,
} from "../types/signals";

// Use relative path in dev (proxied by Vite), or direct URL in production
const HAUNT_URL = import.meta.env.VITE_HAUNT_URL || "";

export type GlobalMetrics = {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  ethDominance: number;
  activeCryptocurrencies: number;
  activeExchanges: number;
  marketCapChange24h: number;
  volumeChange24h: number;
  lastUpdated: string;
};

export type FearGreedData = {
  value: number;
  classification: string;
  timestamp: string;
};

export type SortField =
  | "market_cap"
  | "price"
  | "volume_24h"
  | "percent_change_1h"
  | "percent_change_24h"
  | "percent_change_7d"
  | "name";

export type SortDirection = "asc" | "desc";

export type ListingFilter =
  | "all"
  | "gainers"
  | "losers"
  | "most_volatile"
  | "top_volume";

export type AssetType = "all" | "crypto" | "stock" | "etf" | "forex" | "commodity";

export type ListingsParams = {
  start?: number;
  limit?: number;
  sort?: SortField;
  sort_dir?: SortDirection;
  filter?: ListingFilter;
  asset_type?: AssetType;
  min_change?: number;
  max_change?: number;
};

export type ApiResponse<T> = {
  data: T;
  meta: {
    cached: boolean;
    total?: number;
    start?: number;
    limit?: number;
    query?: string;
  };
};

export type ChartData = {
  symbol: string;
  range: string;
  data: OhlcPoint[];
  seeding?: boolean;
  /** Detailed seeding status: "not_started", "in_progress", "complete", "failed" */
  seedingStatus?: string;
};

export type OhlcPoint = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

export type SymbolSourceStat = {
  source: string;
  updateCount: number;
  updatePercent: number;
  online: boolean;
};

export type SymbolSourceStats = {
  symbol: string;
  sources: SymbolSourceStat[];
  totalUpdates: number;
  timestamp: number;
};

// Top movers types
export type MoverTimeframe = "1m" | "5m" | "15m" | "1h" | "4h" | "24h";

export type Mover = {
  symbol: string;
  price: number;
  changePercent: number;
  volume24h?: number;
};

export type MoversResponse = {
  timeframe: string;
  gainers: Mover[];
  losers: Mover[];
  timestamp: number;
};

// API Statistics types
export type ExchangeStat = {
  source: string;
  updateCount: number;
  updatePercent: number;
  online: boolean;
  lastError?: string;
};

export type ApiStats = {
  totalUpdates: number;
  tps: number;
  uptimeSecs: number;
  activeSymbols: number;
  onlineSources: number;
  totalSources: number;
  exchanges: ExchangeStat[];
};

// Confidence types
export type ConfidenceFactors = {
  sourceDiversity: number;
  updateFrequency: number;
  dataRecency: number;
  priceConsistency: number;
};

export type SymbolConfidence = {
  score: number;
  sourceCount: number;
  onlineSources: number;
  totalUpdates: number;
  currentPrice?: number;
  priceSpreadPercent?: number;
  secondsSinceUpdate?: number;
  factors: ConfidenceFactors;
};

export type ConfidenceResponse = {
  symbol: string;
  confidence: SymbolConfidence;
  chartDataPoints: number;
  timestamp: number;
};

// Generate synthetic sparkline data based on price and percent change
function generateSparkline(price: number, change7d: number, points: number = 168): number[] {
  if (price <= 0) return [];

  const sparkline: number[] = [];
  const startPrice = price / (1 + change7d / 100);
  const volatility = Math.abs(change7d) / 100 / points * 2;

  let current = startPrice;
  for (let i = 0; i < points; i++) {
    const progress = i / (points - 1);
    const trend = startPrice + (price - startPrice) * progress;
    const noise = (Math.random() - 0.5) * price * volatility;
    current = trend + noise;
    sparkline.push(Math.max(0, current));
  }

  // Ensure last point matches current price
  sparkline[sparkline.length - 1] = price;
  return sparkline;
}

// Transform raw Asset (with nested quote) to flat Asset format the frontend expects
function transformAssetResponse(raw: unknown): Asset {
  const data = raw as Record<string, unknown>;

  // If it already has the flat format (from listings), return as-is
  if ('price' in data && 'change1h' in data && 'sparkline' in data) {
    const existing = data as unknown as Asset;
    // Generate sparkline if missing or too short
    if (!existing.sparkline || existing.sparkline.length < 10) {
      existing.sparkline = generateSparkline(existing.price, existing.change7d);
    }
    return existing;
  }

  // Transform nested quote format to flat format
  const quote = (data.quote as Record<string, unknown>) ?? {};
  const price = (quote.price as number) ?? 0;
  const change7d = (quote.percentChange7d as number) ?? 0;

  // Use provided sparkline or generate one
  let sparkline = (data.sparkline as number[]) ?? [];
  if (sparkline.length < 10 && price > 0) {
    sparkline = generateSparkline(price, change7d);
  }

  return {
    id: data.id as number,
    rank: (data.rank as number) ?? 0,
    name: data.name as string,
    symbol: data.symbol as string,
    image: (data.image as string) ?? (data.logo as string) ??
      `https://s2.coinmarketcap.com/static/img/coins/64x64/${data.id}.png`,
    price,
    change1h: (quote.percentChange1h as number) || 0,
    change24h: (quote.percentChange24h as number) || 0,
    change7d: change7d || 0,
    marketCap: (quote.marketCap as number) || 0,
    volume24h: (quote.volume24h as number) || 0,
    circulatingSupply: (quote.circulatingSupply as number) || 0,
    maxSupply: quote.maxSupply as number | undefined,
    sparkline,
  };
}

class HauntClient {
  private baseUrl: string;

  constructor(baseUrl: string = HAUNT_URL) {
    this.baseUrl = baseUrl;
  }

  private async fetch<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`);

    if (!response.ok) {
      throw new Error(`Haunt API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get cryptocurrency listings with optional filtering and sorting
   */
  async getListings(params: ListingsParams = {}): Promise<ApiResponse<Asset[]>> {
    const searchParams = new URLSearchParams();
    if (params.start) searchParams.set("start", String(params.start));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.sort) searchParams.set("sort", params.sort);
    if (params.sort_dir) searchParams.set("sort_dir", params.sort_dir);
    if (params.filter && params.filter !== "all") searchParams.set("filter", params.filter);
    if (params.asset_type && params.asset_type !== "all") searchParams.set("asset_type", params.asset_type);
    if (params.min_change !== undefined) searchParams.set("min_change", String(params.min_change));
    if (params.max_change !== undefined) searchParams.set("max_change", String(params.max_change));

    const query = searchParams.toString();
    return this.fetch(`/api/crypto/listings${query ? `?${query}` : ""}`);
  }

  /**
   * Get a single cryptocurrency by ID
   */
  async getAsset(id: number): Promise<ApiResponse<Asset>> {
    const response = await this.fetch<ApiResponse<unknown>>(`/api/crypto/${id}`);
    return {
      ...response,
      data: transformAssetResponse(response.data),
    };
  }

  /**
   * Get latest quotes for a cryptocurrency
   */
  async getQuotes(id: number): Promise<ApiResponse<Asset>> {
    return this.fetch(`/api/crypto/${id}/quotes`);
  }

  /**
   * Search cryptocurrencies by name or symbol
   */
  async search(query: string, limit = 20): Promise<ApiResponse<Asset[]>> {
    const searchParams = new URLSearchParams({
      q: query,
      limit: String(limit),
    });
    return this.fetch(`/api/crypto/search?${searchParams}`);
  }

  /**
   * Get global market metrics
   */
  async getGlobalMetrics(): Promise<ApiResponse<GlobalMetrics>> {
    return this.fetch("/api/market/global");
  }

  /**
   * Get Fear & Greed Index
   */
  async getFearGreed(): Promise<ApiResponse<FearGreedData>> {
    return this.fetch("/api/market/fear-greed");
  }

  /**
   * Get chart data for a cryptocurrency
   * @param id Asset ID
   * @param range Time range: "1h", "4h", "1d", "1w", "1m"
   */
  async getChart(id: number, range: string = "1d"): Promise<ApiResponse<ChartData>> {
    return this.fetch(`/api/crypto/${id}/chart?range=${range}`);
  }

  /**
   * Trigger historical data seeding for a symbol
   */
  async seedSymbol(symbol: string): Promise<ApiResponse<{ symbol: string; status: string; message: string }>> {
    const response = await fetch(`${this.baseUrl}/api/crypto/seed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol }),
    });
    if (!response.ok) {
      throw new Error(`Seed request failed: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Get source statistics for a specific symbol
   * Shows which data sources are providing updates for this asset
   */
  async getSymbolSourceStats(symbol: string): Promise<ApiResponse<SymbolSourceStats>> {
    return this.fetch(`/api/market/source-stats/${symbol.toLowerCase()}`);
  }

  /**
   * Get top movers (gainers and losers)
   * @param timeframe Time window: "1m", "5m", "15m", "1h", "4h", "24h"
   * @param limit Number of movers to return (default 10, max 50)
   * @param assetType Asset type filter: "all", "crypto", "stock"
   */
  async getMovers(
    timeframe: MoverTimeframe = "1h",
    limit: number = 10,
    assetType?: AssetType
  ): Promise<ApiResponse<MoversResponse>> {
    let url = `/api/market/movers?timeframe=${timeframe}&limit=${limit}`;
    if (assetType && assetType !== "all") {
      url += `&asset_type=${assetType}`;
    }
    return this.fetch(url);
  }

  /**
   * Get API statistics (TPS, uptime, sources, etc.)
   */
  async getStats(): Promise<ApiResponse<ApiStats>> {
    return this.fetch("/api/market/stats");
  }

  /**
   * Get confidence metrics for a specific symbol
   * Includes data quality, source diversity, and price consistency metrics
   */
  async getConfidence(symbol: string): Promise<ApiResponse<ConfidenceResponse>> {
    return this.fetch(`/api/market/confidence/${symbol.toLowerCase()}`);
  }

  /**
   * Health check
   */
  async health(): Promise<{
    status: string;
    timestamp: string;
    uptime: number;
  }> {
    return this.fetch("/api/health");
  }

  /**
   * Get trading signals for a symbol
   * Includes technical indicators, composite scores, and accuracy data
   * @param symbol Asset symbol
   * @param timeframe Trading timeframe (default: day_trading)
   */
  async getSignals(
    symbol: string,
    timeframe: TradingTimeframe = "day_trading"
  ): Promise<ApiResponse<SymbolSignals>> {
    return this.fetch(`/api/signals/${symbol.toLowerCase()}?timeframe=${timeframe}`);
  }

  /**
   * Get signal accuracy stats for a symbol
   * Shows historical accuracy of predictions for each indicator
   */
  async getSignalAccuracy(symbol: string): Promise<ApiResponse<AccuracyResponse>> {
    return this.fetch(`/api/signals/${symbol.toLowerCase()}/accuracy`);
  }

  /**
   * Get recent predictions for a symbol
   * Shows predictions made and their outcomes
   */
  async getSignalPredictions(symbol: string): Promise<ApiResponse<PredictionsResponse>> {
    return this.fetch(`/api/signals/${symbol.toLowerCase()}/predictions`);
  }

  /**
   * Get global accuracy stats for an indicator
   * Shows cross-symbol accuracy for a specific indicator
   */
  async getIndicatorAccuracy(indicator: string): Promise<ApiResponse<SignalAccuracy[]>> {
    return this.fetch(`/api/signals/accuracy/${indicator.toLowerCase()}`);
  }

  /**
   * Get accuracy-weighted recommendation for a symbol
   * Returns a simple Buy/Sell/Hold with confidence based on indicator accuracy
   */
  async getRecommendation(
    symbol: string,
    timeframe: TradingTimeframe = "day_trading"
  ): Promise<ApiResponse<Recommendation>> {
    return this.fetch(`/api/signals/${symbol.toLowerCase()}/recommendation?timeframe=${timeframe}`);
  }
}

// Default client instance
export const hauntClient = new HauntClient();

// Re-export for custom instances
export { HauntClient };
