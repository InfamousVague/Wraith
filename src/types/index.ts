/**
 * @file types/index.ts
 * @description Central export for all application types.
 */

// Settings types
export {
  type DrawdownCalculationMethod,
  type AutoResetPeriod,
  type DrawdownProtectionSettings,
  type TradingSettings,
  DEFAULT_DRAWDOWN_PROTECTION,
  DEFAULT_TRADING_SETTINGS,
  getCalculationMethodLabel,
  getAutoResetLabel,
} from './settings';
