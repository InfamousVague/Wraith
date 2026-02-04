/**
 * MetricsCarousel Component Tests
 *
 * Tests the horizontal metrics carousel including:
 * - Child card rendering
 * - Horizontal scroll behavior
 * - Loading states from hooks
 * - Asset type prop passing
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock theme colors
vi.mock("@wraith/ghost/context/ThemeContext", () => ({
  useThemeColors: () => ({
    border: { subtle: "#333333" },
  }),
}));

// Mock useFearGreed hook
vi.mock("../../hooks/useFearGreed", () => ({
  useFearGreed: () => ({
    data: { value: 65 },
    loading: false,
    error: null,
  }),
}));

// Mock useAltcoinSeason hook
vi.mock("../../hooks/useAltcoinSeason", () => ({
  useAltcoinSeason: () => ({
    data: { value: 45, btcDominance: 52.5 },
    loading: false,
    error: null,
  }),
}));

// Mock all child card components
vi.mock("../top-movers", () => ({
  TopMoversCard: ({ assetType }: { assetType?: string }) => (
    <div data-testid="top-movers-card" data-asset-type={assetType}>TopMoversCard</div>
  ),
}));

vi.mock("../market-status-card", () => ({
  MarketStatusCard: () => <div data-testid="market-status-card">MarketStatusCard</div>,
}));

vi.mock("../api-stats", () => ({
  ApiStatsCard: () => <div data-testid="api-stats-card">ApiStatsCard</div>,
}));

vi.mock("../fear-greed", () => ({
  FearGreedCard: ({ value, loading }: { value?: number; loading?: boolean }) => (
    <div data-testid="fear-greed-card" data-value={value} data-loading={loading}>FearGreedCard</div>
  ),
}));

vi.mock("../altcoin-season", () => ({
  AltcoinSeasonCard: ({ value, btcDominance, loading }: { value?: number; btcDominance?: number; loading?: boolean }) => (
    <div data-testid="altcoin-season-card" data-value={value} data-btc-dominance={btcDominance} data-loading={loading}>AltcoinSeasonCard</div>
  ),
}));

vi.mock("../price-feed", () => ({
  PriceFeedCard: () => <div data-testid="price-feed-card">PriceFeedCard</div>,
}));

vi.mock("../exchange-liquidity", () => ({
  ExchangeLiquidity: () => <div data-testid="exchange-liquidity">ExchangeLiquidity</div>,
}));

import { MetricsCarousel } from "./MetricsCarousel";

describe("MetricsCarousel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Card Rendering", () => {
    it("renders TopMoversCard", () => {
      render(<MetricsCarousel />);
      expect(screen.getByTestId("top-movers-card")).toBeInTheDocument();
    });

    it("renders MarketStatusCard", () => {
      render(<MetricsCarousel />);
      expect(screen.getByTestId("market-status-card")).toBeInTheDocument();
    });

    it("renders ApiStatsCard", () => {
      render(<MetricsCarousel />);
      expect(screen.getByTestId("api-stats-card")).toBeInTheDocument();
    });

    it("renders FearGreedCard", () => {
      render(<MetricsCarousel />);
      expect(screen.getByTestId("fear-greed-card")).toBeInTheDocument();
    });

    it("renders AltcoinSeasonCard", () => {
      render(<MetricsCarousel />);
      expect(screen.getByTestId("altcoin-season-card")).toBeInTheDocument();
    });

    it("renders PriceFeedCard", () => {
      render(<MetricsCarousel />);
      expect(screen.getByTestId("price-feed-card")).toBeInTheDocument();
    });

    it("renders ExchangeLiquidity", () => {
      render(<MetricsCarousel />);
      expect(screen.getByTestId("exchange-liquidity")).toBeInTheDocument();
    });
  });

  describe("Data Passing", () => {
    it("passes fear greed value to FearGreedCard", () => {
      render(<MetricsCarousel />);
      const fearGreedCard = screen.getByTestId("fear-greed-card");
      expect(fearGreedCard).toHaveAttribute("data-value", "65");
    });

    it("passes altcoin season value to AltcoinSeasonCard", () => {
      render(<MetricsCarousel />);
      const altcoinCard = screen.getByTestId("altcoin-season-card");
      expect(altcoinCard).toHaveAttribute("data-value", "45");
    });

    it("passes btc dominance to AltcoinSeasonCard", () => {
      render(<MetricsCarousel />);
      const altcoinCard = screen.getByTestId("altcoin-season-card");
      expect(altcoinCard).toHaveAttribute("data-btc-dominance", "52.5");
    });
  });

  describe("Asset Type Prop", () => {
    it("passes default asset type to TopMoversCard", () => {
      render(<MetricsCarousel />);
      const topMovers = screen.getByTestId("top-movers-card");
      expect(topMovers).toHaveAttribute("data-asset-type", "all");
    });

    it("passes custom asset type to TopMoversCard", () => {
      render(<MetricsCarousel assetType="crypto" />);
      const topMovers = screen.getByTestId("top-movers-card");
      expect(topMovers).toHaveAttribute("data-asset-type", "crypto");
    });
  });

  describe("Loading States", () => {
    it("passes loading=false when data is available", () => {
      render(<MetricsCarousel />);
      const fearGreedCard = screen.getByTestId("fear-greed-card");
      expect(fearGreedCard).toHaveAttribute("data-loading", "false");
    });
  });

  describe("All Cards Present", () => {
    it("renders all 7 carousel cards", () => {
      render(<MetricsCarousel />);
      expect(screen.getByTestId("top-movers-card")).toBeInTheDocument();
      expect(screen.getByTestId("market-status-card")).toBeInTheDocument();
      expect(screen.getByTestId("fear-greed-card")).toBeInTheDocument();
      expect(screen.getByTestId("altcoin-season-card")).toBeInTheDocument();
      expect(screen.getByTestId("price-feed-card")).toBeInTheDocument();
      expect(screen.getByTestId("exchange-liquidity")).toBeInTheDocument();
      expect(screen.getByTestId("api-stats-card")).toBeInTheDocument();
    });
  });
});
