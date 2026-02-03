import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 *
 * Run tests with:
 * - npm run test:e2e         - Run all E2E tests
 * - npm run test:e2e:ui      - Open interactive UI
 * - npm run test:e2e:headed  - Run with browser visible
 * - npm run test:e2e:api     - Run API tests only
 * - npx playwright test --project=mobile  - Run mobile tests only
 * - npx playwright test --project=tablet  - Run tablet tests only
 * - npx playwright test --project=desktop - Run desktop tests only
 */

export const VIEWPORTS = {
  iphoneSE: { width: 375, height: 667 },
  iphone12: { width: 390, height: 844 },
  ipadMini: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
  widescreen: { width: 1920, height: 1080 },
};

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],

  // Global timeout for each test
  timeout: 30000,

  // Expect timeout
  expect: {
    timeout: 10000,
  },

  use: {
    // Base URL for page.goto()
    baseURL: 'http://localhost:5173',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'on-first-retry',
  },

  // Configure projects for different browsers and devices
  projects: [
    // Desktop (default)
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'] },
    },

    // Mobile (iPhone 12)
    {
      name: 'mobile',
      use: { ...devices['iPhone 12'] },
    },

    // Tablet (iPad Mini)
    {
      name: 'tablet',
      use: { ...devices['iPad Mini'] },
    },

    // Legacy chromium project for backwards compatibility
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Web server configuration
  // Uncomment to auto-start dev server before tests
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:5173',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120000,
  // },
});
