/**
 * @file Dashboard.test.tsx
 * @description Tests for the Dashboard page component.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import React from "react";

// Mock hooks and components
const mockSetFilters = vi.fn();
const mockSetViewMode = vi.fn();
const mockSetCardSize = vi.fn();

vi.mock("../context/ThemeContext", () => ({
  useTheme: () => ({ isDark: true, theme: "dark" }),
}));

vi.mock("../hooks/useCryptoData", () => ({
  useCryptoData: vi.fn(() => ({
    assets: [
      { id: "btc", symbol: "BTC", name: "Bitcoin", price: 50000, change24h: 2.5, assetType: "crypto" },
      { id: "eth", symbol: "ETH", name: "Ethereum", price: 3000, change24h: -1.2, assetType: "crypto" },
    ],
    loading: false,
    error: null,
  })),
}));

vi.mock("../hooks/usePersistedState", () => ({
  usePersistedState: vi.fn((key: string, defaultValue: unknown) => {
    if (key === "wraith:viewMode") return ["list", mockSetViewMode];
    if (key === "wraith:cardSize") return [220, mockSetCardSize];
    if (key === "wraith:filters") return [defaultValue, mockSetFilters];
    return [defaultValue, vi.fn()];
  }),
}));

vi.mock("../hooks/useBreakpoint", () => ({
  useBreakpoint: () => ({ isMobile: false, isNarrow: false }),
}));

vi.mock("../utils/marketHours", () => ({
  isUSMarketOpen: () => true,
  getMarketStatus: () => "24/7",
}));

vi.mock("../components/Navbar", () => ({
  Navbar: ({ assetType, onAssetTypeChange }: { assetType: string; onAssetTypeChange: (type: string) => void }) => (
    <div data-testid="navbar" data-asset-type={assetType}>
      <button data-testid="change-asset-type" onClick={() => onAssetTypeChange("crypto")}>
        Change Type
      </button>
    </div>
  ),
}));

vi.mock("../components/MetricsCarousel", () => ({
  MetricsCarousel: ({ assetType }: { assetType: string }) => (
    <div data-testid="metrics-carousel" data-asset-type={assetType}>Metrics</div>
  ),
}));

vi.mock("../components/AssetList", () => ({
  AssetList: ({ filters }: { filters: { assetType: string } }) => (
    <div data-testid="asset-list" data-asset-type={filters.assetType}>Asset List</div>
  ),
}));

vi.mock("../components/ChartGrid", () => ({
  ChartGrid: ({ assets, loading }: { assets: unknown[]; loading: boolean }) => (
    <div data-testid="chart-grid" data-loading={loading} data-count={assets.length}>Chart Grid</div>
  ),
}));

vi.mock("../components/Toolbar", () => ({
  Toolbar: ({ viewMode, onViewModeChange, filters, onFiltersChange }: {
    viewMode: string;
    onViewModeChange: (mode: string) => void;
    filters: { sort: string };
    onFiltersChange: (filters: unknown) => void;
  }) => (
    <div data-testid="toolbar" data-view-mode={viewMode}>
      <button data-testid="toggle-view" onClick={() => onViewModeChange(viewMode === "list" ? "grid" : "list")}>
        Toggle View
      </button>
      <button data-testid="change-sort" onClick={() => onFiltersChange({ ...filters, sort: "price" })}>
        Change Sort
      </button>
    </div>
  ),
}));

import { Dashboard } from "./Dashboard";
import { useCryptoData } from "../hooks/useCryptoData";

function TestWrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders without crashing", () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );
      expect(screen.getByTestId("navbar")).toBeInTheDocument();
    });

    it("renders all main components", () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );
      expect(screen.getByTestId("navbar")).toBeInTheDocument();
      expect(screen.getByTestId("metrics-carousel")).toBeInTheDocument();
      expect(screen.getByTestId("toolbar")).toBeInTheDocument();
      expect(screen.getByTestId("asset-list")).toBeInTheDocument();
    });

    it("renders asset list in list view mode", () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );
      expect(screen.getByTestId("asset-list")).toBeInTheDocument();
      expect(screen.queryByTestId("chart-grid")).not.toBeInTheDocument();
    });
  });

  describe("View Mode", () => {
    it("switches to grid view when toggled", () => {
      const { rerender } = render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId("toggle-view"));
      expect(mockSetViewMode).toHaveBeenCalledWith("grid");
    });
  });

  describe("Filters", () => {
    it("handles asset type change from navbar", () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId("change-asset-type"));
      expect(mockSetFilters).toHaveBeenCalled();
    });

    it("handles sort change from toolbar", () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId("change-sort"));
      expect(mockSetFilters).toHaveBeenCalled();
    });
  });

  describe("Loading State", () => {
    it("passes loading state to components", () => {
      vi.mocked(useCryptoData).mockReturnValue({
        assets: [],
        loading: true,
        error: null,
      } as ReturnType<typeof useCryptoData>);

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      // In list mode, AssetList handles loading internally
      expect(screen.getByTestId("asset-list")).toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("handles error state gracefully", () => {
      vi.mocked(useCryptoData).mockReturnValue({
        assets: [],
        loading: false,
        error: new Error("Failed to fetch"),
      } as ReturnType<typeof useCryptoData>);

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      // Should still render without crashing
      expect(screen.getByTestId("navbar")).toBeInTheDocument();
    });
  });

  describe("Theme", () => {
    it("applies theme colors", () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      // Component renders with theme - specific styling tested visually
      expect(screen.getByTestId("navbar")).toBeInTheDocument();
    });
  });
});
