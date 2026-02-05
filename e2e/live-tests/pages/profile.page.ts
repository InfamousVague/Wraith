/**
 * Profile Page Object
 *
 * Represents the profile/account page with authentication and keys.
 */

import { Page } from '@playwright/test';
import { BasePage } from './base.page';
import { logger, apiValidator } from '../utils';
import { stepDelay, waitForLoadingComplete, waitForAnimations } from '../utils/wait';

export class ProfilePage extends BasePage {
  protected readonly pageName = 'Profile';
  protected readonly pageUrl = '/profile';

  // Selectors - based on actual DOM structure from screenshots
  private selectors = {
    // Guest State - matches "No Account Connected" screen
    guestMessage: 'text=No Account Connected',
    createAccountButton: 'button:has-text("Create New Account")',
    importKeyButton: 'button:has-text("Import Private Key")',
    importKeyInput: 'input[placeholder*="private key"], input[placeholder*="hex"], input[placeholder*="64-character"]',

    // Account Info (when logged in)
    publicKey: '[class*="public-key"], [class*="PublicKey"]',
    privateKeyHidden: '[class*="private-key-hidden"]',
    privateKeyRevealed: '[class*="private-key-revealed"], [class*="PrivateKey"]',
    revealKeyButton: 'button:has-text("Reveal"), button:has-text("Show")',
    hideKeyButton: 'button:has-text("Hide")',
    copyKeyButton: 'button:has-text("Copy")',

    // Server Connection
    connectServerButton: 'button:has-text("Connect")',
    disconnectButton: 'button:has-text("Disconnect")',
    connectionStatus: '[class*="status"], text=Connected',
    serverProfileId: '[class*="profile-id"], [class*="ProfileId"]',
    serverName: '[class*="server-name"], [class*="ServerName"]',

    // Leaderboard Toggle
    leaderboardToggle: '[role="switch"], [type="checkbox"], [class*="toggle"], [class*="Toggle"]',

    // Auth Progress
    authProgress: '[class*="progress"], [class*="loading"], [class*="Progress"]',
    authChallenge: '[class*="challenge"]',

    // Logout
    logoutButton: 'button:has-text("Logout"), button:has-text("Log Out"), button:has-text("Sign Out")',
    confirmLogout: 'button:has-text("Confirm"), button:has-text("Yes")',
    cancelLogout: 'button:has-text("Cancel"), button:has-text("No")',

    // Import Key - on same page, no modal
    importKeyModal: '[role="dialog"]',
    confirmImport: 'button:has-text("Import")',
    cancelImport: 'button:has-text("Cancel")',

    // Loading
    loading: '[class*="loading"], [class*="spinner"]',
  };

  constructor(page: Page) {
    super(page);
  }

  // ========== State Checks ==========

  /**
   * Check if user is in guest state (not logged in)
   */
  async isGuest(): Promise<boolean> {
    // Check for "No Account Connected" text or "Create New Account" button
    const hasGuestMessage = await this.page.getByText('No Account Connected').isVisible().catch(() => false);
    const hasCreateButton = await this.page.getByRole('button', { name: /Create New Account/i }).isVisible().catch(() => false);
    return hasGuestMessage || hasCreateButton;
  }

  /**
   * Check if connected to server
   */
  async isConnectedToServer(): Promise<boolean> {
    try {
      const statusText = await this.getText(this.selectors.connectionStatus);
      return statusText.toLowerCase().includes('connected');
    } catch {
      return await this.isVisible(this.selectors.disconnectButton);
    }
  }

  /**
   * Get connection status text
   */
  async getConnectionStatus(): Promise<string> {
    return this.getText(this.selectors.connectionStatus);
  }

  // ========== Account Creation ==========

  /**
   * Create new account
   */
  async createAccount(): Promise<void> {
    // Click "Create New Account" button
    await this.page.getByRole('button', { name: /Create New Account/i }).click();
    await waitForLoadingComplete(this.page);
    await stepDelay();
  }

  /**
   * Get public key (after account created)
   */
  async getPublicKey(): Promise<string | null> {
    try {
      return await this.getText(this.selectors.publicKey);
    } catch {
      return null;
    }
  }

  // ========== Key Management ==========

  /**
   * Reveal private key
   */
  async revealPrivateKey(): Promise<void> {
    await this.click(this.selectors.revealKeyButton, 'Reveal Key');
    await waitForAnimations();
  }

  /**
   * Hide private key
   */
  async hidePrivateKey(): Promise<void> {
    await this.click(this.selectors.hideKeyButton, 'Hide Key');
    await waitForAnimations();
  }

  /**
   * Check if private key is revealed
   */
  async isPrivateKeyRevealed(): Promise<boolean> {
    return this.isVisible(this.selectors.privateKeyRevealed);
  }

  /**
   * Copy key to clipboard
   */
  async copyKey(): Promise<void> {
    await this.click(this.selectors.copyKeyButton, 'Copy Key');
    // Should show toast/feedback
    await stepDelay();
  }

  /**
   * Import existing key - key input is directly on page
   */
  async importKey(privateKey: string): Promise<void> {
    // Find the input field for private key
    const input = this.page.getByPlaceholder(/private key/i).or(
      this.page.getByPlaceholder(/hex/i)
    ).or(
      this.page.getByPlaceholder(/64-character/i)
    );

    // Enter the key
    await input.fill(privateKey);
    await stepDelay();

    // Click Import button
    await this.page.getByRole('button', { name: /Import Private Key/i }).click();
    await waitForLoadingComplete(this.page);
  }

  // ========== Server Connection ==========

  /**
   * Connect to server
   */
  async connectToServer(): Promise<void> {
    await this.click(this.selectors.connectServerButton, 'Connect to Server');

    // Wait for auth process
    await waitForLoadingComplete(this.page);

    // Wait for connection status to update
    const maxWait = 10000;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      if (await this.isConnectedToServer()) {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    await stepDelay();
  }

  /**
   * Disconnect from server
   */
  async disconnectFromServer(): Promise<void> {
    await this.click(this.selectors.disconnectButton, 'Disconnect');
    await waitForLoadingComplete(this.page);
  }

  /**
   * Get server profile ID (after connected)
   */
  async getServerProfileId(): Promise<string | null> {
    try {
      return await this.getText(this.selectors.serverProfileId);
    } catch {
      return null;
    }
  }

  /**
   * Get connected server name
   */
  async getServerName(): Promise<string | null> {
    try {
      return await this.getText(this.selectors.serverName);
    } catch {
      return null;
    }
  }

  // ========== Leaderboard Toggle ==========

  /**
   * Toggle leaderboard participation
   */
  async toggleLeaderboard(): Promise<void> {
    await this.click(this.selectors.leaderboardToggle, 'Leaderboard Toggle');
    await waitForAnimations();
    await stepDelay();
  }

  /**
   * Check if leaderboard is enabled
   */
  async isLeaderboardEnabled(): Promise<boolean> {
    try {
      const toggle = this.page.locator(this.selectors.leaderboardToggle);
      const checked = await toggle.getAttribute('aria-checked');
      return checked === 'true';
    } catch {
      return false;
    }
  }

  // ========== Logout ==========

  /**
   * Click logout button
   */
  async clickLogout(): Promise<void> {
    await this.click(this.selectors.logoutButton, 'Logout');
  }

  /**
   * Confirm logout in modal
   */
  async confirmLogout(): Promise<void> {
    if (await this.isVisible(this.selectors.confirmLogout)) {
      await this.click(this.selectors.confirmLogout, 'Confirm Logout');
    }
    await waitForLoadingComplete(this.page);
  }

  /**
   * Full logout flow
   */
  async logout(): Promise<void> {
    await this.clickLogout();
    await this.confirmLogout();
    await stepDelay();
  }

  // ========== Full Flows ==========

  /**
   * Complete account creation and server connection flow
   */
  async createAccountAndConnect(): Promise<{ publicKey: string | null; profileId: string | null }> {
    // Create account if guest
    if (await this.isGuest()) {
      await this.createAccount();
    }

    const publicKey = await this.getPublicKey();

    // Connect to server
    if (!await this.isConnectedToServer()) {
      await this.connectToServer();
    }

    const profileId = await this.getServerProfileId();

    return { publicKey, profileId };
  }

  /**
   * Import key and connect
   */
  async importKeyAndConnect(privateKey: string): Promise<{ publicKey: string | null; profileId: string | null }> {
    await this.importKey(privateKey);
    const publicKey = await this.getPublicKey();

    if (!await this.isConnectedToServer()) {
      await this.connectToServer();
    }

    const profileId = await this.getServerProfileId();

    return { publicKey, profileId };
  }
}
