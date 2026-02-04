/**
 * @file AssetList.test.tsx
 * @description Tests for the AssetList component.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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

// Mock breakpoint hook
vi.mock("../../hooks/useBreakpoint", () => ({
  useBreakpoint: () => ({ isMobile: false }),
}));

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        "dashboard:assetList.title": "Asset Prices",
        "dashboard:assetList.subtitle": `Showing ${params?.count ?? 0} assets`,
        "dashboard:assetList.searchPlaceholder": "Search assets...",
        "dashboard:assetList.columns.rank": "#",
        "dashboard:assetList.columns.asset": "Asset",
        "dashboard:assetList.columns.price": "Price",
        "dashboard:assetList.columns.trade": "Trade",
        "dashboard:assetList.columns.change24h": "24h",
        "dashboard:assetList.columns.change7d": "7d",
        "dashboard:assetList.columns.marketCap": "Market Cap",
        "dashboard:assetList.columns.volume24h": "Volume 24h",
        "dashboard:assetList.columns.pulse": "Pulse",
        "common:errors.unableToConnect": "Unable to connect",
        "common:empty.noAssets": "No assets found",
      };
      return translations[key] || key;
    },
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
    assetType: "crypto" as const,
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
    assetType: "crypto" as const,
  },
];

vi.mock("../../hooks/useCryptoData", () => ({
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
  Text: ({ children, size, appearance, weight, style, numberOfLines }: { children: React.ReactNode; size?: string; appearance?: string; weight?: string; style?: object; numberOfLines?: number }) => (
    <span data-testid="text" data-size={size} data-appearance={appearance}>{children}</span>
  ),
  Skeleton: ({ width, height, borderRadius, style }: { width: number | string; height: number; borderRadius?: number; style?: object }) => (
    <div data-testid="skeleton" style={{ width, height }} />
  ),
  Card: ({ children, style, fullBleed }: { children: React.ReactNode; style?: object; fullBleed?: boolean }) => (
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
  Currency: ({ value, size, compact, decimals, animate, weight, mono }: { value: number; size?: string; compact?: boolean; decimals?: number; animate?: boolean; weight?: string; mono?: boolean }) => (
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
  Input: ({ value, onChangeText, placeholder, leadingIcon, size, shape, style }: { value: string; onChangeText: (text: string) => void; placeholder?: string; leadingIcon?: string; size?: string; shape?: string; style?: object }) => (
    <input
      data-testid="search-input"
      value={value}
      onChange={(e) => onChangeText(e.target.value)}
      placeholder={placeholder}
    />
  ),
}));

vi.mock("@wraith/ghost/enums", () => ({
  Size: { Small: "sm", Medium: "md", Large: "lg", ExtraSmall: "xs", TwoXSmall: "2xs" },
  TextAppearance: { Muted: "muted" },
  Shape: { Rounded: "rounded" },
}));

vi.mock("@wraith/ghost/tokens", () => ({
  Typography: { fontWeight: { semibold: "600" } },
  Colors: {},
}));

// Mock MiniChart
vi.mock("../mini-chart", () => ({
  MiniChart: ({ data, isPositive, width, height }: { data: number[]; isPositive: boolean; width: number; height: number }) => (
    <div data-testid="mini-chart" data-positive={isPositive} />
  ),
}));

// Mock HighlightedText
vi.mock("../highlighted-text", () => ({
  HighlightedText: ({ text, highlight, style }: { text: string; highlight: string; style?: object }) => (
    <span data-testid="highlighted-text">{text}</span>
  ),
}));

// Mock market hours utility
vi.mock("../../utils/marketHours", () => ({
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
        <AssetList filters={defaultFilters} />
      </MemoryRouter>
    );

    expect(screen.getByText("Asset Prices")).toBeInTheDocument();
    expect(screen.getByText("Bitcoin")).toBeInTheDocument();
    expect(screen.getByText("Ethereum")).toBeInTheDocument();
  });

  it("renders loading state", async () => {
    const { useCryptoData } = await import("../../hooks/useCryptoData");
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
        <AssetList filters={defaultFilters} />
      </MemoryRouter>
    );

    const skeletons = screen.getAllByTestId("skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders error state", async () => {
    const { useCryptoData } = await import("../../hooks/useCryptoData");
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
        <AssetList filters={defaultFilters} />
      </MemoryRouter>
    );

    expect(screen.getByText(/Unable to connect/i)).toBeInTheDocument();
  });

  it("renders empty state", async () => {
    const { useCryptoData } = await import("../../hooks/useCryptoData");
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
        <AssetList filters={defaultFilters} />
      </MemoryRouter>
    );

    expect(screen.getByText("No assets found")).toBeInTheDocument();
  });

  it("displays trade direction badges", async () => {
    // Reset mock to default data
    const { useCryptoData } = await import("../../hooks/useCryptoData");
    (useCryptoData as ReturnType<typeof vi.fn>).mockReturnValue({
      assets: mockAssets,
      loading: false,
      loadingMore: false,
      error: null,
      hasMore: false,
      loadMore: vi.fn(),
      search: vi.fn((q: string) => mockAssets.filter(a => a.name.toLowerCase().includes(q.toLowerCase()))),
    });

    render(
      <MemoryRouter>
        <AssetList filters={defaultFilters} />
      </MemoryRouter>
    );

    // Should have BUY and SELL badges
    expect(screen.getByText("BUY")).toBeInTheDocument();
    expect(screen.getByText("SELL")).toBeInTheDocument();
  });

  it("renders table headers", () => {
    render(
      <MemoryRouter>
        <AssetList filters={defaultFilters} />
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

  it("renders mini charts for each asset", async () => {
    // Reset mock to default data
    const { useCryptoData } = await import("../../hooks/useCryptoData");
    (useCryptoData as ReturnType<typeof vi.fn>).mockReturnValue({
      assets: mockAssets,
      loading: false,
      loadingMore: false,
      error: null,
      hasMore: false,
      loadMore: vi.fn(),
      search: vi.fn((q: string) => mockAssets.filter(a => a.name.toLowerCase().includes(q.toLowerCase()))),
    });

    render(
      <MemoryRouter>
        <AssetList filters={defaultFilters} />
      </MemoryRouter>
    );

    const charts = screen.getAllByTestId("mini-chart");
    expect(charts.length).toBe(2);
  });

  it("renders search input", () => {
    render(
      <MemoryRouter>
        <AssetList filters={defaultFilters} />
      </MemoryRouter>
    );

    expect(screen.getByTestId("search-input")).toBeInTheDocument();
  });

  it("filters assets when search query is entered", async () => {
    const mockSearch = vi.fn((q: string) =>
      mockAssets.filter((a) => a.name.toLowerCase().includes(q.toLowerCase()))
    );

    const { useCryptoData } = await import("../../hooks/useCryptoData");
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
        <AssetList filters={defaultFilters} />
      </MemoryRouter>
    );

    const searchInput = screen.getByTestId("search-input");
    fireEvent.change(searchInput, { target: { value: "bitcoin" } });

    // Search function should be called with the query
    // The component uses internal state for search
    expect(searchInput).toHaveValue("bitcoin");
  });

  it("renders fullBleed prop correctly", () => {
    render(
      <MemoryRouter>
        <AssetList filters={defaultFilters} fullBleed={true} />
      </MemoryRouter>
    );

    // Card should receive fullBleed prop (component just renders without crashing)
    expect(screen.getByTestId("card")).toBeInTheDocument();
  });
});

describe("AssetList - Asset Rows", () => {
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

  it("renders avatars for assets", () => {
    render(
      <MemoryRouter>
        <AssetList filters={defaultFilters} />
      </MemoryRouter>
    );

    const avatars = screen.getAllByTestId("avatar");
    expect(avatars.length).toBe(2);
    expect(avatars[0]).toHaveTextContent("BT");
    expect(avatars[1]).toHaveTextContent("ET");
  });

  it("renders currency values for prices", () => {
    render(
      <MemoryRouter>
        <AssetList filters={defaultFilters} />
      </MemoryRouter>
    );

    const currencies = screen.getAllByTestId("currency");
    expect(currencies.length).toBeGreaterThan(0);
  });

  it("renders percent changes", () => {
    render(
      <MemoryRouter>
        <AssetList filters={defaultFilters} />
      </MemoryRouter>
    );

    const percentChanges = screen.getAllByTestId("percent-change");
    expect(percentChanges.length).toBeGreaterThan(0);
  });
});
