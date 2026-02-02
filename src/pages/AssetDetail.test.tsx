import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AssetDetail } from "./AssetDetail";

// Mock the theme context
vi.mock("../context/ThemeContext", () => ({
  useTheme: () => ({
    isDark: true,
    theme: "dark",
  }),
}));

// Use vi.hoisted to define mock before vi.mock hoisting
const { mockGetAsset } = vi.hoisted(() => ({
  mockGetAsset: vi.fn(),
}));

vi.mock("../services/haunt", () => ({
  hauntClient: {
    getAsset: mockGetAsset,
  },
}));

// Mock useHauntSocket
vi.mock("../hooks/useHauntSocket", () => ({
  useAssetSubscription: vi.fn(),
}));

// Mock child components
vi.mock("../components/Navbar", () => ({
  Navbar: () => <div data-testid="navbar">Navbar</div>,
}));

vi.mock("../components/AssetHeader", () => ({
  AssetHeader: ({ asset, loading, onBack }: { asset: unknown; loading: boolean; onBack: () => void }) => (
    <div data-testid="asset-header" data-loading={loading}>
      {loading ? "Loading..." : asset ? "Asset Header" : "No Asset"}
      <button onClick={onBack} data-testid="back-button">Back</button>
    </div>
  ),
}));

vi.mock("../components/AdvancedChart", () => ({
  AdvancedChart: ({ asset, loading }: { asset: unknown; loading: boolean }) => (
    <div data-testid="advanced-chart" data-loading={loading}>
      {loading ? "Loading Chart..." : asset ? "Chart" : "No Chart"}
    </div>
  ),
}));

vi.mock("../components/MetricsGrid", () => ({
  MetricsGrid: ({ asset, loading }: { asset: unknown; loading: boolean }) => (
    <div data-testid="metrics-grid" data-loading={loading}>
      {loading ? "Loading Metrics..." : asset ? "Metrics" : "No Metrics"}
    </div>
  ),
}));

// Mock Ghost components
vi.mock("@wraith/ghost/components", () => ({
  Text: ({ children, appearance }: { children: React.ReactNode; appearance?: string }) => (
    <span data-testid="text" data-appearance={appearance}>{children}</span>
  ),
}));

const mockAsset = {
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
  sparkline: [48000, 49000, 50000],
};

// Helper to render with proper routing
function renderWithRouter(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/asset/:id" element={<AssetDetail />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("AssetDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAsset.mockReset();
  });

  it("renders loading state initially", async () => {
    // Mock that never resolves to keep loading state
    mockGetAsset.mockImplementation(() => new Promise(() => {}));

    renderWithRouter("/asset/1");

    // Check loading state
    expect(screen.getByTestId("navbar")).toBeInTheDocument();
    expect(screen.getByTestId("asset-header")).toHaveAttribute("data-loading", "true");
  });

  it("renders asset data after loading", async () => {
    mockGetAsset.mockResolvedValue({ data: mockAsset });

    renderWithRouter("/asset/1");

    await waitFor(() => {
      expect(screen.getByTestId("advanced-chart")).toHaveAttribute("data-loading", "false");
    });

    expect(screen.getByTestId("metrics-grid")).toBeInTheDocument();
    expect(screen.getByText("Chart")).toBeInTheDocument();
  });

  it("renders error state when fetch fails", async () => {
    mockGetAsset.mockRejectedValue(new Error("Failed to fetch"));

    renderWithRouter("/asset/1");

    await waitFor(() => {
      expect(screen.getByText("Failed to fetch")).toBeInTheDocument();
    });
  });

  it("renders error for invalid asset ID", async () => {
    // Mock should not be called for invalid ID since isNaN check throws first
    renderWithRouter("/asset/invalid");

    await waitFor(() => {
      expect(screen.getByText("Invalid asset ID")).toBeInTheDocument();
    });
  });

  it("has a working back button", async () => {
    mockGetAsset.mockResolvedValue({ data: mockAsset });

    renderWithRouter("/asset/1");

    await waitFor(() => {
      expect(screen.getByTestId("back-button")).toBeInTheDocument();
    });
  });
});
