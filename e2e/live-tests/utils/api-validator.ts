/**
 * API Validator
 *
 * Validates UI values against API responses to ensure
 * the frontend displays accurate data.
 */

import { LIVE_TEST_CONFIG, ValidationResult } from '../config';
import { logger } from './logger';

// API response interfaces
interface AssetQuote {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap?: number;
  high24h?: number;
  low24h?: number;
}

interface Position {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  leverage: number;
  marginUsed: number;
  liquidationPrice?: number;
}

interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  status: 'open' | 'filled' | 'cancelled' | 'rejected';
  quantity: number;
  price?: number;
  filledQuantity?: number;
  avgFillPrice?: number;
}

interface Portfolio {
  cashBalance: number;
  marginUsed: number;
  equity: number;
  unrealizedPnl: number;
  realizedPnl: number;
}

interface LeaderboardEntry {
  rank: number;
  traderId: string;
  username?: string;
  pnl: number;
  pnlPercent: number;
  winRate: number;
  totalTrades: number;
}

class ApiValidator {
  private apiUrl: string;
  private sessionToken: string | null = null;

  constructor() {
    this.apiUrl = LIVE_TEST_CONFIG.API_URL;
  }

  setSessionToken(token: string): void {
    this.sessionToken = token;
  }

  private async fetch<T>(endpoint: string): Promise<T> {
    const url = `${this.apiUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.sessionToken) {
      headers['Authorization'] = `Bearer ${this.sessionToken}`;
    }

    const response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(LIVE_TEST_CONFIG.API_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Compare two values with optional tolerance for numbers
  private compare(uiValue: unknown, apiValue: unknown, tolerancePercent?: number): { match: boolean; tolerance?: number } {
    // For numbers, use tolerance
    if (typeof uiValue === 'number' && typeof apiValue === 'number') {
      if (apiValue === 0) {
        return { match: uiValue === 0, tolerance: 0 };
      }
      const tolerance = Math.abs(uiValue - apiValue) / Math.abs(apiValue) * 100;
      const maxTolerance = tolerancePercent ?? LIVE_TEST_CONFIG.TOLERANCE_PERCENT * 100;
      return { match: tolerance <= maxTolerance, tolerance };
    }

    // For strings, exact match
    if (typeof uiValue === 'string' && typeof apiValue === 'string') {
      return { match: uiValue.toLowerCase() === apiValue.toLowerCase() };
    }

    // For other types, strict equality
    return { match: uiValue === apiValue };
  }

  // Validate asset price
  async validateAssetPrice(symbol: string, uiPrice: number): Promise<ValidationResult> {
    try {
      const data = await this.fetch<AssetQuote>(`/api/crypto/${symbol}`);
      const comparison = this.compare(uiPrice, data.price);

      return {
        field: `${symbol} price`,
        uiValue: uiPrice,
        apiValue: data.price,
        match: comparison.match,
        tolerance: comparison.tolerance,
      };
    } catch (error) {
      return {
        field: `${symbol} price`,
        uiValue: uiPrice,
        apiValue: null,
        match: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Validate 24h change
  async validateAsset24hChange(symbol: string, uiChange: number): Promise<ValidationResult> {
    try {
      const data = await this.fetch<AssetQuote>(`/api/crypto/${symbol}`);
      const comparison = this.compare(uiChange, data.changePercent24h, 0.1); // Allow 0.1% diff

      return {
        field: `${symbol} 24h change`,
        uiValue: uiChange,
        apiValue: data.changePercent24h,
        match: comparison.match,
        tolerance: comparison.tolerance,
      };
    } catch (error) {
      return {
        field: `${symbol} 24h change`,
        uiValue: uiChange,
        apiValue: null,
        match: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Validate asset count on dashboard
  async validateAssetCount(uiCount: number): Promise<ValidationResult> {
    try {
      const data = await this.fetch<{ items: unknown[] }>('/api/crypto/listings?limit=200');
      const comparison = this.compare(uiCount, data.items.length);

      return {
        field: 'Asset count',
        uiValue: uiCount,
        apiValue: data.items.length,
        match: comparison.match,
      };
    } catch (error) {
      return {
        field: 'Asset count',
        uiValue: uiCount,
        apiValue: null,
        match: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Validate position details
  async validatePosition(positionId: string, uiPosition: Partial<Position>): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    try {
      const data = await this.fetch<Position>(`/api/trading/positions/${positionId}`);

      if (uiPosition.symbol !== undefined) {
        results.push({
          field: 'Position symbol',
          uiValue: uiPosition.symbol,
          apiValue: data.symbol,
          match: uiPosition.symbol === data.symbol,
        });
      }

      if (uiPosition.side !== undefined) {
        results.push({
          field: 'Position side',
          uiValue: uiPosition.side,
          apiValue: data.side,
          match: uiPosition.side === data.side,
        });
      }

      if (uiPosition.size !== undefined) {
        const comparison = this.compare(uiPosition.size, data.size);
        results.push({
          field: 'Position size',
          uiValue: uiPosition.size,
          apiValue: data.size,
          match: comparison.match,
          tolerance: comparison.tolerance,
        });
      }

      if (uiPosition.entryPrice !== undefined) {
        const comparison = this.compare(uiPosition.entryPrice, data.entryPrice);
        results.push({
          field: 'Entry price',
          uiValue: uiPosition.entryPrice,
          apiValue: data.entryPrice,
          match: comparison.match,
          tolerance: comparison.tolerance,
        });
      }

      if (uiPosition.leverage !== undefined) {
        results.push({
          field: 'Leverage',
          uiValue: uiPosition.leverage,
          apiValue: data.leverage,
          match: uiPosition.leverage === data.leverage,
        });
      }

    } catch (error) {
      results.push({
        field: 'Position fetch',
        uiValue: positionId,
        apiValue: null,
        match: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return results;
  }

  // Validate portfolio summary
  async validatePortfolio(uiPortfolio: Partial<Portfolio>): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    try {
      const data = await this.fetch<Portfolio>('/api/trading/portfolios');

      if (uiPortfolio.cashBalance !== undefined) {
        const comparison = this.compare(uiPortfolio.cashBalance, data.cashBalance);
        results.push({
          field: 'Cash balance',
          uiValue: uiPortfolio.cashBalance,
          apiValue: data.cashBalance,
          match: comparison.match,
          tolerance: comparison.tolerance,
        });
      }

      if (uiPortfolio.marginUsed !== undefined) {
        const comparison = this.compare(uiPortfolio.marginUsed, data.marginUsed);
        results.push({
          field: 'Margin used',
          uiValue: uiPortfolio.marginUsed,
          apiValue: data.marginUsed,
          match: comparison.match,
          tolerance: comparison.tolerance,
        });
      }

      if (uiPortfolio.unrealizedPnl !== undefined) {
        const comparison = this.compare(uiPortfolio.unrealizedPnl, data.unrealizedPnl, 1); // Allow 1% diff for real-time P&L
        results.push({
          field: 'Unrealized P&L',
          uiValue: uiPortfolio.unrealizedPnl,
          apiValue: data.unrealizedPnl,
          match: comparison.match,
          tolerance: comparison.tolerance,
        });
      }

    } catch (error) {
      results.push({
        field: 'Portfolio fetch',
        uiValue: null,
        apiValue: null,
        match: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return results;
  }

  // Validate leaderboard entry
  async validateLeaderboardEntry(rank: number, uiEntry: Partial<LeaderboardEntry>): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    try {
      const data = await this.fetch<{ entries: LeaderboardEntry[] }>('/api/trading/leaderboard?limit=100');
      const apiEntry = data.entries.find(e => e.rank === rank);

      if (!apiEntry) {
        results.push({
          field: `Rank ${rank} entry`,
          uiValue: uiEntry,
          apiValue: null,
          match: false,
          error: `Rank ${rank} not found in API response`,
        });
        return results;
      }

      if (uiEntry.pnl !== undefined) {
        const comparison = this.compare(uiEntry.pnl, apiEntry.pnl);
        results.push({
          field: `Rank ${rank} P&L`,
          uiValue: uiEntry.pnl,
          apiValue: apiEntry.pnl,
          match: comparison.match,
          tolerance: comparison.tolerance,
        });
      }

      if (uiEntry.winRate !== undefined) {
        const comparison = this.compare(uiEntry.winRate, apiEntry.winRate);
        results.push({
          field: `Rank ${rank} Win Rate`,
          uiValue: uiEntry.winRate,
          apiValue: apiEntry.winRate,
          match: comparison.match,
          tolerance: comparison.tolerance,
        });
      }

    } catch (error) {
      results.push({
        field: 'Leaderboard fetch',
        uiValue: null,
        apiValue: null,
        match: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return results;
  }

  // Validate order status
  async validateOrderStatus(orderId: string, expectedStatus: Order['status']): Promise<ValidationResult> {
    try {
      const data = await this.fetch<Order>(`/api/trading/orders/${orderId}`);

      return {
        field: `Order ${orderId.slice(0, 8)} status`,
        uiValue: expectedStatus,
        apiValue: data.status,
        match: expectedStatus === data.status,
      };
    } catch (error) {
      return {
        field: `Order ${orderId.slice(0, 8)} status`,
        uiValue: expectedStatus,
        apiValue: null,
        match: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Validate signal data
  async validateSignalScore(symbol: string, uiScore: number): Promise<ValidationResult> {
    try {
      const data = await this.fetch<{ compositeScore: number }>(`/api/signals/${symbol}`);
      const comparison = this.compare(uiScore, data.compositeScore, 0.5);

      return {
        field: `${symbol} signal score`,
        uiValue: uiScore,
        apiValue: data.compositeScore,
        match: comparison.match,
        tolerance: comparison.tolerance,
      };
    } catch (error) {
      return {
        field: `${symbol} signal score`,
        uiValue: uiScore,
        apiValue: null,
        match: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Batch validate multiple assets
  async validateAssets(
    assets: Array<{ symbol: string; price: number; change24h?: number }>
  ): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    for (const asset of assets) {
      const priceResult = await this.validateAssetPrice(asset.symbol, asset.price);
      results.push(priceResult);
      logger.validation(priceResult);

      if (asset.change24h !== undefined) {
        const changeResult = await this.validateAsset24hChange(asset.symbol, asset.change24h);
        results.push(changeResult);
        logger.validation(changeResult);
      }
    }

    return results;
  }
}

// Export singleton instance
export const apiValidator = new ApiValidator();
