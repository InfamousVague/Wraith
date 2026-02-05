/**
 * Wait Utilities
 *
 * Smart waiting functions for live test execution.
 * These intentionally wait longer so you can watch the tests.
 */

import { Page, Locator } from '@playwright/test';
import { LIVE_TEST_CONFIG } from '../config';
import { logger } from './logger';

/**
 * Wait for a step delay (pause between actions for viewing)
 */
export async function stepDelay(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, LIVE_TEST_CONFIG.STEP_DELAY_MS));
}

/**
 * Wait for page to fully load
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await new Promise(resolve => setTimeout(resolve, LIVE_TEST_CONFIG.PAGE_LOAD_WAIT_MS));
}

/**
 * Wait for animations to complete
 */
export async function waitForAnimations(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, LIVE_TEST_CONFIG.ANIMATION_WAIT_MS));
}

/**
 * Wait for element to be visible and stable
 */
export async function waitForElement(
  page: Page,
  selector: string,
  options?: { timeout?: number; state?: 'visible' | 'attached' | 'hidden' }
): Promise<Locator> {
  const locator = page.locator(selector);
  await locator.waitFor({
    state: options?.state ?? 'visible',
    timeout: options?.timeout ?? LIVE_TEST_CONFIG.API_TIMEOUT_MS,
  });
  await waitForAnimations();
  return locator;
}

/**
 * Wait for text to appear on page
 */
export async function waitForText(
  page: Page,
  text: string,
  options?: { timeout?: number }
): Promise<void> {
  await page.getByText(text).waitFor({
    state: 'visible',
    timeout: options?.timeout ?? LIVE_TEST_CONFIG.API_TIMEOUT_MS,
  });
  await waitForAnimations();
}

/**
 * Wait for network request to complete
 */
export async function waitForRequest(
  page: Page,
  urlPattern: string | RegExp,
  options?: { timeout?: number }
): Promise<void> {
  await page.waitForResponse(
    response => {
      if (typeof urlPattern === 'string') {
        return response.url().includes(urlPattern);
      }
      return urlPattern.test(response.url());
    },
    { timeout: options?.timeout ?? LIVE_TEST_CONFIG.API_TIMEOUT_MS }
  );
}

/**
 * Wait for multiple network requests (useful for page loads)
 */
export async function waitForRequests(
  page: Page,
  urlPatterns: Array<string | RegExp>,
  options?: { timeout?: number }
): Promise<void> {
  const promises = urlPatterns.map(pattern =>
    waitForRequest(page, pattern, options).catch(() => {
      logger.verbose(`Request ${pattern} timed out or failed`);
    })
  );
  await Promise.allSettled(promises);
}

/**
 * Wait for WebSocket message
 */
export async function waitForWebSocketMessage(
  page: Page,
  messageType: string,
  timeout: number = LIVE_TEST_CONFIG.API_TIMEOUT_MS
): Promise<void> {
  // This requires setting up a WebSocket listener before the action
  // For now, we'll just wait a reasonable time
  logger.verbose(`Waiting for WebSocket message: ${messageType}`);
  await new Promise(resolve => setTimeout(resolve, 2000));
}

/**
 * Wait for value to change (useful for real-time updates)
 */
export async function waitForValueChange(
  page: Page,
  selector: string,
  initialValue: string,
  options?: { timeout?: number; pollInterval?: number }
): Promise<string> {
  const timeout = options?.timeout ?? LIVE_TEST_CONFIG.API_TIMEOUT_MS;
  const pollInterval = options?.pollInterval ?? 500;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const currentValue = await page.locator(selector).textContent();
    if (currentValue && currentValue !== initialValue) {
      logger.verbose(`Value changed from "${initialValue}" to "${currentValue}"`);
      return currentValue;
    }
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error(`Value did not change within ${timeout}ms`);
}

/**
 * Wait for loading indicator to disappear
 */
export async function waitForLoadingComplete(
  page: Page,
  loadingSelector: string = '[data-testid="loading"]',
  options?: { timeout?: number }
): Promise<void> {
  try {
    await page.locator(loadingSelector).waitFor({
      state: 'hidden',
      timeout: options?.timeout ?? LIVE_TEST_CONFIG.API_TIMEOUT_MS,
    });
  } catch {
    // Loading indicator might not exist or already gone
    logger.verbose('No loading indicator found or already hidden');
  }
  await waitForAnimations();
}

/**
 * Retry an action until it succeeds
 */
export async function retry<T>(
  action: () => Promise<T>,
  options?: { retries?: number; delay?: number }
): Promise<T> {
  const retries = options?.retries ?? 3;
  const delay = options?.delay ?? 1000;

  let lastError: Error | undefined;

  for (let i = 0; i < retries; i++) {
    try {
      return await action();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.verbose(`Retry ${i + 1}/${retries} failed: ${lastError.message}`);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Wait with countdown (shows progress in logs)
 */
export async function waitWithCountdown(seconds: number, reason: string): Promise<void> {
  logger.verbose(`Waiting ${seconds}s: ${reason}`);
  for (let i = seconds; i > 0; i--) {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}
