/**
 * PredictionHistory Component Tests
 *
 * Tests the prediction history display including:
 * - Filter tabs (all, validated, pending)
 * - Prediction list rendering
 * - Overall accuracy calculation
 * - Loading and empty states
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock theme colors
vi.mock("@wraith/ghost/context/ThemeContext", () => ({
  useThemeColors: () => ({
    text: { primary: "#ffffff", muted: "#888888" },
    border: { subtle: "#333333" },
    background: { secondary: "#1a1a1a" },
  }),
}));

// Mock Ghost components
vi.mock("@wraith/ghost/components", () => ({
  Card: ({ children, style }: { children: React.ReactNode; style?: object }) => (
    <div data-testid="card" style={style}>{children}</div>
  ),
  Text: ({ children, appearance, style }: { children: React.ReactNode; appearance?: string; style?: object }) => (
    <span data-testid="text" data-appearance={appearance}>{children}</span>
  ),
}));

// Mock Colors
vi.mock("@wraith/ghost/tokens", () => ({
  Colors: {
    status: { success: "#2fd575", danger: "#ff5c7a" },
    text: { muted: "#888888" },
  },
}));

// Mock PredictionRow
vi.mock("./PredictionRow", () => ({
  PredictionRow: ({ prediction }: { prediction: { id: string; indicator: string } }) => (
    <div data-testid="prediction-row" data-id={prediction.id}>
      {prediction.indicator}
    </div>
  ),
}));

import { PredictionHistory } from "./PredictionHistory";
import type { SignalPrediction, SignalAccuracy } from "../types/signals";

const mockPredictions: SignalPrediction[] = [
  {
    id: "1",
    symbol: "BTC",
    indicator: "RSI",
    direction: "buy",
    timestamp: Date.now() - 3600000,
    priceAtPrediction: 50000,
    outcome1h: "correct",
    validated: true,
  },
  {
    id: "2",
    symbol: "BTC",
    indicator: "MACD",
    direction: "sell",
    timestamp: Date.now() - 7200000,
    priceAtPrediction: 51000,
    outcome1h: "incorrect",
    validated: true,
  },
  {
    id: "3",
    symbol: "BTC",
    indicator: "EMA",
    direction: "buy",
    timestamp: Date.now() - 60000,
    priceAtPrediction: 49500,
    // No outcomes - pending
  },
];

const mockAccuracies: SignalAccuracy[] = [
  { indicator: "RSI", timeframe: "1h", totalPredictions: 100, correctPredictions: 70, incorrectPredictions: 30, neutralPredictions: 0 },
  { indicator: "MACD", timeframe: "1h", totalPredictions: 80, correctPredictions: 40, incorrectPredictions: 40, neutralPredictions: 0 },
];

describe("PredictionHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders card container", () => {
      render(<PredictionHistory predictions={mockPredictions} accuracies={mockAccuracies} />);
      expect(screen.getByTestId("card")).toBeInTheDocument();
    });

    it("renders title", () => {
      render(<PredictionHistory predictions={mockPredictions} accuracies={mockAccuracies} />);
      expect(screen.getByText("PREDICTION HISTORY")).toBeInTheDocument();
    });

    it("renders filter tabs", () => {
      render(<PredictionHistory predictions={mockPredictions} accuracies={mockAccuracies} />);
      expect(screen.getByText("All")).toBeInTheDocument();
      expect(screen.getByText("Validated")).toBeInTheDocument();
      expect(screen.getByText("Pending")).toBeInTheDocument();
    });
  });

  describe("Filtering", () => {
    it("shows all predictions by default", () => {
      render(<PredictionHistory predictions={mockPredictions} accuracies={mockAccuracies} />);
      const rows = screen.getAllByTestId("prediction-row");
      expect(rows.length).toBe(3);
    });

    it("filters to validated predictions when tab clicked", () => {
      render(<PredictionHistory predictions={mockPredictions} accuracies={mockAccuracies} />);
      fireEvent.click(screen.getByText("Validated"));
      const rows = screen.getAllByTestId("prediction-row");
      expect(rows.length).toBe(2); // Only RSI and MACD have outcomes
    });

    it("filters to pending predictions when tab clicked", () => {
      render(<PredictionHistory predictions={mockPredictions} accuracies={mockAccuracies} />);
      fireEvent.click(screen.getByText("Pending"));
      const rows = screen.getAllByTestId("prediction-row");
      expect(rows.length).toBe(1); // Only EMA is pending
    });
  });

  describe("Prediction Rows", () => {
    it("renders PredictionRow for each prediction", () => {
      render(<PredictionHistory predictions={mockPredictions} accuracies={mockAccuracies} />);
      expect(screen.getByText("RSI")).toBeInTheDocument();
      expect(screen.getByText("MACD")).toBeInTheDocument();
      expect(screen.getByText("EMA")).toBeInTheDocument();
    });

    it("limits to 20 predictions", () => {
      const manyPredictions = Array.from({ length: 25 }, (_, i) => ({
        id: String(i),
        symbol: "BTC",
        indicator: `IND${i}`,
        direction: "buy" as const,
        timestamp: Date.now() - i * 1000,
        priceAtPrediction: 50000,
        outcome1h: "correct" as const,
        validated: true,
      }));
      render(<PredictionHistory predictions={manyPredictions} accuracies={mockAccuracies} />);
      const rows = screen.getAllByTestId("prediction-row");
      expect(rows.length).toBe(20);
    });
  });

  describe("Overall Accuracy", () => {
    it("shows overall accuracy footer", () => {
      render(<PredictionHistory predictions={mockPredictions} accuracies={mockAccuracies} />);
      expect(screen.getByText("Overall Accuracy (1h):")).toBeInTheDocument();
    });

    it("calculates accuracy percentage correctly", () => {
      render(<PredictionHistory predictions={mockPredictions} accuracies={mockAccuracies} />);
      // 70 + 40 = 110 correct, 30 + 40 = 70 incorrect, total = 180
      // 110 / 180 = 61.1%
      expect(screen.getByText("61.1%")).toBeInTheDocument();
    });

    it("shows correct/total count", () => {
      render(<PredictionHistory predictions={mockPredictions} accuracies={mockAccuracies} />);
      expect(screen.getByText("(110/180 correct)")).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("shows loading message when loading", () => {
      render(<PredictionHistory predictions={[]} accuracies={[]} loading={true} />);
      expect(screen.getByText("Loading predictions...")).toBeInTheDocument();
    });

    it("shows title when loading", () => {
      render(<PredictionHistory predictions={[]} accuracies={[]} loading={true} />);
      expect(screen.getByText("PREDICTION HISTORY")).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("shows empty message when no predictions", () => {
      render(<PredictionHistory predictions={[]} accuracies={[]} />);
      // Component shows "No  predictions yet" with filter name in between
      expect(screen.getByText(/No.*predictions yet/)).toBeInTheDocument();
    });

    it("shows filtered empty message for pending filter", () => {
      // Create only validated predictions
      const validatedOnly: SignalPrediction[] = [
        {
          id: "1",
          symbol: "BTC",
          indicator: "RSI",
          direction: "buy",
          timestamp: Date.now() - 3600000,
          priceAtPrediction: 50000,
          outcome1h: "correct",
          validated: true,
        },
      ];
      render(<PredictionHistory predictions={validatedOnly} accuracies={mockAccuracies} />);
      fireEvent.click(screen.getByText("Pending"));
      expect(screen.getByText(/No pending predictions yet/)).toBeInTheDocument();
    });
  });

  describe("No Accuracy Data", () => {
    it("hides footer when no accuracy data", () => {
      render(<PredictionHistory predictions={mockPredictions} accuracies={[]} />);
      expect(screen.queryByText("Overall Accuracy (1h):")).not.toBeInTheDocument();
    });

    it("hides footer when no 1h accuracy data", () => {
      const nonHourlyAccuracies: SignalAccuracy[] = [
        { indicator: "RSI", timeframe: "5m", totalPredictions: 100, correctPredictions: 70, incorrectPredictions: 30, neutralPredictions: 0 },
      ];
      render(<PredictionHistory predictions={mockPredictions} accuracies={nonHourlyAccuracies} />);
      expect(screen.queryByText("Overall Accuracy (1h):")).not.toBeInTheDocument();
    });
  });
});
