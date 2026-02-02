/**
 * End-to-End Tests: API Endpoints
 *
 * Direct tests against the Haunt backend API.
 * These tests verify API responses match expected schemas.
 */

import { test, expect } from "@playwright/test";

const API_BASE = "http://localhost:3001";

test.describe("API - Health Check", () => {
  test("GET /api/health should return ok status", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/health`);

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.status).toBe("ok");
    expect(data).toHaveProperty("timestamp");
    expect(data).toHaveProperty("uptime");
  });
});

test.describe("API - Market Endpoints", () => {
  test("GET /api/market/global should return global metrics", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/market/global`);

    expect(response.ok()).toBeTruthy();

    const json = await response.json();
    expect(json).toHaveProperty("data");
    expect(json).toHaveProperty("meta");

    const data = json.data;
    expect(data).toHaveProperty("totalMarketCap");
    expect(data).toHaveProperty("totalVolume24h");
    expect(data).toHaveProperty("btcDominance");
    expect(data).toHaveProperty("ethDominance");
    expect(data).toHaveProperty("activeCryptocurrencies");
    expect(data).toHaveProperty("activeExchanges");
    expect(data).toHaveProperty("marketCapChange24h");
    expect(data).toHaveProperty("lastUpdated");

    // Validate types
    expect(typeof data.totalMarketCap).toBe("number");
    expect(typeof data.btcDominance).toBe("number");
  });

  test("GET /api/market/fear-greed should return fear greed index", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/market/fear-greed`);

    expect(response.ok()).toBeTruthy();

    const json = await response.json();
    expect(json).toHaveProperty("data");

    const data = json.data;
    expect(data).toHaveProperty("value");
    expect(data).toHaveProperty("classification");
    expect(data).toHaveProperty("timestamp");

    // Value should be 0-100
    expect(data.value).toBeGreaterThanOrEqual(0);
    expect(data.value).toBeLessThanOrEqual(100);

    // Classification should be valid
    const validClassifications = ["Extreme Fear", "Fear", "Neutral", "Greed", "Extreme Greed"];
    expect(validClassifications).toContain(data.classification);
  });

  test("GET /api/market/stats should return aggregated stats", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/market/stats`);

    expect(response.ok()).toBeTruthy();

    const json = await response.json();
    expect(json).toHaveProperty("data");

    const data = json.data;
    expect(data).toHaveProperty("totalUpdates");
    expect(data).toHaveProperty("tps");
    expect(data).toHaveProperty("uptimeSecs");
    expect(data).toHaveProperty("activeSymbols");
    expect(data).toHaveProperty("onlineSources");
    expect(data).toHaveProperty("totalSources");
    expect(data).toHaveProperty("exchanges");

    // Validate constraints
    expect(data.tps).toBeGreaterThanOrEqual(0);
    expect(data.onlineSources).toBeLessThanOrEqual(data.totalSources);
    expect(Array.isArray(data.exchanges)).toBeTruthy();
  });

  test("GET /api/market/exchanges should return exchange stats", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/market/exchanges`);

    expect(response.ok()).toBeTruthy();

    const json = await response.json();
    expect(json).toHaveProperty("data");
    expect(Array.isArray(json.data)).toBeTruthy();

    if (json.data.length > 0) {
      const exchange = json.data[0];
      expect(exchange).toHaveProperty("name");
      expect(exchange).toHaveProperty("updateCount");
      expect(exchange).toHaveProperty("online");
    }
  });
});

test.describe("API - Movers Endpoint", () => {
  test("GET /api/market/movers should return top movers", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/market/movers`);

    expect(response.ok()).toBeTruthy();

    const json = await response.json();
    expect(json).toHaveProperty("data");

    const data = json.data;
    expect(data).toHaveProperty("timeframe");
    expect(data).toHaveProperty("gainers");
    expect(data).toHaveProperty("losers");
    expect(data).toHaveProperty("timestamp");

    expect(Array.isArray(data.gainers)).toBeTruthy();
    expect(Array.isArray(data.losers)).toBeTruthy();
  });

  test("GET /api/market/movers should accept timeframe parameter", async ({ request }) => {
    const timeframes = ["1m", "5m", "15m", "1h", "4h", "24h"];

    for (const tf of timeframes) {
      const response = await request.get(`${API_BASE}/api/market/movers?timeframe=${tf}`);
      expect(response.ok()).toBeTruthy();

      const json = await response.json();
      expect(json.data.timeframe).toBe(tf);
    }
  });

  test("GET /api/market/movers should accept limit parameter", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/market/movers?limit=5`);

    expect(response.ok()).toBeTruthy();

    const json = await response.json();
    expect(json.data.gainers.length).toBeLessThanOrEqual(5);
    expect(json.data.losers.length).toBeLessThanOrEqual(5);
  });

  test("GET /api/market/movers gainers should be sorted descending", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/market/movers`);
    const json = await response.json();

    const gainers = json.data.gainers;
    for (let i = 0; i < gainers.length - 1; i++) {
      expect(gainers[i].changePercent).toBeGreaterThanOrEqual(gainers[i + 1].changePercent);
    }
  });

  test("GET /api/market/movers losers should be sorted ascending", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/market/movers`);
    const json = await response.json();

    const losers = json.data.losers;
    for (let i = 0; i < losers.length - 1; i++) {
      expect(losers[i].changePercent).toBeLessThanOrEqual(losers[i + 1].changePercent);
    }
  });

  test("GET /api/market/movers should have valid mover structure", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/market/movers`);
    const json = await response.json();

    const allMovers = [...json.data.gainers, ...json.data.losers];

    for (const mover of allMovers) {
      expect(mover).toHaveProperty("symbol");
      expect(mover).toHaveProperty("price");
      expect(mover).toHaveProperty("changePercent");
      expect(typeof mover.symbol).toBe("string");
      expect(typeof mover.price).toBe("number");
      expect(typeof mover.changePercent).toBe("number");
    }
  });
});

test.describe("API - Symbol Source Stats Endpoint", () => {
  test("GET /api/market/source-stats/:symbol should return source stats", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/market/source-stats/btc`);

    expect(response.ok()).toBeTruthy();

    const json = await response.json();
    expect(json).toHaveProperty("data");

    const data = json.data;
    expect(data).toHaveProperty("symbol");
    expect(data).toHaveProperty("sources");
    expect(data).toHaveProperty("totalUpdates");
    expect(data).toHaveProperty("timestamp");

    expect(data.symbol).toBe("btc");
    expect(Array.isArray(data.sources)).toBeTruthy();
  });

  test("GET /api/market/source-stats/:symbol should handle uppercase", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/market/source-stats/BTC`);

    expect(response.ok()).toBeTruthy();

    const json = await response.json();
    // Symbol should be normalized to lowercase
    expect(json.data.symbol).toBe("btc");
  });

  test("GET /api/market/source-stats/:symbol sources should have valid structure", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/market/source-stats/btc`);
    const json = await response.json();

    for (const source of json.data.sources) {
      expect(source).toHaveProperty("source");
      expect(source).toHaveProperty("updateCount");
      expect(source).toHaveProperty("updatePercent");
      expect(source).toHaveProperty("online");

      expect(typeof source.source).toBe("string");
      expect(typeof source.updateCount).toBe("number");
      expect(typeof source.updatePercent).toBe("number");
      expect(typeof source.online).toBe("boolean");
    }
  });

  test("GET /api/market/source-stats/:symbol totalUpdates should match sum", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/market/source-stats/btc`);
    const json = await response.json();

    const sumOfUpdates = json.data.sources.reduce(
      (sum: number, s: { updateCount: number }) => sum + s.updateCount,
      0
    );

    expect(json.data.totalUpdates).toBe(sumOfUpdates);
  });
});

test.describe("API - Crypto Endpoints", () => {
  test("GET /api/crypto/listings should return asset listings", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/crypto/listings`);

    expect(response.ok()).toBeTruthy();

    const json = await response.json();
    expect(json).toHaveProperty("data");
    expect(Array.isArray(json.data)).toBeTruthy();

    if (json.data.length > 0) {
      const asset = json.data[0];
      expect(asset).toHaveProperty("id");
      expect(asset).toHaveProperty("name");
      expect(asset).toHaveProperty("symbol");
      expect(asset).toHaveProperty("price");
    }
  });

  test("GET /api/crypto/listings should support pagination", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/crypto/listings?start=0&limit=10`);

    expect(response.ok()).toBeTruthy();

    const json = await response.json();
    expect(json.data.length).toBeLessThanOrEqual(10);
  });

  test("GET /api/crypto/:id should return single asset", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/crypto/1`); // Bitcoin

    expect(response.ok()).toBeTruthy();

    const json = await response.json();
    expect(json).toHaveProperty("data");

    const data = json.data;
    expect(data.id).toBe(1);
    expect(data.symbol).toBe("BTC");
    expect(data.name).toBe("Bitcoin");
  });

  test("GET /api/crypto/:id/chart should return chart data", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/crypto/1/chart`);

    expect(response.ok()).toBeTruthy();

    const json = await response.json();
    expect(json).toHaveProperty("data");

    const data = json.data;
    expect(data).toHaveProperty("symbol");
    expect(data).toHaveProperty("range");
    expect(data).toHaveProperty("data");
    expect(Array.isArray(data.data)).toBeTruthy();
  });

  test("GET /api/crypto/:id/chart should support range parameter", async ({ request }) => {
    const ranges = ["1h", "4h", "1d", "1w", "1m"];

    for (const range of ranges) {
      const response = await request.get(`${API_BASE}/api/crypto/1/chart?range=${range}`);
      expect(response.ok()).toBeTruthy();

      const json = await response.json();
      expect(json.data.range).toBe(range);
    }
  });

  test("GET /api/crypto/:id/chart OHLC points should have valid structure", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/crypto/1/chart`);
    const json = await response.json();

    for (const point of json.data.data) {
      expect(point).toHaveProperty("time");
      expect(point).toHaveProperty("open");
      expect(point).toHaveProperty("high");
      expect(point).toHaveProperty("low");
      expect(point).toHaveProperty("close");

      // OHLC constraints
      expect(point.high).toBeGreaterThanOrEqual(point.low);
      expect(point.high).toBeGreaterThanOrEqual(point.open);
      expect(point.high).toBeGreaterThanOrEqual(point.close);
      expect(point.low).toBeLessThanOrEqual(point.open);
      expect(point.low).toBeLessThanOrEqual(point.close);
    }
  });

  test("GET /api/crypto/search should return search results", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/crypto/search?q=bitcoin`);

    expect(response.ok()).toBeTruthy();

    const json = await response.json();
    expect(json).toHaveProperty("data");
    expect(Array.isArray(json.data)).toBeTruthy();

    // Bitcoin should be in results
    const hasBitcoin = json.data.some(
      (asset: { name: string; symbol: string }) =>
        asset.name.toLowerCase().includes("bitcoin") ||
        asset.symbol.toLowerCase().includes("btc")
    );
    expect(hasBitcoin).toBeTruthy();
  });
});

test.describe("API - Error Handling", () => {
  test("should return 404 for non-existent asset", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/crypto/999999999`);

    // Either 404 or error in response
    if (!response.ok()) {
      expect(response.status()).toBe(404);
    } else {
      const json = await response.json();
      expect(json.error || json.data === null).toBeTruthy();
    }
  });

  test("should return 404 for invalid endpoint", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/nonexistent`);

    expect(response.status()).toBe(404);
  });

  test("should handle invalid query parameters gracefully", async ({ request }) => {
    // Invalid timeframe should use default
    const response = await request.get(`${API_BASE}/api/market/movers?timeframe=invalid`);

    expect(response.ok()).toBeTruthy();

    const json = await response.json();
    // Should fall back to default (1h)
    expect(json.data.timeframe).toBe("1h");
  });
});
