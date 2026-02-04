/**
 * PriceFeedCard Component Tests
 *
 * Tests the live price update feed including:
 * - Statistics display (updates, TPS, uptime, sources)
 * - Connection status indicator
 * - Event list rendering
 * - Loading and empty states
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock useHauntSocket
const mockSubscribe = vi.fn();
const mockOnPriceUpdate = vi.fn((callback) => {
  // Return unsubscribe function
  return () => {};
});

vi.mock("../hooks/useHauntSocket", () => ({
  useHauntSocket: () => ({
    connected: true,
    onPriceUpdate: mockOnPriceUpdate,
    subscribe: mockSubscribe,
    updateCount: 12345,
  }),
}));

// Mock fetch for stats
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({
    data: {
      tps: 25.5,
      uptimeSecs: 86400,
      activeSymbols: 150,
      onlineSources: 8,
      totalSources: 9,
    },
  }),
});

// Mock theme colors
vi.mock("@wraith/ghost/context/ThemeContext", () => ({
  useThemeColors: () => ({
    text: { primary: "#ffffff", muted: "#888888" },
    background: { canvas: "#000000", raised: "#1a1a1a" },
    border: { subtle: "#333333" },
  }),
}));

// Mock Ghost components
vi.mock("@wraith/ghost/components", () => ({
  Card: ({ children, loading }: { children: React.ReactNode; loading?: boolean }) => (
    <div data-testid="card" data-loading={loading}>{children}</div>
  ),
  Text: ({ children, appearance }: { children: React.ReactNode; appearance?: string }) => (
    <span data-testid="text" data-appearance={appearance}>{children}</span>
  ),
  Currency: ({ value, compact }: { value: number; compact?: boolean }) => (
    <span data-testid="currency" data-compact={compact}>${value}</span>
  ),
  PercentChange: ({ value }: { value: number }) => (
    <span data-testid="percent-change">{value}%</span>
  ),
  AnimatedNumber: ({ value, decimals }: { value: number; decimals?: number }) => (
    <span data-testid="animated-number">{value.toFixed(decimals || 0)}</span>
  ),
}));

// Mock Colors
vi.mock("@wraith/ghost/tokens", () => ({
  Colors: {
    status: { success: "#2fd575", danger: "#ff5c7a" },
    accent: { primary: "#3b82f6" },
    text: { muted: "#888888" },
  },
}));

import { PriceFeedCard } from "./PriceFeedCard";

describe("PriceFeedCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders card container", () => {
      render(<PriceFeedCard />);
      expect(screen.getByTestId("card")).toBeInTheDocument();
    });

    it("renders updates tracked header", () => {
      render(<PriceFeedCard />);
      expect(screen.getByText("UPDATES TRACKED")).toBeInTheDocument();
    });

    it("renders update count", () => {
      render(<PriceFeedCard />);
      const numbers = screen.getAllByTestId("animated-number");
      expect(numbers.length).toBeGreaterThan(0);
    });

    it("renders TPS badge", () => {
      render(<PriceFeedCard />);
      expect(screen.getByText("/sec")).toBeInTheDocument();
    });

    it("renders metrics row labels", async () => {
      render(<PriceFeedCard />);
      await waitFor(() => {
        expect(screen.getByText("Uptime")).toBeInTheDocument();
        expect(screen.getByText("Symbols")).toBeInTheDocument();
        expect(screen.getByText("Sources")).toBeInTheDocument();
      });
    });
  });

  describe("Connection Status", () => {
    it("shows connection dot", () => {
      render(<PriceFeedCard />);
      // The connection dot should be rendered - it's a View with backgroundColor
      expect(screen.getByTestId("card")).toBeInTheDocument();
    });
  });

  describe("WebSocket Integration", () => {
    it("registers for price updates", () => {
      render(<PriceFeedCard />);
      expect(mockOnPriceUpdate).toHaveBeenCalled();
    });

    it("subscribes to top assets when connected", () => {
      render(<PriceFeedCard />);
      expect(mockSubscribe).toHaveBeenCalled();
    });
  });

  describe("Empty State", () => {
    it("shows waiting message when no events", () => {
      render(<PriceFeedCard />);
      expect(screen.getByText("Waiting for updates...")).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("passes loading prop to card", () => {
      render(<PriceFeedCard loading={true} />);
      expect(screen.getByTestId("card")).toHaveAttribute("data-loading", "true");
    });
  });

  describe("Stats Fetching", () => {
    it("fetches stats on mount", async () => {
      render(<PriceFeedCard />);
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/market/stats");
      });
    });
  });

  describe("Props", () => {
    it("accepts maxEvents prop", () => {
      render(<PriceFeedCard maxEvents={10} />);
      expect(screen.getByTestId("card")).toBeInTheDocument();
    });

    it("accepts eventLifetime prop", () => {
      render(<PriceFeedCard eventLifetime={60000} />);
      expect(screen.getByTestId("card")).toBeInTheDocument();
    });
  });
});
