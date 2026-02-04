/**
 * Types for PortfolioSummary component
 */

export interface PortfolioSummaryProps {
  /** Current account balance */
  balance: number;
  /** Margin currently used by open positions */
  marginUsed: number;
  /** Available margin for new positions */
  marginAvailable: number;
  /** Unrealized P&L from open positions */
  unrealizedPnl: number;
  /** Realized P&L from closed positions */
  realizedPnl: number;
  /** Loading state */
  loading?: boolean;
  /** Compact mode for mobile */
  compact?: boolean;
}
