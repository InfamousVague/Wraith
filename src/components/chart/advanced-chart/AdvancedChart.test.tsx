import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import React from "react";
import { AdvancedChart } from "./AdvancedChart";
import type { Asset } from "../../../types/asset";

// Mock the theme context
vi.mock("@wraith/ghost/context/ThemeContext", () => ({
  useThemeColors: () => ({
    text: { primary: "#fff", muted: "#888", secondary: "#aaa" },
    background: { raised: "#1a1a1a", surface: "#0a0a0a", overlay: "#2a2a2a" },
    border: { subtle: "#333" },
    accent: { primary: "#3B82F6", secondary: "#1E40AF" },
  }),
}));

// Mock haunt client
vi.mock("../services/haunt", () => {
  // Mock chart data with OHLC points
  const mockChartData = Array.from({ length: 20 }, (_, i) => ({
    time: Math.floor(Date.now() / 1000) - (20 - i) * 3600,
    open: 49000 + i * 50,
    high: 50000 + i * 50,
    low: 48000 + i * 50,
    close: 49500 + i * 50,
    volume: 100000 + i * 1000,
  }));

  return {
    hauntClient: {
      getChart: vi.fn().mockResolvedValue({
        data: {
          symbol: "btc",
          range: "1d",
          data: mockChartData,
          seeding: false,
          seedingStatus: null,
        }
      }),
      seedSymbol: vi.fn(),
    },
  };
});

// Mock useBreakpoint to simulate desktop viewport
vi.mock("../hooks/useBreakpoint", () => ({
  useBreakpoint: () => ({
    breakpoint: "desktop",
    width: 1280,
    height: 800,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isNarrow: false,
  }),
}));

// Mock useHauntSocket
vi.mock("../hooks/useHauntSocket", () => ({
  useAssetSubscription: vi.fn(),
}));

// Mock Ghost components
vi.mock("@wraith/ghost/components", () => ({
  Card: ({ children, style }: { children: React.ReactNode; style?: object | object[] }) => (
    <div data-testid="card" style={Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style}>{children}</div>
  ),
  Skeleton: ({ width, height }: { width: number | string; height: number }) => (
    <div data-testid="skeleton" style={{ width, height }} />
  ),
  Text: ({ children, appearance }: { children: React.ReactNode; appearance?: string }) => (
    <span data-testid="text" data-appearance={appearance}>{children}</span>
  ),
  Icon: ({ name, size }: { name: string; size?: string }) => (
    <span data-testid={`icon-${name}`} />
  ),
  SegmentedControl: ({ options, value, onChange }: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) => (
    <div data-testid="segmented-control">
      {options.map((opt) => (
        <button
          key={opt.value}
          data-selected={opt.value === value}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  ),
  FilterChip: ({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) => (
    <button data-testid={`filter-chip-${label}`} data-selected={selected} onClick={onPress}>
      {label}
    </button>
  ),
  Currency: ({ value }: { value: number }) => (
    <span data-testid="currency">${value.toFixed(2)}</span>
  ),
  PercentChange: ({ value }: { value: number }) => (
    <span data-testid="percent-change">{value.toFixed(2)}%</span>
  ),
}));

const mockAsset: Asset = {
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
  maxSupply: 21000000,
  sparkline: [48000, 49000, 50000, 51000, 50500, 50000, 49500, 50000, 50500, 51000],
};

describe("AdvancedChart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state", () => {
    render(<AdvancedChart asset={null} loading={true} />);

    const skeletons = screen.getAllByTestId("skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders loading state when no asset", () => {
    render(<AdvancedChart asset={null} loading={false} />);

    // When no asset is provided, chart shows loading state (waiting for asset)
    expect(screen.getByText("Loading chart...")).toBeInTheDocument();
  });

  it("renders chart with short sparkline when API returns data", async () => {
    // Even with short sparkline, chart renders because API returns mock data
    const assetWithShortSparkline = { ...mockAsset, sparkline: [50000] };
    render(<AdvancedChart asset={assetWithShortSparkline} loading={false} />);

    // Wait for fetch to complete - API returns valid data
    await waitFor(() => {
      expect(screen.getByText("1H")).toBeInTheDocument();
    });

    expect(screen.getByTestId("card")).toBeInTheDocument();
  });

  it("renders chart with valid asset data", async () => {
    render(<AdvancedChart asset={mockAsset} loading={false} />);

    // Should render the card
    expect(screen.getByTestId("card")).toBeInTheDocument();

    // Wait for async fetch to complete and controls to appear
    await waitFor(() => {
      expect(screen.getByText("1H")).toBeInTheDocument();
    });

    // Should render time range controls
    expect(screen.getByText("1D")).toBeInTheDocument();
    expect(screen.getByText("1W")).toBeInTheDocument();
  });

  it("renders indicator controls", async () => {
    render(<AdvancedChart asset={mockAsset} loading={false} />);

    // Wait for async fetch to complete
    await waitFor(() => {
      expect(screen.getByTestId("filter-chip-SMA")).toBeInTheDocument();
    });

    expect(screen.getByTestId("filter-chip-EMA")).toBeInTheDocument();
    expect(screen.getByTestId("filter-chip-BB")).toBeInTheDocument();
    expect(screen.getByTestId("filter-chip-Vol")).toBeInTheDocument();
  });

  it("renders chart type controls", async () => {
    render(<AdvancedChart asset={mockAsset} loading={false} />);

    // Wait for async fetch to complete
    await waitFor(() => {
      expect(screen.getByText("Area")).toBeInTheDocument();
    });

    expect(screen.getByText("Line")).toBeInTheDocument();
    expect(screen.getByText("Candle")).toBeInTheDocument();
  });

  it("toggles indicators when clicked", async () => {
    render(<AdvancedChart asset={mockAsset} loading={false} />);

    // Wait for async fetch to complete
    await waitFor(() => {
      expect(screen.getByTestId("filter-chip-SMA")).toBeInTheDocument();
    });

    const smaChip = screen.getByTestId("filter-chip-SMA");
    expect(smaChip).toHaveAttribute("data-selected", "false");

    fireEvent.click(smaChip);

    // After click, the indicator should be toggled
    // The component re-renders with new state
  });

  it("changes time range when clicked", async () => {
    render(<AdvancedChart asset={mockAsset} loading={false} />);

    // Wait for async fetch to complete
    await waitFor(() => {
      expect(screen.getByText("1D")).toBeInTheDocument();
    });

    const dayButton = screen.getByText("1D");
    fireEvent.click(dayButton);

    // Component should re-render with new time range
  });

  it("changes chart type when clicked", async () => {
    render(<AdvancedChart asset={mockAsset} loading={false} />);

    // Wait for async fetch to complete
    await waitFor(() => {
      expect(screen.getByText("Candle")).toBeInTheDocument();
    });

    const candleButton = screen.getByText("Candle");
    fireEvent.click(candleButton);

    // Component should re-render with candlestick chart
  });

  it("renders with custom height", async () => {
    render(<AdvancedChart asset={mockAsset} loading={false} height={600} />);

    // Wait for async fetch to complete
    await waitFor(() => {
      expect(screen.getByText("1H")).toBeInTheDocument();
    });

    expect(screen.getByTestId("card")).toBeInTheDocument();
  });

  it("handles negative price changes", async () => {
    const bearishAsset = { ...mockAsset, change24h: -5.0, change7d: -10.0 };
    render(<AdvancedChart asset={bearishAsset} loading={false} />);

    // Wait for async fetch to complete
    await waitFor(() => {
      expect(screen.getByText("1H")).toBeInTheDocument();
    });

    expect(screen.getByTestId("card")).toBeInTheDocument();
  });
});
