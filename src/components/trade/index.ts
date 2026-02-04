/**
 * @file trade/index.ts
 * @description Trade sandbox components for paper trading.
 */

// Portfolio Summary
export { PortfolioSummary } from "./portfolio-summary";
export type { PortfolioSummaryProps } from "./portfolio-summary";

// Order Form
export { OrderForm } from "./order-form";
export { OrderTypeSelector, SideToggle, PriceInput, SizeInput, LeverageSlider, QuickSizeButtons, OrderSummary } from "./order-form";
export type {
  OrderFormProps,
  OrderFormState,
  OrderType,
  OrderSide,
  MarginMode,
} from "./order-form";

// Positions
export { PositionsTable } from "./positions";
export type { Position, PositionsTableProps } from "./positions";

// Orders
export { OrdersTable } from "./orders";
export type { Order, OrdersTableProps } from "./orders";

// Trade History
export { TradeHistoryTable } from "./trade-history";
export type { Trade, TradeHistoryTableProps } from "./trade-history";

// Modals
export { OrderConfirmModal, TradeReceiptModal, ClosePositionModal, ModifyPositionModal, DrawdownWarningModal } from "./modals";
export type { OrderConfirmModalProps, TradeReceiptModalProps, ClosePositionModalProps, ModifyPositionModalProps } from "./modals";

// Alerts
export { AlertsPanel, CreateAlertModal } from "./alerts";

// Common (types only until implemented)
export type {
  TradingPairProps,
  DirectionBadgeProps,
} from "./common";

// Utilities
export {
  validatePrice,
  validateSize,
  validateLeverage,
  validateMargin,
  formatPrice,
  formatQuantity,
  formatPercent,
  formatLeverage,
  formatCompactUsd,
  formatTradeTime,
} from "./order-form";
