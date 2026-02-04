/**
 * Types for common trade components
 */

export interface TradingPairProps {
  base: string;
  quote?: string;
  size?: "small" | "medium" | "large";
}

export interface DirectionBadgeProps {
  direction: "long" | "short";
  size?: "small" | "medium" | "large";
}

export interface LiquidationPriceProps {
  price: number;
  currentPrice: number;
  side: "long" | "short";
}

export interface MarginModeToggleProps {
  value: "isolated" | "cross";
  onChange: (mode: "isolated" | "cross") => void;
}
