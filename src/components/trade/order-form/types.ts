/**
 * Types for OrderForm components
 */

export type OrderType = "market" | "limit" | "stop_loss" | "take_profit" | "stop_limit" | "trailing_stop";
export type OrderSide = "buy" | "sell";
export type MarginMode = "isolated" | "cross";
export type TimeInForce = "gtc" | "ioc" | "fok" | "gtd";

export interface OrderFormState {
  symbol?: string;
  orderType: OrderType;
  side: OrderSide;
  price: string;
  /** Stop/trigger price for stop orders */
  stopPrice?: string;
  size: string;
  leverage: number;
  marginMode: MarginMode;
  timeInForce: TimeInForce;
  stopLoss?: string;
  takeProfit?: string;
  /** Trail percentage for trailing stop orders */
  trailPercent?: string;
  reduceOnly?: boolean;
  postOnly?: boolean;
}

/** Price selection from order book - includes side to auto-set buy/sell */
export interface PriceSelection {
  price: number;
  /** bid = buy at this price (taking from sellers), ask = sell at this price (taking from buyers) */
  side: "bid" | "ask";
}

export interface OrderFormProps {
  /** Current symbol to trade */
  symbol: string;
  /** Current mark price */
  currentPrice?: number;
  /** Available margin for new positions */
  availableMargin: number;
  /** Callback when order is submitted */
  onSubmit?: (order: OrderFormState) => void;
  /** Loading state */
  loading?: boolean;
  /** Callback when price is selected from order book */
  onPriceSelect?: (price: number, side: "bid" | "ask") => void;
  /** Price selection event from order book (object identity changes per click) */
  priceSelection?: PriceSelection | null;
  /** Disable the form (e.g., when not authenticated) */
  disabled?: boolean;
  /** Message to show when disabled */
  disabledMessage?: string;
}

export interface OrderTypeSelectorProps {
  value: OrderType;
  onChange: (type: OrderType) => void;
}

export interface SideToggleProps {
  value: OrderSide;
  onChange: (side: OrderSide) => void;
}

export interface PriceInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

export interface SizeInputProps {
  value: string;
  onChange: (value: string) => void;
  currentPrice?: number;
  symbol?: string;
}

export interface LeverageSliderProps {
  value: number;
  onChange: (leverage: number) => void;
  min?: number;
  max?: number;
}

export interface QuickSizeButtonsProps {
  availableMargin: number;
  currentPrice?: number;
  leverage: number;
  onSizeSelect: (size: number) => void;
}

export interface OrderSummaryProps {
  side: OrderSide;
  orderType: OrderType;
  price?: number;
  size: number;
  leverage: number;
  currentPrice?: number;
}
