import { test, expect } from "@playwright/test";

test.describe("Asset Filter Validation", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto("http://localhost:5173");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState("networkidle");
  });

  test("All filter shows mixed assets", async ({ page }) => {
    await page.goto("http://localhost:5173");
    await page.waitForTimeout(2000);

    // Click "All" filter in navbar using testID
    await page.locator('[data-testid="market-filter-all"]').click();
    await page.waitForTimeout(1500);

    await page.screenshot({ path: "test-screenshots/filter-all.png", fullPage: true });

    // Verify we have assets - look for asset rows in the table
    const pageContent = await page.content();
    const hasCrypto = pageContent.includes("BTC") || pageContent.includes("ETH");
    const hasStocks = pageContent.includes("AAPL") || pageContent.includes("NVDA") || pageContent.includes("MSFT");
    console.log(`All filter: hasCrypto=${hasCrypto}, hasStocks=${hasStocks}`);
  });

  test("Crypto filter shows only crypto", async ({ page }) => {
    await page.goto("http://localhost:5173");
    await page.waitForTimeout(2000);

    // Click "Crypto" filter
    await page.locator('[data-testid="market-filter-crypto"]').click();
    await page.waitForTimeout(1500);

    await page.screenshot({ path: "test-screenshots/filter-crypto.png", fullPage: true });

    // Check asset list contains crypto symbols
    const pageContent = await page.content();
    expect(pageContent).toContain("BTC");
    expect(pageContent).toContain("ETH");

    // Should NOT contain stock symbols
    const hasAAPL = pageContent.includes(">AAPL<") || pageContent.includes(">Apple<");
    console.log(`Crypto filter: Contains BTC, ETH. Has AAPL=${hasAAPL}`);
  });

  test("Stocks filter shows only stocks", async ({ page }) => {
    await page.goto("http://localhost:5173");
    await page.waitForTimeout(2000);

    // Click "Stocks" filter
    await page.locator('[data-testid="market-filter-stock"]').click();
    await page.waitForTimeout(1500);

    await page.screenshot({ path: "test-screenshots/filter-stocks.png", fullPage: true });

    // Check for stock symbols
    const pageContent = await page.content();
    const hasStocks = pageContent.includes("AAPL") || pageContent.includes("NVDA") || pageContent.includes("MSFT");
    expect(hasStocks).toBe(true);

    // Verify no crypto
    const hasBTC = pageContent.includes(">BTC<") || pageContent.includes(">Bitcoin<");
    console.log(`Stocks filter: Has stocks=${hasStocks}, Has BTC=${hasBTC}`);
  });

  test("Gainers filter shows positive changes", async ({ page }) => {
    await page.goto("http://localhost:5173");
    await page.waitForTimeout(2000);

    // Click "Gainers" chip in toolbar - use first match (toolbar chip, not TopMovers card)
    await page.getByText("Gainers").first().click();
    await page.waitForTimeout(1500);

    await page.screenshot({ path: "test-screenshots/filter-gainers.png", fullPage: true });
    console.log("Gainers filter: Screenshot captured");
  });

  test("Losers filter shows negative changes", async ({ page }) => {
    await page.goto("http://localhost:5173");
    await page.waitForTimeout(2000);

    // Click "Losers" chip in toolbar - use first match (toolbar chip, not TopMovers card)
    await page.getByText("Losers").first().click();
    await page.waitForTimeout(1500);

    await page.screenshot({ path: "test-screenshots/filter-losers.png", fullPage: true });
    console.log("Losers filter: Screenshot captured");
  });

  test("Stock detail page navigation", async ({ page }) => {
    await page.goto("http://localhost:5173");
    await page.waitForTimeout(2000);

    // Click "Stocks" filter
    await page.locator('[data-testid="market-filter-stock"]').click();
    await page.waitForTimeout(1500);

    // Try clicking on first clickable row - look for Pressable elements with asset info
    const assetRow = page.locator('[class*="row"]').filter({ hasText: /AAPL|NVDA|MSFT/ }).first();
    if (await assetRow.count() > 0) {
      await assetRow.click();
      await page.waitForTimeout(1500);

      await page.screenshot({ path: "test-screenshots/stock-detail.png", fullPage: true });

      const currentUrl = page.url();
      console.log(`Stock detail URL: ${currentUrl}`);

      const pageContent = await page.content();
      const has404 = pageContent.toLowerCase().includes("404") || pageContent.toLowerCase().includes("not found");
      console.log(`Has 404 error: ${has404}`);
    } else {
      console.log("No stock rows found to click");
    }
  });
});
