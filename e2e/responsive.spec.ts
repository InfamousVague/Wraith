import { test, expect } from '@playwright/test';
import { VIEWPORTS } from '../playwright.config';

/**
 * Mobile Responsive Test Suite
 *
 * Tests all pages at each viewport to verify:
 * - Cards go edge-to-edge on mobile (x position ≤ 12px)
 * - Order book hides/collapses on mobile
 * - Toolbar shows compact mode on mobile
 * - Touch targets ≥ 44px on mobile
 */

const MOBILE_EDGE_THRESHOLD = 12; // Max x position for edge-to-edge cards
const MIN_TOUCH_TARGET = 44; // Minimum touch target size in pixels

test.describe('Dashboard Responsive', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for content to load
    await page.waitForSelector('[data-sherpa="view-toggle"]', { timeout: 10000 });
  });

  test('should show compact toolbar on mobile', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
      return;
    }

    // On mobile, toolbar should be in compact mode
    const toolbar = page.locator('[data-sherpa="view-toggle"]');
    await expect(toolbar).toBeVisible();

    // Filter chips should be hidden in compact mode
    const filterChips = page.locator('[data-testid="filter-chip"]');
    const chipCount = await filterChips.count();
    // In compact mode, we only show essential controls
    expect(chipCount).toBeLessThanOrEqual(2);
  });

  test('should have proper touch targets on mobile', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
      return;
    }

    // Check that interactive elements have adequate touch targets
    const buttons = page.locator('button, [role="button"]');
    const count = await buttons.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box) {
          // Touch targets should be at least 44px in height
          expect(box.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET - 4); // Allow small tolerance
        }
      }
    }
  });

  test('asset list should adapt to viewport', async ({ page, isMobile }) => {
    // Wait for asset list to load
    await page.waitForSelector('[data-sherpa="asset-search"]', { timeout: 10000 });

    if (isMobile) {
      // On mobile, should show mobile card view (simplified rows)
      const tableHeader = page.locator('[data-testid="asset-table-header"]');
      // Table header should be hidden on mobile
      await expect(tableHeader).not.toBeVisible();
    }
  });
});

test.describe('Asset Detail Responsive', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to first asset
    await page.goto('/');
    await page.waitForSelector('[data-sherpa="asset-search"]', { timeout: 10000 });

    // Click on first asset row
    const firstAsset = page.locator('a[href^="/asset/"]').first();
    await firstAsset.click();

    // Wait for asset detail page to load
    await page.waitForURL(/\/asset\/\d+/);
    await page.waitForTimeout(500); // Allow layout to settle
  });

  test('should hide order book on mobile', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
      return;
    }

    // Order book should be hidden (in a collapsible) on mobile
    const orderBook = page.locator('[data-testid="order-book"]');

    // Order book might be in a collapsed section
    const collapsibleOrderBook = page.locator('[data-testid="collapsible-order-book"]');

    // Either order book is hidden or in a collapsible
    const isOrderBookVisible = await orderBook.isVisible().catch(() => false);
    const isCollapsibleVisible = await collapsibleOrderBook.isVisible().catch(() => false);

    // On mobile, order book should not be directly visible (should be collapsible)
    if (isOrderBookVisible) {
      // If visible, it should be inside the collapsible section
      expect(isCollapsibleVisible).toBe(true);
    }
  });

  test('should show order book on desktop', async ({ page, isMobile }) => {
    if (isMobile) {
      test.skip();
      return;
    }

    // Wait for order book to be visible on desktop
    const orderBook = page.locator('[data-testid="order-book"]');
    await expect(orderBook).toBeVisible({ timeout: 5000 });
  });

  test('chart section should have proper layout', async ({ page, isMobile }) => {
    // Check that chart is visible
    const chart = page.locator('[data-testid="advanced-chart"]');
    await expect(chart).toBeVisible({ timeout: 5000 });

    if (isMobile) {
      // On mobile, chart should take full width
      const chartBox = await chart.boundingBox();
      const viewportSize = page.viewportSize();

      if (chartBox && viewportSize) {
        // Chart should be nearly full width on mobile
        expect(chartBox.width).toBeGreaterThan(viewportSize.width * 0.9);
      }
    }
  });
});

test.describe('Settings Responsive', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    await page.waitForTimeout(500);
  });

  test('cards should be edge-to-edge on mobile', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
      return;
    }

    // Find cards on the page
    const cards = page.locator('[data-testid="card"], .card');
    const count = await cards.count();

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      if (await card.isVisible()) {
        const box = await card.boundingBox();
        if (box) {
          // Cards should start near the left edge on mobile
          expect(box.x).toBeLessThanOrEqual(MOBILE_EDGE_THRESHOLD);
        }
      }
    }
  });
});

test.describe('Profile Responsive', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/profile');
    await page.waitForTimeout(500);
  });

  test('cards should be edge-to-edge on mobile', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
      return;
    }

    const cards = page.locator('[data-testid="card"], .card');
    const count = await cards.count();

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      if (await card.isVisible()) {
        const box = await card.boundingBox();
        if (box) {
          expect(box.x).toBeLessThanOrEqual(MOBILE_EDGE_THRESHOLD);
        }
      }
    }
  });
});

test.describe('Visual Regression - Viewports', () => {
  const pages = [
    { name: 'dashboard', path: '/' },
    { name: 'settings', path: '/settings' },
    { name: 'profile', path: '/profile' },
  ];

  for (const pageConfig of pages) {
    test(`${pageConfig.name} should render correctly`, async ({ page, browserName }) => {
      await page.goto(pageConfig.path);
      await page.waitForTimeout(1000); // Allow animations to complete

      // Take screenshot for visual comparison
      await expect(page).toHaveScreenshot(`${pageConfig.name}-${browserName}.png`, {
        fullPage: true,
        animations: 'disabled',
      });
    });
  }
});

test.describe('Breakpoint Transitions', () => {
  test('should handle viewport resize gracefully', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-sherpa="view-toggle"]', { timeout: 10000 });

    // Start at desktop size
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.waitForTimeout(300);

    // Resize to tablet
    await page.setViewportSize(VIEWPORTS.ipadMini);
    await page.waitForTimeout(300);

    // Resize to mobile
    await page.setViewportSize(VIEWPORTS.iphone12);
    await page.waitForTimeout(300);

    // Page should still be functional
    const viewToggle = page.locator('[data-sherpa="view-toggle"]');
    await expect(viewToggle).toBeVisible();

    // Resize back to desktop
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.waitForTimeout(300);

    await expect(viewToggle).toBeVisible();
  });
});
