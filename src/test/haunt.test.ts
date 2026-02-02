/**
 * Unit Tests for Haunt API Client
 *
 * Tests the haunt.ts service functions for API interactions.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { hauntClient, type MoverTimeframe, type Mover, type MoversResponse } from "../services/haunt";

describe("HauntClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getMovers", () => {
    it("should fetch movers with default parameters", async () => {
      const mockResponse: { data: MoversResponse; meta: { cached: boolean } } = {
        data: {
          timeframe: "1h",
          gainers: [
            { symbol: "BTC", price: 50000, changePercent: 5.25, volume24h: 1000000000 },
            { symbol: "SOL", price: 100, changePercent: 4.5 },
          ],
          losers: [
            { symbol: "ETH", price: 3000, changePercent: -3.5, volume24h: 500000000 },
          ],
          timestamp: Date.now(),
        },
        meta: { cached: false },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await hauntClient.getMovers();

      expect(global.fetch).toHaveBeenCalledWith("/api/market/movers?timeframe=1h&limit=10");
      expect(result.data.gainers).toHaveLength(2);
      expect(result.data.losers).toHaveLength(1);
      expect(result.data.timeframe).toBe("1h");
    });

    it("should fetch movers with custom timeframe", async () => {
      const mockResponse = {
        data: {
          timeframe: "24h",
          gainers: [],
          losers: [],
          timestamp: Date.now(),
        },
        meta: { cached: false },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await hauntClient.getMovers("24h" as MoverTimeframe);

      expect(global.fetch).toHaveBeenCalledWith("/api/market/movers?timeframe=24h&limit=10");
    });

    it("should fetch movers with custom limit", async () => {
      const mockResponse = {
        data: {
          timeframe: "1h",
          gainers: [],
          losers: [],
          timestamp: Date.now(),
        },
        meta: { cached: false },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await hauntClient.getMovers("5m" as MoverTimeframe, 20);

      expect(global.fetch).toHaveBeenCalledWith("/api/market/movers?timeframe=5m&limit=20");
    });

    it("should throw error on failed request", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      await expect(hauntClient.getMovers()).rejects.toThrow("Haunt API error");
    });
  });

  describe("getSymbolSourceStats", () => {
    it("should fetch source stats for a symbol", async () => {
      const mockResponse = {
        data: {
          symbol: "btc",
          sources: [
            { source: "binance", updateCount: 1500, updatePercent: 45.5, online: true },
            { source: "coinbase", updateCount: 1200, updatePercent: 36.4, online: true },
          ],
          totalUpdates: 2700,
          timestamp: Date.now(),
        },
        meta: { cached: false },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await hauntClient.getSymbolSourceStats("BTC");

      expect(global.fetch).toHaveBeenCalledWith("/api/market/source-stats/btc");
      expect(result.data.symbol).toBe("btc");
      expect(result.data.sources).toHaveLength(2);
    });

    it("should handle lowercase conversion", async () => {
      const mockResponse = {
        data: {
          symbol: "eth",
          sources: [],
          totalUpdates: 0,
          timestamp: Date.now(),
        },
        meta: { cached: false },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await hauntClient.getSymbolSourceStats("ETH");

      expect(global.fetch).toHaveBeenCalledWith("/api/market/source-stats/eth");
    });
  });

  describe("getListings", () => {
    it("should fetch listings with default parameters", async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            rank: 1,
            name: "Bitcoin",
            symbol: "BTC",
            price: 50000,
            change1h: 0.5,
            change24h: 2.0,
            change7d: 5.0,
            marketCap: 1000000000000,
            volume24h: 50000000000,
            circulatingSupply: 19500000,
            sparkline: [],
          },
        ],
        meta: { cached: false, total: 1 },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await hauntClient.getListings();

      expect(global.fetch).toHaveBeenCalledWith("/api/crypto/listings");
      expect(result.data).toHaveLength(1);
    });

    it("should include filter parameters", async () => {
      const mockResponse = {
        data: [],
        meta: { cached: false },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await hauntClient.getListings({
        start: 0,
        limit: 50,
        sort: "market_cap",
        sort_dir: "desc",
        filter: "gainers",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/crypto/listings?")
      );
    });
  });

  describe("getChart", () => {
    it("should fetch chart data with default range", async () => {
      const mockResponse = {
        data: {
          symbol: "btc",
          range: "1d",
          data: [
            { time: 1704067200, open: 50000, high: 51000, low: 49500, close: 50500 },
          ],
        },
        meta: { cached: false },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await hauntClient.getChart(1);

      expect(global.fetch).toHaveBeenCalledWith("/api/crypto/1/chart?range=1d");
      expect(result.data.data).toHaveLength(1);
    });

    it("should fetch chart data with custom range", async () => {
      const mockResponse = {
        data: {
          symbol: "btc",
          range: "1w",
          data: [],
        },
        meta: { cached: false },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await hauntClient.getChart(1, "1w");

      expect(global.fetch).toHaveBeenCalledWith("/api/crypto/1/chart?range=1w");
    });

    it("should handle seeding status in response", async () => {
      const mockResponse = {
        data: {
          symbol: "xmr",
          range: "1d",
          data: [],
          seeding: true,
          seedingStatus: "in_progress",
        },
        meta: { cached: false },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await hauntClient.getChart(328);

      expect(result.data.seeding).toBe(true);
      expect(result.data.seedingStatus).toBe("in_progress");
    });
  });

  describe("getFearGreed", () => {
    it("should fetch fear and greed index", async () => {
      const mockResponse = {
        data: {
          value: 65,
          classification: "Greed",
          timestamp: "2024-01-01T00:00:00Z",
        },
        meta: { cached: false },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await hauntClient.getFearGreed();

      expect(global.fetch).toHaveBeenCalledWith("/api/market/fear-greed");
      expect(result.data.value).toBe(65);
      expect(result.data.classification).toBe("Greed");
    });
  });

  describe("getGlobalMetrics", () => {
    it("should fetch global market metrics", async () => {
      const mockResponse = {
        data: {
          totalMarketCap: 2500000000000,
          totalVolume24h: 100000000000,
          btcDominance: 50.5,
          ethDominance: 15.2,
          activeCryptocurrencies: 10000,
          activeExchanges: 500,
          marketCapChange24h: 2.5,
          volumeChange24h: 1.2,
          lastUpdated: "2024-01-01T00:00:00Z",
        },
        meta: { cached: false },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await hauntClient.getGlobalMetrics();

      expect(global.fetch).toHaveBeenCalledWith("/api/market/global");
      expect(result.data.btcDominance).toBe(50.5);
    });
  });

  describe("health", () => {
    it("should check API health", async () => {
      const mockResponse = {
        status: "ok",
        timestamp: "2024-01-01T00:00:00Z",
        uptime: 86400,
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await hauntClient.health();

      expect(global.fetch).toHaveBeenCalledWith("/api/health");
      expect(result.status).toBe("ok");
    });
  });
});

describe("MoverTimeframe type", () => {
  it("should have correct values", () => {
    const validTimeframes: MoverTimeframe[] = ["1m", "5m", "15m", "1h", "4h", "24h"];

    validTimeframes.forEach((tf) => {
      expect(typeof tf).toBe("string");
    });
  });
});

describe("Mover type", () => {
  it("should have required fields", () => {
    const mover: Mover = {
      symbol: "BTC",
      price: 50000,
      changePercent: 5.0,
    };

    expect(mover.symbol).toBeDefined();
    expect(mover.price).toBeDefined();
    expect(mover.changePercent).toBeDefined();
  });

  it("should allow optional volume24h", () => {
    const moverWithVolume: Mover = {
      symbol: "BTC",
      price: 50000,
      changePercent: 5.0,
      volume24h: 1000000000,
    };

    expect(moverWithVolume.volume24h).toBe(1000000000);

    const moverWithoutVolume: Mover = {
      symbol: "ETH",
      price: 3000,
      changePercent: -2.5,
    };

    expect(moverWithoutVolume.volume24h).toBeUndefined();
  });
});
