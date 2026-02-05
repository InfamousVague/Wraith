/**
 * Asset Detail Walkthrough Suite
 *
 * Tests asset detail page functionality:
 * - Price display and validation
 * - Chart rendering and timeframe changes
 * - Signal scores and indicators
 * - Predictions
 * - Trade button navigation
 */

import { Page } from '@playwright/test';
import { SuiteResult, ValidationResult } from '../config';
import { logger } from '../utils';
import { AssetDetailPage } from '../pages/asset-detail.page';
import { DashboardPage } from '../pages/dashboard.page';
import { screenshotManager } from '../utils/screenshot';

export async function runAssetDetailSuite(page: Page): Promise<SuiteResult> {
  const assetDetail = new AssetDetailPage(page);
  const dashboard = new DashboardPage(page);
  const result: SuiteResult = {
    name: 'Asset Detail Walkthrough',
    steps: [],
    totalSteps: 0,
    passedSteps: 0,
    duration: 0,
    screenshots: [],
  };

  const startTime = Date.now();

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
    // Step 2.1: Navigate to BTC detail
    {
      const stepStart = Date.now();
      logger.stepStart('2.1', 'Navigate to BTC detail');

      try {
        await assetDetail.navigateToAsset('BTC');
        const screenshot = await screenshotManager.capture(page, '02-btc-detail');
        logger.stepPass('2.1', Date.now() - stepStart);
        recordStep('2.1', 'Navigate to BTC detail', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('2.1', errorMsg);
        recordStep('2.1', 'Navigate to BTC detail', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 2.2: Verify price display
    {
      const stepStart = Date.now();
      logger.stepStart('2.2', 'Verify price display');

      try {
        const price = await assetDetail.getPrice();
        const validation: ValidationResult = {
          field: 'BTC price',
          uiValue: price,
          apiValue: null,
          match: price > 0,
        };
        logger.validation(validation);
        logger.stepPass('2.2', Date.now() - stepStart, `Price: $${price.toLocaleString()}`);
        recordStep('2.2', 'Verify price display', price > 0, Date.now() - stepStart, undefined, [validation]);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('2.2', errorMsg);
        recordStep('2.2', 'Verify price display', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 2.3: Verify 24h change
    {
      const stepStart = Date.now();
      logger.stepStart('2.3', 'Verify 24h change');

      try {
        const change = await assetDetail.getPriceChange();
        const validation: ValidationResult = {
          field: 'BTC 24h change',
          uiValue: change,
          apiValue: null,
          match: !isNaN(change),
        };
        logger.validation(validation);
        logger.stepPass('2.3', Date.now() - stepStart, `24h: ${change > 0 ? '+' : ''}${change.toFixed(2)}%`);
        recordStep('2.3', 'Verify 24h change', !isNaN(change), Date.now() - stepStart, undefined, [validation]);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('2.3', errorMsg);
        recordStep('2.3', 'Verify 24h change', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 2.4: Verify chart renders
    {
      const stepStart = Date.now();
      logger.stepStart('2.4', 'Verify chart renders');

      try {
        const chartVisible = await assetDetail.isChartVisible();
        const screenshot = await screenshotManager.capture(page, '02-chart-render');
        logger.stepPass('2.4', Date.now() - stepStart, chartVisible ? 'Chart visible' : 'Chart not found');
        recordStep('2.4', 'Verify chart renders', chartVisible, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('2.4', errorMsg);
        recordStep('2.4', 'Verify chart renders', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 2.5: Change chart timeframe to 1H
    {
      const stepStart = Date.now();
      logger.stepStart('2.5', 'Change timeframe to 1H');

      try {
        await assetDetail.changeTimeframe('1H');
        const screenshot = await screenshotManager.capture(page, '02-chart-1h');
        logger.stepPass('2.5', Date.now() - stepStart);
        recordStep('2.5', 'Change timeframe to 1H', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('2.5', errorMsg);
        recordStep('2.5', 'Change timeframe to 1H', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 2.6: Change chart timeframe to 1D
    {
      const stepStart = Date.now();
      logger.stepStart('2.6', 'Change timeframe to 1D');

      try {
        await assetDetail.changeTimeframe('1D');
        const screenshot = await screenshotManager.capture(page, '02-chart-1d');
        logger.stepPass('2.6', Date.now() - stepStart);
        recordStep('2.6', 'Change timeframe to 1D', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('2.6', errorMsg);
        recordStep('2.6', 'Change timeframe to 1D', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 2.7: Change chart timeframe to 1W
    {
      const stepStart = Date.now();
      logger.stepStart('2.7', 'Change timeframe to 1W');

      try {
        await assetDetail.changeTimeframe('1W');
        const screenshot = await screenshotManager.capture(page, '02-chart-1w');
        logger.stepPass('2.7', Date.now() - stepStart);
        recordStep('2.7', 'Change timeframe to 1W', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('2.7', errorMsg);
        recordStep('2.7', 'Change timeframe to 1W', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 2.8: Verify signal score
    {
      const stepStart = Date.now();
      logger.stepStart('2.8', 'Verify signal score');

      try {
        const signalScore = await assetDetail.getSignalScore();
        const passed = signalScore !== null;
        logger.stepPass('2.8', Date.now() - stepStart, signalScore !== null ? `Score: ${signalScore}` : 'Signal not available');
        recordStep('2.8', 'Verify signal score', passed, Date.now() - stepStart);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('2.8', errorMsg);
        recordStep('2.8', 'Verify signal score', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 2.9: Verify direction label
    {
      const stepStart = Date.now();
      logger.stepStart('2.9', 'Verify direction label');

      try {
        const direction = await assetDetail.getSignalDirection();
        const passed = direction !== null;
        logger.stepPass('2.9', Date.now() - stepStart, direction ? `Direction: ${direction}` : 'Direction not available');
        recordStep('2.9', 'Verify direction label', passed, Date.now() - stepStart);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('2.9', errorMsg);
        recordStep('2.9', 'Verify direction label', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 2.10: Get all indicators
    {
      const stepStart = Date.now();
      logger.stepStart('2.10', 'Check indicators');

      try {
        const signalData = await assetDetail.getSignalData();
        const screenshot = await screenshotManager.capture(page, '02-indicators');
        const passed = signalData !== null;

        if (signalData) {
          logger.info(`RSI: ${signalData.rsi ?? 'N/A'}, MACD: ${signalData.macd ?? 'N/A'}`);
        }

        logger.stepPass('2.10', Date.now() - stepStart);
        recordStep('2.10', 'Check indicators', passed, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('2.10', errorMsg);
        recordStep('2.10', 'Check indicators', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 2.11: Click Trade button
    {
      const stepStart = Date.now();
      logger.stepStart('2.11', 'Click Trade button');

      try {
        await assetDetail.clickTrade();
        const screenshot = await screenshotManager.capture(page, '02-trade-click');
        logger.stepPass('2.11', Date.now() - stepStart);
        recordStep('2.11', 'Click Trade button', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('2.11', errorMsg);
        recordStep('2.11', 'Click Trade button', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 2.12: Go back to detail
    {
      const stepStart = Date.now();
      logger.stepStart('2.12', 'Go back to detail');

      try {
        await assetDetail.goBack();
        const screenshot = await screenshotManager.capture(page, '02-back');
        logger.stepPass('2.12', Date.now() - stepStart);
        recordStep('2.12', 'Go back to detail', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('2.12', errorMsg);
        recordStep('2.12', 'Go back to detail', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

  } catch (error) {
    logger.error(`Suite failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  result.duration = Date.now() - startTime;
  return result;
}
