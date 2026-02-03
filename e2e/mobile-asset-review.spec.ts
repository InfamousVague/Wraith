import { test, expect } from '@playwright/test';

/**
 * Mobile Asset Detail Page Review
 *
 * Captures screenshots of the asset detail page at mobile viewport
 * to review and improve mobile layout.
 */

const MOBILE_VIEWPORT = { width: 390, height: 844 }; // iPhone 12
const SCREENSHOT_DIR = 'e2e/screenshots/mobile-review';

test.describe('Mobile Asset Detail Review', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize(MOBILE_VIEWPORT);
  });

  test('capture full asset detail page on mobile', async ({ page }) => {
    // Capture console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    page.on('pageerror', error => {
      errors.push(`Page error: ${error.message}`);
    });

    // Navigate to home first
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    console.log('Page loaded, URL:', page.url());

    // Wait for any content to appear
    await page.waitForTimeout(3000);

    // Check what's on the page
    const html = await page.content();
    console.log('Page HTML length:', html.length);
    console.log('Has root div:', html.includes('id="root"'));

    // Try to find asset links
    const links = await page.locator('a').count();
    console.log('Total links on page:', links);

    // Wait for asset links to appear (data loaded)
    try {
      await page.waitForSelector('a[href^="/asset/"]', { timeout: 10000 });
      console.log('Found asset links!');
    } catch {
      console.log('No asset links found after 10s');
      console.log('Console errors:', errors);
      // Capture whatever is there
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/debug-homepage.png`,
        fullPage: true,
      });
      return;
    }

    // Click first asset
    const firstAsset = page.locator('a[href^="/asset/"]').first();
    await firstAsset.click();

    // Wait for asset detail page to load
    await page.waitForURL(/\/asset\/\d+/);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Get visible text on page
    const bodyText = await page.locator('body').innerText();
    console.log('Body text preview:', bodyText.slice(0, 500));

    // Capture full page screenshot
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/asset-detail-full.png`,
      fullPage: true,
    });

    // Also capture visible viewport only (no fullPage)
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/asset-detail-viewport.png`,
    });

    console.log('Console errors:', errors);

    // Find cards by their visual appearance (border-radius, background)
    // Ghost Card component renders with specific styles
    const cardSelector = '[class*="Card"], [class*="card"]';
    const cards = await page.locator(cardSelector).all();

    console.log(`\n=== Mobile Layout Analysis ===`);
    console.log(`Viewport: ${MOBILE_VIEWPORT.width}x${MOBILE_VIEWPORT.height}`);
    console.log(`Found ${cards.length} card-like elements`);

    // Analyze all visible elements with significant width
    const allElements = await page.locator('div').all();
    let cardCount = 0;

    for (const el of allElements) {
      const box = await el.boundingBox();
      if (box && box.width > MOBILE_VIEWPORT.width * 0.8 && box.height > 100) {
        cardCount++;
        const isEdgeToEdge = box.x <= 12;
        const widthPercent = ((box.width / MOBILE_VIEWPORT.width) * 100).toFixed(1);
        if (cardCount <= 10) { // Limit output
          console.log(`Element ${cardCount}: x=${box.x.toFixed(0)}, width=${box.width.toFixed(0)} (${widthPercent}%), edge-to-edge: ${isEdgeToEdge}`);
        }
      }
    }
    console.log(`Total large elements found: ${cardCount}`);
  });

  test('analyze individual sections', async ({ page }) => {
    // Navigate to asset detail
    await page.goto('/');
    await page.waitForSelector('a[href^="/asset/"]', { timeout: 30000 });
    await page.locator('a[href^="/asset/"]').first().click();
    await page.waitForURL(/\/asset\/\d+/);
    await page.waitForSelector('.tv-lightweight-charts', { timeout: 15000 });
    await page.waitForTimeout(1000);

    // Screenshot each section using more flexible selectors
    const sections = [
      { name: 'chart', selector: '.tv-lightweight-charts' },
      { name: 'chart-container', selector: '[data-testid="advanced-chart"]' },
    ];

    console.log('\n=== Section Analysis ===');

    for (const section of sections) {
      const element = page.locator(section.selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.screenshot({
          path: `${SCREENSHOT_DIR}/section-${section.name}.png`,
        });
        const box = await element.boundingBox();
        if (box) {
          console.log(`${section.name}: x=${box.x.toFixed(0)}, width=${box.width.toFixed(0)}, height=${box.height.toFixed(0)}`);
        }
      } else {
        console.log(`${section.name}: NOT VISIBLE`);
      }
    }

    // Take viewport screenshot (visible area only)
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/viewport-top.png`,
    });

    // Scroll to middle and screenshot
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/viewport-middle.png`,
    });

    // Scroll to bottom and screenshot
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/viewport-bottom.png`,
    });
  });

  test('check edge-to-edge layout', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('a[href^="/asset/"]', { timeout: 30000 });
    await page.locator('a[href^="/asset/"]').first().click();
    await page.waitForURL(/\/asset\/\d+/);
    await page.waitForSelector('.tv-lightweight-charts', { timeout: 15000 });
    await page.waitForTimeout(1000);

    console.log('\n=== Edge-to-Edge Layout Check ===');

    // Check chart container
    const chartContainer = page.locator('[data-testid="advanced-chart"]');
    if (await chartContainer.isVisible()) {
      const box = await chartContainer.boundingBox();
      if (box) {
        const isEdgeToEdge = box.x <= 2; // Should be at x=0 for edge-to-edge
        console.log(`Chart: x=${box.x.toFixed(0)}, width=${box.width.toFixed(0)}, edge-to-edge: ${isEdgeToEdge}`);
      }
    }

    // Get page width for comparison
    const pageWidth = await page.evaluate(() => document.documentElement.clientWidth);
    console.log(`Page width: ${pageWidth}px`);

    // Check main content sections by scrolling and measuring
    const scrollPositions = [0, 400, 800, 1200, 1600];
    for (const pos of scrollPositions) {
      await page.evaluate((y) => window.scrollTo(0, y), pos);
      await page.waitForTimeout(200);

      // Find the widest element at this scroll position
      const widestElement = await page.evaluate(() => {
        const elements = document.querySelectorAll('div');
        let maxWidth = 0;
        let result = { x: 0, width: 0 };
        for (const el of elements) {
          const rect = el.getBoundingClientRect();
          // Only check elements in viewport and of significant height
          if (rect.top >= 0 && rect.top < 200 && rect.height > 50 && rect.width > maxWidth) {
            maxWidth = rect.width;
            result = { x: rect.x, width: rect.width };
          }
        }
        return result;
      });

      if (widestElement.width > 0) {
        console.log(`At scroll ${pos}: widest element x=${widestElement.x.toFixed(0)}, width=${widestElement.width.toFixed(0)}`);
      }
    }
  });
});
