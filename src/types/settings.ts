/**
 * @file settings.ts
 * @description Trading settings types for portfolio health and drawdown protection.
 */

/**
 * Method used to calculate drawdown percentage.
 * - `from_peak`: Calculate drawdown from the highest portfolio value achieved
 * - `from_initial`: Calculate drawdown from the initial portfolio balance
 * - `rolling_24h`: Calculate drawdown within a rolling 24-hour window
 */
export type DrawdownCalculationMethod = 'from_peak' | 'from_initial' | 'rolling_24h';

/**
 * Period after which trading automatically re-enables after hitting drawdown limit.
 * - `never`: Manual reset required
 * - `24h`: Auto-reset after 24 hours
 * - `7d`: Auto-reset after 7 days
 * - `30d`: Auto-reset after 30 days
 */
export type AutoResetPeriod = 'never' | '24h' | '7d' | '30d';

/**
 * Configuration for drawdown protection feature.
 * Controls when trading is paused to protect against excessive losses.
 */
export interface DrawdownProtectionSettings {
  /** Whether drawdown protection is enabled */
  enabled: boolean;
  /** Maximum drawdown percentage before trading is stopped (e.g., 20 for 20%) */
  maxDrawdownPercent: number;
  /** Method used to calculate current drawdown */
  calculationMethod: DrawdownCalculationMethod;
  /** Whether users can bypass protection for individual trades */
  allowBypass: boolean;
  /** Period after which trading automatically re-enables */
  autoResetAfter: AutoResetPeriod;
  /** Percentage of max drawdown at which to show warning (e.g., 75 means warn at 75% of max) */
  warningThresholdPercent: number;
}

/**
 * All trading-related settings for a user/portfolio.
 */
export interface TradingSettings {
  /** Drawdown protection configuration */
  drawdownProtection: DrawdownProtectionSettings;
  // Future: other trading settings can be added here
  // e.g., defaultLeverage, preferredOrderType, confirmationSettings, etc.
}

/**
 * Default drawdown protection settings.
 */
export const DEFAULT_DRAWDOWN_PROTECTION: DrawdownProtectionSettings = {
  enabled: true,
  maxDrawdownPercent: 20,
  calculationMethod: 'from_peak',
  allowBypass: true,
  autoResetAfter: 'never',
  warningThresholdPercent: 75,
};

/**
 * Default trading settings used when no saved settings exist.
 */
export const DEFAULT_TRADING_SETTINGS: TradingSettings = {
  drawdownProtection: DEFAULT_DRAWDOWN_PROTECTION,
};

/**
 * Helper to get the label for a drawdown calculation method.
 */
export function getCalculationMethodLabel(method: DrawdownCalculationMethod): string {
  switch (method) {
    case 'from_peak':
      return 'From Peak Value';
    case 'from_initial':
      return 'From Initial Balance';
    case 'rolling_24h':
      return 'Rolling 24 Hours';
  }
}

/**
 * Helper to get the label for an auto-reset period.
 */
export function getAutoResetLabel(period: AutoResetPeriod): string {
  switch (period) {
    case 'never':
      return 'Never';
    case '24h':
      return '24 Hours';
    case '7d':
      return '7 Days';
    case '30d':
      return '30 Days';
  }
}
