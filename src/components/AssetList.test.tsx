import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { AssetList } from "./AssetList";

// Mock the theme context
vi.mock("@wraith/ghost/context/ThemeContext", () => ({
  useThemeColors: () => ({
    text: { primary: "#fff", muted: "#888", secondary: "#aaa" },
    background: { raised: "#1a1a1a", surface: "#0a0a0a" },
    border: { subtle: "#333" },
    accent: { primary: "#3B82F6" },
  }),
}));

// Mock useCryptoData hook
const mockAssets = [
  {
    id: 1,
    rank: 1,
    name: "Bitcoin",
    symbol: "BTC",
    image: "https://example.com/btc.png",
    price: 50000,
    change1h: 0.5,
    change24h: 2.5,
    change7d: 5.0,
    marketCap: 1000000000000,
    volume24h: 50000000000,
    circulatingSupply: 19000000,
    sparkline: [48000, 49000, 50000],
    tradeDirection: "up" as const,
  },
  {
    id: 2,
    rank: 2,
    name: "Ethereum",
    symbol: "ETH",
    image: "https://example.com/eth.png",
    price: 3000,
    change1h: -0.3,
    change24h: -1.5,
    change7d: -2.0,
    marketCap: 400000000000,
    volume24h: 20000000000,
    circulatingSupply: 120000000,
    sparkline: [3100, 3050, 3000],
    tradeDirection: "down" as const,
  },
];

vi.mock("../hooks/useCryptoData", () => ({
  useCryptoData: vi.fn(() => ({
    assets: mockAssets,
    loading: false,
    loadingMore: false,
    error: null,
    hasMore: false,
    loadMore: vi.fn(),
    search: vi.fn((q: string) =>
      mockAssets.filter(
        (a) =>
          a.name.toLowerCase().includes(q.toLowerCase()) ||
          a.symbol.toLowerCase().includes(q.toLowerCase())
      )
    ),
  })),
}));

// Mock Ghost components
vi.mock("@wraith/ghost/components", () => ({
  Text: ({ children, size, appearance, weight, style }: { children: React.ReactNode; size?: string; appearance?: string; weight?: string; style?: object }) => (
    <span data-testid="text" data-size={size} data-appearance={appearance}>{children}</span>
  ),
  Skeleton: ({ width, height }: { width: number | string; height: number }) => (
    <div data-testid="skeleton" style={{ width, height }} />
  ),
  Card: ({ children, style }: { children: React.ReactNode; style?: object }) => (
    <div data-testid="card" style={style}>{children}</div>
  ),
  Avatar: ({ uri, initials, size }: { uri: string; initials: string; size?: string }) => (
    <div data-testid="avatar" data-uri={uri}>{initials}</div>
  ),
  PercentChange: ({ value, size }: { value: number; size?: string }) => (
    <span data-testid="percent-change" data-value={value}>
      {value >= 0 ? "+" : ""}{value.toFixed(2)}%
    </span>
  ),
  Currency: ({ value, size, compact, decimals, animate, weight }: { value: number; size?: string; compact?: boolean; decimals?: number; animate?: boolean; weight?: string }) => (
    <span data-testid="currency" data-value={value}>
      ${compact && value >= 1e9 ? `${(value / 1e9).toFixed(decimals || 2)}B` : value.toLocaleString()}
    </span>
  ),
  Icon: ({ name, size, color }: { name: string; size?: string; color?: string }) => (
    <span data-testid={`icon-${name}`} />
  ),
  Tag: ({ direction, label, size }: { direction: string; label: string; size?: string }) => (
    <span data-testid="tag" data-direction={direction}>{label}</span>
  ),
}));

// Mock MiniChart
vi.mock("./MiniChart", () => ({
  MiniChart: ({ data, isPositive }: { data: number[]; isPositive: boolean }) => (
    <div data-testid="mini-chart" data-positive={isPositive} />
  ),
}));

// Mock HighlightedText
vi.mock("./HighlightedText", () => ({
  HighlightedText: ({ text, highlight, style }: { text: string; highlight: string; style?: object }) => (
    <span data-testid="highlighted-text">{text}</span>
  ),
}));

// Mock market hours utility
vi.mock("../utils/marketHours", () => ({
  getMarketStatus: () => "24/7",
}));

describe("AssetList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultFilters = {
    sort: "market_cap" as const,
    sortDir: "desc" as const,
    filter: "all" as const,
    assetType: "all" as const,
    showOfflineMarkets: true,
  };

  it("renders asset list with data", () => {
    render(
      <MemoryRouter>
        <AssetList searchQuery="" filters={defaultFilters} />
      </MemoryRouter>
    );

    expect(screen.getByText("Asset Prices")).toBeInTheDocument();
    expect(screen.getByText("Bitcoin")).toBeInTheDocument();
    expect(screen.getByText("Ethereum")).toBeInTheDocument();
  });

  it("renders loading state", async () => {
    const { useCryptoData } = await import("../hooks/useCryptoData");
    (useCryptoData as ReturnType<typeof vi.fn>).mockReturnValue({
      assets: [],
      loading: true,
      loadingMore: false,
      error: null,
      hasMore: false,
      loadMore: vi.fn(),
      search: vi.fn(),
    });

    render(
      <MemoryRouter>
        <AssetList searchQuery="" filters={defaultFilters} />
      </MemoryRouter>
    );

    const skeletons = screen.getAllByTestId("skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders error state", async () => {
    const { useCryptoData } = await import("../hooks/useCryptoData");
    (useCryptoData as ReturnType<typeof vi.fn>).mockReturnValue({
      assets: [],
      loading: false,
      loadingMore: false,
      error: new Error("API Error"),
      hasMore: false,
      loadMore: vi.fn(),
      search: vi.fn(),
    });

    render(
      <MemoryRouter>
        <AssetList searchQuery="" filters={defaultFilters} />
      </MemoryRouter>
    );

    expect(screen.getByText(/Unable to connect/i)).toBeInTheDocument();
  });

  it("renders empty state", async () => {
    const { useCryptoData } = await import("../hooks/useCryptoData");
    (useCryptoData as ReturnType<typeof vi.fn>).mockReturnValue({
      assets: [],
      loading: false,
      loadingMore: false,
      error: null,
      hasMore: false,
      loadMore: vi.fn(),
      search: vi.fn(() => []),
    });

    render(
      <MemoryRouter>
        <AssetList searchQuery="nonexistent" filters={defaultFilters} />
      </MemoryRouter>
    );

    expect(screen.getByText("No assets found")).toBeInTheDocument();
  });

  it("filters assets by search query", async () => {
    const mockSearch = vi.fn((q: string) =>
      mockAssets.filter((a) => a.name.toLowerCase().includes(q.toLowerCase()))
    );

    const { useCryptoData } = await import("../hooks/useCryptoData");
    (useCryptoData as ReturnType<typeof vi.fn>).mockReturnValue({
      assets: mockAssets,
      loading: false,
      loadingMore: false,
      error: null,
      hasMore: false,
      loadMore: vi.fn(),
      search: mockSearch,
    });

    render(
      <MemoryRouter>
        <AssetList searchQuery="bitcoin" filters={defaultFilters} />
      </MemoryRouter>
    );

    expect(screen.getByText("Bitcoin")).toBeInTheDocument();
    // Ethereum should be filtered out
    expect(screen.queryByText("Ethereum")).not.toBeInTheDocument();
  });

  it("displays trade direction badges", () => {
    render(
      <MemoryRouter>
        <AssetList searchQuery="" filters={defaultFilters} />
      </MemoryRouter>
    );

    // Should have BUY and SELL badges
    expect(screen.getByText("BUY")).toBeInTheDocument();
    expect(screen.getByText("SELL")).toBeInTheDocument();
  });

  it("renders table headers", () => {
    render(
      <MemoryRouter>
        <AssetList searchQuery="" filters={defaultFilters} />
      </MemoryRouter>
    );

    expect(screen.getByText("#")).toBeInTheDocument();
    expect(screen.getByText("Asset")).toBeInTheDocument();
    expect(screen.getByText("Price")).toBeInTheDocument();
    expect(screen.getByText("Trade")).toBeInTheDocument();
    expect(screen.getByText("24h")).toBeInTheDocument();
    expect(screen.getByText("7d")).toBeInTheDocument();
    expect(screen.getByText("Market Cap")).toBeInTheDocument();
    expect(screen.getByText("Volume 24h")).toBeInTheDocument();
    expect(screen.getByText("Pulse")).toBeInTheDocument();
  });

  it("renders mini charts for each asset", () => {
    render(
      <MemoryRouter>
        <AssetList searchQuery="" filters={defaultFilters} />
      </MemoryRouter>
    );

    const charts = screen.getAllByTestId("mini-chart");
    expect(charts.length).toBe(2);
  });
});
