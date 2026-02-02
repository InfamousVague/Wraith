/**
 * UI Visual Tests with Screenshot Capture
 *
 * Captures screenshots of all UI states for documentation purposes.
 * Run with: npm run test:e2e -- e2e/ui-visual.spec.ts
 *
 * Screenshots are saved to: docs/screenshots/
 */

import { test, expect } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

const SCREENSHOT_DIR = "docs/screenshots";

// Ensure screenshot directory exists
test.beforeAll(async () => {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
});

test.describe("Dashboard Screenshots", () => {
  test("capture home page - full dashboard", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3000); // Wait for data to load

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "dashboard.png"),
      fullPage: true,
    });
  });

  test("capture home page - metrics carousel", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3000);

    // Capture just the top section with metrics
    const metricsSection = page.locator('[data-testid="metrics-carousel"]').first();

    // If no testid, capture the top portion of the page
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "metrics-carousel.png"),
      clip: { x: 0, y: 0, width: 1280, height: 400 },
    });
  });

  test("capture home page - asset list view", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3000);

    // Ensure List view is selected
    await page.getByText("List").click();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "asset-list.png"),
      fullPage: true,
    });
  });

  test("capture home page - charts view", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3000);

    // Switch to Charts view
    await page.getByText("Charts").click();
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "charts-view.png"),
      fullPage: true,
    });
  });

  test("capture top movers - gainers", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3000);

    // Ensure Gainers is selected
    await page.getByText("Gainers").first().click();
    await page.waitForTimeout(500);

    // Find and screenshot the top movers card
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "top-movers-gainers.png"),
      clip: { x: 0, y: 0, width: 1280, height: 500 },
    });
  });

  test("capture top movers - losers", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3000);

    // Click Losers tab
    await page.getByText("Losers").first().click();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "top-movers-losers.png"),
      clip: { x: 0, y: 0, width: 1280, height: 500 },
    });
  });
});

test.describe("Asset Detail Screenshots", () => {
  test("capture asset detail - Bitcoin", async ({ page }) => {
    await page.goto("/asset/1");
    await page.waitForTimeout(5000); // Wait for chart to load

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "asset-detail-bitcoin.png"),
      fullPage: true,
    });
  });

  test("capture asset detail - Ethereum", async ({ page }) => {
    await page.goto("/asset/1027");
    await page.waitForTimeout(5000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "asset-detail-ethereum.png"),
      fullPage: true,
    });
  });

  test("capture chart - 1 hour range", async ({ page }) => {
    await page.goto("/asset/1");
    await page.waitForTimeout(3000);

    // Click 1H range
    await page.getByText("1H", { exact: true }).first().click();
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "chart-1h.png"),
      fullPage: true,
    });
  });

  test("capture chart - 1 day range", async ({ page }) => {
    await page.goto("/asset/1");
    await page.waitForTimeout(3000);

    // Click 1D range
    await page.getByText("1D", { exact: true }).first().click();
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "chart-1d.png"),
      fullPage: true,
    });
  });

  test("capture chart - 1 week range", async ({ page }) => {
    await page.goto("/asset/1");
    await page.waitForTimeout(3000);

    // Click 1W range
    await page.getByText("1W", { exact: true }).first().click();
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "chart-1w.png"),
      fullPage: true,
    });
  });

  test("capture chart - 1 month range", async ({ page }) => {
    await page.goto("/asset/1");
    await page.waitForTimeout(3000);

    // Click 1M range
    await page.getByText("1M", { exact: true }).first().click();
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "chart-1m.png"),
      fullPage: true,
    });
  });
});

test.describe("Component State Screenshots", () => {
  test("capture loading state - chart", async ({ page }) => {
    // Navigate to a less common asset that might need seeding
    await page.goto("/asset/5426"); // Solana or similar

    // Capture immediately to catch loading state
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "loading-state-chart.png"),
      fullPage: true,
    });
  });

  test("capture trade indicators - buy", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(5000);

    // Look for a BUY indicator and capture the area
    const buyTag = page.getByText("BUY").first();

    try {
      await buyTag.waitFor({ timeout: 10000 });
      const boundingBox = await buyTag.boundingBox();

      if (boundingBox) {
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, "trade-indicator-buy.png"),
          clip: {
            x: Math.max(0, boundingBox.x - 200),
            y: Math.max(0, boundingBox.y - 20),
            width: 400,
            height: 60,
          },
        });
      }
    } catch {
      // BUY indicator might not be present in current market conditions
      console.log("No BUY indicators visible");
    }
  });

  test("capture trade indicators - sell", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(5000);

    // Look for a SELL indicator and capture the area
    const sellTag = page.getByText("SELL").first();

    try {
      await sellTag.waitFor({ timeout: 10000 });
      const boundingBox = await sellTag.boundingBox();

      if (boundingBox) {
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, "trade-indicator-sell.png"),
          clip: {
            x: Math.max(0, boundingBox.x - 200),
            y: Math.max(0, boundingBox.y - 20),
            width: 400,
            height: 60,
          },
        });
      }
    } catch {
      // SELL indicator might not be present in current market conditions
      console.log("No SELL indicators visible");
    }
  });

  test("capture search input", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(2000);

    // Focus on search input
    const searchInput = page.locator('input[placeholder*="Search"]').first();

    try {
      await searchInput.waitFor({ timeout: 5000 });
      await searchInput.click();
      await searchInput.fill("Bitcoin");
      await page.waitForTimeout(500);

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, "search-input.png"),
        clip: { x: 0, y: 0, width: 1280, height: 300 },
      });
    } catch {
      console.log("Search input not found or not interactable");
    }
  });
});

test.describe("Responsive Screenshots", () => {
  test("capture mobile view - dashboard", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X
    await page.goto("/");
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "mobile-dashboard.png"),
      fullPage: true,
    });
  });

  test("capture mobile view - asset detail", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/asset/1");
    await page.waitForTimeout(5000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "mobile-asset-detail.png"),
      fullPage: true,
    });
  });

  test("capture tablet view - dashboard", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto("/");
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "tablet-dashboard.png"),
      fullPage: true,
    });
  });
});

test.describe("Dark Mode Screenshots", () => {
  test.skip("capture dark mode - dashboard", async ({ page }) => {
    // This test assumes there's a theme toggle
    await page.goto("/");
    await page.waitForTimeout(2000);

    // Try to toggle dark mode
    const themeToggle = page.locator('[data-testid="theme-toggle"]').first();

    try {
      await themeToggle.click();
      await page.waitForTimeout(500);

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, "dark-mode-dashboard.png"),
        fullPage: true,
      });
    } catch {
      console.log("Theme toggle not found");
    }
  });
});
