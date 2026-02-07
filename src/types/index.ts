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

// Tap Trading types
export {
  type GridConfig,
  type TapPosition,
  type TapPositionStatus,
  type TileVisualState,
  type TapStats,
  type TapNotification,
  type TapNotificationType,
  type TapSettings,
  type MultiplierColorMode,
  type GridLineStyle,
  type SparklineThickness,
  type GlowIntensity,
  type AnimationSpeed,
  type GridMultiplierUpdate,
  type GridTradePlaced,
  type GridTradeResolved,
  type GridColumnExpired,
  type PlaceTradeRequest,
  type UseTapTradingReturn,
  DEFAULT_TAP_SETTINGS,
} from './tap-trading';
