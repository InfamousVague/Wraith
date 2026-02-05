/**
 * Screenshot Utility
 *
 * Takes and manages screenshots during test execution.
 */

import { Page } from '@playwright/test';
import { LIVE_TEST_CONFIG } from '../config';
import { logger } from './logger';
import * as fs from 'fs';
import * as path from 'path';

class ScreenshotManager {
  private screenshotDir: string;
  private screenshots: string[] = [];
  private currentSuite: string = '';

  constructor() {
    this.screenshotDir = LIVE_TEST_CONFIG.SCREENSHOT_DIR;
    this.ensureDirectoryExists();
  }

  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }
  }

  setSuite(suiteName: string): void {
    this.currentSuite = suiteName.toLowerCase().replace(/\s+/g, '-');
  }

  getScreenshots(): string[] {
    return [...this.screenshots];
  }

  clearScreenshots(): void {
    this.screenshots = [];
  }

  private getFilename(name: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const safeName = name.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    return `${this.currentSuite}-${safeName}-${timestamp}.png`;
  }

  async capture(page: Page, name: string): Promise<string | null> {
    if (!LIVE_TEST_CONFIG.SCREENSHOT_ON_STEP) {
      return null;
    }

    try {
      const filename = this.getFilename(name);
      const filepath = path.join(this.screenshotDir, filename);

      await page.screenshot({
        path: filepath,
        fullPage: false,
        animations: 'disabled',
      });

      this.screenshots.push(filename);
      logger.screenshot(filename);

      return filename;
    } catch (error) {
      logger.warn(`Failed to capture screenshot: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  async captureFullPage(page: Page, name: string): Promise<string | null> {
    if (!LIVE_TEST_CONFIG.SCREENSHOT_ON_STEP) {
      return null;
    }

    try {
      const filename = this.getFilename(`full-${name}`);
      const filepath = path.join(this.screenshotDir, filename);

      await page.screenshot({
        path: filepath,
        fullPage: true,
        animations: 'disabled',
      });

      this.screenshots.push(filename);
      logger.screenshot(filename);

      return filename;
    } catch (error) {
      logger.warn(`Failed to capture full page screenshot: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  async captureElement(page: Page, selector: string, name: string): Promise<string | null> {
    if (!LIVE_TEST_CONFIG.SCREENSHOT_ON_STEP) {
      return null;
    }

    try {
      const element = page.locator(selector);
      const filename = this.getFilename(`element-${name}`);
      const filepath = path.join(this.screenshotDir, filename);

      await element.screenshot({
        path: filepath,
        animations: 'disabled',
      });

      this.screenshots.push(filename);
      logger.screenshot(filename);

      return filename;
    } catch (error) {
      logger.warn(`Failed to capture element screenshot: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  // Clean up old screenshots (keep last N runs)
  async cleanupOldScreenshots(keepLastN: number = 5): Promise<void> {
    try {
      const files = fs.readdirSync(this.screenshotDir);
      const pngFiles = files.filter(f => f.endsWith('.png'));

      // Group by suite prefix
      const grouped: Record<string, string[]> = {};
      for (const file of pngFiles) {
        const prefix = file.split('-')[0];
        if (!grouped[prefix]) {
          grouped[prefix] = [];
        }
        grouped[prefix].push(file);
      }

      // Sort and remove old files
      for (const prefix in grouped) {
        const sortedFiles = grouped[prefix].sort().reverse();
        const toDelete = sortedFiles.slice(keepLastN * 20); // Assuming ~20 screenshots per run

        for (const file of toDelete) {
          fs.unlinkSync(path.join(this.screenshotDir, file));
        }
      }

    } catch (error) {
      logger.warn(`Failed to cleanup old screenshots: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const screenshotManager = new ScreenshotManager();
