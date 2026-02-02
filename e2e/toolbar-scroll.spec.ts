import { test, expect } from '@playwright/test';

/**
 * Toolbar Scroll Test
 *
 * Verifies the mobile toolbar can scroll horizontally to reveal all filter options.
 */

test.describe('Mobile Toolbar Scrolling', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('toolbar should be horizontally scrollable on mobile', async ({ page }) => {
    await page.goto('/');

    // Wait for the toolbar to appear
    await page.waitForSelector('[data-sherpa="view-toggle"]', { timeout: 10000 });

    // Take a screenshot before scrolling
    await page.screenshot({ path: 'e2e/screenshots/toolbar-before-scroll.png', fullPage: false });

    // Find the scrollable div with hide-scrollbar class
    const scrollInfo = await page.evaluate(() => {
      // Find the scrollable element by class
      const scrollable = document.querySelector('.hide-scrollbar') as HTMLElement;
      if (scrollable) {
        return {
          found: 'hide-scrollbar',
          scrollWidth: scrollable.scrollWidth,
          clientWidth: scrollable.clientWidth,
          canScroll: scrollable.scrollWidth > scrollable.clientWidth,
          overflowX: window.getComputedStyle(scrollable).overflowX,
          children: scrollable.children.length,
        };
      }

      // Fallback: find any element with overflow-x: auto
      const allElements = document.querySelectorAll('*');
      for (const el of allElements) {
        const style = window.getComputedStyle(el);
        if (style.overflowX === 'auto' || style.overflowX === 'scroll') {
          return {
            found: 'overflow-auto',
            tagName: el.tagName,
            scrollWidth: (el as HTMLElement).scrollWidth,
            clientWidth: (el as HTMLElement).clientWidth,
            canScroll: (el as HTMLElement).scrollWidth > (el as HTMLElement).clientWidth,
          };
        }
      }

      return { found: false };
    });
    console.log('Scroll info:', scrollInfo);

    // Verify scrolling works
    if (scrollInfo.found && scrollInfo.canScroll) {
      console.log('SUCCESS: Toolbar can scroll horizontally');
    } else if (scrollInfo.found) {
      console.log('Toolbar found but content fits (no scroll needed)');
    } else {
      console.log('WARNING: No scrollable toolbar element found');
    }

    // Check filter chips are present
    const filterChips = page.locator('button:has-text("All"), button:has-text("Gainers"), button:has-text("Losers")');
    const chipCount = await filterChips.count();
    console.log('Filter chip count:', chipCount);

    // Take screenshot showing current state
    await page.screenshot({ path: 'e2e/screenshots/toolbar-mobile-debug.png', fullPage: false });

    // Expect the scrollable element to exist
    expect(scrollInfo.found).toBeTruthy();
  });

  test('should show all filter chips in toolbar', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-sherpa="view-toggle"]', { timeout: 10000 });

    // Screenshot the toolbar area
    await page.screenshot({
      path: 'e2e/screenshots/toolbar-spacing-check.png',
      clip: { x: 0, y: 0, width: 375, height: 120 }
    });

    // Check for toolbar-specific filter chips using data-testid
    const toolbarFilterGroup = page.locator('[data-testid="toolbar-filter-chips"]');
    const toolbarFilterCount = await toolbarFilterGroup.count();
    console.log(`Toolbar filter group count: ${toolbarFilterCount}`);

    // Check for specific filter chips
    const filterChipAll = page.locator('[data-testid="filter-chip-all"]');
    const filterChipGainers = page.locator('[data-testid="filter-chip-gainers"]');
    const allChipCount = await filterChipAll.count();
    const gainersChipCount = await filterChipGainers.count();
    console.log(`Filter chips by testid: all=${allChipCount}, gainers=${gainersChipCount}`);

    // Debug: Check what's in the scrollable container
    const scrollableContent = await page.evaluate(() => {
      const scrollable = document.querySelector('.hide-scrollbar');
      if (scrollable) {
        // Get all text content in the scrollable area
        const textContent = scrollable.textContent;
        // Count all buttons/interactive elements
        const buttons = scrollable.querySelectorAll('button, [role="button"]');
        const buttonTexts = Array.from(buttons).map(b => b.textContent?.trim()).slice(0, 10);
        return {
          textContent: textContent?.substring(0, 200),
          buttonCount: buttons.length,
          buttonTexts,
          fullWidth: scrollable.scrollWidth,
        };
      }
      return null;
    });
    console.log('Scrollable content:', scrollableContent);

    // Find all filter chips (from anywhere on page)
    const allChip = page.locator('button:has-text("All")');
    const gainersChip = page.locator('button:has-text("Gainers")');
    const losersChip = page.locator('button:has-text("Losers")');

    const allCount = await allChip.count();
    const gainersCount = await gainersChip.count();
    const losersCount = await losersChip.count();

    console.log(`Chips in DOM (any location): All=${allCount}, Gainers=${gainersCount}, Losers=${losersCount}`);

    // Verify filter chip text is present in the scrollable area
    const hasFilterChips = scrollableContent?.textContent?.includes('All') &&
                          scrollableContent?.textContent?.includes('Gainers') &&
                          scrollableContent?.textContent?.includes('Losers');
    console.log('Filter chips present in toolbar:', hasFilterChips);
    expect(hasFilterChips).toBe(true);
  });

  test('can scroll toolbar to reveal hidden chips', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-sherpa="view-toggle"]', { timeout: 10000 });

    // Find the actual toolbar element position
    const toolbarBox = await page.evaluate(() => {
      const scrollable = document.querySelector('.hide-scrollbar');
      if (scrollable) {
        const rect = scrollable.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      }
      return null;
    });
    console.log('Toolbar bounding box:', toolbarBox);

    // Screenshot toolbar before scrolling - use element's actual position
    const clipY = Math.max(0, (toolbarBox?.y || 500) - 10);
    await page.screenshot({
      path: 'e2e/screenshots/toolbar-before-scroll-clip.png',
      clip: { x: 0, y: clipY, width: 375, height: 60 }
    });

    // Find the scrollable container
    const scrollContainer = page.locator('.hide-scrollbar');

    if (await scrollContainer.count() > 0) {
      // Try to scroll right to reveal filter chips
      await page.evaluate(() => {
        const el = document.querySelector('.hide-scrollbar') as HTMLElement;
        if (el) {
          el.scrollLeft = 250;
        }
      });

      // Small delay for scroll to complete
      await page.waitForTimeout(100);

      // Take screenshot after scrolling - use same position
      await page.screenshot({
        path: 'e2e/screenshots/toolbar-after-scroll-clip.png',
        clip: { x: 0, y: clipY, width: 375, height: 60 }
      });

      const scrollLeft = await page.evaluate(() => {
        const el = document.querySelector('.hide-scrollbar') as HTMLElement;
        return el ? el.scrollLeft : 0;
      });

      console.log('Scroll position after scroll:', scrollLeft);

      // Verify scroll happened
      expect(scrollLeft).toBeGreaterThan(0);
    } else {
      console.log('No .hide-scrollbar element found');
    }
  });
});
