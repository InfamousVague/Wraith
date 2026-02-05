/**
 * Dashboard Page Object
 *
 * Represents the main dashboard/home page with asset listings.
 */

import { Page } from '@playwright/test';
import { BasePage } from './base.page';
import { logger, apiValidator } from '../utils';
import { stepDelay, waitForAnimations } from '../utils/wait';
import { ValidationResult } from '../config';

export interface AssetRowData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume?: number;
  marketCap?: number;
}

export class DashboardPage extends BasePage {
  protected readonly pageName = 'Dashboard';
  protected readonly pageUrl = '/';

  // Selectors - based on actual DOM structure
  private selectors = {
    // Asset Prices table - matches actual Wraith UI structure
    assetSection: 'text=Asset Prices',
    assetRow: 'table tbody tr, [class*="AssetRow"], [class*="asset-row"]',
    assetSymbol: 'td:nth-child(2) span, [class*="symbol"]',
    assetName: 'td:nth-child(2) div, [class*="name"]',
    assetPrice: 'td:nth-child(3), [class*="price"]',
    assetChange: '[class*="change"], td:has-text("%")',
    assetVolume: 'td:nth-child(7)',
    assetMarketCap: 'td:nth-child(5)',
    // Filter tabs - using visible text
    filterAll: 'button:has-text("All")',
    filterCrypto: 'button:has-text("Crypto")',
    filterStocks: 'button:has-text("Stocks")',
    // Sort dropdown
    sortDropdown: 'button:has-text("Market Cap"), [class*="sort"]',
    // View toggle buttons
    viewToggleGrid: 'button:has-text("Charts"), [aria-label*="grid"], [title*="Charts"]',
    viewToggleList: 'button:has-text("List"), [aria-label*="list"], [title*="List"]',
    cardSizeSlider: '[type="range"], [class*="slider"]',
    // Search input
    searchInput: 'input[placeholder*="Search"], input[type="search"]',
    searchResults: '[class*="search-result"], [class*="SearchResult"]',
    loading: '[class*="loading"], [class*="spinner"]',
    // Trade button
    tradeButton: 'button:has-text("Trade")',
    // Alternative selectors as fallback
    altAssetList: '.asset-list, .assets-container',
    altAssetRow: 'tr:has(button:has-text("Trade"))',
  };

  constructor(page: Page) {
    super(page);
  }

  /**
   * Wait for assets to load
   */
  async waitForAssetsToLoad(): Promise<void> {
    // Wait for "Asset Prices" section and rows with Trade buttons
    try {
      // First wait for the asset prices header
      await this.page.getByText('Asset Prices').waitFor({ state: 'visible', timeout: 10000 });
      // Then wait for at least one Trade button which indicates rows are loaded
      await this.page.locator('button:has-text("Trade")').first().waitFor({ state: 'visible', timeout: 10000 });
    } catch {
      logger.warn('Asset rows not found with expected selectors, checking page structure...');
    }
    await stepDelay();
  }

  /**
   * Get count of visible assets
   */
  async getAssetCount(): Promise<number> {
    // Count rows by counting Trade buttons (each asset row has one)
    let count = await this.page.locator('button:has-text("Trade")').count();
    if (count === 0) {
      // Fallback: try counting table rows
      count = await this.page.locator('table tbody tr').count();
    }
    return count;
  }

  /**
   * Get asset data from a specific row
   */
  async getAssetData(index: number): Promise<AssetRowData | null> {
    try {
      // Find rows that contain a Trade button (these are asset rows)
      const rows = this.page.locator('tr:has(button:has-text("Trade"))');
      const row = rows.nth(index);

      // The structure appears to be: [rank] [logo+name+symbol] [price] [trade] [change%] [market cap] [volume] [chart]
      // Get the cell containing name and symbol
      const nameCell = row.locator('td').nth(1); // Second cell has name/symbol
      const fullText = await nameCell.textContent().catch(() => '');

      // Parse name and symbol from the text (e.g., "Bitcoin BTC" or "Ethereum ETH")
      let name = '';
      let symbol = '';
      if (fullText) {
        const parts = fullText.trim().split(/\s+/);
        if (parts.length >= 2) {
          // Last part is usually the symbol, rest is name
          symbol = parts[parts.length - 1];
          name = parts.slice(0, -1).join(' ');
        } else if (parts.length === 1) {
          symbol = parts[0];
          name = parts[0];
        }
      }

      // Get price from third cell
      const priceText = await row.locator('td').nth(2).textContent().catch(() => null);

      // Get 24h change - look for percentage text
      let changeText = '';
      const allCells = await row.locator('td').all();
      for (const cell of allCells) {
        const text = await cell.textContent().catch(() => '');
        if (text && text.includes('%') && !text.includes('Trade')) {
          changeText = text;
          break;
        }
      }

      if (!symbol || !priceText) {
        logger.warn(`Could not extract data from asset row ${index}`);
        return null;
      }

      return {
        symbol: symbol.trim(),
        name: name.trim(),
        price: this.parsePrice(priceText),
        change24h: changeText ? this.parsePercent(changeText) : 0,
      };
    } catch (error) {
      logger.warn(`Failed to get asset data for row ${index}: ${error}`);
      return null;
    }
  }

  /**
   * Get data for first N assets
   */
  async getTopAssets(count: number = 5): Promise<AssetRowData[]> {
    const assets: AssetRowData[] = [];
    const totalCount = await this.getAssetCount();

    for (let i = 0; i < Math.min(count, totalCount); i++) {
      const data = await this.getAssetData(i);
      if (data) {
        assets.push(data);
      }
    }

    return assets;
  }

  /**
   * Validate asset prices against API
   */
  async validateAssetPrices(count: number = 5): Promise<ValidationResult[]> {
    const assets = await this.getTopAssets(count);
    return apiValidator.validateAssets(assets.map(a => ({
      symbol: a.symbol,
      price: a.price,
      change24h: a.change24h,
    })));
  }

  /**
   * Click on filter tab
   */
  async clickFilter(filter: 'all' | 'crypto' | 'stocks'): Promise<void> {
    const selectorMap = {
      all: this.selectors.filterAll,
      crypto: this.selectors.filterCrypto,
      stocks: this.selectors.filterStocks,
    };

    try {
      await this.click(selectorMap[filter], `Filter: ${filter}`);
    } catch {
      // Try by text content
      await this.page.getByText(filter, { exact: false }).first().click();
      await stepDelay();
    }
  }

  /**
   * Change sort option
   */
  async changeSort(sortBy: string): Promise<void> {
    try {
      await this.click(this.selectors.sortDropdown, 'Sort dropdown');
      await this.page.getByText(sortBy, { exact: false }).click();
      await stepDelay();
    } catch {
      logger.warn(`Sort dropdown not found, trying alternative`);
    }
  }

  /**
   * Toggle to grid view (Charts view in Wraith)
   */
  async toggleGridView(): Promise<void> {
    try {
      // Look for the Charts button in the view toggle area
      await this.page.getByRole('button', { name: /charts/i }).click();
      await stepDelay();
    } catch {
      try {
        // Try clicking text that contains "Charts"
        await this.page.locator('button:has-text("Charts")').first().click();
        await stepDelay();
      } catch {
        logger.warn('Grid/Charts view toggle not found - may not exist in current view');
      }
    }
  }

  /**
   * Toggle to list view
   */
  async toggleListView(): Promise<void> {
    try {
      // Look for the List button in the view toggle area
      await this.page.getByRole('button', { name: /list/i }).click();
      await stepDelay();
    } catch {
      try {
        await this.page.locator('button:has-text("List")').first().click();
        await stepDelay();
      } catch {
        logger.warn('List view toggle not found - may not exist in current view');
      }
    }
  }

  /**
   * Use search
   */
  async search(query: string): Promise<void> {
    try {
      await this.type(this.selectors.searchInput, query, { clear: true });
    } catch {
      // Try finding search by placeholder or role
      const searchInput = this.page.getByPlaceholder(/search/i).or(
        this.page.getByRole('searchbox')
      );
      await searchInput.fill(query);
    }
    await waitForAnimations();
    await stepDelay();
  }

  /**
   * Clear search
   */
  async clearSearch(): Promise<void> {
    try {
      await this.type(this.selectors.searchInput, '', { clear: true });
    } catch {
      const searchInput = this.page.getByPlaceholder(/search/i).or(
        this.page.getByRole('searchbox')
      );
      await searchInput.clear();
    }
    await waitForAnimations();
    await stepDelay();
  }

  /**
   * Click on an asset to navigate to detail
   */
  async clickAsset(symbol: string): Promise<void> {
    // Find the row containing this symbol and click the name/symbol area (not the Trade button)
    const row = this.page.locator(`tr:has(button:has-text("Trade"))`).filter({ hasText: symbol }).first();
    // Click on the name cell (second cell) to navigate to detail
    const nameCell = row.locator('td').nth(1);
    await nameCell.click();
    await stepDelay();
  }

  /**
   * Click on first asset
   */
  async clickFirstAsset(): Promise<string | null> {
    const firstAsset = await this.getAssetData(0);
    if (firstAsset) {
      await this.clickAsset(firstAsset.symbol);
      return firstAsset.symbol;
    }

    // Fallback: just click the first row's name cell
    try {
      const firstRow = this.page.locator('tr:has(button:has-text("Trade"))').first();
      const nameCell = firstRow.locator('td').nth(1);
      await nameCell.click();
      await stepDelay();
      return 'unknown';
    } catch {
      return null;
    }
  }

  /**
   * Adjust card size slider (if available)
   */
  async adjustCardSize(value: number): Promise<void> {
    try {
      const slider = this.page.locator(this.selectors.cardSizeSlider);
      if (await slider.isVisible()) {
        await slider.fill(String(value));
        await waitForAnimations();
        await stepDelay();
      }
    } catch {
      logger.verbose('Card size slider not available');
    }
  }

  /**
   * Check if in grid view
   */
  async isGridView(): Promise<boolean> {
    // Check for grid layout class or active toggle
    const hasGridClass = await this.page.locator('[class*="grid"]').first().isVisible().catch(() => false);
    const gridToggleActive = await this.page.locator(`${this.selectors.viewToggleGrid}[class*="active"]`).isVisible().catch(() => false);
    return hasGridClass || gridToggleActive;
  }
}
