/**
 * MetricsGrid Component Tests
 *
 * Tests the asset metrics grid including:
 * - MetricCard rendering
 * - Market cap display
 * - Volume display
 * - Percent change displays (1h, 24h, 7d)
 * - Supply information
 * - Loading states
 * - Responsive grid behavior
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock theme colors
vi.mock("@wraith/ghost/context/ThemeContext", () => ({
  useThemeColors: () => ({
    text: { primary: "#ffffff", muted: "#888888" },
    border: { subtle: "#333333" },
  }),
}));

// Mock Ghost components
vi.mock("@wraith/ghost/components", () => ({
  Text: ({ children, size, weight, appearance }: any) => (
    <span data-testid="text" data-size={size} data-weight={weight} data-appearance={appearance}>
      {children}
    </span>
  ),
  Card: ({ children, style, fullBleed }: any) => (
    <div data-testid="card" data-full-bleed={fullBleed}>{children}</div>
  ),
  Currency: ({ value, size, weight, compact, decimals, mono }: any) => (
    <span data-testid="currency" data-value={value} data-compact={compact} data-decimals={decimals}>
      ${value}
    </span>
  ),
  PercentChange: ({ value, size }: any) => (
    <span data-testid="percent-change" data-value={value}>
      {value > 0 ? "+" : ""}{value}%
    </span>
  ),
  Skeleton: ({ width, height, style }: any) => (
    <div data-testid="skeleton" data-width={width} data-height={height} />
  ),
}));

// Mock enums
vi.mock("@wraith/ghost/enums", () => ({
  Size: {
    ExtraSmall: "xs",
    Small: "sm",
    Medium: "md",
    Large: "lg",
  },
  TextAppearance: { Muted: "muted" },
}));

// Mock useBreakpoint hook
let mockIsMobile = false;
vi.mock("../../../hooks/useBreakpoint", () => ({
  useBreakpoint: () => ({
    isMobile: mockIsMobile,
  }),
}));

import { MetricsGrid } from "./MetricsGrid";
import type { Asset } from "../../../types/asset";

const createMockAsset = (overrides?: Partial<Asset>): Asset => ({
  id: 1,
  symbol: "BTC",
  name: "Bitcoin",
  price: 45000,
  marketCap: 850000000000,
  volume24h: 25000000000,
  change1h: 0.5,
  change24h: 2.5,
  change7d: -1.2,
  circulatingSupply: 19000000,
  maxSupply: 21000000,
  rank: 1,
  image: "https://example.com/btc.png",
  sparkline: [],
  ...overrides,
});

describe("MetricsGrid", () => {
  const mockAsset = createMockAsset();

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsMobile = false;
  });

  describe("Rendering", () => {
    it("renders metric cards", () => {
      render(<MetricsGrid asset={mockAsset} />);
      const cards = screen.getAllByTestId("card");
      expect(cards.length).toBeGreaterThan(0);
    });

    it("renders Key Metrics title on desktop", () => {
      mockIsMobile = false;
      render(<MetricsGrid asset={mockAsset} />);
      expect(screen.getByText("Key Metrics")).toBeInTheDocument();
    });

    it("hides Key Metrics title on mobile", () => {
      mockIsMobile = true;
      render(<MetricsGrid asset={mockAsset} />);
      expect(screen.queryByText("Key Metrics")).not.toBeInTheDocument();
    });
  });

  describe("Market Cap", () => {
    it("renders market cap label", () => {
      render(<MetricsGrid asset={mockAsset} />);
      expect(screen.getByText("Market Cap")).toBeInTheDocument();
    });

    it("renders market cap value", () => {
      render(<MetricsGrid asset={mockAsset} />);
      const currencies = screen.getAllByTestId("currency");
      const marketCapCurrency = currencies.find(
        (el) => el.getAttribute("data-value") === "850000000000"
      );
      expect(marketCapCurrency).toBeInTheDocument();
    });
  });

  describe("24h Volume", () => {
    it("renders volume label", () => {
      render(<MetricsGrid asset={mockAsset} />);
      expect(screen.getByText("24h Volume")).toBeInTheDocument();
    });

    it("renders volume value", () => {
      render(<MetricsGrid asset={mockAsset} />);
      const currencies = screen.getAllByTestId("currency");
      const volumeCurrency = currencies.find(
        (el) => el.getAttribute("data-value") === "25000000000"
      );
      expect(volumeCurrency).toBeInTheDocument();
    });
  });

  describe("Percent Changes", () => {
    it("renders 1h change label", () => {
      render(<MetricsGrid asset={mockAsset} />);
      expect(screen.getByText("1h Change")).toBeInTheDocument();
    });

    it("renders 24h change label", () => {
      render(<MetricsGrid asset={mockAsset} />);
      expect(screen.getByText("24h Change")).toBeInTheDocument();
    });

    it("renders 7d change label", () => {
      render(<MetricsGrid asset={mockAsset} />);
      expect(screen.getByText("7d Change")).toBeInTheDocument();
    });

    it("renders percent change values", () => {
      render(<MetricsGrid asset={mockAsset} />);
      const percentChanges = screen.getAllByTestId("percent-change");
      expect(percentChanges.length).toBe(3); // 1h, 24h, 7d
    });

    it("renders positive 1h change", () => {
      render(<MetricsGrid asset={mockAsset} />);
      const percentChanges = screen.getAllByTestId("percent-change");
      const change1h = percentChanges.find(
        (el) => el.getAttribute("data-value") === "0.5"
      );
      expect(change1h).toBeInTheDocument();
    });

    it("renders positive 24h change", () => {
      render(<MetricsGrid asset={mockAsset} />);
      const percentChanges = screen.getAllByTestId("percent-change");
      const change24h = percentChanges.find(
        (el) => el.getAttribute("data-value") === "2.5"
      );
      expect(change24h).toBeInTheDocument();
    });

    it("renders negative 7d change", () => {
      render(<MetricsGrid asset={mockAsset} />);
      const percentChanges = screen.getAllByTestId("percent-change");
      const change7d = percentChanges.find(
        (el) => el.getAttribute("data-value") === "-1.2"
      );
      expect(change7d).toBeInTheDocument();
    });
  });

  describe("Supply Information", () => {
    it("renders circulating supply label", () => {
      render(<MetricsGrid asset={mockAsset} />);
      expect(screen.getByText("Circulating Supply")).toBeInTheDocument();
    });

    it("renders circulating supply value with symbol", () => {
      render(<MetricsGrid asset={mockAsset} />);
      expect(screen.getByText(/19\.00M BTC/)).toBeInTheDocument();
    });

    it("renders max supply when available", () => {
      render(<MetricsGrid asset={mockAsset} />);
      expect(screen.getByText("Max Supply")).toBeInTheDocument();
    });

    it("renders max supply value with symbol", () => {
      render(<MetricsGrid asset={mockAsset} />);
      expect(screen.getByText(/21\.00M BTC/)).toBeInTheDocument();
    });

    it("renders supply percentage when max supply available", () => {
      render(<MetricsGrid asset={mockAsset} />);
      expect(screen.getByText("Supply %")).toBeInTheDocument();
      expect(screen.getByText("90.5%")).toBeInTheDocument();
    });

    it("hides max supply card when not available", () => {
      const assetWithoutMax = createMockAsset({ maxSupply: undefined });
      render(<MetricsGrid asset={assetWithoutMax} />);
      expect(screen.queryByText("Max Supply")).not.toBeInTheDocument();
    });

    it("hides supply percentage when no max supply", () => {
      const assetWithoutMax = createMockAsset({ maxSupply: undefined });
      render(<MetricsGrid asset={assetWithoutMax} />);
      expect(screen.queryByText("Supply %")).not.toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("shows skeletons when loading", () => {
      render(<MetricsGrid asset={mockAsset} loading={true} />);
      const skeletons = screen.getAllByTestId("skeleton");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("hides currency values when loading", () => {
      render(<MetricsGrid asset={mockAsset} loading={true} />);
      expect(screen.queryByTestId("currency")).not.toBeInTheDocument();
    });

    it("hides percent change values when loading", () => {
      render(<MetricsGrid asset={mockAsset} loading={true} />);
      expect(screen.queryByTestId("percent-change")).not.toBeInTheDocument();
    });
  });

  describe("Null Asset", () => {
    it("renders labels with null asset", () => {
      render(<MetricsGrid asset={null} />);
      expect(screen.getByText("Market Cap")).toBeInTheDocument();
      expect(screen.getByText("24h Volume")).toBeInTheDocument();
    });

    it("does not render currency values with null asset", () => {
      render(<MetricsGrid asset={null} />);
      expect(screen.queryByTestId("currency")).not.toBeInTheDocument();
    });
  });

  describe("Supply Formatting", () => {
    it("formats trillion values correctly", () => {
      const trillionAsset = createMockAsset({ circulatingSupply: 1500000000000 });
      render(<MetricsGrid asset={trillionAsset} />);
      expect(screen.getByText(/1\.50T BTC/)).toBeInTheDocument();
    });

    it("formats billion values correctly", () => {
      const billionAsset = createMockAsset({ circulatingSupply: 5500000000 });
      render(<MetricsGrid asset={billionAsset} />);
      expect(screen.getByText(/5\.50B BTC/)).toBeInTheDocument();
    });

    it("formats million values correctly", () => {
      render(<MetricsGrid asset={mockAsset} />);
      expect(screen.getByText(/19\.00M BTC/)).toBeInTheDocument();
    });

    it("formats thousand values correctly", () => {
      const thousandAsset = createMockAsset({ circulatingSupply: 5500 });
      render(<MetricsGrid asset={thousandAsset} />);
      expect(screen.getByText(/5\.50K BTC/)).toBeInTheDocument();
    });
  });

  describe("Responsive Behavior", () => {
    it("renders in desktop mode", () => {
      mockIsMobile = false;
      render(<MetricsGrid asset={mockAsset} />);
      expect(screen.getByText("Key Metrics")).toBeInTheDocument();
    });

    it("renders in mobile mode", () => {
      mockIsMobile = true;
      render(<MetricsGrid asset={mockAsset} />);
      // Title should be hidden on mobile
      expect(screen.queryByText("Key Metrics")).not.toBeInTheDocument();
      // But cards should still render
      expect(screen.getByText("Market Cap")).toBeInTheDocument();
    });
  });
});
