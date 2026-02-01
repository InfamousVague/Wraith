/**
 * Component Tests for ConfidenceCard
 *
 * Tests the ConfidenceCard component rendering and data display.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ConfidenceCard } from "../components/ConfidenceCard";

// Mock the haunt client
vi.mock("../services/haunt", () => ({
  hauntClient: {
    getConfidence: vi.fn(),
  },
}));

import { hauntClient } from "../services/haunt";

describe("ConfidenceCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render loading state initially", async () => {
    (hauntClient.getConfidence as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {}) // Never resolves - stays loading
    );

    render(<ConfidenceCard symbol="BTC" />);

    // Card should be in loading state
  });

  it("should display DATA CONFIDENCE header", async () => {
    const mockResponse = {
      data: {
        symbol: "btc",
        confidence: {
          score: 85,
          sourceCount: 4,
          onlineSources: 4,
          totalUpdates: 5000,
          currentPrice: 50000,
          priceSpreadPercent: 0.1,
          secondsSinceUpdate: 5,
          factors: {
            sourceDiversity: 24,
            updateFrequency: 25,
            dataRecency: 25,
            priceConsistency: 16,
          },
        },
        chartDataPoints: 1500,
        timestamp: Date.now(),
      },
      meta: { cached: false },
    };

    (hauntClient.getConfidence as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    render(<ConfidenceCard symbol="BTC" />);

    await waitFor(() => {
      expect(screen.getByText("DATA CONFIDENCE")).toBeInTheDocument();
    });
  });

  it("should display confidence score", async () => {
    const mockResponse = {
      data: {
        symbol: "btc",
        confidence: {
          score: 85,
          sourceCount: 4,
          onlineSources: 4,
          totalUpdates: 5000,
          currentPrice: 50000,
          priceSpreadPercent: 0.1,
          secondsSinceUpdate: 5,
          factors: {
            sourceDiversity: 24,
            updateFrequency: 25,
            dataRecency: 25,
            priceConsistency: 16,
          },
        },
        chartDataPoints: 1500,
        timestamp: Date.now(),
      },
      meta: { cached: false },
    };

    (hauntClient.getConfidence as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    render(<ConfidenceCard symbol="BTC" />);

    await waitFor(() => {
      // Score and max value
      expect(screen.getByText("/ 100")).toBeInTheDocument();
    });
  });

  it("should display confidence label based on score", async () => {
    const mockResponse = {
      data: {
        symbol: "btc",
        confidence: {
          score: 85,
          sourceCount: 4,
          onlineSources: 4,
          totalUpdates: 5000,
          currentPrice: 50000,
          priceSpreadPercent: 0.1,
          secondsSinceUpdate: 5,
          factors: {
            sourceDiversity: 24,
            updateFrequency: 25,
            dataRecency: 25,
            priceConsistency: 16,
          },
        },
        chartDataPoints: 1500,
        timestamp: Date.now(),
      },
      meta: { cached: false },
    };

    (hauntClient.getConfidence as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    render(<ConfidenceCard symbol="BTC" />);

    await waitFor(() => {
      // Score 85 = "Excellent"
      expect(screen.getByText("Excellent")).toBeInTheDocument();
    });
  });

  it("should display stats row with sources, updates, and data points", async () => {
    const mockResponse = {
      data: {
        symbol: "btc",
        confidence: {
          score: 85,
          sourceCount: 4,
          onlineSources: 4,
          totalUpdates: 5000,
          currentPrice: 50000,
          priceSpreadPercent: 0.1,
          secondsSinceUpdate: 5,
          factors: {
            sourceDiversity: 24,
            updateFrequency: 25,
            dataRecency: 25,
            priceConsistency: 16,
          },
        },
        chartDataPoints: 1500,
        timestamp: Date.now(),
      },
      meta: { cached: false },
    };

    (hauntClient.getConfidence as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    render(<ConfidenceCard symbol="BTC" />);

    await waitFor(() => {
      expect(screen.getByText("Sources")).toBeInTheDocument();
      expect(screen.getByText("Updates")).toBeInTheDocument();
      expect(screen.getByText("Data Points")).toBeInTheDocument();
    });
  });

  it("should display confidence factors breakdown", async () => {
    const mockResponse = {
      data: {
        symbol: "btc",
        confidence: {
          score: 85,
          sourceCount: 4,
          onlineSources: 4,
          totalUpdates: 5000,
          currentPrice: 50000,
          priceSpreadPercent: 0.1,
          secondsSinceUpdate: 5,
          factors: {
            sourceDiversity: 24,
            updateFrequency: 25,
            dataRecency: 25,
            priceConsistency: 16,
          },
        },
        chartDataPoints: 1500,
        timestamp: Date.now(),
      },
      meta: { cached: false },
    };

    (hauntClient.getConfidence as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    render(<ConfidenceCard symbol="BTC" />);

    await waitFor(() => {
      expect(screen.getByText("CONFIDENCE FACTORS")).toBeInTheDocument();
      expect(screen.getByText("Source Diversity")).toBeInTheDocument();
      expect(screen.getByText("Update Frequency")).toBeInTheDocument();
      expect(screen.getByText("Data Recency")).toBeInTheDocument();
      expect(screen.getByText("Price Consistency")).toBeInTheDocument();
    });
  });

  it("should show symbol in description", async () => {
    const mockResponse = {
      data: {
        symbol: "btc",
        confidence: {
          score: 85,
          sourceCount: 4,
          onlineSources: 4,
          totalUpdates: 5000,
          currentPrice: 50000,
          priceSpreadPercent: 0.1,
          secondsSinceUpdate: 5,
          factors: {
            sourceDiversity: 24,
            updateFrequency: 25,
            dataRecency: 25,
            priceConsistency: 16,
          },
        },
        chartDataPoints: 1500,
        timestamp: Date.now(),
      },
      meta: { cached: false },
    };

    (hauntClient.getConfidence as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    render(<ConfidenceCard symbol="BTC" />);

    await waitFor(() => {
      expect(screen.getByText(/Quality score for BTC/i)).toBeInTheDocument();
    });
  });

  it("should handle API error gracefully", async () => {
    (hauntClient.getConfidence as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Network error")
    );

    render(<ConfidenceCard symbol="BTC" />);

    await waitFor(() => {
      expect(screen.getByText(/Unable to load confidence data/i)).toBeInTheDocument();
    });
  });

  it("should call API with correct symbol", async () => {
    const mockResponse = {
      data: {
        symbol: "eth",
        confidence: {
          score: 75,
          sourceCount: 3,
          onlineSources: 3,
          totalUpdates: 3000,
          currentPrice: 3000,
          priceSpreadPercent: 0.2,
          secondsSinceUpdate: 10,
          factors: {
            sourceDiversity: 18,
            updateFrequency: 20,
            dataRecency: 20,
            priceConsistency: 17,
          },
        },
        chartDataPoints: 1000,
        timestamp: Date.now(),
      },
      meta: { cached: false },
    };

    (hauntClient.getConfidence as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    render(<ConfidenceCard symbol="ETH" />);

    await waitFor(() => {
      expect(hauntClient.getConfidence).toHaveBeenCalledWith("ETH");
    });
  });

  it("should display Good label for score 60-79", async () => {
    const mockResponse = {
      data: {
        symbol: "btc",
        confidence: {
          score: 65,
          sourceCount: 3,
          onlineSources: 3,
          totalUpdates: 2000,
          currentPrice: 50000,
          priceSpreadPercent: 0.5,
          secondsSinceUpdate: 15,
          factors: {
            sourceDiversity: 18,
            updateFrequency: 15,
            dataRecency: 15,
            priceConsistency: 12,
          },
        },
        chartDataPoints: 800,
        timestamp: Date.now(),
      },
      meta: { cached: false },
    };

    (hauntClient.getConfidence as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    render(<ConfidenceCard symbol="BTC" />);

    await waitFor(() => {
      expect(screen.getByText("Good")).toBeInTheDocument();
    });
  });

  it("should display Fair label for score 40-59", async () => {
    const mockResponse = {
      data: {
        symbol: "btc",
        confidence: {
          score: 45,
          sourceCount: 2,
          onlineSources: 2,
          totalUpdates: 500,
          currentPrice: 50000,
          priceSpreadPercent: 1.5,
          secondsSinceUpdate: 60,
          factors: {
            sourceDiversity: 12,
            updateFrequency: 10,
            dataRecency: 10,
            priceConsistency: 8,
          },
        },
        chartDataPoints: 300,
        timestamp: Date.now(),
      },
      meta: { cached: false },
    };

    (hauntClient.getConfidence as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    render(<ConfidenceCard symbol="BTC" />);

    await waitFor(() => {
      expect(screen.getByText("Fair")).toBeInTheDocument();
    });
  });
});
