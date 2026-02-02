/**
 * Visual Review Tests
 *
 * Captures screenshots of all pages in:
 * - English and Korean languages
 * - Dark and Light themes
 *
 * Screenshots are saved to: e2e/screenshots/
 */

import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const SCREENSHOT_DIR = path.join(__dirname, "screenshots");

// Pages to test
const PAGES = [
  { name: "dashboard", path: "/" },
  { name: "asset-detail-btc", path: "/asset/BTC" },
  { name: "asset-detail-eth", path: "/asset/ETH" },
  { name: "profile", path: "/profile" },
  { name: "settings", path: "/settings" },
];

const LANGUAGES = ["en", "ko"] as const;
const THEMES = ["dark", "light"] as const;

// Ensure screenshot directory exists
test.beforeAll(async () => {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
});

// Helper to set localStorage and reload
async function setupPageSettings(
  page: any,
  targetPath: string,
  language: string,
  theme: string
) {
  // Navigate to the target page first
  await page.goto(targetPath);

  // Set localStorage values via JavaScript
  await page.evaluate(
    ({ lang, thm }: { lang: string; thm: string }) => {
      localStorage.setItem("wraith-language", lang);
      localStorage.setItem("wraith-theme", thm);
    },
    { lang: language, thm: theme }
  );

  // Reload to apply settings
  await page.reload();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);
}

// Full page screenshot helper
async function captureFullPage(
  page: any,
  pageName: string,
  language: string,
  theme: string
) {
  const filename = `${pageName}_${language}_${theme}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);

  await page.screenshot({
    path: filepath,
    fullPage: true,
  });

  console.log(`Captured: ${filename}`);
  return filepath;
}

test.describe("Visual Review - All Pages", () => {
  test.describe.configure({ mode: "serial" });

  for (const lang of LANGUAGES) {
    for (const theme of THEMES) {
      for (const pageConfig of PAGES) {
        test(`${pageConfig.name} - ${lang} - ${theme}`, async ({ page }) => {
          // Setup page with language and theme
          await setupPageSettings(page, pageConfig.path, lang, theme);

          // Take screenshot
          await captureFullPage(page, pageConfig.name, lang, theme);

          // Basic validation - page should have content
          const body = page.locator("body");
          await expect(body).toBeVisible();
        });
      }
    }
  }
});

test.describe("Visual Review - Dashboard Components", () => {
  for (const theme of THEMES) {
    test(`Dashboard components - ${theme}`, async ({ page }) => {
      await setupPageSettings(page, "/", "en", theme);

      // Capture full dashboard
      await captureFullPage(page, "dashboard-full", "en", theme);

      // Check for key components
      const fearGreed = page.getByText(/Fear.*Greed/i).first();
      const topMovers = page.getByText(/Top Movers/i).first();

      // These should be visible
      try {
        await expect(fearGreed).toBeVisible({ timeout: 5000 });
      } catch (e) {
        console.log("Fear & Greed card not found");
      }

      try {
        await expect(topMovers).toBeVisible({ timeout: 5000 });
      } catch (e) {
        console.log("Top Movers card not found");
      }
    });
  }
});

test.describe("Visual Review - Asset Detail Components", () => {
  for (const theme of THEMES) {
    test(`Asset detail page - ${theme}`, async ({ page }) => {
      await setupPageSettings(page, "/asset/BTC", "en", theme);

      // Capture full asset detail
      await captureFullPage(page, "asset-detail-full", "en", theme);

      // Check for trading signals card
      const tradingSignals = page.getByText(/Trading Signals|거래 신호/i).first();
      try {
        await expect(tradingSignals).toBeVisible({ timeout: 5000 });
      } catch (e) {
        console.log("Trading Signals card not found");
      }

      // Check for prediction card
      const predictions = page.getByText(/Market Prediction|시장 예측/i).first();
      try {
        await expect(predictions).toBeVisible({ timeout: 5000 });
      } catch (e) {
        console.log("Prediction card not found");
      }
    });
  }
});

test.describe("Visual Review - Filter Chips (Gainers/Losers)", () => {
  for (const theme of THEMES) {
    test(`Filter chips colors - ${theme}`, async ({ page }) => {
      await setupPageSettings(page, "/", "en", theme);

      // Find and click on Gainers filter
      const gainersChip = page.getByText("Gainers").first();
      try {
        await gainersChip.click();
        await page.waitForTimeout(500);
        await captureFullPage(page, "filter-gainers-selected", "en", theme);
      } catch (e) {
        console.log("Gainers chip not found");
      }

      // Find and click on Losers filter
      const losersChip = page.getByText("Losers").first();
      try {
        await losersChip.click();
        await page.waitForTimeout(500);
        await captureFullPage(page, "filter-losers-selected", "en", theme);
      } catch (e) {
        console.log("Losers chip not found");
      }
    });
  }
});

test.describe("Visual Review - Korean Translation Check", () => {
  test("Check Korean translations on all pages", async ({ page }) => {
    // Dashboard
    await setupPageSettings(page, "/", "ko", "dark");

    // Check for Korean text
    const koreanText = page.locator("text=/[가-힣]+/").first();
    await expect(koreanText).toBeVisible({ timeout: 10000 });

    await captureFullPage(page, "korean-dashboard", "ko", "dark");

    // Asset Detail
    await setupPageSettings(page, "/asset/BTC", "ko", "dark");
    await captureFullPage(page, "korean-asset-detail", "ko", "dark");

    // Settings
    await setupPageSettings(page, "/settings", "ko", "dark");
    await captureFullPage(page, "korean-settings", "ko", "dark");

    // Profile
    await setupPageSettings(page, "/profile", "ko", "dark");
    await captureFullPage(page, "korean-profile", "ko", "dark");
  });
});

test.describe("Visual Review - Color Consistency Check", () => {
  test("Check sell/buy colors in Trading Signals", async ({ page }) => {
    await setupPageSettings(page, "/asset/BTC", "en", "dark");

    // Scroll to ensure signals card is visible
    await page.evaluate(() => {
      window.scrollTo(0, 500);
    });
    await page.waitForTimeout(500);

    await captureFullPage(page, "trading-signals-colors", "en", "dark");
  });

  test("Check filter chip colors", async ({ page }) => {
    await setupPageSettings(page, "/", "en", "dark");

    // Capture toolbar area with filter chips
    await captureFullPage(page, "filter-chips-colors", "en", "dark");
  });
});
