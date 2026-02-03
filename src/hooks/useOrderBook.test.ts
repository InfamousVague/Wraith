/**
 * @file useOrderBook.test.ts
 * @description Tests for the useOrderBook hook.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useOrderBook } from "./useOrderBook";

// Mock hauntClient
vi.mock("../services/haunt", () => ({
  hauntClient: {
    getOrderBook: vi.fn(),
  },
}));

import { hauntClient } from "../services/haunt";
const mockGetOrderBook = vi.mocked(hauntClient.getOrderBook);

const mockOrderBook = {
  symbol: "BTC",
  bids: [
    { price: 50000, quantity: 1.5, source: "binance" },
    { price: 49900, quantity: 2.0, source: "coinbase" },
  ],
  asks: [
    { price: 50100, quantity: 1.0, source: "binance" },
    { price: 50200, quantity: 1.5, source: "kraken" },
  ],
  spread: 100,
  spreadPercentage: 0.2,
  timestamp: Date.now(),
};

describe("useOrderBook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("returns loading state initially when fetching", () => {
      mockGetOrderBook.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useOrderBook("BTC", { enablePolling: false }));

      expect(result.current.loading).toBe(true);
      expect(result.current.orderBook).toBe(null);
      expect(result.current.error).toBe(null);
    });
  });

  describe("with undefined symbol", () => {
    it("returns null orderBook when symbol is undefined", async () => {
      const { result } = renderHook(() => useOrderBook(undefined, { enablePolling: false }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.orderBook).toBe(null);
      expect(mockGetOrderBook).not.toHaveBeenCalled();
    });
  });

  describe("data fetching", () => {
    it("fetches order book data", async () => {
      mockGetOrderBook.mockResolvedValue({ data: mockOrderBook });

      const { result } = renderHook(() => useOrderBook("BTC", { enablePolling: false }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.orderBook).toEqual(mockOrderBook);
      expect(result.current.error).toBe(null);
      expect(mockGetOrderBook).toHaveBeenCalledWith("BTC", 50);
    });

    it("uses custom depth", async () => {
      mockGetOrderBook.mockResolvedValue({ data: mockOrderBook });

      const { result } = renderHook(() => useOrderBook("BTC", { depth: 100, enablePolling: false }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockGetOrderBook).toHaveBeenCalledWith("BTC", 100);
    });

    it("handles fetch errors", async () => {
      mockGetOrderBook.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useOrderBook("BTC", { enablePolling: false }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("Network error");
    });
  });

  describe("refresh function", () => {
    it("provides refresh function", async () => {
      mockGetOrderBook.mockResolvedValue({ data: mockOrderBook });

      const { result } = renderHook(() => useOrderBook("BTC", { enablePolling: false }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(typeof result.current.refresh).toBe("function");
    });
  });
});
