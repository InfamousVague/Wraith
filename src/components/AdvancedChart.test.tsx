import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import React from "react";
import { AdvancedChart } from "./AdvancedChart";
import type { Asset } from "../types/asset";

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
vi.mock("../services/haunt", () => ({
  hauntClient: {
    getChart: vi.fn().mockResolvedValue({ data: { symbol: "btc", range: "1d", data: [], seeding: false } }),
    seedSymbol: vi.fn(),
  },
}));

// Mock Ghost components
vi.mock("@wraith/ghost/components", () => ({
  Card: ({ children, style }: { children: React.ReactNode; style?: object }) => (
    <div data-testid="card" style={style}>{children}</div>
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

  it("renders empty state when no asset", () => {
    render(<AdvancedChart asset={null} loading={false} />);

    expect(screen.getByTestId("icon-bar-chart-2")).toBeInTheDocument();
    expect(screen.getByText("No chart data available")).toBeInTheDocument();
  });

  it("renders empty state when sparkline is too short", async () => {
    const assetWithShortSparkline = { ...mockAsset, sparkline: [50000] };
    render(<AdvancedChart asset={assetWithShortSparkline} loading={false} />);

    // Wait for fetch to complete (mocked to return empty data)
    await waitFor(() => {
      expect(screen.getByText("No chart data available")).toBeInTheDocument();
    });
  });

  it("renders chart with valid asset data", () => {
    render(<AdvancedChart asset={mockAsset} loading={false} />);

    // Should render the card
    expect(screen.getByTestId("card")).toBeInTheDocument();

    // Should render time range controls
    expect(screen.getByText("1H")).toBeInTheDocument();
    expect(screen.getByText("1D")).toBeInTheDocument();
    expect(screen.getByText("1W")).toBeInTheDocument();
  });

  it("renders indicator controls", () => {
    render(<AdvancedChart asset={mockAsset} loading={false} />);

    expect(screen.getByTestId("filter-chip-SMA")).toBeInTheDocument();
    expect(screen.getByTestId("filter-chip-EMA")).toBeInTheDocument();
    expect(screen.getByTestId("filter-chip-BB")).toBeInTheDocument();
    expect(screen.getByTestId("filter-chip-Vol")).toBeInTheDocument();
  });

  it("renders chart type controls", () => {
    render(<AdvancedChart asset={mockAsset} loading={false} />);

    expect(screen.getByText("Area")).toBeInTheDocument();
    expect(screen.getByText("Line")).toBeInTheDocument();
    expect(screen.getByText("Candle")).toBeInTheDocument();
  });

  it("toggles indicators when clicked", () => {
    render(<AdvancedChart asset={mockAsset} loading={false} />);

    const smaChip = screen.getByTestId("filter-chip-SMA");
    expect(smaChip).toHaveAttribute("data-selected", "false");

    fireEvent.click(smaChip);

    // After click, the indicator should be toggled
    // The component re-renders with new state
  });

  it("changes time range when clicked", () => {
    render(<AdvancedChart asset={mockAsset} loading={false} />);

    const dayButton = screen.getByText("1D");
    fireEvent.click(dayButton);

    // Component should re-render with new time range
  });

  it("changes chart type when clicked", () => {
    render(<AdvancedChart asset={mockAsset} loading={false} />);

    const candleButton = screen.getByText("Candle");
    fireEvent.click(candleButton);

    // Component should re-render with candlestick chart
  });

  it("renders with custom height", () => {
    render(<AdvancedChart asset={mockAsset} loading={false} height={600} />);

    expect(screen.getByTestId("card")).toBeInTheDocument();
  });

  it("handles negative price changes", () => {
    const bearishAsset = { ...mockAsset, change24h: -5.0, change7d: -10.0 };
    render(<AdvancedChart asset={bearishAsset} loading={false} />);

    expect(screen.getByTestId("card")).toBeInTheDocument();
  });
});
