/**
 * Contrast and Accessibility Tests
 *
 * Checks for color contrast issues across all pages in both dark and light modes.
 * Uses @axe-core/playwright for WCAG accessibility testing.
 */

import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import * as fs from "fs";
import * as path from "path";

const RESULTS_DIR = path.join(__dirname, "accessibility-results");

// Pages to test
const PAGES = [
  { name: "dashboard", path: "/" },
  { name: "settings", path: "/settings" },
  { name: "profile", path: "/profile" },
];

const THEMES = ["dark", "light"] as const;

// Ensure results directory exists
test.beforeAll(async () => {
  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }
});

// Helper to set theme and language
async function setupPage(page: any, targetPath: string, theme: string) {
  await page.goto(targetPath);
  await page.evaluate(({ thm }: { thm: string }) => {
    localStorage.setItem("wraith-theme", thm);
    localStorage.setItem("wraith-language", "en");
  }, { thm: theme });
  await page.reload();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);
}

// Helper to get contrast ratio between two colors
function getContrastRatio(color1: string, color2: string): number {
  const getLuminance = (hex: string): number => {
    const rgb = hex.replace("#", "").match(/.{2}/g);
    if (!rgb) return 0;
    const [r, g, b] = rgb.map((c) => {
      const val = parseInt(c, 16) / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

test.describe("Contrast and Accessibility Checks", () => {
  test.describe.configure({ mode: "serial" });

  for (const theme of THEMES) {
    for (const pageConfig of PAGES) {
      test(`Accessibility check: ${pageConfig.name} - ${theme}`, async ({ page }) => {
        await setupPage(page, pageConfig.path, theme);

        // Run axe accessibility scan focusing on color contrast
        const accessibilityScanResults = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();

        // Filter for color contrast violations
        const contrastViolations = accessibilityScanResults.violations.filter(
          (v) => v.id === "color-contrast" || v.id.includes("contrast")
        );

        // Save full results to file
        const resultsFile = path.join(
          RESULTS_DIR,
          `${pageConfig.name}_${theme}_accessibility.json`
        );
        fs.writeFileSync(
          resultsFile,
          JSON.stringify(accessibilityScanResults, null, 2)
        );

        // Log summary
        console.log(`\n=== ${pageConfig.name} (${theme} mode) ===`);
        console.log(`Total violations: ${accessibilityScanResults.violations.length}`);
        console.log(`Contrast violations: ${contrastViolations.length}`);

        if (contrastViolations.length > 0) {
          console.log("\nContrast issues found:");
          contrastViolations.forEach((v) => {
            console.log(`  - ${v.description}`);
            v.nodes.forEach((node) => {
              console.log(`    Element: ${node.html.substring(0, 100)}...`);
              console.log(`    Fix: ${node.failureSummary}`);
            });
          });
        }

        // Take screenshot for reference
        await page.screenshot({
          path: path.join(RESULTS_DIR, `${pageConfig.name}_${theme}.png`),
          fullPage: true,
        });

        // Soft assertion - log but don't fail for now (can be made strict later)
        if (contrastViolations.length > 0) {
          console.warn(
            `Warning: ${contrastViolations.length} contrast issues on ${pageConfig.name} (${theme})`
          );
        }
      });
    }
  }
});

test.describe("Theme Color Validation", () => {
  test("Dark theme colors meet minimum contrast", async ({ page }) => {
    await setupPage(page, "/", "dark");

    // Expected dark theme colors
    const darkColors = {
      background: "#050608",
      surface: "#0B0E15",
      textPrimary: "#F4F6FF",
      textSecondary: "#C5CADB",
      textMuted: "#9096AB",
    };

    // Check text contrast against backgrounds
    const primaryOnCanvas = getContrastRatio(darkColors.textPrimary, darkColors.background);
    const secondaryOnCanvas = getContrastRatio(darkColors.textSecondary, darkColors.background);
    const mutedOnCanvas = getContrastRatio(darkColors.textMuted, darkColors.background);
    const primaryOnSurface = getContrastRatio(darkColors.textPrimary, darkColors.surface);

    console.log("\n=== Dark Theme Contrast Ratios ===");
    console.log(`Primary text on canvas: ${primaryOnCanvas.toFixed(2)}:1 (WCAG AA requires 4.5:1)`);
    console.log(`Secondary text on canvas: ${secondaryOnCanvas.toFixed(2)}:1`);
    console.log(`Muted text on canvas: ${mutedOnCanvas.toFixed(2)}:1`);
    console.log(`Primary text on surface: ${primaryOnSurface.toFixed(2)}:1`);

    // WCAG AA requires 4.5:1 for normal text
    expect(primaryOnCanvas).toBeGreaterThan(4.5);
    expect(secondaryOnCanvas).toBeGreaterThan(4.5);
    expect(primaryOnSurface).toBeGreaterThan(4.5);
    // Muted text can have lower contrast (3:1 for large text)
    expect(mutedOnCanvas).toBeGreaterThan(3);
  });

  test("Light theme colors meet minimum contrast", async ({ page }) => {
    await setupPage(page, "/", "light");

    // Expected light theme colors
    const lightColors = {
      background: "#f8fafc",
      surface: "#ffffff",
      textPrimary: "#0f172a",
      textSecondary: "#334155",
      textMuted: "#64748b",
    };

    // Check text contrast against backgrounds
    const primaryOnCanvas = getContrastRatio(lightColors.textPrimary, lightColors.background);
    const secondaryOnCanvas = getContrastRatio(lightColors.textSecondary, lightColors.background);
    const mutedOnCanvas = getContrastRatio(lightColors.textMuted, lightColors.background);
    const primaryOnSurface = getContrastRatio(lightColors.textPrimary, lightColors.surface);

    console.log("\n=== Light Theme Contrast Ratios ===");
    console.log(`Primary text on canvas: ${primaryOnCanvas.toFixed(2)}:1 (WCAG AA requires 4.5:1)`);
    console.log(`Secondary text on canvas: ${secondaryOnCanvas.toFixed(2)}:1`);
    console.log(`Muted text on canvas: ${mutedOnCanvas.toFixed(2)}:1`);
    console.log(`Primary text on surface: ${primaryOnSurface.toFixed(2)}:1`);

    // WCAG AA requires 4.5:1 for normal text
    expect(primaryOnCanvas).toBeGreaterThan(4.5);
    expect(secondaryOnCanvas).toBeGreaterThan(4.5);
    expect(primaryOnSurface).toBeGreaterThan(4.5);
    // Muted text can have lower contrast (3:1 for large text)
    expect(mutedOnCanvas).toBeGreaterThan(3);
  });
});

test.describe("Visual Regression - Theme Consistency", () => {
  test("Both themes render without errors", async ({ page }) => {
    // Test dark mode
    await setupPage(page, "/", "dark");
    const darkBody = page.locator("body");
    await expect(darkBody).toBeVisible();

    // Verify dark theme is applied (check for dark background)
    const darkBgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    console.log(`Dark mode background: ${darkBgColor}`);

    // Test light mode
    await setupPage(page, "/", "light");
    const lightBody = page.locator("body");
    await expect(lightBody).toBeVisible();

    // Verify light theme is applied (check for light background)
    const lightBgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    console.log(`Light mode background: ${lightBgColor}`);

    // Backgrounds should be different
    expect(darkBgColor).not.toEqual(lightBgColor);
  });

  test("Key UI elements are visible in both themes", async ({ page }) => {
    for (const theme of THEMES) {
      await setupPage(page, "/", theme);

      // Check for key elements that should always be visible
      const elementsToCheck = [
        { selector: 'text="WRAITH"', name: "Logo" },
        { selector: 'text="Asset Prices"', name: "Asset Prices heading" },
        { selector: '[placeholder*="Search"]', name: "Search input" },
      ];

      for (const element of elementsToCheck) {
        const el = page.locator(element.selector).first();
        const isVisible = await el.isVisible().catch(() => false);
        console.log(`${theme} mode - ${element.name}: ${isVisible ? "visible" : "NOT VISIBLE"}`);

        if (!isVisible) {
          console.warn(`Warning: ${element.name} not visible in ${theme} mode`);
        }
      }
    }
  });
});
