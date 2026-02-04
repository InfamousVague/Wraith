/**
 * Types for OrderForm components
 */

export type OrderType = "market" | "limit" | "stop_loss" | "take_profit";
export type OrderSide = "buy" | "sell";
export type MarginMode = "isolated" | "cross";

export interface OrderFormState {
  symbol?: string;
  orderType: OrderType;
  side: OrderSide;
  price: string;
  size: string;
  leverage: number;
  marginMode: MarginMode;
  stopLoss?: string;
  takeProfit?: string;
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
  onPriceSelect?: (price: number) => void;
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
