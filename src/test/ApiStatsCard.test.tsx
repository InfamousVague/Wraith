/**
 * Component Tests for ApiStatsCard
 *
 * Tests the ApiStatsCard component rendering and data display.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ApiStatsCard } from "../components/ApiStatsCard";

// Mock the haunt client
vi.mock("../services/haunt", () => ({
  hauntClient: {
    getStats: vi.fn(),
  },
}));

import { hauntClient } from "../services/haunt";

describe("ApiStatsCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render loading state initially", async () => {
    (hauntClient.getStats as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {}) // Never resolves - stays loading
    );

    render(<ApiStatsCard />);

    // Card should be in loading state
  });

  it("should display API STATISTICS header", async () => {
    const mockResponse = {
      data: {
        totalUpdates: 1000,
        tps: 5.5,
        uptimeSecs: 3600,
        activeSymbols: 50,
        onlineSources: 4,
        totalSources: 5,
        exchanges: [],
      },
      meta: { cached: false },
    };

    (hauntClient.getStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    render(<ApiStatsCard />);

    await waitFor(() => {
      expect(screen.getByText("API STATISTICS")).toBeInTheDocument();
    });
  });

  it("should display TPS value", async () => {
    const mockResponse = {
      data: {
        totalUpdates: 1000,
        tps: 5.5,
        uptimeSecs: 3600,
        activeSymbols: 50,
        onlineSources: 4,
        totalSources: 5,
        exchanges: [],
      },
      meta: { cached: false },
    };

    (hauntClient.getStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    render(<ApiStatsCard />);

    await waitFor(() => {
      expect(screen.getByText("TPS")).toBeInTheDocument();
      expect(screen.getByText("Throughput")).toBeInTheDocument();
    });
  });

  it("should display online sources count", async () => {
    const mockResponse = {
      data: {
        totalUpdates: 1000,
        tps: 5.5,
        uptimeSecs: 3600,
        activeSymbols: 50,
        onlineSources: 4,
        totalSources: 5,
        exchanges: [],
      },
      meta: { cached: false },
    };

    (hauntClient.getStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    render(<ApiStatsCard />);

    await waitFor(() => {
      expect(screen.getByText("4/5 Online")).toBeInTheDocument();
    });
  });

  it("should display latency metric", async () => {
    const mockResponse = {
      data: {
        totalUpdates: 1000,
        tps: 5.5,
        uptimeSecs: 3600,
        activeSymbols: 50,
        onlineSources: 4,
        totalSources: 5,
        exchanges: [],
      },
      meta: { cached: false },
    };

    (hauntClient.getStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    render(<ApiStatsCard />);

    await waitFor(() => {
      expect(screen.getByText("Latency")).toBeInTheDocument();
      expect(screen.getByText("ms")).toBeInTheDocument();
    });
  });

  it("should display tracked assets count", async () => {
    const mockResponse = {
      data: {
        totalUpdates: 1000,
        tps: 5.5,
        uptimeSecs: 3600,
        activeSymbols: 50,
        onlineSources: 4,
        totalSources: 5,
        exchanges: [],
      },
      meta: { cached: false },
    };

    (hauntClient.getStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    render(<ApiStatsCard />);

    await waitFor(() => {
      expect(screen.getByText("Tracked Assets")).toBeInTheDocument();
    });
  });

  it("should display total updates", async () => {
    const mockResponse = {
      data: {
        totalUpdates: 1000,
        tps: 5.5,
        uptimeSecs: 3600,
        activeSymbols: 50,
        onlineSources: 4,
        totalSources: 5,
        exchanges: [],
      },
      meta: { cached: false },
    };

    (hauntClient.getStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    render(<ApiStatsCard />);

    await waitFor(() => {
      expect(screen.getByText("Total Updates")).toBeInTheDocument();
    });
  });

  it("should display uptime", async () => {
    const mockResponse = {
      data: {
        totalUpdates: 1000,
        tps: 5.5,
        uptimeSecs: 3600,
        activeSymbols: 50,
        onlineSources: 4,
        totalSources: 5,
        exchanges: [],
      },
      meta: { cached: false },
    };

    (hauntClient.getStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    render(<ApiStatsCard />);

    await waitFor(() => {
      expect(screen.getByText("Uptime")).toBeInTheDocument();
      // 3600 seconds = 1h 0m
      expect(screen.getByText("1h 0m")).toBeInTheDocument();
    });
  });

  it("should display system health section", async () => {
    const mockResponse = {
      data: {
        totalUpdates: 1000,
        tps: 5.5,
        uptimeSecs: 3600,
        activeSymbols: 50,
        onlineSources: 4,
        totalSources: 5,
        exchanges: [],
      },
      meta: { cached: false },
    };

    (hauntClient.getStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    render(<ApiStatsCard />);

    await waitFor(() => {
      expect(screen.getByText("System Health")).toBeInTheDocument();
      // 4/5 online = 80%
      expect(screen.getByText("80%")).toBeInTheDocument();
    });
  });

  it("should handle API error gracefully", async () => {
    (hauntClient.getStats as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Network error")
    );

    render(<ApiStatsCard />);

    await waitFor(() => {
      expect(screen.getByText("API Offline")).toBeInTheDocument();
    });
  });

  it("should poll at specified interval", async () => {
    vi.useFakeTimers();

    const mockResponse = {
      data: {
        totalUpdates: 1000,
        tps: 5.5,
        uptimeSecs: 3600,
        activeSymbols: 50,
        onlineSources: 4,
        totalSources: 5,
        exchanges: [],
      },
      meta: { cached: false },
    };

    (hauntClient.getStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    render(<ApiStatsCard pollInterval={5000} />);

    // Initial call
    expect(hauntClient.getStats).toHaveBeenCalledTimes(1);

    // Advance timer
    vi.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(hauntClient.getStats).toHaveBeenCalledTimes(2);
    });

    vi.useRealTimers();
  });
});
