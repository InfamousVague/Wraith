/**
 * ExchangeLiquidity Component Tests
 *
 * Tests the data source statistics display including:
 * - Exchange list rendering
 * - Progress bars for update counts
 * - Online/offline status indicators
 * - Loading and error states
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch
const mockExchanges = [
  { source: "binance", updateCount: 5000, updatePercent: 35.5, online: true },
  { source: "coinbase", updateCount: 3500, updatePercent: 24.8, online: true },
  { source: "kraken", updateCount: 2000, updatePercent: 14.2, online: true },
  { source: "okx", updateCount: 0, updatePercent: 0, online: false, lastError: "Connection timeout" },
];

let mockFetchResponse = { data: mockExchanges };
let mockFetchOk = true;

global.fetch = vi.fn().mockImplementation(() =>
  Promise.resolve({
    ok: mockFetchOk,
    json: () => Promise.resolve(mockFetchResponse),
  })
);

// Mock theme colors
vi.mock("@wraith/ghost/context/ThemeContext", () => ({
  useThemeColors: () => ({
    text: { primary: "#ffffff", muted: "#888888" },
    border: { subtle: "#333333" },
  }),
}));

// Mock Ghost components
vi.mock("@wraith/ghost/components", () => ({
  Card: ({ children, loading, style }: { children: React.ReactNode; loading?: boolean; style?: object }) => (
    <div data-testid="card" data-loading={loading} style={style}>{children}</div>
  ),
  Text: ({ children, appearance }: { children: React.ReactNode; appearance?: string }) => (
    <span data-testid="text" data-appearance={appearance}>{children}</span>
  ),
  ProgressBar: ({ value, max, color }: { value: number; max: number; color?: string }) => (
    <div data-testid="progress-bar" data-value={value} data-max={max} data-color={color} />
  ),
  AnimatedNumber: ({ value, decimals }: { value: number; decimals?: number }) => (
    <span data-testid="animated-number">{value.toFixed(decimals || 0)}</span>
  ),
  Icon: ({ name, size, color }: { name: string; size?: string; color?: string }) => (
    <span data-testid={`icon-${name}`} data-color={color} />
  ),
}));

// Mock Colors
vi.mock("@wraith/ghost/tokens", () => ({
  Colors: {
    status: { success: "#2fd575", danger: "#ff5c7a" },
    accent: { primary: "#3b82f6" },
  },
}));

import { ExchangeLiquidity } from "./ExchangeLiquidity";

describe("ExchangeLiquidity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchResponse = { data: mockExchanges };
    mockFetchOk = true;
  });

  describe("Rendering", () => {
    it("renders card container", async () => {
      render(<ExchangeLiquidity />);
      await waitFor(() => {
        expect(screen.getByTestId("card")).toBeInTheDocument();
      });
    });

    it("renders data sources header", async () => {
      render(<ExchangeLiquidity />);
      await waitFor(() => {
        expect(screen.getByText("DATA SOURCES")).toBeInTheDocument();
      });
    });

    it("renders online count badge", async () => {
      render(<ExchangeLiquidity />);
      await waitFor(() => {
        expect(screen.getByText("3/4 Online")).toBeInTheDocument();
      });
    });
  });

  describe("Exchange List", () => {
    it("renders exchange names", async () => {
      render(<ExchangeLiquidity />);
      await waitFor(() => {
        expect(screen.getByText("Binance")).toBeInTheDocument();
        expect(screen.getByText("Coinbase")).toBeInTheDocument();
        expect(screen.getByText("Kraken")).toBeInTheDocument();
        expect(screen.getByText("OKX")).toBeInTheDocument();
      });
    });

    it("renders progress bars for each exchange", async () => {
      render(<ExchangeLiquidity />);
      await waitFor(() => {
        const progressBars = screen.getAllByTestId("progress-bar");
        expect(progressBars.length).toBe(4);
      });
    });

    it("renders update counts", async () => {
      render(<ExchangeLiquidity />);
      await waitFor(() => {
        const numbers = screen.getAllByTestId("animated-number");
        expect(numbers.length).toBeGreaterThan(0);
      });
    });

    it("renders skull icon for offline exchanges", async () => {
      render(<ExchangeLiquidity />);
      await waitFor(() => {
        expect(screen.getByTestId("icon-skull")).toBeInTheDocument();
      });
    });
  });

  describe("Loading State", () => {
    it("passes loading prop to card", () => {
      render(<ExchangeLiquidity loading={true} />);
      expect(screen.getByTestId("card")).toHaveAttribute("data-loading", "true");
    });
  });

  describe("Error State", () => {
    it("shows error state when fetch fails", async () => {
      mockFetchOk = false;
      render(<ExchangeLiquidity />);
      await waitFor(() => {
        expect(screen.getByText("API Offline")).toBeInTheDocument();
      });
    });

    it("shows skull icon on error", async () => {
      mockFetchOk = false;
      render(<ExchangeLiquidity />);
      await waitFor(() => {
        expect(screen.getByTestId("icon-skull")).toBeInTheDocument();
      });
    });
  });

  describe("Empty State", () => {
    it("shows collecting message when no exchanges", async () => {
      mockFetchResponse = { data: [] };
      render(<ExchangeLiquidity />);
      await waitFor(() => {
        expect(screen.getByText("Collecting data from sources...")).toBeInTheDocument();
      });
    });
  });

  describe("API Polling", () => {
    it("fetches data on mount", async () => {
      render(<ExchangeLiquidity />);
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/market/exchanges");
      });
    });

    it("accepts custom poll interval", async () => {
      render(<ExchangeLiquidity pollInterval={5000} />);
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });
});
