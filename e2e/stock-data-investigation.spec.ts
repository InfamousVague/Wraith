import { test, expect } from "@playwright/test";

test.describe("Stock Data Investigation", () => {
  test("check all stock prices and 7d changes", async ({ page }) => {
    // Navigate to dashboard with stock filter
    await page.goto("http://localhost:5173");

    // Wait for initial load
    await page.waitForTimeout(2000);

    // Click on Stocks filter in navbar to show only stocks
    const stocksFilter = page.locator('text="Stocks"').first();
    if (await stocksFilter.isVisible()) {
      await stocksFilter.click();
      await page.waitForTimeout(1000);
    }

    // Take a screenshot of the stocks view
    await page.screenshot({ path: "e2e/screenshots/stocks-overview.png", fullPage: true });

    // Get all asset rows from the list
    const assetRows = page.locator('[data-testid="asset-row"], [class*="assetRow"], tr').filter({
      has: page.locator('text=/AAPL|MSFT|GOOGL|NVDA|TSLA|AMZN|META|SPY|QQQ/'),
    });

    const rowCount = await assetRows.count();
    console.log(`\n=== Found ${rowCount} stock rows ===\n`);

    // If no rows found, try alternative selectors
    if (rowCount === 0) {
      console.log("No rows found with data-testid, checking page content...");
      const pageContent = await page.content();

      // Check for stock symbols in the page
      const stockSymbols = ["AAPL", "MSFT", "GOOGL", "NVDA", "TSLA", "AMZN", "META", "SPY", "QQQ"];
      for (const symbol of stockSymbols) {
        const found = pageContent.includes(symbol);
        console.log(`${symbol}: ${found ? "FOUND" : "NOT FOUND"} on page`);
      }
    }

    // Try to get data from the API directly
    console.log("\n=== Checking API directly ===\n");

    const apiResponse = await page.evaluate(async () => {
      const res = await fetch("http://localhost:3001/api/crypto/listings?asset_type=stock&limit=20");
      return res.json();
    });

    if (apiResponse?.data) {
      console.log("Stock data from API:");
      console.log("Symbol\t\tPrice\t\tChange24h\tChange7d\tVolume24h\tSparkline");
      console.log("-".repeat(90));

      for (const stock of apiResponse.data) {
        const sparklineLen = stock.sparkline?.length || 0;
        const change7d = stock.change7d?.toFixed(2) || "N/A";
        const change24h = stock.change24h?.toFixed(2) || "N/A";
        const volume = stock.volume24h?.toFixed(0) || "0";
        const price = stock.price?.toFixed(2) || "N/A";

        console.log(
          `${stock.symbol.padEnd(8)}\t$${price.padEnd(10)}\t${change24h}%\t\t${change7d}%\t\t${volume}\t\t${sparklineLen} pts`
        );
      }

      // Identify issues
      console.log("\n=== Issues Found ===\n");

      const noChange7d = apiResponse.data.filter((s: any) => s.change7d === 0 || s.change7d === null);
      const noVolume = apiResponse.data.filter((s: any) => s.volume24h === 0 || s.volume24h === null);
      const noSparkline = apiResponse.data.filter((s: any) => !s.sparkline || s.sparkline.length === 0);

      if (noChange7d.length > 0) {
        console.log(`Stocks missing 7d change: ${noChange7d.map((s: any) => s.symbol).join(", ")}`);
      }
      if (noVolume.length > 0) {
        console.log(`Stocks missing volume: ${noVolume.map((s: any) => s.symbol).join(", ")}`);
      }
      if (noSparkline.length > 0) {
        console.log(`Stocks missing sparkline: ${noSparkline.map((s: any) => s.symbol).join(", ")}`);
      }
    }
  });

  test("check which stocks are receiving Alpaca trades", async ({ page }) => {
    // Check the backend logs or price cache for trade activity
    console.log("\n=== Checking Alpaca subscription ===\n");
    console.log("Alpaca free tier subscribes to: AAPL, MSFT, GOOGL, AMZN, NVDA, TSLA, META, SPY, QQQ");
    console.log("Other stocks (JPM, V, JNJ, etc.) are NOT subscribed and won't receive real-time trades.\n");

    // Fetch stock data and check which ones have recent updates
    await page.goto("http://localhost:5173");

    const apiResponse = await page.evaluate(async () => {
      const res = await fetch("http://localhost:3001/api/crypto/listings?asset_type=stock&limit=30");
      return res.json();
    });

    if (apiResponse?.data) {
      const alpacaSymbols = ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA", "META", "SPY", "QQQ"];

      console.log("=== Alpaca-subscribed stocks ===");
      for (const stock of apiResponse.data.filter((s: any) => alpacaSymbols.includes(s.symbol))) {
        console.log(`${stock.symbol}: volume=${stock.volume24h}, sparkline=${stock.sparkline?.length || 0} pts`);
      }

      console.log("\n=== Non-Alpaca stocks (Finnhub REST only) ===");
      for (const stock of apiResponse.data.filter((s: any) => !alpacaSymbols.includes(s.symbol))) {
        console.log(`${stock.symbol}: volume=${stock.volume24h}, sparkline=${stock.sparkline?.length || 0} pts`);
      }
    }
  });

  test("investigate 7d change calculation", async ({ page }) => {
    console.log("\n=== Investigating 7d change calculation ===\n");

    await page.goto("http://localhost:5173");

    // Check chart data for a few stocks to see historical data availability
    const stocksToCheck = ["AAPL", "NVDA", "MSFT", "GOOGL"];

    for (const symbol of stocksToCheck) {
      // Find the stock's ID first
      const listingRes = await page.evaluate(async (sym) => {
        const res = await fetch(`http://localhost:3001/api/crypto/listings?asset_type=stock&limit=30`);
        const data = await res.json();
        return data.data?.find((s: any) => s.symbol === sym);
      }, symbol);

      if (listingRes?.id) {
        // Get chart data
        const chartRes = await page.evaluate(async (id) => {
          const res = await fetch(`http://localhost:3001/api/crypto/${id}/chart?range=1w`);
          return res.json();
        }, listingRes.id);

        const dataPoints = chartRes?.data?.data?.length || 0;
        const seedingStatus = chartRes?.data?.seedingStatus || "unknown";

        console.log(`${symbol} (ID: ${listingRes.id}):`);
        console.log(`  - Chart data points: ${dataPoints}`);
        console.log(`  - Seeding status: ${seedingStatus}`);
        console.log(`  - 7d change in listing: ${listingRes.change7d?.toFixed(2) || "N/A"}%`);
        console.log(`  - Has enough data for 7d calc: ${dataPoints >= 7 ? "YES" : "NO (need 7+ days)"}`);
        console.log("");
      }
    }
  });
});
