import { test, expect } from '@playwright/test';

const TIME_RANGES = ['1H', '4H', '1D', '1W', '1M'] as const;
const ASSETS = [
  { id: 1, symbol: 'BTC', name: 'Bitcoin' },
  { id: 1027, symbol: 'ETH', name: 'Ethereum' },
];

test.describe('Chart Comparison Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Browser console error:', msg.text());
      }
    });
  });

  for (const asset of ASSETS) {
    test.describe(`${asset.name} (${asset.symbol})`, () => {
      test('captures chart at all time ranges', async ({ page }) => {
        await page.goto(`http://localhost:5173/asset/${asset.id}`);

        // Wait for initial chart to load
        await page.waitForTimeout(3000);

        for (const range of TIME_RANGES) {
          // Click the time range button
          const rangeButton = page.locator(`button:has-text("${range}")`).first();
          if (await rangeButton.isVisible()) {
            await rangeButton.click();
            await page.waitForTimeout(2000); // Wait for chart to update
          }

          // Take screenshot
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          await page.screenshot({
            path: `e2e/screenshots/${asset.symbol.toLowerCase()}-${range}-${timestamp}.png`,
            fullPage: true,
          });

          console.log(`Captured ${asset.symbol} ${range} chart`);
        }
      });

    });
  }

  test('visual comparison summary', async ({ page }) => {
    // Take screenshots of main dashboard for reference
    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: 'e2e/screenshots/dashboard-overview.png',
      fullPage: true,
    });

    // Navigate to BTC and capture different chart types
    await page.goto('http://localhost:5173/asset/1');
    await page.waitForTimeout(3000);

    // Area chart (default)
    await page.screenshot({
      path: 'e2e/screenshots/btc-area-chart.png',
      fullPage: true,
    });

    // Line chart
    const lineButton = page.locator('button:has-text("Line")');
    if (await lineButton.isVisible()) {
      await lineButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: 'e2e/screenshots/btc-line-chart.png',
        fullPage: true,
      });
    }

    // Candle chart
    const candleButton = page.locator('button:has-text("Candle")');
    if (await candleButton.isVisible()) {
      await candleButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: 'e2e/screenshots/btc-candle-chart.png',
        fullPage: true,
      });
    }

    // Enable SMA indicator
    const smaButton = page.locator('button:has-text("SMA")');
    if (await smaButton.isVisible()) {
      await smaButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: 'e2e/screenshots/btc-with-sma.png',
        fullPage: true,
      });
    }

    // Enable Bollinger Bands
    const bbButton = page.locator('button:has-text("BB")');
    if (await bbButton.isVisible()) {
      await bbButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: 'e2e/screenshots/btc-with-bollinger.png',
        fullPage: true,
      });
    }

    console.log('Chart comparison screenshots captured successfully');
  });
});
