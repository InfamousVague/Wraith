/**
 * Base Page Object
 *
 * Common functionality shared by all page objects.
 */

import { Page, Locator, expect } from '@playwright/test';
import { LIVE_TEST_CONFIG, ValidationResult } from '../config';
import { logger, screenshotManager, apiValidator } from '../utils';
import { stepDelay, waitForPageLoad, waitForAnimations, waitForLoadingComplete } from '../utils/wait';

export abstract class BasePage {
  protected page: Page;
  protected abstract readonly pageName: string;
  protected abstract readonly pageUrl: string;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to this page
   */
  async navigate(): Promise<void> {
    await this.page.goto(this.pageUrl);
    await waitForPageLoad(this.page);
    await waitForLoadingComplete(this.page);
    await stepDelay();
  }

  /**
   * Check if currently on this page
   */
  async isOnPage(): Promise<boolean> {
    const currentUrl = this.page.url();
    return currentUrl.includes(this.pageUrl);
  }

  /**
   * Wait for page to be ready
   */
  async waitForReady(): Promise<void> {
    await waitForPageLoad(this.page);
    await waitForLoadingComplete(this.page);
  }

  /**
   * Take a screenshot with descriptive name
   */
  async screenshot(name: string): Promise<string | null> {
    return screenshotManager.capture(this.page, name);
  }

  /**
   * Click an element with step delay
   */
  async click(selector: string, description?: string): Promise<void> {
    const locator = this.page.locator(selector);
    await locator.waitFor({ state: 'visible' });
    await locator.click();
    if (description) {
      logger.verbose(`Clicked: ${description}`);
    }
    await stepDelay();
  }

  /**
   * Click a button by text
   */
  async clickButton(text: string): Promise<void> {
    await this.page.getByRole('button', { name: text }).click();
    logger.verbose(`Clicked button: ${text}`);
    await stepDelay();
  }

  /**
   * Click a link by text
   */
  async clickLink(text: string): Promise<void> {
    await this.page.getByRole('link', { name: text }).click();
    logger.verbose(`Clicked link: ${text}`);
    await stepDelay();
  }

  /**
   * Type into an input with delay
   */
  async type(selector: string, text: string, options?: { clear?: boolean }): Promise<void> {
    const locator = this.page.locator(selector);
    await locator.waitFor({ state: 'visible' });

    if (options?.clear) {
      await locator.clear();
    }

    await locator.fill(text);
    logger.verbose(`Typed: "${text}"`);
    await waitForAnimations();
  }

  /**
   * Select from dropdown
   */
  async select(selector: string, value: string): Promise<void> {
    const locator = this.page.locator(selector);
    await locator.waitFor({ state: 'visible' });
    await locator.selectOption(value);
    logger.verbose(`Selected: ${value}`);
    await stepDelay();
  }

  /**
   * Get text from element
   */
  async getText(selector: string): Promise<string> {
    const locator = this.page.locator(selector);
    await locator.waitFor({ state: 'visible' });
    return (await locator.textContent()) ?? '';
  }

  /**
   * Get value from input
   */
  async getValue(selector: string): Promise<string> {
    const locator = this.page.locator(selector);
    await locator.waitFor({ state: 'visible' });
    return await locator.inputValue();
  }

  /**
   * Check if element is visible
   */
  async isVisible(selector: string): Promise<boolean> {
    try {
      const locator = this.page.locator(selector);
      return await locator.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Wait for element to appear
   */
  async waitFor(selector: string, timeout?: number): Promise<Locator> {
    const locator = this.page.locator(selector);
    await locator.waitFor({
      state: 'visible',
      timeout: timeout ?? LIVE_TEST_CONFIG.API_TIMEOUT_MS,
    });
    return locator;
  }

  /**
   * Count elements matching selector
   */
  async count(selector: string): Promise<number> {
    return await this.page.locator(selector).count();
  }

  /**
   * Get all text contents from matching elements
   */
  async getAllTexts(selector: string): Promise<string[]> {
    const locators = this.page.locator(selector);
    const count = await locators.count();
    const texts: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await locators.nth(i).textContent();
      if (text) texts.push(text.trim());
    }

    return texts;
  }

  /**
   * Parse price from text (removes $, commas, etc)
   */
  protected parsePrice(text: string): number {
    return parseFloat(text.replace(/[$,]/g, ''));
  }

  /**
   * Parse percentage from text (removes %, +, etc)
   */
  protected parsePercent(text: string): number {
    return parseFloat(text.replace(/[%+]/g, ''));
  }

  /**
   * Scroll to element
   */
  async scrollTo(selector: string): Promise<void> {
    const locator = this.page.locator(selector);
    await locator.scrollIntoViewIfNeeded();
    await waitForAnimations();
  }

  /**
   * Scroll down the page
   */
  async scrollDown(pixels: number = 500): Promise<void> {
    await this.page.mouse.wheel(0, pixels);
    await waitForAnimations();
  }

  /**
   * Execute step with logging
   */
  async step<T>(
    stepId: string,
    description: string,
    action: () => Promise<T>,
    screenshot?: string
  ): Promise<{ result: T; passed: boolean; duration: number; error?: string }> {
    logger.stepStart(stepId, description);
    const startTime = Date.now();

    try {
      const result = await action();
      const duration = Date.now() - startTime;

      logger.stepPass(stepId, duration);

      if (screenshot) {
        await this.screenshot(screenshot);
      }

      return { result, passed: true, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.stepFail(stepId, errorMsg);

      return { result: undefined as T, passed: false, duration, error: errorMsg };
    }
  }

  /**
   * Expect assertion with logging
   */
  async expectVisible(selector: string, message?: string): Promise<void> {
    await expect(this.page.locator(selector)).toBeVisible({
      timeout: LIVE_TEST_CONFIG.API_TIMEOUT_MS,
    });
    if (message) logger.verbose(message);
  }

  /**
   * Expect text to be present
   */
  async expectText(selector: string, expectedText: string): Promise<void> {
    await expect(this.page.locator(selector)).toContainText(expectedText, {
      timeout: LIVE_TEST_CONFIG.API_TIMEOUT_MS,
    });
  }
}
