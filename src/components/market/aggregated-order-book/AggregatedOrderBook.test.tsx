/**
 * AggregatedOrderBook Component Tests
 *
 * Tests the aggregated order book display including:
 * - Bid/ask rendering with depth bars
 * - Spread and imbalance display
 * - Exchange breakdown
 * - Loading and error states
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock useOrderBook hook
const mockOrderBook = {
  symbol: "btc",
  midPrice: 50000,
  spreadPct: 0.001,
  imbalance: 0.15,
  bidTotal: 100,
  askTotal: 85,
  exchangeCount: 3,
  exchanges: ["binance", "coinbase", "kraken"],
  bids: [
    { price: 49990, totalQuantity: 2.5, exchanges: { binance: 1.5, coinbase: 1.0 } },
    { price: 49980, totalQuantity: 3.0, exchanges: { binance: 2.0, kraken: 1.0 } },
    { price: 49970, totalQuantity: 1.8, exchanges: { coinbase: 1.8 } },
  ],
  asks: [
    { price: 50010, totalQuantity: 2.0, exchanges: { binance: 1.0, coinbase: 1.0 } },
    { price: 50020, totalQuantity: 2.5, exchanges: { kraken: 2.5 } },
    { price: 50030, totalQuantity: 1.5, exchanges: { binance: 1.5 } },
  ],
};

let mockLoading = false;
let mockError: string | null = null;
let mockOrderBookData = mockOrderBook;

vi.mock("../hooks/useOrderBook", () => ({
  useOrderBook: () => ({
    orderBook: mockOrderBookData,
    loading: mockLoading,
    error: mockError,
  }),
}));

// Mock orderbook types
vi.mock("../types/orderbook", () => ({
  getImbalanceColor: (imbalance: number) => imbalance > 0 ? "#2fd575" : "#ff5c7a",
  getImbalanceLabel: (imbalance: number) => imbalance > 0 ? "Buy Pressure" : "Sell Pressure",
}));

// Mock Ghost components
vi.mock("@wraith/ghost/components", () => ({
  Card: ({ children, style }: { children: React.ReactNode; style?: object }) => (
    <div data-testid="card" style={style}>{children}</div>
  ),
  Text: ({ children, appearance }: { children: React.ReactNode; appearance?: string }) => (
    <span data-testid="text" data-appearance={appearance}>{children}</span>
  ),
  Skeleton: ({ width, height }: { width?: number; height?: number }) => (
    <div data-testid="skeleton" style={{ width, height }} />
  ),
  Number: ({ value, format }: { value: number; format?: object }) => (
    <span data-testid="number">{value}</span>
  ),
  Currency: ({ value, decimals }: { value: number; decimals?: number }) => (
    <span data-testid="currency">${value}</span>
  ),
}));

// Mock Colors
vi.mock("@wraith/ghost/tokens", () => ({
  Colors: {
    status: { success: "#2fd575", danger: "#ff5c7a" },
  },
}));

import { AggregatedOrderBook } from "./AggregatedOrderBook";

describe("AggregatedOrderBook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoading = false;
    mockError = null;
    mockOrderBookData = mockOrderBook;
  });

  describe("Rendering", () => {
    it("renders card container", () => {
      render(<AggregatedOrderBook symbol="btc" />);
      expect(screen.getByTestId("card")).toBeInTheDocument();
    });

    it("renders title", () => {
      render(<AggregatedOrderBook symbol="btc" />);
      expect(screen.getByText("Aggregated Book")).toBeInTheDocument();
    });

    it("renders symbol in uppercase", () => {
      render(<AggregatedOrderBook symbol="btc" />);
      expect(screen.getByText("BTC")).toBeInTheDocument();
    });

    it("renders spread section", () => {
      render(<AggregatedOrderBook symbol="btc" />);
      expect(screen.getByText("Spread")).toBeInTheDocument();
    });

    it("renders imbalance section", () => {
      render(<AggregatedOrderBook symbol="btc" />);
      expect(screen.getByText("Imbalance")).toBeInTheDocument();
    });

    it("renders ASKS label", () => {
      render(<AggregatedOrderBook symbol="btc" />);
      expect(screen.getByText("ASKS")).toBeInTheDocument();
    });

    it("renders BIDS label", () => {
      render(<AggregatedOrderBook symbol="btc" />);
      expect(screen.getByText("BIDS")).toBeInTheDocument();
    });

    it("renders price header", () => {
      render(<AggregatedOrderBook symbol="btc" />);
      const priceHeaders = screen.getAllByText("Price");
      expect(priceHeaders.length).toBeGreaterThan(0);
    });

    it("renders quantity header", () => {
      render(<AggregatedOrderBook symbol="btc" />);
      const qtyHeaders = screen.getAllByText("Quantity");
      expect(qtyHeaders.length).toBeGreaterThan(0);
    });

    it("renders exchange count header", () => {
      render(<AggregatedOrderBook symbol="btc" />);
      const exHeaders = screen.getAllByText("Ex");
      expect(exHeaders.length).toBeGreaterThan(0);
    });
  });

  describe("Exchange Breakdown", () => {
    it("renders sources count", () => {
      render(<AggregatedOrderBook symbol="btc" />);
      expect(screen.getByText("Sources (3)")).toBeInTheDocument();
    });

    it("renders exchange names", () => {
      render(<AggregatedOrderBook symbol="btc" />);
      expect(screen.getByText("binance")).toBeInTheDocument();
      expect(screen.getByText("coinbase")).toBeInTheDocument();
      expect(screen.getByText("kraken")).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("shows skeletons when loading", () => {
      mockLoading = true;
      render(<AggregatedOrderBook symbol="btc" />);
      const skeletons = screen.getAllByTestId("skeleton");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("shows title when loading", () => {
      mockLoading = true;
      render(<AggregatedOrderBook symbol="btc" />);
      expect(screen.getByText("Aggregated Book")).toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("shows error message when error occurs", () => {
      mockError = "Failed to fetch order book";
      mockOrderBookData = null as any;
      render(<AggregatedOrderBook symbol="btc" />);
      expect(screen.getByText("Failed to fetch order book")).toBeInTheDocument();
    });

    it("shows default message when no data", () => {
      mockError = null;
      mockOrderBookData = null as any;
      render(<AggregatedOrderBook symbol="btc" />);
      expect(screen.getByText("No order book data available")).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("shows empty message when no bids/asks", () => {
      mockOrderBookData = { ...mockOrderBook, bids: [], asks: [] };
      render(<AggregatedOrderBook symbol="btc" />);
      expect(screen.getByText("Order book is empty")).toBeInTheDocument();
    });
  });

  describe("Props", () => {
    it("accepts loading prop override", () => {
      render(<AggregatedOrderBook symbol="btc" loading={true} />);
      const skeletons = screen.getAllByTestId("skeleton");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("handles undefined symbol", () => {
      render(<AggregatedOrderBook symbol={undefined} />);
      expect(screen.getByTestId("card")).toBeInTheDocument();
    });
  });
});
