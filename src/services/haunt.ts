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
import type { AggregatedOrderBook, OrderBookResponse } from "../types/orderbook";
import type { RatState, RatConfig, RatConfigUpdate } from "../types/rat";

// Use relative path in dev (proxied by Vite), or direct URL in production
const HAUNT_URL = import.meta.env.VITE_HAUNT_URL || "";

/**
 * Custom error class for API errors that preserves the error code
 */
export class HauntApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string = "", status: number = 0) {
    super(message);
    this.name = "HauntApiError";
    this.code = code;
    this.status = status;
  }
}

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

// Exchange Dominance types
export type RegionExchange = {
  name: string;
  percentage: number;
  volume24h: number;
};

export type RegionDominance = {
  region: string;
  dominantExchange: string;
  percentage: number;
  volume24h: number;
  exchanges: RegionExchange[];
};

export type ExchangeDominanceResponse = {
  symbol: string;
  regions: RegionDominance[];
  timestamp: number;
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

// Peer mesh types for multi-server connectivity
export type PeerConnectionStatus = "connected" | "connecting" | "disconnected" | "failed";

export type PeerStatus = {
  id: string;
  region: string;
  status: PeerConnectionStatus;
  latencyMs?: number;
  avgLatencyMs?: number;
  minLatencyMs?: number;
  maxLatencyMs?: number;
  pingCount: number;
  failedPings: number;
  uptimePercent: number;
  lastPingAt?: number;
  lastAttemptAt?: number;
};

export type PeerMeshResponse = {
  serverId: string;
  serverRegion: string;
  peers: PeerStatus[];
  connectedCount: number;
  totalPeers: number;
  timestamp: number;
};

// Sync monitoring types
export type SyncHealthResponse = {
  nodeId: string;
  isPrimary: boolean;
  syncEnabled: boolean;
  lastFullSyncAt: number;
  lastIncrementalSyncAt: number;
  syncCursorPosition: number;
  pendingSyncCount: number;
  failedSyncCount: number;
  totalSyncedEntities: number;
  databaseSizeMb: number;
  databaseRowCount: number;
};

// UI-oriented sync status used by Servers list.
export type SyncStatus = {
  predictionsAhead: number;
  predictionsBehind: number;
  preferencesAhead: number;
  preferencesBehind: number;
  syncing: boolean;
};

// Portfolio types - matches Haunt API response
export type Portfolio = {
  id: string;
  userId: string;
  name: string;
  description?: string;
  baseCurrency: string;
  startingBalance: number;
  cashBalance: number;  // Note: API uses cashBalance, not balance
  marginUsed: number;
  marginAvailable: number;
  unrealizedPnl: number;
  realizedPnl: number;
  totalValue: number;
  totalTrades: number;
  winningTrades: number;
  costBasisMethod?: string;
  riskSettings?: {
    maxPositionSizePct: number;
    dailyLossLimitPct: number;
    maxOpenPositions: number;
    riskPerTradePct: number;
    portfolioStopPct: number;
  };
  isCompetition?: boolean;
  createdAt: number;
  updatedAt: number;
  // Alias for backwards compatibility
  balance?: number;
  lastUpdated?: number;
};

export type Holding = {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  value: number;
  allocation: number;
  pnl: number;
  pnlPercent: number;
};

export type HoldingsResponse = {
  holdings: Holding[];
  totalValue: number;
  totalPnl: number;
  timestamp: number;
};

export type PerformancePoint = {
  timestamp: number;
  value: number;
  pnl: number;
  pnlPercent: number;
};

export type PerformanceResponse = {
  range: string;
  data: PerformancePoint[];
  startValue: number;
  endValue: number;
  totalPnl: number;
  totalPnlPercent: number;
  timestamp: number;
};

// Position type - matches backend API response
// Note: Frontend components may use aliases (size/markPrice) for compatibility
export type Position = {
  id: string;
  symbol: string;
  side: "long" | "short";
  quantity: number; // Backend field name
  size?: number; // Alias for compatibility
  entryPrice: number;
  currentPrice: number; // Backend field name
  markPrice?: number; // Alias for compatibility
  leverage: number;
  marginMode: "isolated" | "cross";
  liquidationPrice?: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number; // Backend field name
  unrealizedPnlPercent?: number; // Alias for compatibility
  marginUsed: number; // Backend field name
  margin?: number; // Alias for compatibility
  roe?: number; // Return on equity (%)
  stopLoss?: number;
  takeProfit?: number;
  trailingStop?: number;
  createdAt: number;
};

export type ModifyPositionRequest = {
  stopLoss?: number | null; // null to remove
  takeProfit?: number | null;
  trailingStop?: number | null;
};

export type Order = {
  id: string;
  symbol: string;
  type: "market" | "limit" | "stop_loss" | "take_profit";
  side: "buy" | "sell";
  price?: number;
  size: number;
  filledSize: number;
  status: "pending" | "partial" | "filled" | "cancelled";
  createdAt: number;
};

export type Trade = {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  size: number;
  price: number;
  fee: number;
  pnl: number;
  executedAt: number;
};

// Asset class for trading - must match backend AssetClass enum (snake_case)
export type AssetClass = "crypto_spot" | "stock" | "etf" | "perp" | "option";

// Order type - must match backend OrderType enum (snake_case)
export type OrderType = "market" | "limit" | "stop_loss" | "take_profit" | "stop_limit" | "trailing_stop";

// Time in force for orders (snake_case)
export type TimeInForce = "gtc" | "ioc" | "fok" | "gtd";

export type PlaceOrderRequest = {
  portfolioId: string;
  symbol: string;
  assetClass: AssetClass;
  side: "buy" | "sell";
  orderType: OrderType;
  quantity: number;
  price?: number;
  stopPrice?: number;
  trailAmount?: number;
  trailPercent?: number;
  timeInForce?: TimeInForce;
  leverage?: number;
  stopLoss?: number;
  takeProfit?: number;
  /** Reduce only - order can only reduce existing position, not increase it */
  reduceOnly?: boolean;
  /** Post only - order will only be placed if it adds liquidity (maker order) */
  postOnly?: boolean;
  /** Margin mode for the position */
  marginMode?: "isolated" | "cross";
  /** Bypass drawdown protection for this order */
  bypassDrawdown?: boolean;
};

// Backend returns ApiResponse<Order> which wraps as { data: Order }
export type PlaceOrderResponse = Order;

export type ModifyOrderRequest = {
  price?: number;
  size?: number;
  stopLoss?: number;
  takeProfit?: number;
};

export type CancelAllOrdersResponse = {
  cancelled: number;
  message: string;
};

// Leaderboard types
// Alert types
export type AlertCondition = "above" | "below" | "crosses";

export type Alert = {
  id: string;
  symbol: string;
  condition: AlertCondition;
  targetPrice: number;
  currentPrice?: number;
  triggered: boolean;
  triggeredAt?: number;
  createdAt: number;
  expiresAt?: number;
  notifyEmail?: boolean;
  notifyPush?: boolean;
};

export type CreateAlertRequest = {
  symbol: string;
  condition: AlertCondition;
  targetPrice: number;
  expiresAt?: number;
  notifyEmail?: boolean;
  notifyPush?: boolean;
};

// Account types
export type AccountSummary = {
  balance: number;
  equity: number;
  marginUsed: number;
  marginAvailable: number;
  unrealizedPnl: number;
  realizedPnl: number;
  todayPnl: number;
  todayPnlPercent: number;
  openPositions: number;
  pendingOrders: number;
  leverage: number;
  marginLevel: number; // equity / marginUsed
  liquidationRisk: "low" | "medium" | "high" | "critical";
};

export type Transaction = {
  id: string;
  type: "deposit" | "withdraw" | "transfer" | "fee" | "funding" | "liquidation" | "bonus";
  amount: number;
  balance: number; // Balance after transaction
  description: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  createdAt: number;
  completedAt?: number;
};

export type TransactionHistoryParams = {
  type?: Transaction["type"];
  status?: Transaction["status"];
  startTime?: number;
  endTime?: number;
  limit?: number;
};

// Trading stats types
export type TradingStats = {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  avgHoldTime: number; // seconds
  totalVolume: number;
  totalFees: number;
  netPnl: number;
  bestDay: { date: string; pnl: number };
  worstDay: { date: string; pnl: number };
  currentStreak: number;
  longestWinStreak: number;
  longestLoseStreak: number;
};

export type TradingStatsTimeframe = "today" | "week" | "month" | "year" | "all";

// Portfolio Settings types
export type PortfolioSettings = {
  drawdownProtection: {
    enabled: boolean;
    maxDrawdownPercent: number;
    calculationMethod: string;
    allowBypass: boolean;
    autoResetAfter: string;
    warningThresholdPercent: number;
  };
};

// Portfolio Stats types - detailed trading statistics
export type PortfolioStats = {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  largestWin: number;
  largestLoss: number;
  bestTrade: { symbol: string; pnl: number; pnlPercent: number; date: number } | null;
  worstTrade: { symbol: string; pnl: number; pnlPercent: number; date: number } | null;
  currentStreak: { type: "win" | "loss" | "none"; count: number };
  longestWinStreak: number;
  longestLossStreak: number;
  averageHoldTime: number; // in milliseconds
  peakValue: number;
  peakDate: number;
  currentDrawdown: number;
  currentDrawdownPercent: number;
  maxDrawdownHit: number;
  maxDrawdownPercent: number;
  maxDrawdownDate: number;
  sharpeRatio: number | null;
  sortinoRatio: number | null;
};

// Drawdown History types
export type DrawdownHistoryPoint = {
  timestamp: number;
  drawdownPercent: number;
  portfolioValue: number;
};

export type DrawdownHistoryRange = "1d" | "1w" | "1m" | "3m" | "all";

// Funding rate types (for perpetuals)
export type FundingRate = {
  symbol: string;
  rate: number;
  nextFundingTime: number;
  predictedRate?: number;
  interval: number; // hours
};

export type FundingHistory = {
  symbol: string;
  rate: number;
  timestamp: number;
  payment?: number; // If user had position
};

// Trade history filter params
export type TradeHistoryParams = {
  symbol?: string;
  side?: "buy" | "sell";
  startTime?: number;
  endTime?: number;
  limit?: number;
  offset?: number;
};

export type LeaderboardTimeframe = "daily" | "weekly" | "monthly" | "all_time";

/**
 * Leaderboard entry from API
 * Matches the actual Haunt backend response structure
 */
export type LeaderboardEntry = {
  portfolioId: string;
  name: string;
  userId: string;
  totalValue: number;
  startingBalance: number;
  realizedPnl: number;
  unrealizedPnl: number;
  totalReturnPct: number;
  totalTrades: number;
  winningTrades: number;
  winRate: number;
  openPositions: number;
  // Computed/optional fields for display
  rank?: number;
  avatar?: string;
  badges?: string[];
};

/**
 * Leaderboard response - API returns array directly in data field
 */
export type LeaderboardResponse = LeaderboardEntry[];

// Auth types
export type AuthChallenge = {
  challenge: string;
  timestamp: number;
  expiresAt: number;
};

export type AuthRequest = {
  publicKey: string;
  challenge: string;
  signature: string;
  timestamp: number;
};

export type Profile = {
  id: string;
  publicKey: string;
  username: string;
  createdAt: number;
  lastSeen: number;
  showOnLeaderboard: boolean;
  leaderboardSignature?: string;
  leaderboardConsentAt?: number;
  settings: ProfileSettings;
};

export type ProfileSettings = {
  defaultTimeframe: string;
  preferredIndicators: string[];
  notificationsEnabled: boolean;
};

export type AuthResponse = {
  authenticated: boolean;
  publicKey: string;
  sessionToken: string;
  expiresAt: number;
  profile: Profile;
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

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, options);

    if (!response.ok) {
      // Try to parse error response for more details
      let errorMessage = `Haunt API error: ${response.status} ${response.statusText}`;
      let errorCode = "";

      try {
        const errorBody = await response.json();
        if (errorBody.error) {
          errorMessage = errorBody.error;
        } else if (errorBody.message) {
          errorMessage = errorBody.message;
        }
        // Preserve the error code from the backend
        if (errorBody.code) {
          errorCode = errorBody.code;
        }
      } catch {
        // Couldn't parse JSON, use default message
      }

      // Add helpful context for common errors
      if (response.status === 403) {
        if (endpoint.includes("/orders") || endpoint.includes("/positions")) {
          errorMessage = "Portfolio access denied. Please try logging out and back in.";
        }
      }

      throw new HauntApiError(errorMessage, errorCode, response.status);
    }

    return response.json();
  }

  private async fetchWithAuth<T>(endpoint: string, token: string, options?: RequestInit): Promise<T> {
    return this.fetch<T>(endpoint, {
      ...options,
      headers: {
        ...options?.headers,
        Authorization: `Bearer ${token}`,
      },
    });
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
   * Get exchange dominance by region for a symbol
   * Shows which exchanges have the most volume in each geographic region
   * Useful for choosing optimal trading server
   */
  async getExchangeDominance(symbol: string): Promise<ApiResponse<ExchangeDominanceResponse>> {
    return this.fetch(`/api/market/exchange-dominance/${symbol.toLowerCase()}`);
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
   * Get predictions for a symbol
   * Shows predictions made and their outcomes
   * @param symbol - The symbol to get predictions for
   * @param options - Optional parameters for filtering
   * @param options.status - Filter by status: "all", "validated", "pending"
   * @param options.limit - Maximum number of predictions to return (default: 50, max: 500)
   */
  async getSignalPredictions(
    symbol: string,
    options?: { status?: "all" | "validated" | "pending"; limit?: number }
  ): Promise<ApiResponse<PredictionsResponse>> {
    const params = new URLSearchParams();
    if (options?.status) params.set("status", options.status);
    if (options?.limit) params.set("limit", options.limit.toString());
    const queryString = params.toString();
    const url = `/api/signals/${symbol.toLowerCase()}/predictions${queryString ? `?${queryString}` : ""}`;
    return this.fetch(url);
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

  /**
   * Generate predictions for a symbol immediately
   * Forces fresh signal computation and prediction generation
   * @param symbol Asset symbol
   * @param timeframe Trading timeframe (default: day_trading)
   */
  async generatePredictions(
    symbol: string,
    timeframe: TradingTimeframe = "day_trading"
  ): Promise<ApiResponse<SymbolSignals>> {
    return this.fetch(`/api/signals/${symbol.toLowerCase()}/generate?timeframe=${timeframe}`, {
      method: "POST",
    });
  }

  // ========== Portfolio API Methods ==========

  /**
   * List all portfolios for a user
   * @param userId User ID to filter by
   */
  async listPortfolios(token: string, userId?: string): Promise<ApiResponse<Portfolio[]>> {
    const query = userId ? `?user_id=${userId}` : "";
    return this.fetchWithAuth(`/api/trading/portfolios${query}`, token);
  }

  /**
   * Get a specific portfolio by ID
   */
  async getPortfolio(token: string, portfolioId: string): Promise<ApiResponse<Portfolio>> {
    return this.fetchWithAuth(`/api/trading/portfolios/${portfolioId}`, token);
  }

  /**
   * Get portfolio summary (balance, margin, P&L)
   */
  async getPortfolioSummary(token: string, portfolioId: string): Promise<ApiResponse<Portfolio>> {
    return this.fetchWithAuth(`/api/trading/portfolios/${portfolioId}/summary`, token);
  }

  /**
   * Create a new portfolio
   */
  async createPortfolio(token: string, data: { name?: string; initialBalance?: number; userId?: string }): Promise<ApiResponse<Portfolio>> {
    return this.fetchWithAuth("/api/trading/portfolios", token, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        initial_balance: data.initialBalance,
        user_id: data.userId,
      }),
    });
  }

  /**
   * Reset a portfolio (restore balance, clear positions, unstop if stopped)
   */
  async resetPortfolio(token: string, portfolioId: string): Promise<ApiResponse<Portfolio>> {
    return this.fetchWithAuth(`/api/trading/portfolios/${portfolioId}/reset`, token, {
      method: "POST",
    });
  }

  /**
   * Get portfolio holdings breakdown
   * Shows all assets held with allocation percentages
   */
  async getHoldings(token: string, portfolioId: string): Promise<ApiResponse<HoldingsResponse>> {
    return this.fetchWithAuth(`/api/trading/portfolios/${portfolioId}/holdings`, token);
  }

  /**
   * Get portfolio performance history
   * @param token Auth token
   * @param portfolioId Portfolio ID
   * @param range Time range: "1d", "1w", "1m", "3m", "1y", "all"
   */
  async getPerformance(token: string, portfolioId: string, range: string = "1m"): Promise<ApiResponse<PerformanceResponse>> {
    return this.fetchWithAuth(`/api/trading/portfolios/${portfolioId}/performance?range=${range}`, token);
  }

  /**
   * Get open positions for a portfolio
   */
  async getPositions(token: string, portfolioId: string): Promise<ApiResponse<Position[]>> {
    const response = await this.fetchWithAuth<ApiResponse<Position[]>>(`/api/trading/positions?portfolio_id=${portfolioId}`, token);
    // Add aliases for backward compatibility with UI components
    response.data = response.data.map(pos => ({
      ...pos,
      size: pos.quantity,
      markPrice: pos.currentPrice,
      unrealizedPnlPercent: pos.unrealizedPnlPct,
      margin: pos.marginUsed,
      liquidationPrice: pos.liquidationPrice ?? 0,
      roe: pos.unrealizedPnlPct,
    }));
    return response;
  }

  /**
   * Get a specific position
   */
  async getPosition(token: string, positionId: string): Promise<ApiResponse<Position>> {
    const response = await this.fetchWithAuth<ApiResponse<Position>>(`/api/trading/positions/${positionId}`, token);
    // Add aliases for backward compatibility
    response.data = {
      ...response.data,
      size: response.data.quantity,
      markPrice: response.data.currentPrice,
      unrealizedPnlPercent: response.data.unrealizedPnlPct,
      margin: response.data.marginUsed,
      liquidationPrice: response.data.liquidationPrice ?? 0,
      roe: response.data.unrealizedPnlPct,
    };
    return response;
  }

  /**
   * Get pending orders for a portfolio
   * @param status Filter by status: "open", "filled", "cancelled"
   */
  async getOrders(token: string, portfolioId: string, status: string = "open"): Promise<ApiResponse<Order[]>> {
    return this.fetchWithAuth(`/api/trading/orders?portfolio_id=${portfolioId}&status=${status}`, token);
  }

  /**
   * Get trade history for a portfolio
   * @param token Auth token
   * @param portfolioId Portfolio ID
   * @param limit Number of trades to return (default: 50, max: 500)
   */
  async getTrades(token: string, portfolioId: string, limit: number = 50): Promise<ApiResponse<Trade[]>> {
    return this.fetchWithAuth(`/api/trading/trades?portfolio_id=${portfolioId}&limit=${limit}`, token);
  }

  /**
   * Place an order
   */
  async placeOrder(token: string, order: PlaceOrderRequest): Promise<ApiResponse<PlaceOrderResponse>> {
    // Backend expects camelCase field names
    const requestBody = {
      portfolioId: order.portfolioId,
      symbol: order.symbol,
      assetClass: order.assetClass,
      side: order.side,
      orderType: order.orderType,
      quantity: order.quantity,
      price: order.price,
      stopPrice: order.stopPrice,
      trailAmount: order.trailAmount,
      trailPercent: order.trailPercent,
      timeInForce: order.timeInForce,
      leverage: order.leverage,
      stopLoss: order.stopLoss,
      takeProfit: order.takeProfit,
      reduceOnly: order.reduceOnly,
      postOnly: order.postOnly,
      marginMode: order.marginMode,
      bypassDrawdown: order.bypassDrawdown,
    };
    return this.fetchWithAuth("/api/trading/orders", token, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
  }

  /**
   * Cancel an order
   */
  async cancelOrder(token: string, orderId: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.fetchWithAuth(`/api/trading/orders/${orderId}`, token, {
      method: "DELETE",
    });
  }

  /**
   * Modify an existing order
   */
  async modifyOrder(
    token: string,
    orderId: string,
    changes: ModifyOrderRequest
  ): Promise<ApiResponse<Order>> {
    return this.fetchWithAuth(`/api/trading/orders/${orderId}`, token, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    });
  }

  /**
   * Cancel all pending orders for a portfolio
   * @param portfolioId Portfolio ID
   * @param symbol Optional - only cancel orders for this symbol
   */
  async cancelAllOrders(
    token: string,
    portfolioId: string,
    symbol?: string
  ): Promise<ApiResponse<CancelAllOrdersResponse>> {
    let url = `/api/trading/orders?portfolio_id=${portfolioId}`;
    if (symbol) url += `&symbol=${symbol}`;
    return this.fetchWithAuth(url, token, {
      method: "DELETE",
    });
  }

  /**
   * Close a position
   * @param price Optional closing price for limit close
   */
  async closePosition(token: string, positionId: string, price?: number): Promise<ApiResponse<Trade>> {
    const query = price ? `?price=${price}` : "";
    return this.fetchWithAuth(`/api/trading/positions/${positionId}${query}`, token, {
      method: "DELETE",
    });
  }

  /**
   * Modify a position (update stop loss, take profit)
   */
  async modifyPosition(
    token: string,
    positionId: string,
    changes: ModifyPositionRequest
  ): Promise<ApiResponse<Position>> {
    return this.fetchWithAuth(`/api/trading/positions/${positionId}`, token, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    });
  }

  /**
   * Add margin to an isolated position
   */
  async addMargin(
    token: string,
    positionId: string,
    amount: number
  ): Promise<ApiResponse<Position>> {
    return this.fetchWithAuth(`/api/trading/positions/${positionId}/margin`, token, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
  }

  // ========== Portfolio Settings API Methods ==========

  /**
   * Get portfolio settings (drawdown protection, etc.)
   */
  async getPortfolioSettings(
    token: string,
    portfolioId: string
  ): Promise<ApiResponse<PortfolioSettings>> {
    return this.fetchWithAuth(`/api/trading/portfolios/${portfolioId}/settings`, token);
  }

  /**
   * Update portfolio settings
   */
  async updatePortfolioSettings(
    token: string,
    portfolioId: string,
    settings: Partial<PortfolioSettings>
  ): Promise<ApiResponse<PortfolioSettings>> {
    return this.fetchWithAuth(`/api/trading/portfolios/${portfolioId}/settings`, token, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
  }

  /**
   * Get portfolio statistics (win rate, streaks, drawdown, etc.)
   */
  async getPortfolioStats(
    token: string,
    portfolioId: string
  ): Promise<ApiResponse<PortfolioStats>> {
    return this.fetchWithAuth(`/api/trading/portfolios/${portfolioId}/stats`, token);
  }

  /**
   * Get drawdown history for a portfolio
   * @param range Time range: "1d", "1w", "1m", "3m", "all"
   */
  async getDrawdownHistory(
    token: string,
    portfolioId: string,
    range: DrawdownHistoryRange = "1m"
  ): Promise<ApiResponse<DrawdownHistoryPoint[]>> {
    return this.fetchWithAuth(
      `/api/trading/portfolios/${portfolioId}/drawdown-history?range=${range}`,
      token
    );
  }

  // ========== Auth API Methods ==========

  /**
   * Get a challenge to sign for authentication
   */
  async getChallenge(): Promise<ApiResponse<AuthChallenge>> {
    return this.fetch("/api/auth/challenge");
  }

  /**
   * Verify a signed challenge and create a session
   */
  async verify(request: AuthRequest): Promise<ApiResponse<AuthResponse>> {
    return this.fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
  }

  /**
   * Get the current authenticated user's profile
   */
  async getMe(token: string): Promise<ApiResponse<Profile>> {
    return this.fetchWithAuth("/api/auth/me", token);
  }

  /**
   * Update the authenticated user's profile settings
   */
  async updateProfile(token: string, settings: ProfileSettings): Promise<ApiResponse<Profile>> {
    return this.fetchWithAuth("/api/auth/profile", token, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
  }

  /**
   * Update the authenticated user's username
   */
  async updateUsername(token: string, username: string): Promise<ApiResponse<Profile>> {
    return this.fetchWithAuth("/api/auth/profile/username", token, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
  }

  /**
   * Logout and invalidate the current session
   */
  async logout(token: string): Promise<void> {
    await this.fetchWithAuth("/api/auth/logout", token, {
      method: "POST",
    });
  }

  // ========== Order Book API Methods ==========

  /**
   * Get aggregated order book for a symbol across multiple exchanges
   * @param symbol Asset symbol (e.g., "btc", "eth")
   * @param depth Number of price levels to return (default: 50, max: 100)
   */
  async getOrderBook(symbol: string, depth: number = 50): Promise<OrderBookResponse> {
    return this.fetch(`/api/orderbook/${symbol.toLowerCase()}?depth=${depth}`);
  }

  // ========== Peer Mesh API Methods ==========

  /**
   * Get the current peer mesh status
   * Shows all connected servers and their latency info
   */
  async getPeers(): Promise<ApiResponse<PeerMeshResponse>> {
    return this.fetch("/api/peers");
  }

  // ========== Sync Monitoring API Methods ==========

  /**
   * Get node-local sync health status
   */
  async getSyncHealth(): Promise<SyncHealthResponse> {
    return this.fetch("/api/sync/health");
  }

  /**
   * Get a specific peer's status
   */
  async getPeer(peerId: string): Promise<ApiResponse<PeerStatus | null>> {
    return this.fetch(`/api/peers/${peerId}`);
  }

  // ========== Leaderboard API Methods ==========

  /**
   * Get the trading leaderboard
   * Shows top traders ranked by performance
   * @param timeframe Time period: "daily", "weekly", "monthly", "all_time"
   * @param limit Number of entries to return (default: 50, max: 100)
   */
  async getLeaderboard(
    timeframe: LeaderboardTimeframe = "weekly",
    limit: number = 50
  ): Promise<ApiResponse<LeaderboardResponse>> {
    return this.fetch(`/api/trading/leaderboard?timeframe=${timeframe}&limit=${limit}`);
  }

  /**
   * Get a specific trader's stats on the leaderboard
   * @param traderId Trader's public key or ID
   */
  async getTraderStats(traderId: string): Promise<ApiResponse<LeaderboardEntry>> {
    return this.fetch(`/api/trading/leaderboard/${traderId}`);
  }

  /**
   * Get current user's leaderboard rank (requires auth)
   */
  async getMyRank(token: string): Promise<ApiResponse<LeaderboardEntry & { rank: number }>> {
    return this.fetchWithAuth("/api/trading/leaderboard/me", token);
  }

  /**
   * Update leaderboard visibility (opt-in requires signing consent)
   * @param showOnLeaderboard Whether to show on leaderboard
   * @param signature Signature of consent message (required when opting in)
   * @param timestamp Timestamp included in consent message
   */
  async updateLeaderboardVisibility(
    token: string,
    showOnLeaderboard: boolean,
    signature?: string,
    timestamp?: number
  ): Promise<ApiResponse<Profile>> {
    return this.fetchWithAuth("/api/auth/profile/leaderboard", token, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        showOnLeaderboard,
        signature,
        timestamp: timestamp ?? Date.now(),
      }),
    });
  }

  // ========== Alerts API Methods ==========

  /**
   * Get all user alerts
   */
  async getAlerts(token: string): Promise<ApiResponse<Alert[]>> {
    return this.fetchWithAuth("/api/alerts", token);
  }

  /**
   * Create a new price alert
   */
  async createAlert(token: string, request: CreateAlertRequest): Promise<ApiResponse<Alert>> {
    return this.fetchWithAuth("/api/alerts", token, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
  }

  /**
   * Delete an alert
   */
  async deleteAlert(token: string, alertId: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.fetchWithAuth(`/api/alerts/${alertId}`, token, {
      method: "DELETE",
    });
  }

  // ========== Account API Methods ==========

  /**
   * Get account summary with margin info and risk level
   */
  async getAccountSummary(token: string): Promise<ApiResponse<AccountSummary>> {
    return this.fetchWithAuth("/api/account/summary", token);
  }

  /**
   * Get transaction history (deposits, withdrawals, fees, etc.)
   */
  async getTransactions(
    token: string,
    params?: TransactionHistoryParams
  ): Promise<ApiResponse<Transaction[]>> {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.set("type", params.type);
    if (params?.status) searchParams.set("status", params.status);
    if (params?.startTime) searchParams.set("startTime", String(params.startTime));
    if (params?.endTime) searchParams.set("endTime", String(params.endTime));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    const query = searchParams.toString();
    return this.fetchWithAuth(`/api/account/transactions${query ? `?${query}` : ""}`, token);
  }

  // ========== Trading Stats API Methods ==========

  /**
   * Get trading statistics for the user
   * @param timeframe Stats period: "today", "week", "month", "year", "all"
   */
  async getTradingStats(
    token: string,
    timeframe: TradingStatsTimeframe = "all"
  ): Promise<ApiResponse<TradingStats>> {
    return this.fetchWithAuth(`/api/account/stats?timeframe=${timeframe}`, token);
  }

  // ========== Funding Rate API Methods ==========

  /**
   * Get current funding rates for perpetual contracts
   * @param symbols Optional list of symbols to filter
   */
  async getFundingRates(symbols?: string[]): Promise<ApiResponse<FundingRate[]>> {
    const query = symbols?.length ? `?symbols=${symbols.join(",")}` : "";
    return this.fetch(`/api/market/funding${query}`);
  }

  /**
   * Get funding rate history for a symbol
   * @param symbol Asset symbol
   * @param limit Number of entries (default: 100)
   */
  async getFundingHistory(
    symbol: string,
    limit: number = 100
  ): Promise<ApiResponse<FundingHistory[]>> {
    return this.fetch(`/api/market/funding/${symbol.toLowerCase()}/history?limit=${limit}`);
  }

  // ========== Extended Trade History API Methods ==========

  /**
   * Get trade history with filtering options
   */
  async getTradeHistory(
    token: string,
    params?: TradeHistoryParams
  ): Promise<ApiResponse<Trade[]>> {
    const searchParams = new URLSearchParams();
    if (params?.symbol) searchParams.set("symbol", params.symbol);
    if (params?.side) searchParams.set("side", params.side);
    if (params?.startTime) searchParams.set("startTime", String(params.startTime));
    if (params?.endTime) searchParams.set("endTime", String(params.endTime));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.offset) searchParams.set("offset", String(params.offset));
    const query = searchParams.toString();
    return this.fetchWithAuth(`/api/trades${query ? `?${query}` : ""}`, token);
  }

  // ========== Developer / RAT API Methods ==========

  /**
   * Start the Random Auto Trader for a portfolio
   * @param portfolioId Portfolio to start RAT for
   * @param config Optional initial configuration overrides
   */
  async startRat(
    token: string,
    portfolioId: string,
    config?: RatConfigUpdate
  ): Promise<ApiResponse<RatState>> {
    return this.fetchWithAuth("/api/developer/rat/start", token, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ portfolioId, config }),
    });
  }

  /**
   * Stop the Random Auto Trader for a portfolio
   * @param portfolioId Portfolio to stop RAT for
   */
  async stopRat(token: string, portfolioId: string): Promise<ApiResponse<RatState>> {
    return this.fetchWithAuth("/api/developer/rat/stop", token, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ portfolioId }),
    });
  }

  /**
   * Get current RAT status for a portfolio
   * @param portfolioId Portfolio to get RAT status for
   */
  async getRatStatus(token: string, portfolioId: string): Promise<ApiResponse<RatState>> {
    return this.fetchWithAuth(`/api/developer/rat/status?portfolio_id=${portfolioId}`, token);
  }

  /**
   * Update RAT configuration for a portfolio
   * @param portfolioId Portfolio to update RAT config for
   * @param config Configuration updates to apply
   */
  async updateRatConfig(
    token: string,
    portfolioId: string,
    config: RatConfigUpdate
  ): Promise<ApiResponse<RatConfig>> {
    return this.fetchWithAuth("/api/developer/rat/config", token, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ portfolioId, config }),
    });
  }
}

// Default client instance
export const hauntClient = new HauntClient();

// Re-export for custom instances
export { HauntClient };
