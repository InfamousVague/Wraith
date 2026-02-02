import { test, expect } from "@playwright/test";

test.describe("Sherpa Hints", () => {
  test("clicking indicator shows popup with content", async ({ page }) => {
    await page.goto("http://localhost:5173");
    await page.waitForTimeout(2500);

    // Take initial screenshot
    await page.screenshot({ path: "test-results/01-initial.png", fullPage: true });

    // Find indicators by their fixed position and cursor style
    const indicators = page.locator('div[style*="cursor: pointer"][style*="position: fixed"]');
    const count = await indicators.count();
    console.log(`Found ${count} indicators`);

    // Click the first indicator (should be top-right - market indicators)
    const firstIndicator = indicators.first();
    const box = await firstIndicator.boundingBox();
    console.log("Clicking indicator at:", box);

    await firstIndicator.click();

    // Wait a moment for state to update and animation
    await page.waitForTimeout(300);

    // Take screenshot immediately after click
    await page.screenshot({ path: "test-results/02-after-click.png", fullPage: true });

    // Check what's in the DOM now
    const pageContent = await page.content();
    console.log("Contains 'Market Indicators':", pageContent.includes("Market Indicators"));
    console.log("Contains 'Got it':", pageContent.includes("Got it"));
    console.log("Contains backdrop rgba:", pageContent.includes("rgba(0, 0, 0"));

    // Try to find the popup by its content
    const popupTitle = page.locator("text=Market Indicators");
    const titleVisible = await popupTitle.isVisible().catch(() => false);
    console.log("Popup title visible:", titleVisible);

    // Check for the Got it button
    const gotItButton = page.locator("text=Got it");
    const buttonVisible = await gotItButton.isVisible().catch(() => false);
    console.log("Got it button visible:", buttonVisible);

    // Get all elements with high z-index
    const highZInfo = await page.evaluate(() => {
      const results: string[] = [];
      document.querySelectorAll("*").forEach((el) => {
        const style = window.getComputedStyle(el);
        const zIndex = parseInt(style.zIndex) || 0;
        if (zIndex >= 9998) {
          const rect = el.getBoundingClientRect();
          results.push(
            `z:${zIndex} pos:${style.position} display:${style.display} opacity:${style.opacity} ` +
            `rect:[${Math.round(rect.left)},${Math.round(rect.top)},${Math.round(rect.width)}x${Math.round(rect.height)}] ` +
            `tag:${el.tagName} text:"${el.textContent?.slice(0, 50)}"`
          );
        }
      });
      return results;
    });

    console.log("High z-index elements after click:");
    highZInfo.forEach((info) => console.log("  ", info));

    // Final screenshot
    await page.screenshot({ path: "test-results/03-final.png", fullPage: true });
  });
});
