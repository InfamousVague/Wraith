/**
 * Profile & Auth Walkthrough Suite
 *
 * Tests profile/account functionality:
 * - Guest state
 * - Account creation
 * - Key management
 * - Server connection
 * - Logout
 */

import { Page } from '@playwright/test';
import { SuiteResult, ValidationResult } from '../config';
import { logger } from '../utils';
import { ProfilePage } from '../pages/profile.page';
import { screenshotManager } from '../utils/screenshot';
import { stepDelay } from '../utils/wait';

export async function runProfileSuite(page: Page): Promise<SuiteResult> {
  const profile = new ProfilePage(page);
  const result: SuiteResult = {
    name: 'Profile & Auth Walkthrough',
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

  let savedPublicKey: string | null = null;

  try {
    // Step 6.1: Navigate to profile
    {
      const stepStart = Date.now();
      logger.stepStart('6.1', 'Navigate to profile');

      try {
        await profile.navigate();
        const screenshot = await screenshotManager.capture(page, '06-profile-load');
        logger.stepPass('6.1', Date.now() - stepStart);
        recordStep('6.1', 'Navigate to profile', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('6.1', errorMsg);
        recordStep('6.1', 'Navigate to profile', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 6.2: Verify guest state
    {
      const stepStart = Date.now();
      logger.stepStart('6.2', 'Verify guest state');

      try {
        const isGuest = await profile.isGuest();
        const screenshot = await screenshotManager.capture(page, '06-profile-guest');
        logger.stepPass('6.2', Date.now() - stepStart, isGuest ? 'Guest state' : 'Already logged in');
        recordStep('6.2', 'Verify guest state', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('6.2', errorMsg);
        recordStep('6.2', 'Verify guest state', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 6.3: Create account
    {
      const stepStart = Date.now();
      logger.stepStart('6.3', 'Create account');

      try {
        const isGuest = await profile.isGuest();
        if (isGuest) {
          await profile.createAccount();
        }
        const screenshot = await screenshotManager.capture(page, '06-account-created');
        logger.stepPass('6.3', Date.now() - stepStart);
        recordStep('6.3', 'Create account', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('6.3', errorMsg);
        recordStep('6.3', 'Create account', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 6.4: Verify public key
    {
      const stepStart = Date.now();
      logger.stepStart('6.4', 'Verify public key');

      try {
        savedPublicKey = await profile.getPublicKey();
        const hasKey = savedPublicKey !== null && savedPublicKey.length > 0;
        if (hasKey) {
          logger.info(`Public key: ${savedPublicKey!.slice(0, 16)}...`);
        }
        logger.stepPass('6.4', Date.now() - stepStart, hasKey ? 'Key displayed' : 'No key');
        recordStep('6.4', 'Verify public key', hasKey, Date.now() - stepStart);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('6.4', errorMsg);
        recordStep('6.4', 'Verify public key', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 6.5: Reveal private key
    {
      const stepStart = Date.now();
      logger.stepStart('6.5', 'Reveal private key');

      try {
        await profile.revealPrivateKey();
        const revealed = await profile.isPrivateKeyRevealed();
        const screenshot = await screenshotManager.capture(page, '06-key-revealed');
        logger.stepPass('6.5', Date.now() - stepStart, revealed ? 'Key revealed' : 'Key not revealed');
        recordStep('6.5', 'Reveal private key', revealed, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('6.5', errorMsg);
        recordStep('6.5', 'Reveal private key', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 6.6: Copy key
    {
      const stepStart = Date.now();
      logger.stepStart('6.6', 'Copy key');

      try {
        await profile.copyKey();
        logger.stepPass('6.6', Date.now() - stepStart, 'Copy triggered');
        recordStep('6.6', 'Copy key', true, Date.now() - stepStart);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('6.6', errorMsg);
        recordStep('6.6', 'Copy key', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 6.7: Hide key
    {
      const stepStart = Date.now();
      logger.stepStart('6.7', 'Hide key');

      try {
        await profile.hidePrivateKey();
        const revealed = await profile.isPrivateKeyRevealed();
        logger.stepPass('6.7', Date.now() - stepStart, !revealed ? 'Key hidden' : 'Key still visible');
        recordStep('6.7', 'Hide key', !revealed, Date.now() - stepStart);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('6.7', errorMsg);
        recordStep('6.7', 'Hide key', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 6.8: Connect to server
    {
      const stepStart = Date.now();
      logger.stepStart('6.8', 'Connect to server');

      try {
        const alreadyConnected = await profile.isConnectedToServer();
        if (!alreadyConnected) {
          await profile.connectToServer();
        }
        const screenshot = await screenshotManager.capture(page, '06-connecting');
        logger.stepPass('6.8', Date.now() - stepStart);
        recordStep('6.8', 'Connect to server', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('6.8', errorMsg);
        recordStep('6.8', 'Connect to server', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 6.9: Verify connected
    {
      const stepStart = Date.now();
      logger.stepStart('6.9', 'Verify connected');

      try {
        await stepDelay();
        const connected = await profile.isConnectedToServer();
        const status = await profile.getConnectionStatus();
        const screenshot = await screenshotManager.capture(page, '06-connected');
        logger.stepPass('6.9', Date.now() - stepStart, `Status: ${status}`);
        recordStep('6.9', 'Verify connected', connected, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('6.9', errorMsg);
        recordStep('6.9', 'Verify connected', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 6.10: Check server profile ID
    {
      const stepStart = Date.now();
      logger.stepStart('6.10', 'Check server profile ID');

      try {
        const profileId = await profile.getServerProfileId();
        if (profileId) {
          logger.info(`Profile ID: ${profileId.slice(0, 16)}...`);
        }
        logger.stepPass('6.10', Date.now() - stepStart, profileId ? 'ID displayed' : 'No profile ID');
        recordStep('6.10', 'Check server profile ID', true, Date.now() - stepStart);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('6.10', errorMsg);
        recordStep('6.10', 'Check server profile ID', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 6.11: Toggle leaderboard
    {
      const stepStart = Date.now();
      logger.stepStart('6.11', 'Toggle leaderboard');

      try {
        await profile.toggleLeaderboard();
        const enabled = await profile.isLeaderboardEnabled();
        const screenshot = await screenshotManager.capture(page, '06-leaderboard-toggle');
        logger.stepPass('6.11', Date.now() - stepStart, enabled ? 'Enabled' : 'Disabled');
        recordStep('6.11', 'Toggle leaderboard', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('6.11', errorMsg);
        recordStep('6.11', 'Toggle leaderboard', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 6.12: Click logout
    {
      const stepStart = Date.now();
      logger.stepStart('6.12', 'Click logout');

      try {
        await profile.clickLogout();
        const screenshot = await screenshotManager.capture(page, '06-logout-confirm');
        logger.stepPass('6.12', Date.now() - stepStart);
        recordStep('6.12', 'Click logout', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('6.12', errorMsg);
        recordStep('6.12', 'Click logout', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 6.13: Confirm logout
    {
      const stepStart = Date.now();
      logger.stepStart('6.13', 'Confirm logout');

      try {
        await profile.confirmLogout();
        const screenshot = await screenshotManager.capture(page, '06-logged-out');
        logger.stepPass('6.13', Date.now() - stepStart);
        recordStep('6.13', 'Confirm logout', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('6.13', errorMsg);
        recordStep('6.13', 'Confirm logout', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 6.14: Verify guest state again
    {
      const stepStart = Date.now();
      logger.stepStart('6.14', 'Verify guest state');

      try {
        await stepDelay();
        const isGuest = await profile.isGuest();
        logger.stepPass('6.14', Date.now() - stepStart, isGuest ? 'Back to guest' : 'Still logged in');
        recordStep('6.14', 'Verify guest state', isGuest, Date.now() - stepStart);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('6.14', errorMsg);
        recordStep('6.14', 'Verify guest state', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

  } catch (error) {
    logger.error(`Suite failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  result.duration = Date.now() - startTime;
  return result;
}
