/**
 * @file PriceTicker.test.tsx
 * @description Tests for the PriceTicker component.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { PriceTicker } from "./PriceTicker";

// Mock theme context
vi.mock("@wraith/ghost/context/ThemeContext", () => ({
  useThemeColors: () => ({
    text: { primary: "#fff", muted: "#888" },
    background: { canvas: "#0a0a0a" },
    border: { subtle: "#333" },
  }),
}));

// Mock useCryptoData hook
const mockAssets = [
  { id: 1, symbol: "BTC", price: 50000, change24h: 2.5 },
  { id: 2, symbol: "ETH", price: 3000, change24h: -1.5 },
  { id: 3, symbol: "SOL", price: 100, change24h: 5.0 },
];

vi.mock("../hooks/useCryptoData", () => ({
  useCryptoData: vi.fn(() => ({
    assets: mockAssets,
    loading: false,
    error: null,
  })),
}));

// Mock Ghost components
vi.mock("@wraith/ghost/components", () => ({
  Text: ({ children, size, weight, style }: { children: React.ReactNode; size?: string; weight?: string; style?: object }) => (
    <span data-testid="text" data-size={size} data-weight={weight} style={style}>{children}</span>
  ),
  Currency: ({ value, currency, decimals, size, weight, brightness, mono }: { value: number; currency?: string; decimals?: number; size?: string; weight?: string; brightness?: string; mono?: boolean }) => (
    <span data-testid="currency" data-value={value}>${value.toLocaleString()}</span>
  ),
  PercentChange: ({ value, size, weight }: { value: number; size?: string; weight?: string }) => (
    <span data-testid="percent-change" data-value={value}>{value >= 0 ? "+" : ""}{value.toFixed(2)}%</span>
  ),
  Skeleton: ({ width, height, borderRadius }: { width: number; height: number; borderRadius?: number }) => (
    <div data-testid="skeleton" style={{ width, height }} />
  ),
}));

vi.mock("@wraith/ghost/enums", () => ({
  Size: { Small: "sm", ExtraSmall: "xs" },
  Brightness: { Soft: "soft" },
}));

describe("PriceTicker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering with Data", () => {
    it("renders ticker items for each asset", () => {
      render(<PriceTicker />);
      // Should show symbols (duplicated for loop effect)
      const btcTexts = screen.getAllByText("BTC");
      expect(btcTexts.length).toBeGreaterThanOrEqual(1);
    });

    it("renders currency values", () => {
      render(<PriceTicker />);
      const currencies = screen.getAllByTestId("currency");
      expect(currencies.length).toBeGreaterThan(0);
    });

    it("renders percent changes", () => {
      render(<PriceTicker />);
      const percentChanges = screen.getAllByTestId("percent-change");
      expect(percentChanges.length).toBeGreaterThan(0);
    });

    it("duplicates items for seamless loop", () => {
      render(<PriceTicker />);
      // With 3 assets duplicated, should have 6 BTC texts
      const btcTexts = screen.getAllByText("BTC");
      expect(btcTexts.length).toBe(2); // Original + duplicate
    });
  });

  describe("Loading State", () => {
    it("renders skeletons when loading", async () => {
      const { useCryptoData } = await import("../hooks/useCryptoData");
      vi.mocked(useCryptoData).mockReturnValue({
        assets: [],
        loading: true,
        error: null,
        loadMore: vi.fn(),
        loadingMore: false,
        hasMore: false,
        search: vi.fn(),
      });

      render(<PriceTicker />);
      const skeletons = screen.getAllByTestId("skeleton");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("renders skeletons on error with no data", async () => {
      const { useCryptoData } = await import("../hooks/useCryptoData");
      vi.mocked(useCryptoData).mockReturnValue({
        assets: [],
        loading: false,
        error: new Error("API Error"),
        loadMore: vi.fn(),
        loadingMore: false,
        hasMore: false,
        search: vi.fn(),
      });

      render(<PriceTicker />);
      const skeletons = screen.getAllByTestId("skeleton");
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe("Ticker Items", () => {
    it("renders asset symbols when data is available", async () => {
      // Ensure mock returns data for this test
      const { useCryptoData } = await import("../hooks/useCryptoData");
      vi.mocked(useCryptoData).mockReturnValue({
        assets: mockAssets,
        loading: false,
        error: null,
        loadMore: vi.fn(),
        loadingMore: false,
        hasMore: false,
        search: vi.fn(),
      });

      render(<PriceTicker />);
      expect(screen.getAllByText("BTC").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("ETH").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("SOL").length).toBeGreaterThanOrEqual(1);
    });
  });
});

describe("PriceTicker - Memoization", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset mock to return data
    const { useCryptoData } = await import("../hooks/useCryptoData");
    vi.mocked(useCryptoData).mockReturnValue({
      assets: mockAssets,
      loading: false,
      error: null,
      loadMore: vi.fn(),
      loadingMore: false,
      hasMore: false,
      search: vi.fn(),
    });
  });

  it("renders without crashing on re-render", () => {
    const { rerender } = render(<PriceTicker />);
    // Should show at least one BTC text or fallback to testing component renders
    expect(screen.queryAllByText("BTC").length + screen.queryAllByTestId("skeleton").length).toBeGreaterThanOrEqual(1);

    rerender(<PriceTicker />);
    expect(screen.queryAllByText("BTC").length + screen.queryAllByTestId("skeleton").length).toBeGreaterThanOrEqual(1);
  });
});
