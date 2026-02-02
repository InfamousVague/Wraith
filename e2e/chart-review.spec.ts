import { test, expect } from "@playwright/test";

test.describe("Chart Review - All Timespans and Types", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173");
    await page.waitForLoadState("networkidle");
  });

  test("Review BTC chart in all configurations", async ({ page }) => {
    // Click on Bitcoin (first crypto asset)
    await page.locator('[data-testid="market-filter-crypto"]').click();
    await page.waitForTimeout(2000);

    // Click on first row to open asset detail
    const btcRow = page.locator("text=Bitcoin").first();
    await btcRow.click();
    await page.waitForTimeout(3000);

    // Take screenshot of default chart (1D Area)
    await page.screenshot({ path: "test-screenshots/chart-btc-1d-area.png", fullPage: true });

    // Test each timespan with Area chart
    const timespans = ["1H", "4H", "1D", "1W", "1M"];

    for (const ts of timespans) {
      // Find and click the timespan button
      const tsButton = page.getByText(ts, { exact: true }).first();
      if (await tsButton.count() > 0) {
        await tsButton.click();
        await page.waitForTimeout(1500);
        await page.screenshot({ path: `test-screenshots/chart-btc-${ts.toLowerCase()}-area.png`, fullPage: true });
        console.log(`Screenshot: BTC ${ts} Area`);
      }
    }

    // Switch to Candle chart
    const candleButton = page.getByText("Candle").first();
    if (await candleButton.count() > 0) {
      await candleButton.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: "test-screenshots/chart-btc-candle-default.png", fullPage: true });
      console.log("Screenshot: BTC Candle default");

      // Test each timespan with Candle chart
      for (const ts of timespans) {
        const tsButton = page.getByText(ts, { exact: true }).first();
        if (await tsButton.count() > 0) {
          await tsButton.click();
          await page.waitForTimeout(1500);
          await page.screenshot({ path: `test-screenshots/chart-btc-${ts.toLowerCase()}-candle.png`, fullPage: true });
          console.log(`Screenshot: BTC ${ts} Candle`);
        }
      }
    }
  });

  test("Review stock chart (AAPL)", async ({ page }) => {
    // Click on Stocks filter
    await page.locator('[data-testid="market-filter-stock"]').click();
    await page.waitForTimeout(2000);

    // Click on Apple
    const aaplRow = page.locator("text=AAPL").first();
    if (await aaplRow.count() > 0) {
      await aaplRow.click();
      await page.waitForTimeout(3000);

      // Take screenshot of stock chart
      await page.screenshot({ path: "test-screenshots/chart-aapl-default.png", fullPage: true });
      console.log("Screenshot: AAPL default chart");

      // Test 1W timespan
      const weekButton = page.getByText("1W", { exact: true }).first();
      if (await weekButton.count() > 0) {
        await weekButton.click();
        await page.waitForTimeout(1500);
        await page.screenshot({ path: "test-screenshots/chart-aapl-1w.png", fullPage: true });
        console.log("Screenshot: AAPL 1W chart");
      }
    } else {
      console.log("AAPL not found in stocks list");
    }
  });

  test("Review pulse charts in asset list", async ({ page }) => {
    // Take screenshot of asset list with pulse charts
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "test-screenshots/asset-list-pulse-all.png", fullPage: true });
    console.log("Screenshot: Asset list with pulse charts (All)");

    // Switch to Crypto
    await page.locator('[data-testid="market-filter-crypto"]').click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "test-screenshots/asset-list-pulse-crypto.png", fullPage: true });
    console.log("Screenshot: Asset list with pulse charts (Crypto)");

    // Switch to Stocks
    await page.locator('[data-testid="market-filter-stock"]').click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "test-screenshots/asset-list-pulse-stocks.png", fullPage: true });
    console.log("Screenshot: Asset list with pulse charts (Stocks)");
  });
});
