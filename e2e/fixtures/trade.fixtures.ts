/**
 * @file trade.fixtures.ts
 * @description Test fixtures and utilities for TradeSandbox E2E tests.
 *
 * Provides helpers for:
 * - User authentication (create account, login)
 * - Portfolio management (create, reset)
 * - Order cleanup (cancel all orders)
 * - Position cleanup (close all positions)
 * - WebSocket connection utilities
 */

import { Page, expect } from "@playwright/test";
import { STORAGE_KEYS, TIMEOUTS, API_BASE } from "./trade.data";

/**
 * Authentication result from createAccountAndAuthenticate.
 */
export interface AuthResult {
  authenticated: boolean;
  sessionToken: string | null;
  userId: string | null;
  publicKey: string | null;
}

/**
 * Server profile stored in localStorage.
 */
interface ServerProfile {
  id: string;
  publicKey: string;
  username?: string;
}

/**
 * Creates a new account and authenticates with the server.
 * Returns authentication details for subsequent API calls.
 */
export async function createAccountAndAuthenticate(page: Page): Promise<AuthResult> {
  // Navigate to profile page which handles auth
  await page.goto("/profile");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(2000);

  // Check if already authenticated
  let sessionToken = await page.evaluate(
    (key) => localStorage.getItem(key),
    STORAGE_KEYS.session
  );

  if (sessionToken) {
    const serverProfile = await page.evaluate(
      (key) => localStorage.getItem(key),
      STORAGE_KEYS.serverProfile
    );
    const profile: ServerProfile | null = serverProfile ? JSON.parse(serverProfile) : null;
    return {
      authenticated: true,
      sessionToken,
      userId: profile?.id ?? null,
      publicKey: profile?.publicKey ?? null,
    };
  }

  // Look for "Create New Account" button
  const createButton = page.getByRole("button", { name: /create new account/i });
  const buttonVisible = await createButton.isVisible({ timeout: 5000 }).catch(() => false);

  if (buttonVisible) {
    await createButton.click();
    await page.waitForTimeout(TIMEOUTS.pageLoad); // Wait for account creation and auto-login
  }

  // Check auth state after creation
  sessionToken = await page.evaluate(
    (key) => localStorage.getItem(key),
    STORAGE_KEYS.session
  );
  const serverProfile = await page.evaluate(
    (key) => localStorage.getItem(key),
    STORAGE_KEYS.serverProfile
  );
  const profile: ServerProfile | null = serverProfile ? JSON.parse(serverProfile) : null;

  return {
    authenticated: !!sessionToken,
    sessionToken,
    userId: profile?.id ?? null,
    publicKey: profile?.publicKey ?? null,
  };
}

/**
 * Logs out the current user by clearing auth storage.
 */
export async function logout(page: Page): Promise<void> {
  // Navigate to a page first to ensure localStorage is accessible
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");

  await page.evaluate((keys) => {
    localStorage.removeItem(keys.privateKey);
    localStorage.removeItem(keys.user);
    localStorage.removeItem(keys.session);
    localStorage.removeItem(keys.serverProfile);
  }, STORAGE_KEYS);
}

/**
 * Navigates to the trade sandbox page and waits for it to load.
 */
export async function navigateToTradeSandbox(page: Page, symbol?: string): Promise<void> {
  const path = symbol ? `/trade-sandbox/${symbol.toLowerCase()}` : "/trade-sandbox";
  await page.goto(path);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(TIMEOUTS.short);

  // Wait for order form to be visible (indicates page loaded)
  await page.waitForSelector("text=Order Type", { timeout: TIMEOUTS.pageLoad }).catch(() => {
    // Fallback: page may still be loading
  });
}

/**
 * Gets the portfolio ID for the current user.
 * Requires authentication.
 */
export async function getPortfolioId(page: Page): Promise<string | null> {
  const sessionToken = await page.evaluate(
    (key) => localStorage.getItem(key),
    STORAGE_KEYS.session
  );

  if (!sessionToken) return null;

  const serverProfile = await page.evaluate(
    (key) => localStorage.getItem(key),
    STORAGE_KEYS.serverProfile
  );

  if (!serverProfile) return null;

  const profile: ServerProfile = JSON.parse(serverProfile);

  // Fetch portfolios from API
  const response = await page.request.get(`${API_BASE}/api/trading/portfolios`, {
    headers: {
      Authorization: `Bearer ${sessionToken}`,
    },
    params: {
      userId: profile.id,
    },
  });

  if (!response.ok()) return null;

  const data = await response.json();
  const portfolios = data.data || [];

  // Return first portfolio ID or null
  return portfolios[0]?.id ?? null;
}

/**
 * Cancels all pending orders for the current user.
 * Useful for test cleanup.
 */
export async function cancelAllOrders(page: Page): Promise<number> {
  const sessionToken = await page.evaluate(
    (key) => localStorage.getItem(key),
    STORAGE_KEYS.session
  );

  if (!sessionToken) return 0;

  const portfolioId = await getPortfolioId(page);
  if (!portfolioId) return 0;

  // Get all orders
  const ordersResponse = await page.request.get(
    `${API_BASE}/api/trading/portfolios/${portfolioId}/orders`,
    {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    }
  );

  if (!ordersResponse.ok()) return 0;

  const ordersData = await ordersResponse.json();
  const orders = ordersData.data || [];

  // Cancel each pending order
  let cancelled = 0;
  for (const order of orders) {
    if (order.status === "pending" || order.status === "partial") {
      const cancelResponse = await page.request.delete(
        `${API_BASE}/api/trading/orders/${order.id}`,
        {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        }
      );
      if (cancelResponse.ok()) cancelled++;
    }
  }

  return cancelled;
}

/**
 * Closes all open positions for the current user.
 * Useful for test cleanup.
 */
export async function closeAllPositions(page: Page): Promise<number> {
  const sessionToken = await page.evaluate(
    (key) => localStorage.getItem(key),
    STORAGE_KEYS.session
  );

  if (!sessionToken) return 0;

  const portfolioId = await getPortfolioId(page);
  if (!portfolioId) return 0;

  // Get all positions
  const positionsResponse = await page.request.get(
    `${API_BASE}/api/trading/portfolios/${portfolioId}/positions`,
    {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    }
  );

  if (!positionsResponse.ok()) return 0;

  const positionsData = await positionsResponse.json();
  const positions = positionsData.data || [];

  // Close each position
  let closed = 0;
  for (const position of positions) {
    const closeResponse = await page.request.post(
      `${API_BASE}/api/trading/positions/${position.id}/close`,
      {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "Content-Type": "application/json",
        },
        data: {
          price: position.markPrice,
        },
      }
    );
    if (closeResponse.ok()) closed++;
  }

  return closed;
}

/**
 * Waits for the WebSocket connection to be established.
 * Checks for price updates as indicator of connection.
 */
export async function waitForWebSocketConnection(page: Page): Promise<boolean> {
  try {
    // Wait for any price element to update (indicates WebSocket working)
    await page.waitForFunction(
      () => {
        const priceElements = document.querySelectorAll('[data-testid="price"], .price');
        return priceElements.length > 0;
      },
      { timeout: TIMEOUTS.webSocket }
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Waits for a price update on the current asset.
 * Returns the new price or null if timeout.
 */
export async function waitForPriceUpdate(page: Page): Promise<number | null> {
  try {
    // Get initial price
    const initialPriceText = await page.locator("text=/\\$[\\d,]+/").first().textContent();
    const initialPrice = initialPriceText ? parseFloat(initialPriceText.replace(/[$,]/g, "")) : 0;

    // Wait for price to change
    await page.waitForFunction(
      (initial) => {
        const priceEl = document.querySelector('[data-testid="current-price"]');
        if (!priceEl) return false;
        const newPrice = parseFloat(priceEl.textContent?.replace(/[$,]/g, "") || "0");
        return newPrice !== initial;
      },
      initialPrice,
      { timeout: TIMEOUTS.priceUpdate }
    );

    // Get new price
    const newPriceText = await page.locator("text=/\\$[\\d,]+/").first().textContent();
    return newPriceText ? parseFloat(newPriceText.replace(/[$,]/g, "")) : null;
  } catch {
    return null;
  }
}

/**
 * Gets the current price displayed for the selected asset.
 */
export async function getCurrentPrice(page: Page): Promise<number> {
  const priceText = await page.locator("text=/\\$[\\d,]+/").first().textContent().catch(() => "$50000");
  return parseFloat(priceText?.replace(/[$,]/g, "") || "50000");
}

/**
 * Gets the available margin for the current user.
 */
export async function getAvailableMargin(page: Page): Promise<number> {
  const sessionToken = await page.evaluate(
    (key) => localStorage.getItem(key),
    STORAGE_KEYS.session
  );

  if (!sessionToken) return 0;

  const portfolioId = await getPortfolioId(page);
  if (!portfolioId) return 0;

  const response = await page.request.get(
    `${API_BASE}/api/trading/portfolios/${portfolioId}`,
    {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    }
  );

  if (!response.ok()) return 0;

  const data = await response.json();
  return data.data?.marginAvailable ?? 0;
}

/**
 * Verifies the user is authenticated by checking for session token.
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const sessionToken = await page.evaluate(
    (key) => localStorage.getItem(key),
    STORAGE_KEYS.session
  );
  return !!sessionToken;
}

/**
 * Gets positions count from the API.
 */
export async function getPositionsCount(page: Page): Promise<number> {
  const sessionToken = await page.evaluate(
    (key) => localStorage.getItem(key),
    STORAGE_KEYS.session
  );

  if (!sessionToken) return 0;

  const portfolioId = await getPortfolioId(page);
  if (!portfolioId) return 0;

  const response = await page.request.get(
    `${API_BASE}/api/trading/portfolios/${portfolioId}/positions`,
    {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    }
  );

  if (!response.ok()) return 0;

  const data = await response.json();
  return (data.data || []).length;
}

/**
 * Gets pending orders count from the API.
 */
export async function getOrdersCount(page: Page): Promise<number> {
  const sessionToken = await page.evaluate(
    (key) => localStorage.getItem(key),
    STORAGE_KEYS.session
  );

  if (!sessionToken) return 0;

  const portfolioId = await getPortfolioId(page);
  if (!portfolioId) return 0;

  const response = await page.request.get(
    `${API_BASE}/api/trading/portfolios/${portfolioId}/orders`,
    {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    }
  );

  if (!response.ok()) return 0;

  const data = await response.json();
  return (data.data || []).filter((o: { status: string }) =>
    o.status === "pending" || o.status === "partial"
  ).length;
}

/**
 * Takes a screenshot with a descriptive name.
 */
export async function takeScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({
    path: `e2e/screenshots/trade-sandbox-${name}.png`,
    fullPage: true,
  });
}
