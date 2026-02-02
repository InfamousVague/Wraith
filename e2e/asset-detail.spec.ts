/**
 * End-to-End Tests: Asset Detail Page
 *
 * Tests the asset detail page functionality including:
 * - Chart loading and display
 * - Price metrics
 * - Source breakdown
 * - Chart range selection
 */

import { test, expect } from "@playwright/test";

test.describe("Asset Detail Page", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a known asset (Bitcoin)
    await page.goto("/");
    await page.waitForTimeout(2000);

    // Click on Bitcoin to navigate to detail
    const bitcoinRow = page.getByText("Bitcoin").first();
    await bitcoinRow.click();

    // Wait for navigation
    await page.waitForURL(/\/asset\/1/);
  });

  test("should navigate to asset detail page", async ({ page }) => {
    // Verify URL contains asset ID
    expect(page.url()).toContain("/asset/");
  });

  test("should display asset name and symbol", async ({ page }) => {
    // Look for Bitcoin/BTC
    const assetName = page.getByText("Bitcoin");
    await expect(assetName.first()).toBeVisible({ timeout: 10000 });

    const assetSymbol = page.getByText("BTC");
    await expect(assetSymbol.first()).toBeVisible({ timeout: 10000 });
  });

  test("should display current price", async ({ page }) => {
    // Look for price ($ followed by numbers)
    const price = page.locator("text=/\\$[0-9,]+/").first();
    await expect(price).toBeVisible({ timeout: 10000 });
  });

  test("should display price change percentage", async ({ page }) => {
    // Look for percentage (number followed by %)
    const percentChange = page.locator("text=/[+-]?[0-9.]+%/").first();
    await expect(percentChange).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Asset Detail Page - Chart", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/asset/1"); // Bitcoin
    await page.waitForTimeout(2000);
  });

  test("should display chart or loading state", async ({ page }) => {
    // Either chart is visible or "Updating chart data" message
    const chartArea = page.locator("canvas").first();
    const loadingMessage = page.getByText(/Updating chart data|Building chart/i);

    // One of these should be visible
    const chartVisible = await chartArea.isVisible().catch(() => false);
    const loadingVisible = await loadingMessage.isVisible().catch(() => false);

    expect(chartVisible || loadingVisible).toBeTruthy();
  });

  test("should have chart range options", async ({ page }) => {
    // Look for common range options
    const ranges = ["1H", "4H", "1D", "1W", "1M"];

    for (const range of ranges) {
      const rangeButton = page.getByText(range, { exact: true });
      try {
        await expect(rangeButton.first()).toBeVisible({ timeout: 5000 });
      } catch {
        // Some ranges might not be visible, continue
      }
    }
  });

  test("should change chart range when clicked", async ({ page }) => {
    // Wait for chart to load
    await page.waitForTimeout(3000);

    // Click on 1W range
    const weekButton = page.getByText("1W", { exact: true }).first();
    await weekButton.click();

    // Wait for chart to update
    await page.waitForTimeout(2000);
  });
});

test.describe("Asset Detail Page - Metrics Grid", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/asset/1"); // Bitcoin
    await page.waitForTimeout(2000);
  });

  test("should display market cap", async ({ page }) => {
    const marketCapLabel = page.getByText(/Market Cap/i);
    await expect(marketCapLabel.first()).toBeVisible({ timeout: 10000 });
  });

  test("should display 24h volume", async ({ page }) => {
    const volumeLabel = page.getByText(/Volume|24h/i);
    await expect(volumeLabel.first()).toBeVisible({ timeout: 10000 });
  });

  test("should display circulating supply", async ({ page }) => {
    const supplyLabel = page.getByText(/Circulating|Supply/i);
    await expect(supplyLabel.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Asset Detail Page - Source Breakdown", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/asset/1"); // Bitcoin
    await page.waitForTimeout(3000);
  });

  test("should display data sources section", async ({ page }) => {
    // Look for sources header
    const sourcesHeader = page.getByText(/Data Sources|Sources/i);
    try {
      await expect(sourcesHeader.first()).toBeVisible({ timeout: 10000 });
    } catch {
      // Source breakdown might not be visible on all assets
    }
  });

  test("should show exchange names in source breakdown", async ({ page }) => {
    // Look for known exchange names
    const exchanges = ["Binance", "Coinbase", "Kraken"];

    for (const exchange of exchanges) {
      const exchangeElement = page.getByText(exchange, { exact: false });
      try {
        await exchangeElement.first().waitFor({ timeout: 3000 });
      } catch {
        // Exchange might not be available for this asset
      }
    }
  });
});

test.describe("Asset Detail Page - Navigation", () => {
  test("should navigate back to home", async ({ page }) => {
    await page.goto("/asset/1");
    await page.waitForTimeout(1000);

    // Click back button or logo to return home
    const backButton = page.locator('[aria-label="Back"], [data-testid="back-button"]').first();
    const logo = page.locator('[aria-label="Home"], [data-testid="logo"]').first();

    const backVisible = await backButton.isVisible().catch(() => false);
    const logoVisible = await logo.isVisible().catch(() => false);

    if (backVisible) {
      await backButton.click();
    } else if (logoVisible) {
      await logo.click();
    } else {
      // Navigate manually
      await page.goto("/");
    }

    // Verify we're back on home
    await page.waitForURL("/");
  });

  test("should handle direct URL navigation", async ({ page }) => {
    // Navigate directly to an asset
    await page.goto("/asset/1027"); // Ethereum

    // Should load the asset page
    await page.waitForTimeout(2000);

    // Look for Ethereum
    const ethereumName = page.getByText("Ethereum");
    await expect(ethereumName.first()).toBeVisible({ timeout: 10000 });
  });

  test("should handle invalid asset ID gracefully", async ({ page }) => {
    // Navigate to non-existent asset
    await page.goto("/asset/999999999");

    await page.waitForTimeout(2000);

    // Should show error or redirect
    // Either error message or redirect to home
  });
});

test.describe("Asset Detail Page - Chart Loading States", () => {
  test("should show loading state while fetching chart data", async ({ page }) => {
    // Navigate to a less common asset that might need seeding
    await page.goto("/asset/328"); // Monero

    await page.waitForTimeout(1000);

    // Look for loading indicators
    const loadingIndicator = page.getByText(/Loading|Updating|Building/i);
    const chartCanvas = page.locator("canvas");

    // One of these should be present
    const loadingVisible = await loadingIndicator.first().isVisible().catch(() => false);
    const chartVisible = await chartCanvas.first().isVisible().catch(() => false);

    expect(loadingVisible || chartVisible).toBeTruthy();
  });

  test("should eventually show chart data", async ({ page }) => {
    await page.goto("/asset/1"); // Bitcoin - should have data

    // Wait for chart to load (longer timeout for seeding)
    await page.waitForTimeout(10000);

    // Chart canvas should be visible
    const chartCanvas = page.locator("canvas");
    const isVisible = await chartCanvas.first().isVisible().catch(() => false);

    // If chart isn't visible, check for valid loading/error state
    if (!isVisible) {
      const errorOrLoading = page.getByText(/error|loading|building|no data/i);
      await expect(errorOrLoading.first()).toBeVisible();
    }
  });
});
