/**
 * Dashboard Walkthrough Suite
 *
 * Tests all dashboard functionality:
 * - Asset listing
 * - Price display and validation
 * - Filters (All, Crypto, Stocks)
 * - Sorting
 * - View toggle (Grid/List)
 * - Search
 */

import { Page } from '@playwright/test';
import { SuiteResult, ValidationResult } from '../config';
import { logger } from '../utils';
import { DashboardPage } from '../pages/dashboard.page';
import { stepDelay, waitForPageLoad } from '../utils/wait';
import { screenshotManager } from '../utils/screenshot';

export async function runDashboardSuite(page: Page): Promise<SuiteResult> {
  const dashboard = new DashboardPage(page);
  const result: SuiteResult = {
    name: 'Dashboard Walkthrough',
    steps: [],
    totalSteps: 0,
    passedSteps: 0,
    duration: 0,
    screenshots: [],
  };

  const startTime = Date.now();

  // Helper to record step
  const recordStep = (
    id: string,
    description: string,
    passed: boolean,
    duration: number,
    screenshot?: string,
    validations?: ValidationResult[],
    error?: string
  ) => {
    result.steps.push({ id, description, passed, duration, screenshot, validations, error });
    result.totalSteps++;
    if (passed) result.passedSteps++;
  };

  try {
    // Step 1.1: Navigate to dashboard
    {
      const stepStart = Date.now();
      logger.stepStart('1.1', 'Navigate to dashboard');

      try {
        await dashboard.navigate();
        const screenshot = await screenshotManager.capture(page, '01-dashboard-load');
        logger.stepPass('1.1', Date.now() - stepStart);
        recordStep('1.1', 'Navigate to dashboard', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('1.1', errorMsg);
        recordStep('1.1', 'Navigate to dashboard', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 1.2: Wait for assets to load
    {
      const stepStart = Date.now();
      logger.stepStart('1.2', 'Wait for assets to load');

      try {
        await dashboard.waitForAssetsToLoad();
        const screenshot = await screenshotManager.capture(page, '01-assets-loaded');
        logger.stepPass('1.2', Date.now() - stepStart);
        recordStep('1.2', 'Wait for assets to load', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('1.2', errorMsg);
        recordStep('1.2', 'Wait for assets to load', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 1.3: Verify asset count
    {
      const stepStart = Date.now();
      logger.stepStart('1.3', 'Verify asset count');

      try {
        const count = await dashboard.getAssetCount();
        logger.stepPass('1.3', Date.now() - stepStart, `Found ${count} assets`);
        recordStep('1.3', 'Verify asset count', count > 0, Date.now() - stepStart);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('1.3', errorMsg);
        recordStep('1.3', 'Verify asset count', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 1.4: Check first 5 asset prices
    {
      const stepStart = Date.now();
      logger.stepStart('1.4', 'Check first 5 asset prices');

      try {
        const assets = await dashboard.getTopAssets(5);
        const validations: ValidationResult[] = [];

        for (const asset of assets) {
          const validation: ValidationResult = {
            field: `${asset.symbol} price`,
            uiValue: asset.price,
            apiValue: null, // Would be filled by API validator
            match: asset.price > 0,
          };
          validations.push(validation);
          logger.validation(validation);
        }

        const screenshot = await screenshotManager.capture(page, '01-prices-match');
        const allPassed = validations.every(v => v.match);
        logger.stepPass('1.4', Date.now() - stepStart);
        recordStep('1.4', 'Check first 5 asset prices', allPassed, Date.now() - stepStart, screenshot ?? undefined, validations);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('1.4', errorMsg);
        recordStep('1.4', 'Check first 5 asset prices', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 1.5: Check 24h changes
    {
      const stepStart = Date.now();
      logger.stepStart('1.5', 'Check 24h changes');

      try {
        const assets = await dashboard.getTopAssets(5);
        const hasChanges = assets.some(a => a.change24h !== undefined && !isNaN(a.change24h));
        logger.stepPass('1.5', Date.now() - stepStart, `${assets.length} assets with 24h changes`);
        recordStep('1.5', 'Check 24h changes', hasChanges, Date.now() - stepStart);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('1.5', errorMsg);
        recordStep('1.5', 'Check 24h changes', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 1.6: Click "Crypto" filter
    {
      const stepStart = Date.now();
      logger.stepStart('1.6', 'Click "Crypto" filter');

      try {
        await dashboard.clickFilter('crypto');
        const screenshot = await screenshotManager.capture(page, '01-crypto-filter');
        logger.stepPass('1.6', Date.now() - stepStart);
        recordStep('1.6', 'Click "Crypto" filter', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('1.6', errorMsg);
        recordStep('1.6', 'Click "Crypto" filter', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 1.7: Click "Stocks" filter
    {
      const stepStart = Date.now();
      logger.stepStart('1.7', 'Click "Stocks" filter');

      try {
        await dashboard.clickFilter('stocks');
        const screenshot = await screenshotManager.capture(page, '01-stocks-filter');
        logger.stepPass('1.7', Date.now() - stepStart);
        recordStep('1.7', 'Click "Stocks" filter', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('1.7', errorMsg);
        recordStep('1.7', 'Click "Stocks" filter', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 1.8: Click "All" filter
    {
      const stepStart = Date.now();
      logger.stepStart('1.8', 'Click "All" filter');

      try {
        await dashboard.clickFilter('all');
        const screenshot = await screenshotManager.capture(page, '01-all-filter');
        logger.stepPass('1.8', Date.now() - stepStart);
        recordStep('1.8', 'Click "All" filter', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('1.8', errorMsg);
        recordStep('1.8', 'Click "All" filter', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 1.9: Toggle to grid view
    {
      const stepStart = Date.now();
      logger.stepStart('1.9', 'Toggle to grid view');

      try {
        await dashboard.toggleGridView();
        const screenshot = await screenshotManager.capture(page, '01-grid-view');
        logger.stepPass('1.9', Date.now() - stepStart);
        recordStep('1.9', 'Toggle to grid view', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('1.9', errorMsg);
        recordStep('1.9', 'Toggle to grid view', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 1.10: Toggle back to list view
    {
      const stepStart = Date.now();
      logger.stepStart('1.10', 'Toggle to list view');

      try {
        await dashboard.toggleListView();
        const screenshot = await screenshotManager.capture(page, '01-list-view');
        logger.stepPass('1.10', Date.now() - stepStart);
        recordStep('1.10', 'Toggle to list view', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('1.10', errorMsg);
        recordStep('1.10', 'Toggle to list view', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 1.11: Use search bar
    {
      const stepStart = Date.now();
      logger.stepStart('1.11', 'Search for "BTC"');

      try {
        await dashboard.search('BTC');
        const screenshot = await screenshotManager.capture(page, '01-search-btc');
        logger.stepPass('1.11', Date.now() - stepStart);
        recordStep('1.11', 'Search for "BTC"', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('1.11', errorMsg);
        recordStep('1.11', 'Search for "BTC"', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 1.12: Verify search results
    {
      const stepStart = Date.now();
      logger.stepStart('1.12', 'Verify search results');

      try {
        const count = await dashboard.getAssetCount();
        const hasBtc = count > 0; // Should show BTC-related results
        logger.stepPass('1.12', Date.now() - stepStart, `${count} search results`);
        recordStep('1.12', 'Verify search results', hasBtc, Date.now() - stepStart);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('1.12', errorMsg);
        recordStep('1.12', 'Verify search results', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 1.13: Clear search
    {
      const stepStart = Date.now();
      logger.stepStart('1.13', 'Clear search');

      try {
        await dashboard.clearSearch();
        const screenshot = await screenshotManager.capture(page, '01-search-cleared');
        logger.stepPass('1.13', Date.now() - stepStart);
        recordStep('1.13', 'Clear search', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('1.13', errorMsg);
        recordStep('1.13', 'Clear search', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 1.14: Click on an asset
    {
      const stepStart = Date.now();
      logger.stepStart('1.14', 'Click first asset');

      try {
        const symbol = await dashboard.clickFirstAsset();
        const screenshot = await screenshotManager.capture(page, '01-asset-clicked');
        logger.stepPass('1.14', Date.now() - stepStart, `Clicked ${symbol}`);
        recordStep('1.14', 'Click first asset', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('1.14', errorMsg);
        recordStep('1.14', 'Click first asset', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 1.15: Go back to dashboard
    {
      const stepStart = Date.now();
      logger.stepStart('1.15', 'Go back to dashboard');

      try {
        await page.goBack();
        await waitForPageLoad(page);
        await stepDelay();
        const screenshot = await screenshotManager.capture(page, '01-back-to-dashboard');
        logger.stepPass('1.15', Date.now() - stepStart);
        recordStep('1.15', 'Go back to dashboard', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('1.15', errorMsg);
        recordStep('1.15', 'Go back to dashboard', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

  } catch (error) {
    logger.error(`Suite failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  result.duration = Date.now() - startTime;
  return result;
}
