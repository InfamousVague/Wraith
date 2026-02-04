/**
 * Types for OrderBook components
 */

export interface PriceLevel {
  price: number;
  quantity: number;
  total: number;
}

export interface OrderBookPanelProps {
  /** Symbol to display order book for */
  symbol: string | undefined;
  /** Callback when a price level is clicked */
  onPriceSelect?: (price: number) => void;
  /** Loading state */
  loading?: boolean;
}

export interface PriceLevelProps {
  level: PriceLevel;
  maxTotal: number;
  side: "bid" | "ask";
  onClick?: (price: number) => void;
  priceDecimals?: number;
  quantityDecimals?: number;
}

export interface DepthBarProps {
  percentage: number;
  side: "bid" | "ask";
}

export interface SpreadDisplayProps {
  bidPrice?: number;
  askPrice?: number;
  priceDecimals?: number;
}
