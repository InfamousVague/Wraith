/**
 * @file useSignals.test.ts
 * @description Tests for the useSignals hook.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useSignals, getIndicatorAccuracy } from "./useSignals";

// Mock hauntClient
vi.mock("../services/haunt", () => ({
  hauntClient: {
    getSignals: vi.fn(),
    getSignalAccuracy: vi.fn(),
    getSignalPredictions: vi.fn(),
    getRecommendation: vi.fn(),
    generatePredictions: vi.fn(),
  },
}));

import { hauntClient } from "../services/haunt";
const mockGetSignals = vi.mocked(hauntClient.getSignals);
const mockGetSignalAccuracy = vi.mocked(hauntClient.getSignalAccuracy);
const mockGetSignalPredictions = vi.mocked(hauntClient.getSignalPredictions);
const mockGetRecommendation = vi.mocked(hauntClient.getRecommendation);

const mockSignals = {
  symbol: "BTC",
  indicators: [
    { name: "RSI", value: 35, signal: "buy" as const },
    { name: "MACD", value: 0.5, signal: "buy" as const },
  ],
  timestamp: Date.now(),
};

const mockAccuracies = {
  accuracies: [
    { indicator: "RSI", timeframe: "4h", accuracy: 0.65, sampleSize: 100 },
  ],
};

const mockPredictions = {
  predictions: [],
};

const mockRecommendation = {
  recommendation: "buy" as const,
  confidence: 0.75,
  reasons: ["RSI oversold", "MACD bullish crossover"],
};

describe("useSignals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSignals.mockResolvedValue({ data: mockSignals });
    mockGetSignalAccuracy.mockResolvedValue({ data: mockAccuracies });
    mockGetSignalPredictions.mockResolvedValue({ data: mockPredictions });
    mockGetRecommendation.mockResolvedValue({ data: mockRecommendation });
  });

  describe("with undefined symbol", () => {
    it("returns null when symbol is undefined", async () => {
      const { result } = renderHook(() => useSignals(undefined, { enablePolling: false }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.signals).toBe(null);
      expect(mockGetSignals).not.toHaveBeenCalled();
    });
  });

  describe("data fetching", () => {
    it("fetches signal data with default timeframe", async () => {
      const { result } = renderHook(() => useSignals("BTC", { enablePolling: false }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.signals).toEqual(mockSignals);
      expect(mockGetSignals).toHaveBeenCalledWith("BTC", "day_trading");
    });

    it("uses custom timeframe", async () => {
      const { result } = renderHook(() =>
        useSignals("BTC", { timeframe: "scalping", enablePolling: false })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockGetSignals).toHaveBeenCalledWith("BTC", "scalping");
    });

    it("handles fetch errors gracefully", async () => {
      mockGetSignals.mockRejectedValue(new Error("API error"));

      const { result } = renderHook(() => useSignals("BTC", { enablePolling: false }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.signals).toBe(null);
      expect(result.current.error).toBe("API error");
    });
  });

  describe("recommendation", () => {
    it("provides recommendation from API", async () => {
      const { result } = renderHook(() => useSignals("BTC", { enablePolling: false }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.recommendation).toEqual(mockRecommendation);
    });
  });

  describe("result structure", () => {
    it("provides all expected properties", async () => {
      const { result } = renderHook(() => useSignals("BTC", { enablePolling: false }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current).toHaveProperty("signals");
      expect(result.current).toHaveProperty("accuracies");
      expect(result.current).toHaveProperty("predictions");
      expect(result.current).toHaveProperty("pendingPredictions");
      expect(result.current).toHaveProperty("recommendation");
      expect(result.current).toHaveProperty("loading");
      expect(result.current).toHaveProperty("generating");
      expect(result.current).toHaveProperty("error");
      expect(result.current).toHaveProperty("refresh");
      expect(result.current).toHaveProperty("generatePredictions");
    });
  });
});

describe("getIndicatorAccuracy", () => {
  const accuracies = [
    { indicator: "RSI_Signal", timeframe: "4h", accuracy: 0.65, sampleSize: 100 },
    { indicator: "RSI_Signal", timeframe: "1h", accuracy: 0.60, sampleSize: 80 },
    { indicator: "MACD_Signal", timeframe: "4h", accuracy: 0.70, sampleSize: 120 },
  ];

  it("finds accuracy by indicator name and preferred timeframe", () => {
    const result = getIndicatorAccuracy(accuracies, "RSI", "4h");
    expect(result?.accuracy).toBe(0.65);
    expect(result?.timeframe).toBe("4h");
  });

  it("falls back to any timeframe if preferred not found", () => {
    const result = getIndicatorAccuracy(accuracies, "RSI", "24h");
    expect(result?.indicator).toContain("RSI");
  });

  it("returns undefined for unknown indicator", () => {
    const result = getIndicatorAccuracy(accuracies, "Unknown", "4h");
    expect(result).toBeUndefined();
  });
});
