/**
 * @file mockPortfolio.ts
 * @description Mock data for paper trading portfolio.
 *
 * Used for development and testing of the TradeSandbox page
 * before connecting to the Haunt backend API.
 */

export interface Portfolio {
  id: string;
  balance: number;
  marginUsed: number;
  marginAvailable: number;
  unrealizedPnl: number;
  realizedPnl: number;
}

export interface Position {
  id: string;
  symbol: string;
  side: "long" | "short";
  size: number;
  entryPrice: number;
  markPrice: number;
  leverage: number;
  marginMode: "isolated" | "cross";
  liquidationPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface Order {
  id: string;
  symbol: string;
  type: "market" | "limit" | "stop_loss" | "take_profit";
  side: "buy" | "sell";
  price?: number;
  size: number;
  filledSize: number;
  status: "pending" | "partial" | "filled" | "cancelled";
  createdAt: string;
}

export interface Trade {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  size: number;
  price: number;
  fee: number;
  pnl: number;
  executedAt: number; // Unix timestamp in ms
}

export const MOCK_PORTFOLIO: Portfolio = {
  id: "portfolio-1",
  balance: 5000000,
  marginUsed: 250000,
  marginAvailable: 4750000,
  unrealizedPnl: 15234.56,
  realizedPnl: 42100.0,
};

export const MOCK_POSITIONS: Position[] = [
  {
    id: "pos-1",
    symbol: "BTC",
    side: "long",
    size: 0.5,
    entryPrice: 65000,
    markPrice: 67500,
    leverage: 10,
    marginMode: "isolated",
    liquidationPrice: 58500,
    unrealizedPnl: 1250,
    unrealizedPnlPercent: 3.85,
    stopLoss: 62000,
    takeProfit: 75000,
  },
  {
    id: "pos-2",
    symbol: "ETH",
    side: "short",
    size: 5.0,
    entryPrice: 3500,
    markPrice: 3450,
    leverage: 5,
    marginMode: "cross",
    liquidationPrice: 4200,
    unrealizedPnl: 250,
    unrealizedPnlPercent: 1.43,
  },
];

export const MOCK_ORDERS: Order[] = [
  {
    id: "order-1",
    symbol: "BTC",
    type: "limit",
    side: "buy",
    price: 64000,
    size: 0.25,
    filledSize: 0,
    status: "pending",
    createdAt: "2026-02-03T10:30:00Z",
  },
  {
    id: "order-2",
    symbol: "ETH",
    type: "stop_loss",
    side: "sell",
    price: 3600,
    size: 2.0,
    filledSize: 0,
    status: "pending",
    createdAt: "2026-02-03T09:15:00Z",
  },
];

export const MOCK_TRADES: Trade[] = [
  {
    id: "trade-1",
    symbol: "BTC",
    side: "buy",
    size: 0.5,
    price: 65000,
    fee: 32.5,
    pnl: 0,
    executedAt: Date.now() - 24 * 60 * 60 * 1000, // 1 day ago
  },
  {
    id: "trade-2",
    symbol: "ETH",
    side: "sell",
    size: 5.0,
    price: 3500,
    fee: 17.5,
    pnl: 0,
    executedAt: Date.now() - 24 * 60 * 60 * 1000 - 3 * 60 * 60 * 1000, // ~27 hours ago
  },
  {
    id: "trade-3",
    symbol: "SOL",
    side: "buy",
    size: 100,
    price: 120,
    fee: 12.0,
    pnl: 1500,
    executedAt: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
  },
];
