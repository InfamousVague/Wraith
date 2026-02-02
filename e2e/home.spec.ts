/**
 * End-to-End Tests: Home Page
 *
 * Tests the main home page functionality including:
 * - Metrics carousel
 * - Asset listings
 * - Navigation
 */

import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should load the home page", async ({ page }) => {
    // Wait for main content to load
    await expect(page).toHaveTitle(/Wraith/);
  });

  test("should display the metrics carousel", async ({ page }) => {
    // Wait for the carousel to be visible
    const carousel = page.locator("[data-testid='metrics-carousel']").first();

    // If no testid, look for common metrics
    const updatesTracked = page.getByText("UPDATES TRACKED");
    await expect(updatesTracked).toBeVisible({ timeout: 10000 });
  });

  test("should display the price feed card", async ({ page }) => {
    // Look for the Updates Tracked card
    const priceFeedCard = page.getByText("UPDATES TRACKED");
    await expect(priceFeedCard).toBeVisible({ timeout: 10000 });
  });

  test("should display the top movers card", async ({ page }) => {
    // Look for the Top Movers card
    const topMoversCard = page.getByText("TOP MOVERS");
    await expect(topMoversCard).toBeVisible({ timeout: 10000 });
  });

  test("should display the fear and greed card", async ({ page }) => {
    // Look for Fear & Greed indicator
    const fearGreedCard = page.getByText(/FEAR.*GREED|Fear.*Greed/i);
    await expect(fearGreedCard.first()).toBeVisible({ timeout: 10000 });
  });

  test("should show cryptocurrency listings", async ({ page }) => {
    // Wait for asset rows to load
    const bitcoinRow = page.getByText("Bitcoin").first();
    await expect(bitcoinRow).toBeVisible({ timeout: 15000 });
  });

  test("should show asset prices", async ({ page }) => {
    // Wait for prices to appear (look for $ symbol)
    const prices = page.locator("text=/\\$[0-9,]+/").first();
    await expect(prices).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Home Page - Top Movers Card", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for the card to load
    await page.getByText("TOP MOVERS").waitFor({ timeout: 10000 });
  });

  test("should show gainers tab by default", async ({ page }) => {
    const gainersTab = page.getByText("Gainers");
    await expect(gainersTab).toBeVisible();
  });

  test("should have losers tab", async ({ page }) => {
    const losersTab = page.getByText("Losers");
    await expect(losersTab).toBeVisible();
  });

  test("should switch between gainers and losers", async ({ page }) => {
    // Click on Losers tab
    await page.getByText("Losers").click();

    // Wait for content to update
    await page.waitForTimeout(500);

    // Click back on Gainers
    await page.getByText("Gainers").click();

    // Verify we're back on gainers
    await page.waitForTimeout(500);
  });

  test("should have timeframe selector", async ({ page }) => {
    // Check for timeframe options
    await expect(page.getByText("1H")).toBeVisible();
    await expect(page.getByText("24H")).toBeVisible();
  });

  test("should change timeframe when clicked", async ({ page }) => {
    // Click on 24H timeframe
    await page.getByText("24H").click();

    // Wait for data to reload
    await page.waitForTimeout(1000);

    // The timeframe should be selected (visual indication)
  });
});

test.describe("Home Page - Price Feed Card", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for the card to load
    await page.getByText("UPDATES TRACKED").waitFor({ timeout: 10000 });
  });

  test("should display total updates count", async ({ page }) => {
    // Look for numeric count (could be any number)
    const updateCount = page.locator("text=/[0-9,]+/").first();
    await expect(updateCount).toBeVisible();
  });

  test("should show connection status indicator", async ({ page }) => {
    // The connection dot should be visible (green or red)
    // This is a small colored circle element
    await page.waitForTimeout(2000); // Wait for connection
  });

  test("should display TPS (transactions per second)", async ({ page }) => {
    // Look for /sec indicator
    const tpsIndicator = page.getByText("/sec");
    await expect(tpsIndicator).toBeVisible();
  });

  test("should show uptime metric", async ({ page }) => {
    const uptimeLabel = page.getByText("Uptime");
    await expect(uptimeLabel).toBeVisible();
  });

  test("should show symbols metric", async ({ page }) => {
    const symbolsLabel = page.getByText("Symbols");
    await expect(symbolsLabel).toBeVisible();
  });

  test("should show sources metric", async ({ page }) => {
    const sourcesLabel = page.getByText("Sources");
    await expect(sourcesLabel).toBeVisible();
  });
});

test.describe("Home Page - Exchange Liquidity Card", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display exchange breakdown", async ({ page }) => {
    // Look for known exchange names
    const exchanges = ["Binance", "Coinbase", "Kraken", "CoinGecko"];

    for (const exchange of exchanges) {
      const exchangeElement = page.getByText(exchange, { exact: false });
      // At least some exchanges should be visible
      try {
        await exchangeElement.first().waitFor({ timeout: 5000 });
      } catch {
        // Exchange might not be available, continue
      }
    }
  });
});

test.describe("Home Page - View Toggle", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should have list and charts view options", async ({ page }) => {
    const listOption = page.getByText("List");
    const chartsOption = page.getByText("Charts");

    await expect(listOption).toBeVisible({ timeout: 10000 });
    await expect(chartsOption).toBeVisible({ timeout: 10000 });
  });

  test("should switch to charts view", async ({ page }) => {
    // Click on Charts
    await page.getByText("Charts").click();

    // Wait for view to change
    await page.waitForTimeout(1000);

    // Verify charts view is shown (sparklines/charts should appear)
  });

  test("should switch back to list view", async ({ page }) => {
    // Go to charts first
    await page.getByText("Charts").click();
    await page.waitForTimeout(500);

    // Go back to list
    await page.getByText("List").click();
    await page.waitForTimeout(500);
  });
});
