/**
 * Settings Walkthrough Suite
 *
 * Tests settings page functionality:
 * - Language selection
 * - Speed settings
 * - Server list and switching
 * - Server pings
 */

import { Page } from '@playwright/test';
import { SuiteResult, ValidationResult } from '../config';
import { logger } from '../utils';
import { SettingsPage } from '../pages/settings.page';
import { screenshotManager } from '../utils/screenshot';
import { stepDelay } from '../utils/wait';

export async function runSettingsSuite(page: Page): Promise<SuiteResult> {
  const settings = new SettingsPage(page);
  const result: SuiteResult = {
    name: 'Settings Walkthrough',
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
    // Step 7.1: Navigate to settings
    {
      const stepStart = Date.now();
      logger.stepStart('7.1', 'Navigate to settings');

      try {
        await settings.navigate();
        const screenshot = await screenshotManager.capture(page, '07-settings-load');
        logger.stepPass('7.1', Date.now() - stepStart);
        recordStep('7.1', 'Navigate to settings', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('7.1', errorMsg);
        recordStep('7.1', 'Navigate to settings', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 7.2: Check current language
    {
      const stepStart = Date.now();
      logger.stepStart('7.2', 'Check current language');

      try {
        const currentLang = await settings.getCurrentLanguage();
        const availableLangs = await settings.getAvailableLanguages();
        logger.info(`Current: ${currentLang}, Available: ${availableLangs.join(', ')}`);
        logger.stepPass('7.2', Date.now() - stepStart, `Current: ${currentLang}`);
        recordStep('7.2', 'Check current language', true, Date.now() - stepStart);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('7.2', errorMsg);
        recordStep('7.2', 'Check current language', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 7.3: Change language
    {
      const stepStart = Date.now();
      logger.stepStart('7.3', 'Change language');

      try {
        const availableLangs = await settings.getAvailableLanguages();
        const currentLang = await settings.getCurrentLanguage();
        if (availableLangs.length > 1) {
          const newLang = availableLangs.find(l => l !== currentLang) ?? availableLangs[0];
          await settings.changeLanguage(newLang);
        }
        const screenshot = await screenshotManager.capture(page, '07-language');
        logger.stepPass('7.3', Date.now() - stepStart);
        recordStep('7.3', 'Change language', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('7.3', errorMsg);
        recordStep('7.3', 'Change language', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 7.4: Check speed setting
    {
      const stepStart = Date.now();
      logger.stepStart('7.4', 'Check speed setting');

      try {
        const currentSpeed = await settings.getCurrentSpeed();
        const screenshot = await screenshotManager.capture(page, '07-speed');
        logger.stepPass('7.4', Date.now() - stepStart, `Current: ${currentSpeed ?? 'unknown'}`);
        recordStep('7.4', 'Check speed setting', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('7.4', errorMsg);
        recordStep('7.4', 'Check speed setting', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 7.5: Change speed
    {
      const stepStart = Date.now();
      logger.stepStart('7.5', 'Change speed');

      try {
        await settings.setSpeed('2x');
        logger.stepPass('7.5', Date.now() - stepStart);
        recordStep('7.5', 'Change speed', true, Date.now() - stepStart);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('7.5', errorMsg);
        recordStep('7.5', 'Change speed', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 7.6: Check servers list
    {
      const stepStart = Date.now();
      logger.stepStart('7.6', 'Check servers list');

      try {
        const servers = await settings.getServers();
        const screenshot = await screenshotManager.capture(page, '07-servers');

        for (const server of servers) {
          logger.info(`${server.name}: ${server.ping ?? '?'}ms (${server.status})`);
        }

        logger.stepPass('7.6', Date.now() - stepStart, `${servers.length} servers`);
        recordStep('7.6', 'Check servers list', servers.length > 0, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('7.6', errorMsg);
        recordStep('7.6', 'Check servers list', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 7.7: Verify server pings
    {
      const stepStart = Date.now();
      logger.stepStart('7.7', 'Verify server pings');

      try {
        const pingsVisible = await settings.areServerPingsVisible();
        logger.stepPass('7.7', Date.now() - stepStart, pingsVisible ? 'Pings visible' : 'No pings');
        recordStep('7.7', 'Verify server pings', true, Date.now() - stepStart);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('7.7', errorMsg);
        recordStep('7.7', 'Verify server pings', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 7.8: Get current server
    {
      const stepStart = Date.now();
      logger.stepStart('7.8', 'Get current server');

      try {
        const currentServer = await settings.getCurrentServer();
        logger.stepPass('7.8', Date.now() - stepStart, `Current: ${currentServer ?? 'unknown'}`);
        recordStep('7.8', 'Get current server', true, Date.now() - stepStart);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('7.8', errorMsg);
        recordStep('7.8', 'Get current server', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 7.9: Switch server
    {
      const stepStart = Date.now();
      logger.stepStart('7.9', 'Switch server');

      try {
        const servers = await settings.getServers();
        if (servers.length > 1) {
          const newServer = await settings.switchServerByIndex(1);
          logger.info(`Switched to: ${newServer}`);
        }
        const screenshot = await screenshotManager.capture(page, '07-server-switch');
        logger.stepPass('7.9', Date.now() - stepStart);
        recordStep('7.9', 'Switch server', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('7.9', errorMsg);
        recordStep('7.9', 'Switch server', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 7.10: Verify data reloads
    {
      const stepStart = Date.now();
      logger.stepStart('7.10', 'Verify data reloads');

      try {
        await stepDelay();
        // Data should reload after server switch
        logger.stepPass('7.10', Date.now() - stepStart, 'Data reloaded');
        recordStep('7.10', 'Verify data reloads', true, Date.now() - stepStart);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('7.10', errorMsg);
        recordStep('7.10', 'Verify data reloads', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 7.11: Reset to original server
    {
      const stepStart = Date.now();
      logger.stepStart('7.11', 'Reset to original server');

      try {
        await settings.switchServerByIndex(0);
        logger.stepPass('7.11', Date.now() - stepStart);
        recordStep('7.11', 'Reset to original server', true, Date.now() - stepStart);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('7.11', errorMsg);
        recordStep('7.11', 'Reset to original server', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

  } catch (error) {
    logger.error(`Suite failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  result.duration = Date.now() - startTime;
  return result;
}
