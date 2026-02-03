/**
 * PredictionRow Component Tests
 *
 * Tests the single prediction row display including:
 * - Indicator name and direction
 * - Price display and change
 * - Outcome icons (correct, incorrect, neutral, pending)
 * - Time formatting
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock theme colors
vi.mock("@wraith/ghost/context/ThemeContext", () => ({
  useThemeColors: () => ({
    text: { primary: "#ffffff", muted: "#888888" },
  }),
}));

// Mock Ghost components
vi.mock("@wraith/ghost/components", () => ({
  Text: ({ children, appearance, style }: { children: React.ReactNode; appearance?: string; style?: object }) => (
    <span data-testid="text" data-appearance={appearance}>{children}</span>
  ),
  Icon: ({ name, color }: { name: string; color?: string }) => (
    <span data-testid={`icon-${name}`} data-color={color} />
  ),
}));

// Mock Colors
vi.mock("@wraith/ghost/tokens", () => ({
  Colors: {
    status: {
      success: "#2fd575",
      successDim: "#1ea355",
      danger: "#ff5c7a",
      dangerDim: "#cc4a62",
    },
    text: { muted: "#888888" },
  },
}));

import { PredictionRow } from "./PredictionRow";
import type { SignalPrediction } from "../types/signals";

const basePrediction: SignalPrediction = {
  id: "1",
  symbol: "BTC",
  indicator: "RSI",
  direction: "buy",
  timestamp: Date.now() - 3600000, // 1 hour ago
  priceAtPrediction: 50000,
};

describe("PredictionRow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders indicator name", () => {
      render(<PredictionRow prediction={basePrediction} />);
      expect(screen.getByText("RSI")).toBeInTheDocument();
    });

    it("renders price at prediction", () => {
      render(<PredictionRow prediction={basePrediction} />);
      expect(screen.getByText("$50,000")).toBeInTheDocument();
    });
  });

  describe("Direction Display", () => {
    it("shows BUY for buy direction", () => {
      render(<PredictionRow prediction={{ ...basePrediction, direction: "buy" }} />);
      expect(screen.getByText("BUY")).toBeInTheDocument();
    });

    it("shows BUY for strong_buy direction", () => {
      render(<PredictionRow prediction={{ ...basePrediction, direction: "strong_buy" }} />);
      expect(screen.getByText("BUY")).toBeInTheDocument();
    });

    it("shows SELL for sell direction", () => {
      render(<PredictionRow prediction={{ ...basePrediction, direction: "sell" }} />);
      expect(screen.getByText("SELL")).toBeInTheDocument();
    });

    it("shows SELL for strong_sell direction", () => {
      render(<PredictionRow prediction={{ ...basePrediction, direction: "strong_sell" }} />);
      expect(screen.getByText("SELL")).toBeInTheDocument();
    });

    it("shows HOLD for neutral direction", () => {
      render(<PredictionRow prediction={{ ...basePrediction, direction: "neutral" }} />);
      expect(screen.getByText("HOLD")).toBeInTheDocument();
    });
  });

  describe("Outcome Display", () => {
    it("shows check icon for correct outcome", () => {
      const prediction: SignalPrediction = {
        ...basePrediction,
        outcome1h: "correct",
        priceAfter1h: 51000,
      };
      render(<PredictionRow prediction={prediction} />);
      expect(screen.getByTestId("icon-check")).toBeInTheDocument();
    });

    it("shows x icon for incorrect outcome", () => {
      const prediction: SignalPrediction = {
        ...basePrediction,
        outcome1h: "incorrect",
        priceAfter1h: 49000,
      };
      render(<PredictionRow prediction={prediction} />);
      expect(screen.getByTestId("icon-x")).toBeInTheDocument();
    });

    it("shows minus icon for neutral outcome", () => {
      const prediction: SignalPrediction = {
        ...basePrediction,
        outcome1h: "neutral",
        priceAfter1h: 50000,
      };
      render(<PredictionRow prediction={prediction} />);
      expect(screen.getByTestId("icon-minus")).toBeInTheDocument();
    });

    it("shows clock icon for pending prediction", () => {
      render(<PredictionRow prediction={basePrediction} />);
      expect(screen.getByTestId("icon-clock")).toBeInTheDocument();
    });
  });

  describe("Price Change", () => {
    it("shows price after and change when outcome exists", () => {
      const prediction: SignalPrediction = {
        ...basePrediction,
        outcome1h: "correct",
        priceAfter1h: 51000,
      };
      render(<PredictionRow prediction={prediction} />);
      expect(screen.getByText("$51,000")).toBeInTheDocument();
      expect(screen.getByText("(+2.00%)")).toBeInTheDocument();
    });

    it("shows negative change correctly", () => {
      const prediction: SignalPrediction = {
        ...basePrediction,
        outcome1h: "incorrect",
        priceAfter1h: 49000,
      };
      render(<PredictionRow prediction={prediction} />);
      expect(screen.getByText("$49,000")).toBeInTheDocument();
      expect(screen.getByText("(-2.00%)")).toBeInTheDocument();
    });

    it("shows awaiting message for pending", () => {
      render(<PredictionRow prediction={basePrediction} />);
      expect(screen.getByText(/awaiting.*pending/)).toBeInTheDocument();
    });
  });

  describe("Timeframe Priority", () => {
    it("uses 24h outcome when available", () => {
      const prediction: SignalPrediction = {
        ...basePrediction,
        outcome5m: "incorrect",
        outcome1h: "incorrect",
        outcome4h: "incorrect",
        outcome24h: "correct",
        priceAfter24h: 55000,
      };
      render(<PredictionRow prediction={prediction} />);
      expect(screen.getByText("$55,000")).toBeInTheDocument();
    });

    it("respects preferred timeframe prop", () => {
      const prediction: SignalPrediction = {
        ...basePrediction,
        outcome5m: "correct",
        outcome1h: "incorrect",
        priceAfter5m: 50500,
        priceAfter1h: 49000,
      };
      render(<PredictionRow prediction={prediction} timeframe="5m" />);
      expect(screen.getByText("$50,500")).toBeInTheDocument();
    });
  });

  describe("Time Ago", () => {
    it("shows time ago for recent prediction", () => {
      const prediction: SignalPrediction = {
        ...basePrediction,
        timestamp: Date.now() - 3600000, // 1 hour ago
      };
      render(<PredictionRow prediction={prediction} />);
      expect(screen.getByText("1h ago")).toBeInTheDocument();
    });

    it("shows minutes for recent prediction", () => {
      const prediction: SignalPrediction = {
        ...basePrediction,
        timestamp: Date.now() - 1800000, // 30 minutes ago
      };
      render(<PredictionRow prediction={prediction} />);
      expect(screen.getByText("30m ago")).toBeInTheDocument();
    });

    it("shows days for old prediction", () => {
      const prediction: SignalPrediction = {
        ...basePrediction,
        timestamp: Date.now() - 172800000, // 2 days ago
      };
      render(<PredictionRow prediction={prediction} />);
      expect(screen.getByText("2d ago")).toBeInTheDocument();
    });

    it("shows just now for very recent", () => {
      const prediction: SignalPrediction = {
        ...basePrediction,
        timestamp: Date.now() - 30000, // 30 seconds ago
      };
      render(<PredictionRow prediction={prediction} />);
      expect(screen.getByText("just now")).toBeInTheDocument();
    });
  });

  describe("Price Formatting", () => {
    it("formats large prices without decimals", () => {
      const prediction: SignalPrediction = {
        ...basePrediction,
        priceAtPrediction: 50000,
      };
      render(<PredictionRow prediction={prediction} />);
      expect(screen.getByText("$50,000")).toBeInTheDocument();
    });

    it("formats medium prices with 2 decimals", () => {
      const prediction: SignalPrediction = {
        ...basePrediction,
        priceAtPrediction: 150.75,
      };
      render(<PredictionRow prediction={prediction} />);
      expect(screen.getByText("$150.75")).toBeInTheDocument();
    });

    it("formats small prices with more decimals", () => {
      const prediction: SignalPrediction = {
        ...basePrediction,
        priceAtPrediction: 0.00123,
      };
      render(<PredictionRow prediction={prediction} />);
      expect(screen.getByText("$0.00123")).toBeInTheDocument();
    });
  });
});
