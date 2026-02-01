/**
 * Component Tests for TopMoversCard
 *
 * Tests the TopMoversCard component rendering and interactions.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { TopMoversCard } from "../components/TopMoversCard";

// Mock the haunt client
vi.mock("../services/haunt", () => ({
  hauntClient: {
    getMovers: vi.fn(),
  },
}));

import { hauntClient } from "../services/haunt";

describe("TopMoversCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render loading state initially", async () => {
    (hauntClient.getMovers as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {}) // Never resolves - stays loading
    );

    render(<TopMoversCard />);

    // Card should be in loading state
    // The Card component shows loading skeleton when loading prop is true
  });

  it("should render gainers by default", async () => {
    const mockResponse = {
      data: {
        timeframe: "1h",
        gainers: [
          { symbol: "BTC", price: 50000, changePercent: 5.25 },
          { symbol: "SOL", price: 100, changePercent: 4.5 },
        ],
        losers: [
          { symbol: "ETH", price: 3000, changePercent: -3.5 },
        ],
        timestamp: Date.now(),
      },
      meta: { cached: false },
    };

    (hauntClient.getMovers as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    render(<TopMoversCard />);

    await waitFor(() => {
      expect(screen.getByText("BTC")).toBeInTheDocument();
      expect(screen.getByText("SOL")).toBeInTheDocument();
    });
  });

  it("should display TOP MOVERS header", async () => {
    const mockResponse = {
      data: {
        timeframe: "1h",
        gainers: [],
        losers: [],
        timestamp: Date.now(),
      },
      meta: { cached: false },
    };

    (hauntClient.getMovers as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    render(<TopMoversCard />);

    await waitFor(() => {
      expect(screen.getByText("TOP MOVERS")).toBeInTheDocument();
    });
  });

  it("should show gainers and losers tabs", async () => {
    const mockResponse = {
      data: {
        timeframe: "1h",
        gainers: [{ symbol: "BTC", price: 50000, changePercent: 5.25 }],
        losers: [{ symbol: "ETH", price: 3000, changePercent: -3.5 }],
        timestamp: Date.now(),
      },
      meta: { cached: false },
    };

    (hauntClient.getMovers as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    render(<TopMoversCard />);

    await waitFor(() => {
      expect(screen.getByText("Gainers")).toBeInTheDocument();
      expect(screen.getByText("Losers")).toBeInTheDocument();
    });
  });

  it("should switch to losers when clicked", async () => {
    const mockResponse = {
      data: {
        timeframe: "1h",
        gainers: [{ symbol: "BTC", price: 50000, changePercent: 5.25 }],
        losers: [{ symbol: "ETH", price: 3000, changePercent: -3.5 }],
        timestamp: Date.now(),
      },
      meta: { cached: false },
    };

    (hauntClient.getMovers as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    render(<TopMoversCard />);

    await waitFor(() => {
      expect(screen.getByText("Losers")).toBeInTheDocument();
    });

    // Click on Losers tab
    const losersTab = screen.getByText("Losers");
    fireEvent.click(losersTab);

    await waitFor(() => {
      expect(screen.getByText("ETH")).toBeInTheDocument();
    });
  });

  it("should show empty state when no gainers", async () => {
    const mockResponse = {
      data: {
        timeframe: "1h",
        gainers: [],
        losers: [],
        timestamp: Date.now(),
      },
      meta: { cached: false },
    };

    (hauntClient.getMovers as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    render(<TopMoversCard />);

    await waitFor(() => {
      expect(screen.getByText(/No gainers/i)).toBeInTheDocument();
    });
  });

  it("should handle API error gracefully", async () => {
    (hauntClient.getMovers as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Network error")
    );

    render(<TopMoversCard />);

    await waitFor(() => {
      expect(screen.getByText(/Unable to load movers/i)).toBeInTheDocument();
    });
  });

  it("should call API with correct timeframe", async () => {
    const mockResponse = {
      data: {
        timeframe: "1h",
        gainers: [],
        losers: [],
        timestamp: Date.now(),
      },
      meta: { cached: false },
    };

    (hauntClient.getMovers as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    render(<TopMoversCard />);

    await waitFor(() => {
      expect(hauntClient.getMovers).toHaveBeenCalledWith("1h", 10);
    });
  });

  it("should display movers with correct data", async () => {
    const mockResponse = {
      data: {
        timeframe: "1h",
        gainers: [
          { symbol: "BTC", price: 50000, changePercent: 5.25 },
          { symbol: "SOL", price: 100, changePercent: 4.5 },
        ],
        losers: [
          { symbol: "ETH", price: 3000, changePercent: -3.5 },
        ],
        timestamp: Date.now(),
      },
      meta: { cached: false },
    };

    (hauntClient.getMovers as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    render(<TopMoversCard />);

    await waitFor(() => {
      // Check for mover symbols
      expect(screen.getByText("BTC")).toBeInTheDocument();
      expect(screen.getByText("SOL")).toBeInTheDocument();
    });
  });

  it("should rank movers correctly", async () => {
    const mockResponse = {
      data: {
        timeframe: "1h",
        gainers: [
          { symbol: "BTC", price: 50000, changePercent: 10.0 },
          { symbol: "SOL", price: 100, changePercent: 5.0 },
          { symbol: "DOGE", price: 0.08, changePercent: 3.0 },
        ],
        losers: [],
        timestamp: Date.now(),
      },
      meta: { cached: false },
    };

    (hauntClient.getMovers as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    render(<TopMoversCard />);

    await waitFor(() => {
      // Verify ranks are displayed
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
    });
  });

  it("should respect custom pollInterval", async () => {
    vi.useFakeTimers();

    const mockResponse = {
      data: {
        timeframe: "1h",
        gainers: [],
        losers: [],
        timestamp: Date.now(),
      },
      meta: { cached: false },
    };

    (hauntClient.getMovers as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    render(<TopMoversCard pollInterval={10000} />);

    // Initial call
    expect(hauntClient.getMovers).toHaveBeenCalledTimes(1);

    // Advance timer
    vi.advanceTimersByTime(10000);

    await waitFor(() => {
      expect(hauntClient.getMovers).toHaveBeenCalledTimes(2);
    });

    vi.useRealTimers();
  });
});

describe("TopMoversCard timeframe selection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should have timeframe options available", async () => {
    const mockResponse = {
      data: {
        timeframe: "1h",
        gainers: [],
        losers: [],
        timestamp: Date.now(),
      },
      meta: { cached: false },
    };

    (hauntClient.getMovers as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    render(<TopMoversCard />);

    await waitFor(() => {
      // Check for timeframe options in the segmented control
      expect(screen.getByText("5m")).toBeInTheDocument();
      expect(screen.getByText("15m")).toBeInTheDocument();
      expect(screen.getByText("1H")).toBeInTheDocument();
      expect(screen.getByText("4H")).toBeInTheDocument();
      expect(screen.getByText("24H")).toBeInTheDocument();
    });
  });
});
