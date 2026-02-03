/**
 * ChartGrid Component Tests
 *
 * Tests the responsive chart grid including:
 * - Asset card rendering with price, change, and charts
 * - Responsive grid layout
 * - Loading state with skeletons
 * - Search filtering and highlighting
 * - Card size variations (compact vs full)
 * - Empty state handling
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "chartGrid.vol": "Vol",
        "chartGrid.noAssets": "No assets found",
      };
      return translations[key] || key;
    },
  }),
}));

// Mock theme colors
const mockThemeColors = {
  text: { primary: "#ffffff", muted: "#888888", secondary: "#aaaaaa" },
  background: { canvas: "#000000", raised: "#1a1a1a", surface: "#0d0d0d" },
  border: { subtle: "#333333" },
  accent: { primary: "#3b82f6" },
};

vi.mock("@wraith/ghost/context/ThemeContext", () => ({
  useThemeColors: () => mockThemeColors,
}));

// Mock Ghost components
vi.mock("@wraith/ghost/components", () => ({
  Card: ({ children, style }: { children: React.ReactNode; style?: object }) => (
    <div data-testid="card" style={style}>{children}</div>
  ),
  Text: ({ children, appearance }: { children: React.ReactNode; appearance?: string }) => (
    <span data-testid="text" data-appearance={appearance}>{children}</span>
  ),
  Avatar: ({ uri, initials, size }: { uri?: string; initials?: string; size?: string }) => (
    <div data-testid="avatar" data-uri={uri} data-initials={initials} data-size={size} />
  ),
  PercentChange: ({ value, size }: { value: number; size?: string }) => (
    <span data-testid="percent-change" data-value={value}>{value}%</span>
  ),
  Currency: ({ value, decimals, compact }: { value: number; decimals?: number; compact?: boolean }) => (
    <span data-testid="currency" data-value={value} data-compact={compact}>${value}</span>
  ),
  Skeleton: ({ width, height }: { width?: number | string; height?: number }) => (
    <div data-testid="skeleton" style={{ width, height }} />
  ),
}));

// Mock MiniChart
vi.mock("./MiniChart", () => ({
  MiniChart: ({ data, isPositive, height }: { data: number[]; isPositive: boolean; height: number }) => (
    <div data-testid="mini-chart" data-points={data.length} data-positive={isPositive} data-height={height} />
  ),
}));

// Mock HighlightedText
vi.mock("./HighlightedText", () => ({
  HighlightedText: ({ text, highlight, style }: { text: string; highlight: string; style?: object }) => (
    <span data-testid="highlighted-text" data-text={text} data-highlight={highlight}>{text}</span>
  ),
}));

// Mock react-window
vi.mock("react-window", () => ({
  FixedSizeGrid: ({ children, columnCount, rowCount }: {
    children: (props: { columnIndex: number; rowIndex: number; style: object }) => React.ReactNode;
    columnCount: number;
    rowCount: number;
  }) => (
    <div data-testid="virtualized-grid" data-columns={columnCount} data-rows={rowCount}>
      {/* Render a few cells for testing */}
      {Array.from({ length: Math.min(4, columnCount * rowCount) }).map((_, i) => (
        <div key={i}>
          {children({ columnIndex: i % columnCount, rowIndex: Math.floor(i / columnCount), style: {} })}
        </div>
      ))}
    </div>
  ),
}));

import { ChartGrid } from "./ChartGrid";
import type { Asset } from "../types/asset";

const createMockAsset = (id: string, overrides?: Partial<Asset>): Asset => ({
  id,
  symbol: id.toUpperCase(),
  name: `${id.charAt(0).toUpperCase()}${id.slice(1)} Token`,
  price: 50000 + Math.random() * 10000,
  change24h: (Math.random() - 0.5) * 10,
  change7d: (Math.random() - 0.5) * 20,
  marketCap: 1000000000000,
  volume24h: 50000000000,
  rank: 1,
  sparkline: Array.from({ length: 24 }, (_, i) => 48000 + Math.sin(i / 5) * 2000),
  image: `https://example.com/${id}.png`,
  type: "crypto",
  ...overrides,
});

const mockAssets: Asset[] = [
  createMockAsset("bitcoin", { symbol: "BTC", name: "Bitcoin", price: 50000, change24h: 2.5 }),
  createMockAsset("ethereum", { symbol: "ETH", name: "Ethereum", price: 3000, change24h: -1.5 }),
  createMockAsset("solana", { symbol: "SOL", name: "Solana", price: 100, change24h: 5.0 }),
];

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe("ChartGrid", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock ResizeObserver as a class constructor
    global.ResizeObserver = class ResizeObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    } as unknown as typeof ResizeObserver;
  });

  describe("Rendering", () => {
    it("renders asset cards", () => {
      renderWithRouter(<ChartGrid assets={mockAssets} />);

      const cards = screen.getAllByTestId("card");
      expect(cards.length).toBe(3);
    });

    it("renders avatar for each asset", () => {
      renderWithRouter(<ChartGrid assets={mockAssets} />);

      const avatars = screen.getAllByTestId("avatar");
      expect(avatars.length).toBe(3);
      expect(avatars[0]).toHaveAttribute("data-initials", "BT");
    });

    it("renders currency values", () => {
      renderWithRouter(<ChartGrid assets={mockAssets} />);

      const currencies = screen.getAllByTestId("currency");
      expect(currencies.length).toBeGreaterThan(0);
    });

    it("renders percent changes", () => {
      renderWithRouter(<ChartGrid assets={mockAssets} />);

      const changes = screen.getAllByTestId("percent-change");
      expect(changes.length).toBeGreaterThan(0);
    });

    it("renders mini charts for assets with sparkline", () => {
      renderWithRouter(<ChartGrid assets={mockAssets} />);

      const charts = screen.getAllByTestId("mini-chart");
      expect(charts.length).toBe(3);
    });
  });

  describe("Loading State", () => {
    it("shows skeleton cards when loading", () => {
      renderWithRouter(<ChartGrid assets={[]} loading={true} />);

      const skeletons = screen.getAllByTestId("skeleton");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("shows 20 loading cards", () => {
      renderWithRouter(<ChartGrid assets={[]} loading={true} />);

      // Each loading card has multiple skeletons
      const cards = screen.getAllByTestId("card");
      expect(cards.length).toBe(20);
    });
  });

  describe("Empty State", () => {
    it("shows empty message when no assets and not loading", () => {
      renderWithRouter(<ChartGrid assets={[]} loading={false} />);

      expect(screen.getByText("No assets found")).toBeInTheDocument();
    });
  });

  describe("Search Filtering", () => {
    it("filters assets by search query", () => {
      renderWithRouter(<ChartGrid assets={mockAssets} searchQuery="bitcoin" />);

      const cards = screen.getAllByTestId("card");
      expect(cards.length).toBe(1);
    });

    it("filters by symbol", () => {
      renderWithRouter(<ChartGrid assets={mockAssets} searchQuery="eth" />);

      const cards = screen.getAllByTestId("card");
      expect(cards.length).toBe(1);
    });

    it("shows empty state when no matches", () => {
      renderWithRouter(<ChartGrid assets={mockAssets} searchQuery="xyz123" />);

      expect(screen.getByText("No assets found")).toBeInTheDocument();
    });

    it("passes search query to HighlightedText", () => {
      renderWithRouter(<ChartGrid assets={mockAssets} searchQuery="bit" />);

      const highlighted = screen.getAllByTestId("highlighted-text");
      expect(highlighted[0]).toHaveAttribute("data-highlight", "bit");
    });
  });

  describe("Card Size Variations", () => {
    it("renders with default card size", () => {
      renderWithRouter(<ChartGrid assets={mockAssets} />);

      const charts = screen.getAllByTestId("mini-chart");
      // Default cardSize=220 gives chartHeight around 65
      expect(charts[0]).toHaveAttribute("data-height");
    });

    it("adjusts chart height based on card size", () => {
      renderWithRouter(<ChartGrid assets={mockAssets} cardSize={300} />);

      const charts = screen.getAllByTestId("mini-chart");
      // Larger card = taller chart
      const height = parseInt(charts[0].getAttribute("data-height") || "0");
      expect(height).toBeGreaterThan(40);
    });

    it("renders compact layout for small card size", () => {
      renderWithRouter(<ChartGrid assets={mockAssets} cardSize={150} />);

      // Compact mode hides some elements - avatar should be smaller
      const avatars = screen.getAllByTestId("avatar");
      expect(avatars[0]).toHaveAttribute("data-size", "sm");
    });
  });

  describe("MiniChart Props", () => {
    it("passes isPositive=true for positive change", () => {
      const positiveAsset = [createMockAsset("pos", { change24h: 5.0 })];
      renderWithRouter(<ChartGrid assets={positiveAsset} />);

      const chart = screen.getByTestId("mini-chart");
      expect(chart).toHaveAttribute("data-positive", "true");
    });

    it("passes isPositive=false for negative change", () => {
      const negativeAsset = [createMockAsset("neg", { change24h: -5.0 })];
      renderWithRouter(<ChartGrid assets={negativeAsset} />);

      const chart = screen.getByTestId("mini-chart");
      expect(chart).toHaveAttribute("data-positive", "false");
    });

    it("passes sparkline data to chart", () => {
      renderWithRouter(<ChartGrid assets={mockAssets} />);

      const charts = screen.getAllByTestId("mini-chart");
      expect(charts[0]).toHaveAttribute("data-points", "24");
    });
  });

  describe("Links", () => {
    it("wraps cards in links to asset detail", () => {
      renderWithRouter(<ChartGrid assets={mockAssets} />);

      const links = document.querySelectorAll('a[href^="/asset/"]');
      expect(links.length).toBe(3);
    });

    it("links to correct asset ID", () => {
      renderWithRouter(<ChartGrid assets={mockAssets} />);

      const link = document.querySelector('a[href="/asset/bitcoin"]');
      expect(link).toBeInTheDocument();
    });
  });

  describe("Footer Stats", () => {
    it("shows volume in footer", () => {
      renderWithRouter(<ChartGrid assets={mockAssets} cardSize={220} />);

      const volLabels = screen.getAllByText("Vol");
      expect(volLabels.length).toBe(3); // One per asset card
    });

    it("shows 7d change in footer", () => {
      renderWithRouter(<ChartGrid assets={mockAssets} cardSize={220} />);

      const labels = screen.getAllByText("7d");
      expect(labels.length).toBe(3); // One per asset card
    });
  });

  describe("Missing Sparkline", () => {
    it("renders placeholder when sparkline is too short", () => {
      const assetWithShortSparkline = [
        createMockAsset("short", { sparkline: [100] })
      ];
      renderWithRouter(<ChartGrid assets={assetWithShortSparkline} />);

      // Should not render MiniChart
      expect(screen.queryByTestId("mini-chart")).not.toBeInTheDocument();
    });
  });
});
