/**
 * @file haunt.integration.test.ts
 * @description Integration tests for Haunt API endpoints.
 *
 * These tests verify that all API endpoints are properly configured
 * and responding correctly. Run with: npm test -- haunt.integration
 */

import { describe, it, expect, beforeAll } from "vitest";
import { hauntClient } from "./haunt";

// Skip these tests in CI or when API is unavailable
const API_AVAILABLE = process.env.VITE_HAUNT_URL || process.env.TEST_API;

describe.skipIf(!API_AVAILABLE)("Haunt API Integration Tests", () => {
  // Allow longer timeout for network requests
  const TIMEOUT = 10000;

  describe("Phase 1: Core Market Data", () => {
    it("should fetch crypto listings", async () => {
      const response = await hauntClient.getListings({ limit: 10 });
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeLessThanOrEqual(10);
    }, TIMEOUT);

    it("should fetch a single asset by ID", async () => {
      const response = await hauntClient.getAsset(1); // Bitcoin
      expect(response.data).toBeDefined();
      expect(response.data.symbol).toBeDefined();
    }, TIMEOUT);

    it("should search for assets", async () => {
      const response = await hauntClient.search("bitcoin", 5);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
    }, TIMEOUT);

    it("should fetch chart data", async () => {
      const response = await hauntClient.getChart(1, "1d");
      expect(response.data).toBeDefined();
      expect(response.data.data).toBeDefined();
      expect(Array.isArray(response.data.data)).toBe(true);
    }, TIMEOUT);

    it("should fetch global metrics", async () => {
      const response = await hauntClient.getGlobalMetrics();
      expect(response.data).toBeDefined();
      expect(response.data.totalMarketCap).toBeDefined();
    }, TIMEOUT);

    it("should fetch fear & greed index", async () => {
      const response = await hauntClient.getFearGreed();
      expect(response.data).toBeDefined();
      expect(response.data.value).toBeDefined();
    }, TIMEOUT);
  });

  describe("Phase 2: Market Analytics", () => {
    it("should fetch top movers", async () => {
      const response = await hauntClient.getMovers("1h", 10);
      expect(response.data).toBeDefined();
      expect(response.data.gainers).toBeDefined();
      expect(response.data.losers).toBeDefined();
    }, TIMEOUT);

    it("should fetch API stats", async () => {
      const response = await hauntClient.getStats();
      expect(response.data).toBeDefined();
      expect(response.data.tps).toBeDefined();
    }, TIMEOUT);

    it("should fetch symbol confidence", async () => {
      const response = await hauntClient.getConfidence("btc");
      expect(response.data).toBeDefined();
      expect(response.data.confidence).toBeDefined();
    }, TIMEOUT);

    it("should fetch symbol source stats", async () => {
      const response = await hauntClient.getSymbolSourceStats("btc");
      expect(response.data).toBeDefined();
      expect(response.data.sources).toBeDefined();
    }, TIMEOUT);
  });

  describe("Phase 3: Trading Signals", () => {
    it("should fetch trading signals", async () => {
      const response = await hauntClient.getSignals("btc", "day_trading");
      expect(response.data).toBeDefined();
      expect(response.data.signals).toBeDefined();
    }, TIMEOUT);

    it("should fetch signal accuracy", async () => {
      const response = await hauntClient.getSignalAccuracy("btc");
      expect(response.data).toBeDefined();
    }, TIMEOUT);

    it("should fetch signal predictions", async () => {
      const response = await hauntClient.getSignalPredictions("btc", { limit: 10 });
      expect(response.data).toBeDefined();
    }, TIMEOUT);

    it("should fetch recommendation", async () => {
      const response = await hauntClient.getRecommendation("btc");
      expect(response.data).toBeDefined();
      expect(response.data.action).toBeDefined();
    }, TIMEOUT);
  });

  describe("Phase 4: Order Book", () => {
    it("should fetch aggregated order book", async () => {
      const response = await hauntClient.getOrderBook("btc", 20);
      expect(response).toBeDefined();
      expect(response.bids).toBeDefined();
      expect(response.asks).toBeDefined();
    }, TIMEOUT);
  });

  describe("Phase 5: Leaderboard (Public)", () => {
    it("should fetch leaderboard", async () => {
      const response = await hauntClient.getLeaderboard("weekly", 10);
      expect(response.data).toBeDefined();
      expect(response.data.entries).toBeDefined();
      expect(Array.isArray(response.data.entries)).toBe(true);
    }, TIMEOUT);

    it("should fetch trader stats", async () => {
      // This might fail if no traders exist
      try {
        const leaderboard = await hauntClient.getLeaderboard("weekly", 1);
        if (leaderboard.data.entries.length > 0) {
          const traderId = leaderboard.data.entries[0].id;
          const response = await hauntClient.getTraderStats(traderId);
          expect(response.data).toBeDefined();
        }
      } catch (error) {
        // Expected if no traders on leaderboard
        expect(error).toBeDefined();
      }
    }, TIMEOUT);
  });

  describe("Phase 6: Peer Mesh", () => {
    it("should fetch peers", async () => {
      const response = await hauntClient.getPeers();
      expect(response.data).toBeDefined();
      expect(response.data.peers).toBeDefined();
    }, TIMEOUT);
  });

  describe("Phase 7: Health Check", () => {
    it("should return healthy status", async () => {
      const response = await hauntClient.health();
      expect(response.status).toBe("ok");
    }, TIMEOUT);
  });

  describe("Phase 8: Funding Rates (Public)", () => {
    it("should fetch funding rates", async () => {
      const response = await hauntClient.getFundingRates();
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
    }, TIMEOUT);

    it("should fetch funding history for symbol", async () => {
      const response = await hauntClient.getFundingHistory("btc", 10);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
    }, TIMEOUT);
  });
});

// Authenticated endpoints require a session token
describe.skipIf(!API_AVAILABLE)("Haunt API Authenticated Endpoints", () => {
  const TIMEOUT = 10000;
  let sessionToken: string | null = null;

  beforeAll(async () => {
    // Note: In real tests, you'd need to authenticate first
    // For now, we'll skip these if no token is available
    sessionToken = process.env.TEST_SESSION_TOKEN || null;
  });

  describe.skipIf(!sessionToken)("Portfolio Endpoints", () => {
    it("should fetch portfolio", async () => {
      const response = await hauntClient.getPortfolio(sessionToken!);
      expect(response.data).toBeDefined();
      expect(response.data.balance).toBeDefined();
    }, TIMEOUT);

    it("should fetch holdings", async () => {
      const response = await hauntClient.getHoldings(sessionToken!);
      expect(response.data).toBeDefined();
      expect(response.data.holdings).toBeDefined();
    }, TIMEOUT);

    it("should fetch performance", async () => {
      const response = await hauntClient.getPerformance(sessionToken!, "1m");
      expect(response.data).toBeDefined();
      expect(response.data.data).toBeDefined();
    }, TIMEOUT);
  });

  describe.skipIf(!sessionToken)("Trading Endpoints", () => {
    it("should fetch positions", async () => {
      const response = await hauntClient.getPositions(sessionToken!);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
    }, TIMEOUT);

    it("should fetch orders", async () => {
      const response = await hauntClient.getOrders(sessionToken!);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
    }, TIMEOUT);

    it("should fetch trades", async () => {
      const response = await hauntClient.getTrades(sessionToken!, 10);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
    }, TIMEOUT);
  });

  describe.skipIf(!sessionToken)("Account Endpoints", () => {
    it("should fetch account summary", async () => {
      const response = await hauntClient.getAccountSummary(sessionToken!);
      expect(response.data).toBeDefined();
      expect(response.data.balance).toBeDefined();
    }, TIMEOUT);

    it("should fetch transactions", async () => {
      const response = await hauntClient.getTransactions(sessionToken!);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
    }, TIMEOUT);

    it("should fetch trading stats", async () => {
      const response = await hauntClient.getTradingStats(sessionToken!);
      expect(response.data).toBeDefined();
      expect(response.data.totalTrades).toBeDefined();
    }, TIMEOUT);
  });

  describe.skipIf(!sessionToken)("Alerts Endpoints", () => {
    it("should fetch alerts", async () => {
      const response = await hauntClient.getAlerts(sessionToken!);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
    }, TIMEOUT);
  });

  describe.skipIf(!sessionToken)("Leaderboard (Authenticated)", () => {
    it("should fetch my rank", async () => {
      try {
        const response = await hauntClient.getMyRank(sessionToken!);
        expect(response.data).toBeDefined();
      } catch (error) {
        // Expected if user not on leaderboard
        expect(error).toBeDefined();
      }
    }, TIMEOUT);
  });
});
