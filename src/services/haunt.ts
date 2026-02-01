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

export type ListingsParams = {
  start?: number;
  limit?: number;
  sort?:
    | "market_cap"
    | "name"
    | "symbol"
    | "date_added"
    | "price"
    | "volume_24h"
    | "percent_change_24h"
    | "percent_change_7d";
  sort_dir?: "asc" | "desc";
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
   * Get cryptocurrency listings
   */
  async getListings(params: ListingsParams = {}): Promise<ApiResponse<Asset[]>> {
    const searchParams = new URLSearchParams();
    if (params.start) searchParams.set("start", String(params.start));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.sort) searchParams.set("sort", params.sort);
    if (params.sort_dir) searchParams.set("sort_dir", params.sort_dir);

    const query = searchParams.toString();
    return this.fetch(`/api/crypto/listings${query ? `?${query}` : ""}`);
  }

  /**
   * Get a single cryptocurrency by ID
   */
  async getAsset(id: number): Promise<ApiResponse<Asset>> {
    return this.fetch(`/api/crypto/${id}`);
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
   * Health check
   */
  async health(): Promise<{
    status: string;
    timestamp: string;
    uptime: number;
  }> {
    return this.fetch("/api/health");
  }
}

// Default client instance
export const hauntClient = new HauntClient();

// Re-export for custom instances
export { HauntClient };
