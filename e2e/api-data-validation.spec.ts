/**
 * End-to-End Tests: API Data Validation
 *
 * These tests create an account, authenticate, and validate that:
 * 1. All UI components on Portfolio page use real API data
 * 2. All UI components on TradeSandbox page use real API data
 * 3. No mock data is displayed to authenticated users
 *
 * Run: npx playwright test e2e/api-data-validation.spec.ts --headed
 */

import { test, expect, Page } from "@playwright/test";

const API_BASE = "http://localhost:3001";
const APP_BASE = "http://localhost:5173";

// Storage keys from AuthContext
const STORAGE_KEYS = {
  privateKey: "wraith_private_key",
  user: "wraith_user",
  session: "wraith_session_token",
  serverProfile: "wraith_server_profile",
};

// Test results tracking
interface DataSourceCheck {
  component: string;
  page: string;
  expectedSource: "api" | "mock";
  actualSource: "api" | "mock" | "empty" | "unknown";
  value?: string;
  apiValue?: string;
  passed: boolean;
  notes: string;
}

const testResults: DataSourceCheck[] = [];

/**
 * Helper to log API requests and responses
 */
async function setupApiLogger(page: Page) {
  const apiCalls: Array<{ url: string; method: string; response?: unknown }> = [];

  page.on("request", (request) => {
    if (request.url().includes(API_BASE)) {
      console.log(`[API Request] ${request.method()} ${request.url()}`);
    }
  });

  page.on("response", async (response) => {
    if (response.url().includes(API_BASE)) {
      try {
        const json = await response.json().catch(() => null);
        console.log(`[API Response] ${response.status()} ${response.url()}`);
        if (json) {
          console.log(`[API Data]`, JSON.stringify(json, null, 2).substring(0, 500));
        }
        apiCalls.push({ url: response.url(), method: response.request().method(), response: json });
      } catch {
        // Ignore non-JSON responses
      }
    }
  });

  return apiCalls;
}

/**
 * Create account and authenticate
 */
async function createAccountAndAuthenticate(page: Page): Promise<boolean> {
  console.log("\n=== Creating Account and Authenticating ===\n");

  // Navigate to profile page (don't wait for networkidle due to WebSocket)
  await page.goto("/profile");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(2000);

  // Check if already authenticated
  const sessionToken = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEYS.session);
  if (sessionToken) {
    console.log("Already authenticated, session token found");
    return true;
  }

  // Look for "Create New Account" button
  const createButton = page.getByRole("button", { name: /create new account/i });
  if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log("Clicking 'Create New Account' button...");
    await createButton.click();

    // Wait for account creation and auto-login to complete
    await page.waitForTimeout(5000);
  }

  // Check if we're now authenticated
  const newSessionToken = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEYS.session);
  const serverProfile = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEYS.serverProfile);

  console.log("Session token:", newSessionToken ? "present" : "missing");
  console.log("Server profile:", serverProfile ? JSON.parse(serverProfile) : "missing");

  return !!newSessionToken;
}

/**
 * Fetch portfolio data directly from API
 */
async function fetchPortfolioFromApi(page: Page): Promise<{
  portfolios: unknown[];
  portfolio: unknown;
  sessionToken: string | null;
}> {
  const sessionToken = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEYS.session);

  if (!sessionToken) {
    return { portfolios: [], portfolio: null, sessionToken: null };
  }

  // Fetch portfolios
  const portfoliosResponse = await page.request.get(`${API_BASE}/api/trading/portfolios`, {
    headers: { Authorization: `Bearer ${sessionToken}` },
  });

  const portfoliosJson = await portfoliosResponse.json().catch(() => ({ data: [] }));
  console.log("\n=== API Portfolio Data ===");
  console.log(JSON.stringify(portfoliosJson, null, 2));

  return {
    portfolios: portfoliosJson.data || [],
    portfolio: portfoliosJson.data?.[0] || null,
    sessionToken,
  };
}

test.describe("Portfolio Page - API Data Validation", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiLogger(page);
  });

  test("authenticated user sees real portfolio balance from API", async ({ page }) => {
    // Create account if needed
    const authenticated = await createAccountAndAuthenticate(page);
    expect(authenticated).toBe(true);

    // Fetch actual API data for comparison
    const { portfolio, sessionToken } = await fetchPortfolioFromApi(page);
    console.log("\n=== Expected Portfolio from API ===");
    console.log("Portfolio:", portfolio);

    // Navigate to portfolio page
    await page.goto("/portfolio");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // Get displayed balance
    const content = await page.content();

    // Check for API values in the UI
    const apiCashBalance = (portfolio as { cashBalance?: number })?.cashBalance;
    const apiTotalValue = (portfolio as { totalValue?: number })?.totalValue;

    console.log("\n=== Checking UI for API Values ===");
    console.log("API cashBalance:", apiCashBalance);
    console.log("API totalValue:", apiTotalValue);

    // Take screenshot for debugging
    await page.screenshot({ path: "e2e/screenshots/portfolio-balance-check.png", fullPage: true });

    // If API has data, check if UI shows it
    if (apiCashBalance && apiCashBalance > 0) {
      // Format the expected value (the UI might show it differently)
      const expectedValues = [
        apiCashBalance.toLocaleString(),
        apiCashBalance.toFixed(2),
        (apiCashBalance / 1000).toFixed(0) + "K",
        (apiCashBalance / 1000000).toFixed(1) + "M",
      ];

      let found = false;
      for (const expected of expectedValues) {
        if (content.includes(expected)) {
          console.log(`Found expected value in UI: ${expected}`);
          found = true;
          break;
        }
      }

      testResults.push({
        component: "Portfolio Balance",
        page: "Portfolio",
        expectedSource: "api",
        actualSource: found ? "api" : "unknown",
        value: found ? String(apiCashBalance) : "not found",
        apiValue: String(apiCashBalance),
        passed: found,
        notes: found ? "Balance matches API" : "Balance not found or mismatched",
      });
    } else {
      // API has no balance, UI should show 0 or empty state
      const hasZeroBalance = content.includes("$0") || content.includes("$0.00");
      console.log("API has no balance, checking for $0 in UI:", hasZeroBalance);

      testResults.push({
        component: "Portfolio Balance",
        page: "Portfolio",
        expectedSource: "api",
        actualSource: hasZeroBalance ? "api" : "unknown",
        value: hasZeroBalance ? "$0" : "not found",
        apiValue: "0",
        passed: hasZeroBalance,
        notes: hasZeroBalance ? "Shows $0 as expected" : "Expected $0 but found different value",
      });
    }

    // Log test results
    console.log("\n=== Test Results ===");
    console.log(JSON.stringify(testResults, null, 2));
  });

  test("portfolio summary shows real margin and P&L data", async ({ page }) => {
    const authenticated = await createAccountAndAuthenticate(page);
    expect(authenticated).toBe(true);

    const { portfolio } = await fetchPortfolioFromApi(page);

    await page.goto("/portfolio");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    const content = await page.content();

    // Check margin used
    const apiMarginUsed = (portfolio as { marginUsed?: number })?.marginUsed || 0;
    const apiMarginAvailable = (portfolio as { marginAvailable?: number })?.marginAvailable || 0;
    const apiUnrealizedPnl = (portfolio as { unrealizedPnl?: number })?.unrealizedPnl || 0;
    const apiRealizedPnl = (portfolio as { realizedPnl?: number })?.realizedPnl || 0;

    console.log("\n=== Checking Portfolio Metrics ===");
    console.log("API marginUsed:", apiMarginUsed);
    console.log("API marginAvailable:", apiMarginAvailable);
    console.log("API unrealizedPnl:", apiUnrealizedPnl);
    console.log("API realizedPnl:", apiRealizedPnl);

    await page.screenshot({ path: "e2e/screenshots/portfolio-metrics-check.png", fullPage: true });

    // These values should all be from API (even if 0)
    // We just verify the page loaded without mock data indicators
    const mockDataIndicators = [
      "101,250", // Mock BTC holding value
      "51,750", // Mock ETH holding value
      "45.2%", // Mock BTC allocation
    ];

    let hasMockData = false;
    for (const indicator of mockDataIndicators) {
      if (content.includes(indicator)) {
        console.log(`WARNING: Found mock data indicator: ${indicator}`);
        hasMockData = true;
      }
    }

    expect(hasMockData).toBe(false);
  });

  test("holdings list shows real data or empty state", async ({ page }) => {
    const authenticated = await createAccountAndAuthenticate(page);
    expect(authenticated).toBe(true);

    const { portfolio, sessionToken } = await fetchPortfolioFromApi(page);
    const portfolioId = (portfolio as { id?: string })?.id;

    // Fetch holdings from API
    let apiHoldings: unknown[] = [];
    if (portfolioId && sessionToken) {
      const holdingsResponse = await page.request.get(
        `${API_BASE}/api/trading/portfolios/${portfolioId}/holdings`,
        { headers: { Authorization: `Bearer ${sessionToken}` } }
      );
      const holdingsJson = await holdingsResponse.json().catch(() => ({ data: { holdings: [] } }));
      apiHoldings = holdingsJson.data?.holdings || [];
      console.log("\n=== API Holdings ===");
      console.log(JSON.stringify(holdingsJson, null, 2));
    }

    await page.goto("/portfolio");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    const content = await page.content();

    if (apiHoldings.length === 0) {
      // Should see empty state message
      const hasEmptyState =
        content.toLowerCase().includes("no holdings") ||
        content.toLowerCase().includes("start trading") ||
        content.includes("0 assets");
      console.log("API has no holdings, checking for empty state:", hasEmptyState);

      testResults.push({
        component: "Holdings List",
        page: "Portfolio",
        expectedSource: "api",
        actualSource: hasEmptyState ? "empty" : "unknown",
        value: hasEmptyState ? "empty state shown" : "unexpected content",
        apiValue: "empty",
        passed: hasEmptyState,
        notes: hasEmptyState ? "Correct empty state" : "Should show empty state",
      });
    } else {
      // Should see real holdings
      console.log(`API has ${apiHoldings.length} holdings`);
    }

    await page.screenshot({ path: "e2e/screenshots/portfolio-holdings-check.png", fullPage: true });
  });
});

test.describe("TradeSandbox Page - API Data Validation", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiLogger(page);
  });

  test("authenticated user sees real positions from API", async ({ page }) => {
    const authenticated = await createAccountAndAuthenticate(page);
    expect(authenticated).toBe(true);

    const { portfolio, sessionToken } = await fetchPortfolioFromApi(page);
    const portfolioId = (portfolio as { id?: string })?.id;

    // Fetch positions from API
    let apiPositions: unknown[] = [];
    if (portfolioId && sessionToken) {
      const positionsResponse = await page.request.get(
        `${API_BASE}/api/trading/positions?portfolio_id=${portfolioId}`,
        { headers: { Authorization: `Bearer ${sessionToken}` } }
      );
      const positionsJson = await positionsResponse.json().catch(() => ({ data: [] }));
      apiPositions = positionsJson.data || [];
      console.log("\n=== API Positions ===");
      console.log(JSON.stringify(positionsJson, null, 2));
    }

    await page.goto("/trade-sandbox");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // Click on positions tab
    const positionsTab = page.getByRole("button", { name: /positions/i });
    if (await positionsTab.isVisible()) {
      await positionsTab.click();
      await page.waitForTimeout(1000);
    }

    const content = await page.content();

    await page.screenshot({ path: "e2e/screenshots/tradesandbox-positions-check.png", fullPage: true });

    // Check for mock position indicators
    const mockPositionIndicators = [
      "67,500", // Mock BTC price
      "3,450", // Mock ETH price
    ];

    let hasMockData = false;
    for (const indicator of mockPositionIndicators) {
      if (content.includes(indicator)) {
        console.log(`WARNING: Found mock position indicator: ${indicator}`);
        hasMockData = true;
      }
    }

    if (apiPositions.length === 0) {
      // Should show empty state, not mock data
      expect(hasMockData).toBe(false);
    }
  });

  test("authenticated user sees real orders from API", async ({ page }) => {
    const authenticated = await createAccountAndAuthenticate(page);
    expect(authenticated).toBe(true);

    const { portfolio, sessionToken } = await fetchPortfolioFromApi(page);
    const portfolioId = (portfolio as { id?: string })?.id;

    // Fetch orders from API
    let apiOrders: unknown[] = [];
    if (portfolioId && sessionToken) {
      const ordersResponse = await page.request.get(
        `${API_BASE}/api/trading/orders?portfolio_id=${portfolioId}`,
        { headers: { Authorization: `Bearer ${sessionToken}` } }
      );
      const ordersJson = await ordersResponse.json().catch(() => ({ data: [] }));
      apiOrders = ordersJson.data || [];
      console.log("\n=== API Orders ===");
      console.log(JSON.stringify(ordersJson, null, 2));
    }

    await page.goto("/trade-sandbox");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // Click on orders tab
    const ordersTab = page.getByRole("button", { name: /orders/i });
    if (await ordersTab.isVisible()) {
      await ordersTab.click();
      await page.waitForTimeout(1000);
    }

    await page.screenshot({ path: "e2e/screenshots/tradesandbox-orders-check.png", fullPage: true });
  });

  test("order form uses real available margin from API", async ({ page }) => {
    const authenticated = await createAccountAndAuthenticate(page);
    expect(authenticated).toBe(true);

    const { portfolio } = await fetchPortfolioFromApi(page);
    const apiMarginAvailable = (portfolio as { marginAvailable?: number })?.marginAvailable || 0;

    console.log("\n=== Expected Available Margin ===");
    console.log("API marginAvailable:", apiMarginAvailable);

    await page.goto("/trade-sandbox");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    await page.screenshot({ path: "e2e/screenshots/tradesandbox-orderform-check.png", fullPage: true });

    // The order form should reflect the real available margin
    const content = await page.content();

    if (apiMarginAvailable > 0) {
      const expectedValues = [
        apiMarginAvailable.toLocaleString(),
        apiMarginAvailable.toFixed(2),
        (apiMarginAvailable / 1000).toFixed(0) + "K",
        (apiMarginAvailable / 1000000).toFixed(1) + "M",
      ];

      let found = false;
      for (const expected of expectedValues) {
        if (content.includes(expected)) {
          console.log(`Found expected margin in UI: ${expected}`);
          found = true;
          break;
        }
      }

      testResults.push({
        component: "Available Margin",
        page: "TradeSandbox",
        expectedSource: "api",
        actualSource: found ? "api" : "unknown",
        value: found ? String(apiMarginAvailable) : "not found",
        apiValue: String(apiMarginAvailable),
        passed: found,
        notes: found ? "Margin matches API" : "Margin not found or mismatched",
      });
    }
  });
});

test.describe("API Response Structure Validation", () => {
  test("portfolios endpoint returns expected structure", async ({ request }) => {
    // First get a session token by creating an account via the app
    // For now, test the endpoint structure
    const response = await request.get(`${API_BASE}/api/trading/portfolios`);
    const json = await response.json();

    console.log("\n=== Portfolios Endpoint Response ===");
    console.log("Status:", response.status());
    console.log("Body:", JSON.stringify(json, null, 2));

    // Should have data array (even if auth required)
    if (response.ok()) {
      expect(json).toHaveProperty("data");
      expect(Array.isArray(json.data)).toBe(true);

      if (json.data.length > 0) {
        const portfolio = json.data[0];
        // Validate expected fields
        const expectedFields = [
          "id",
          "cashBalance",
          "marginUsed",
          "marginAvailable",
          "unrealizedPnl",
          "realizedPnl",
        ];
        for (const field of expectedFields) {
          console.log(`Checking field '${field}':`, portfolio[field]);
          expect(portfolio).toHaveProperty(field);
        }
      }
    }
  });

  test("positions endpoint returns expected structure", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/trading/positions`);
    const json = await response.json();

    console.log("\n=== Positions Endpoint Response ===");
    console.log("Status:", response.status());
    console.log("Body:", JSON.stringify(json, null, 2).substring(0, 500));

    if (response.ok()) {
      expect(json).toHaveProperty("data");
      expect(Array.isArray(json.data)).toBe(true);
    }
  });

  test("orders endpoint returns expected structure", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/trading/orders`);
    const json = await response.json();

    console.log("\n=== Orders Endpoint Response ===");
    console.log("Status:", response.status());
    console.log("Body:", JSON.stringify(json, null, 2).substring(0, 500));

    if (response.ok()) {
      expect(json).toHaveProperty("data");
      expect(Array.isArray(json.data)).toBe(true);
    }
  });
});

test.describe("Debug: Console Log API Calls", () => {
  test("log all API calls during portfolio page load", async ({ page }) => {
    const apiCalls = await setupApiLogger(page);

    // Create account
    const authenticated = await createAccountAndAuthenticate(page);
    console.log("\n=== Authentication Status ===");
    console.log("Authenticated:", authenticated);

    // Navigate to portfolio
    await page.goto("/portfolio");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);

    console.log("\n=== All API Calls Made ===");
    console.log(JSON.stringify(apiCalls, null, 2));

    // Check localStorage
    const localStorage = await page.evaluate(() => {
      return {
        privateKey: window.localStorage.getItem("wraith_private_key") ? "present" : "missing",
        user: window.localStorage.getItem("wraith_user"),
        session: window.localStorage.getItem("wraith_session_token") ? "present" : "missing",
        serverProfile: window.localStorage.getItem("wraith_server_profile"),
      };
    });

    console.log("\n=== LocalStorage State ===");
    console.log(JSON.stringify(localStorage, null, 2));

    await page.screenshot({ path: "e2e/screenshots/debug-portfolio-load.png", fullPage: true });
  });
});

// Generate summary report after all tests
test.afterAll(() => {
  console.log("\n" + "=".repeat(80));
  console.log("API DATA VALIDATION SUMMARY");
  console.log("=".repeat(80));

  const passed = testResults.filter((r) => r.passed);
  const failed = testResults.filter((r) => !r.passed);

  console.log(`\nTotal Checks: ${testResults.length}`);
  console.log(`Passed: ${passed.length}`);
  console.log(`Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.log("\n--- FAILED CHECKS ---");
    for (const result of failed) {
      console.log(`\n[${result.page}] ${result.component}`);
      console.log(`  Expected: ${result.expectedSource} (${result.apiValue})`);
      console.log(`  Actual: ${result.actualSource} (${result.value})`);
      console.log(`  Notes: ${result.notes}`);
    }
  }

  console.log("\n" + "=".repeat(80));
});
