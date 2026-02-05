/**
 * Settings Page Object
 *
 * Represents the settings page with language, speed, and server selection.
 */

import { Page } from '@playwright/test';
import { BasePage } from './base.page';
import { logger } from '../utils';
import { stepDelay, waitForAnimations, waitForLoadingComplete } from '../utils/wait';

export interface ServerInfo {
  name: string;
  url?: string;
  ping?: number;
  status?: 'online' | 'offline' | 'unknown';
}

export class SettingsPage extends BasePage {
  protected readonly pageName = 'Settings';
  protected readonly pageUrl = '/settings';

  // Selectors
  private selectors = {
    // Language
    languageDropdown: '[data-testid="language-dropdown"], select[name="language"]',
    languageOption: '[data-testid="language-option"]',

    // Speed
    speedSelector: '[data-testid="speed-selector"], [class*="speed"]',
    speedOption: '[data-testid="speed-option"]',
    speed1x: '[data-testid="speed-1x"], button:has-text("1x")',
    speed2x: '[data-testid="speed-2x"], button:has-text("2x")',
    speed5x: '[data-testid="speed-5x"], button:has-text("5x")',

    // Drawdown Protection
    drawdownToggle: '[data-testid="drawdown-toggle"]',
    drawdownLimit: '[data-testid="drawdown-limit"], input[name="drawdownLimit"]',

    // Server Selection
    serverList: '[data-testid="server-list"], [class*="server-list"]',
    serverRow: '[data-testid="server-row"], [class*="server-item"]',
    serverName: '[data-testid="server-name"]',
    serverPing: '[data-testid="server-ping"], [class*="ping"]',
    serverStatus: '[data-testid="server-status"], [class*="status"]',
    serverSelect: '[data-testid="server-select"], button:has-text("Connect")',
    currentServer: '[data-testid="current-server"], [class*="active-server"]',

    // Theme (if available)
    themeToggle: '[data-testid="theme-toggle"]',
    themeDark: '[data-testid="theme-dark"]',
    themeLight: '[data-testid="theme-light"]',

    // Notifications
    notificationsToggle: '[data-testid="notifications-toggle"]',
    soundToggle: '[data-testid="sound-toggle"]',

    // Loading
    loading: '[data-testid="loading"]',
  };

  constructor(page: Page) {
    super(page);
  }

  // ========== Language ==========

  /**
   * Get current language
   */
  async getCurrentLanguage(): Promise<string> {
    try {
      const dropdown = this.page.locator(this.selectors.languageDropdown);
      return await dropdown.inputValue();
    } catch {
      return 'unknown';
    }
  }

  /**
   * Change language
   */
  async changeLanguage(language: string): Promise<void> {
    await this.select(this.selectors.languageDropdown, language);
    await waitForLoadingComplete(this.page);
  }

  /**
   * Get available languages
   */
  async getAvailableLanguages(): Promise<string[]> {
    const options = this.page.locator(`${this.selectors.languageDropdown} option`);
    const count = await options.count();
    const languages: string[] = [];

    for (let i = 0; i < count; i++) {
      const value = await options.nth(i).getAttribute('value');
      if (value) languages.push(value);
    }

    return languages;
  }

  // ========== Speed ==========

  /**
   * Get current speed
   */
  async getCurrentSpeed(): Promise<string | null> {
    try {
      // Look for active speed button
      const activeSpeed = this.page.locator('[data-testid^="speed-"][class*="active"], [data-testid^="speed-"][aria-pressed="true"]');
      return await activeSpeed.textContent();
    } catch {
      return null;
    }
  }

  /**
   * Set speed
   */
  async setSpeed(speed: '1x' | '2x' | '5x'): Promise<void> {
    const selectorMap = {
      '1x': this.selectors.speed1x,
      '2x': this.selectors.speed2x,
      '5x': this.selectors.speed5x,
    };

    await this.click(selectorMap[speed], `Speed: ${speed}`);
    await waitForAnimations();
  }

  // ========== Drawdown Protection ==========

  /**
   * Check if drawdown protection is enabled
   */
  async isDrawdownProtectionEnabled(): Promise<boolean> {
    try {
      const toggle = this.page.locator(this.selectors.drawdownToggle);
      const checked = await toggle.getAttribute('aria-checked');
      return checked === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Toggle drawdown protection
   */
  async toggleDrawdownProtection(): Promise<void> {
    await this.click(this.selectors.drawdownToggle, 'Drawdown Toggle');
    await waitForAnimations();
  }

  /**
   * Set drawdown limit
   */
  async setDrawdownLimit(limit: number): Promise<void> {
    await this.type(this.selectors.drawdownLimit, String(limit), { clear: true });
    await stepDelay();
  }

  // ========== Server Selection ==========

  /**
   * Get list of available servers
   */
  async getServers(): Promise<ServerInfo[]> {
    const servers: ServerInfo[] = [];
    const rows = this.page.locator(this.selectors.serverRow);
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);

      const name = await row.locator(this.selectors.serverName).textContent().catch(() => null);
      const pingText = await row.locator(this.selectors.serverPing).textContent().catch(() => null);
      const statusText = await row.locator(this.selectors.serverStatus).textContent().catch(() => null);

      if (name) {
        servers.push({
          name: name.trim(),
          ping: pingText ? parseInt(pingText.replace(/[^0-9]/g, '')) : undefined,
          status: statusText?.toLowerCase().includes('online') ? 'online' :
                  statusText?.toLowerCase().includes('offline') ? 'offline' : 'unknown',
        });
      }
    }

    return servers;
  }

  /**
   * Get current server
   */
  async getCurrentServer(): Promise<string | null> {
    try {
      return await this.getText(this.selectors.currentServer);
    } catch {
      return null;
    }
  }

  /**
   * Switch to a specific server
   */
  async switchServer(serverName: string): Promise<void> {
    // Find the server row with matching name
    const serverRow = this.page.locator(this.selectors.serverRow).filter({ hasText: serverName });
    const selectButton = serverRow.locator(this.selectors.serverSelect);

    await selectButton.click();
    logger.verbose(`Switching to server: ${serverName}`);

    await waitForLoadingComplete(this.page);
    await stepDelay();
  }

  /**
   * Switch to server by index
   */
  async switchServerByIndex(index: number): Promise<string | null> {
    const servers = await this.getServers();
    if (index >= servers.length) {
      logger.warn(`Server index ${index} out of range (${servers.length} servers)`);
      return null;
    }

    await this.switchServer(servers[index].name);
    return servers[index].name;
  }

  /**
   * Check server pings are visible
   */
  async areServerPingsVisible(): Promise<boolean> {
    const servers = await this.getServers();
    return servers.some(s => s.ping !== undefined);
  }

  // ========== Theme ==========

  /**
   * Check if theme toggle is available
   */
  async isThemeToggleAvailable(): Promise<boolean> {
    return this.isVisible(this.selectors.themeToggle);
  }

  /**
   * Set theme
   */
  async setTheme(theme: 'dark' | 'light'): Promise<void> {
    const selector = theme === 'dark' ? this.selectors.themeDark : this.selectors.themeLight;
    try {
      await this.click(selector, `Theme: ${theme}`);
      await waitForAnimations();
    } catch {
      logger.verbose('Theme selector not available');
    }
  }

  // ========== Notifications ==========

  /**
   * Toggle notifications
   */
  async toggleNotifications(): Promise<void> {
    await this.click(this.selectors.notificationsToggle, 'Notifications Toggle');
    await waitForAnimations();
  }

  /**
   * Toggle sound
   */
  async toggleSound(): Promise<void> {
    await this.click(this.selectors.soundToggle, 'Sound Toggle');
    await waitForAnimations();
  }
}
