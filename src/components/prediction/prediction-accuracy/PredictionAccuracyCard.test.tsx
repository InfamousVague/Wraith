/**
 * PredictionAccuracyCard Component Tests
 *
 * Tests the prediction accuracy display including:
 * - Recommendation badge and gauges
 * - Accuracy calculations
 * - Indicator groups
 * - Empty and loading states
 * - Generating state
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        "components:prediction.title": "Market Predictions",
        "components:prediction.confidence": "Confidence",
        "components:prediction.accuracy": "Accuracy",
        "components:prediction.winRate": "Win Rate",
        "components:prediction.basedOn": "Based on {{count}} predictions",
        "components:prediction.history.title": "Prediction History",
        "components:prediction.history.legend": "5m / 1h / 4h outcomes",
        "components:prediction.hint.title": "About Predictions",
        "components:prediction.hint.content": "Predictions help forecast price movements",
        "components:prediction.historyHint.title": "History",
        "components:prediction.historyHint.content": "Shows past prediction outcomes",
        "components:prediction.generating": "Generating predictions...",
        "components:prediction.analyzingMarket": "Analyzing market conditions",
        "components:prediction.empty.title": "No predictions yet",
        "components:prediction.empty.description": "Predictions will appear as market data is analyzed",
        "common:buttons.generatePredictions": "Generate Predictions",
      };
      let result = translations[key] || key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          result = result.replace(`{{${k}}}`, String(v));
        });
      }
      return result;
    },
  }),
}));

// Mock theme colors
vi.mock("@wraith/ghost/context/ThemeContext", () => ({
  useThemeColors: () => ({
    text: { primary: "#ffffff", muted: "#888888" },
    border: { subtle: "#333333" },
  }),
}));

// Mock breakpoint
vi.mock("../hooks/useBreakpoint", () => ({
  useBreakpoint: () => ({ isMobile: false }),
}));

// Mock signals types
vi.mock("../types/signals", () => ({
  getRecommendationColor: (action: string) => {
    if (action === "buy" || action === "strong_buy") return "#2fd575";
    if (action === "sell" || action === "strong_sell") return "#ff5c7a";
    return "#888888";
  },
}));

// Mock Ghost components
vi.mock("@wraith/ghost/components", () => ({
  Card: ({ children, loading, fullBleed }: { children: React.ReactNode; loading?: boolean; fullBleed?: boolean }) => (
    <div data-testid="card" data-loading={loading} data-fullbleed={fullBleed}>{children}</div>
  ),
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
      warning: "#ffc107",
    },
    text: { muted: "#888888" },
    accent: { primary: "#3b82f6" },
    data: { blue: "#3b82f6" },
  },
}));

// Mock react-native-svg
vi.mock("react-native-svg", () => ({
  default: ({ children }: { children: React.ReactNode }) => <svg data-testid="svg">{children}</svg>,
  Path: ({ d, stroke }: { d: string; stroke?: string }) => <path data-testid="path" d={d} stroke={stroke} />,
}));

// Mock sub-components
vi.mock("../countdown-timer", () => ({
  CountdownTimer: ({ targetTime, label }: { targetTime: number; label: string }) => (
    <span data-testid="countdown-timer">{label}</span>
  ),
}));

vi.mock("../heartbeat-chart", () => ({
  HeartbeatChart: ({ height, width }: { height: number; width: number }) => (
    <div data-testid="heartbeat-chart" style={{ height, width }} />
  ),
}));

vi.mock("../hint-indicator", () => ({
  HintIndicator: ({ title }: { title: string }) => (
    <span data-testid="hint-indicator">{title}</span>
  ),
}));

vi.mock("../indicator-tooltip", () => ({
  IndicatorTooltip: ({ indicatorName }: { indicatorName: string }) => (
    <span data-testid="indicator-tooltip">{indicatorName}</span>
  ),
}));

import { PredictionAccuracyCard } from "./PredictionAccuracyCard";
import type { SignalAccuracy, SignalPrediction, Recommendation } from "../../types/signals";

const mockAccuracies: SignalAccuracy[] = [
  { indicator: "RSI", timeframe: "5m", totalPredictions: 100, correctPredictions: 65, incorrectPredictions: 20, neutralPredictions: 15 },
  { indicator: "RSI", timeframe: "1h", totalPredictions: 80, correctPredictions: 55, incorrectPredictions: 15, neutralPredictions: 10 },
  { indicator: "MACD", timeframe: "5m", totalPredictions: 90, correctPredictions: 50, incorrectPredictions: 25, neutralPredictions: 15 },
];

const mockPredictions: SignalPrediction[] = [
  {
    id: "1",
    symbol: "BTC",
    indicator: "RSI",
    direction: "buy",
    timestamp: Date.now() - 3600000,
    outcome5m: "correct",
    outcome1h: "correct",
    outcome4h: null,
  },
  {
    id: "2",
    symbol: "BTC",
    indicator: "MACD",
    direction: "sell",
    timestamp: Date.now() - 7200000,
    outcome5m: "incorrect",
    outcome1h: "correct",
    outcome4h: "correct",
  },
];

const mockPendingPredictions: SignalPrediction[] = [
  {
    id: "3",
    symbol: "BTC",
    indicator: "RSI",
    direction: "strong_buy",
    timestamp: Date.now() - 60000,
    outcome5m: null,
    outcome1h: null,
    outcome4h: null,
  },
];

const mockRecommendation: Recommendation = {
  action: "buy",
  confidence: 75,
  reasoning: "Strong bullish signals",
};

describe("PredictionAccuracyCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders card container", () => {
      render(
        <PredictionAccuracyCard
          accuracies={mockAccuracies}
          predictions={mockPredictions}
        />
      );
      expect(screen.getByTestId("card")).toBeInTheDocument();
    });

    it("renders title", () => {
      render(
        <PredictionAccuracyCard
          accuracies={mockAccuracies}
          predictions={mockPredictions}
        />
      );
      expect(screen.getByText("Market Predictions")).toBeInTheDocument();
    });

    it("renders hint indicator", () => {
      render(
        <PredictionAccuracyCard
          accuracies={mockAccuracies}
          predictions={mockPredictions}
        />
      );
      const hints = screen.getAllByTestId("hint-indicator");
      expect(hints.length).toBeGreaterThan(0);
    });
  });

  describe("Recommendation Badge", () => {
    it("shows BUY label when recommendation is buy", () => {
      render(
        <PredictionAccuracyCard
          accuracies={mockAccuracies}
          predictions={mockPredictions}
          recommendation={mockRecommendation}
        />
      );
      expect(screen.getByText("BUY")).toBeInTheDocument();
    });

    it("shows SELL label when recommendation is sell", () => {
      render(
        <PredictionAccuracyCard
          accuracies={mockAccuracies}
          predictions={mockPredictions}
          recommendation={{ action: "sell", confidence: 60, reasoning: "" }}
        />
      );
      expect(screen.getByText("SELL")).toBeInTheDocument();
    });

    it("shows HOLD label when recommendation is hold", () => {
      render(
        <PredictionAccuracyCard
          accuracies={mockAccuracies}
          predictions={mockPredictions}
          recommendation={{ action: "hold", confidence: 50, reasoning: "" }}
        />
      );
      expect(screen.getByText("HOLD")).toBeInTheDocument();
    });

    it("shows HOLD when no recommendation provided", () => {
      render(
        <PredictionAccuracyCard
          accuracies={mockAccuracies}
          predictions={mockPredictions}
        />
      );
      expect(screen.getByText("HOLD")).toBeInTheDocument();
    });
  });

  describe("Gauges", () => {
    it("renders SVG elements for gauges", () => {
      render(
        <PredictionAccuracyCard
          accuracies={mockAccuracies}
          predictions={mockPredictions}
          recommendation={mockRecommendation}
        />
      );
      const svgs = screen.getAllByTestId("svg");
      expect(svgs.length).toBe(3); // 3 half-circle gauges
    });

    it("renders gauge labels", () => {
      render(
        <PredictionAccuracyCard
          accuracies={mockAccuracies}
          predictions={mockPredictions}
          recommendation={mockRecommendation}
        />
      );
      expect(screen.getByText("Confidence")).toBeInTheDocument();
      expect(screen.getByText("Accuracy")).toBeInTheDocument();
      expect(screen.getByText("Win Rate")).toBeInTheDocument();
    });

    it("shows confidence percentage", () => {
      render(
        <PredictionAccuracyCard
          accuracies={mockAccuracies}
          predictions={mockPredictions}
          recommendation={mockRecommendation}
        />
      );
      expect(screen.getByText("75%")).toBeInTheDocument();
    });
  });

  describe("Prediction Count", () => {
    it("shows total predictions count", () => {
      render(
        <PredictionAccuracyCard
          accuracies={mockAccuracies}
          predictions={mockPredictions}
        />
      );
      expect(screen.getByText("Based on 270 predictions")).toBeInTheDocument();
    });
  });

  describe("Indicator Groups", () => {
    it("renders indicator names", () => {
      render(
        <PredictionAccuracyCard
          accuracies={mockAccuracies}
          predictions={mockPredictions}
        />
      );
      // Indicator names appear both in indicator group and tooltip
      expect(screen.getAllByText("RSI").length).toBeGreaterThan(0);
      expect(screen.getAllByText("MACD").length).toBeGreaterThan(0);
    });

    it("renders indicator tooltips", () => {
      render(
        <PredictionAccuracyCard
          accuracies={mockAccuracies}
          predictions={mockPredictions}
        />
      );
      const tooltips = screen.getAllByTestId("indicator-tooltip");
      expect(tooltips.length).toBeGreaterThan(0);
    });

    it("renders history section title", () => {
      render(
        <PredictionAccuracyCard
          accuracies={mockAccuracies}
          predictions={mockPredictions}
        />
      );
      expect(screen.getByText("Prediction History")).toBeInTheDocument();
    });
  });

  describe("Pending Predictions", () => {
    it("shows pending predictions with direction", () => {
      render(
        <PredictionAccuracyCard
          accuracies={mockAccuracies}
          predictions={mockPredictions}
          pendingPredictions={mockPendingPredictions}
        />
      );
      // The pending prediction has direction "strong_buy" which maps to "BUY"
      const buyLabels = screen.getAllByText("BUY");
      expect(buyLabels.length).toBeGreaterThan(0);
    });
  });

  describe("Loading State", () => {
    it("passes loading prop to card", () => {
      render(
        <PredictionAccuracyCard
          accuracies={mockAccuracies}
          predictions={mockPredictions}
          loading={true}
        />
      );
      expect(screen.getByTestId("card")).toHaveAttribute("data-loading", "true");
    });
  });

  describe("Empty State", () => {
    it("shows empty state when no predictions", () => {
      render(
        <PredictionAccuracyCard
          accuracies={[]}
          predictions={[]}
        />
      );
      expect(screen.getByText("No predictions yet")).toBeInTheDocument();
    });

    it("shows empty state description", () => {
      render(
        <PredictionAccuracyCard
          accuracies={[]}
          predictions={[]}
        />
      );
      expect(screen.getByText("Predictions will appear as market data is analyzed")).toBeInTheDocument();
    });

    it("shows generate button when callback provided", () => {
      const mockGenerate = vi.fn();
      render(
        <PredictionAccuracyCard
          accuracies={[]}
          predictions={[]}
          onGeneratePredictions={mockGenerate}
        />
      );
      expect(screen.getByText("Generate Predictions")).toBeInTheDocument();
    });

    it("calls onGeneratePredictions when button clicked", () => {
      const mockGenerate = vi.fn();
      render(
        <PredictionAccuracyCard
          accuracies={[]}
          predictions={[]}
          onGeneratePredictions={mockGenerate}
        />
      );
      fireEvent.click(screen.getByText("Generate Predictions"));
      expect(mockGenerate).toHaveBeenCalled();
    });

    it("shows zap icon in empty state", () => {
      render(
        <PredictionAccuracyCard
          accuracies={[]}
          predictions={[]}
        />
      );
      expect(screen.getByTestId("icon-zap")).toBeInTheDocument();
    });
  });

  describe("Generating State", () => {
    it("shows heartbeat chart when generating", () => {
      render(
        <PredictionAccuracyCard
          accuracies={[]}
          predictions={[]}
          generating={true}
        />
      );
      const heartbeats = screen.getAllByTestId("heartbeat-chart");
      expect(heartbeats.length).toBeGreaterThan(0);
    });

    it("shows generating text when generating", () => {
      render(
        <PredictionAccuracyCard
          accuracies={[]}
          predictions={[]}
          generating={true}
        />
      );
      expect(screen.getByText("Generating predictions...")).toBeInTheDocument();
    });

    it("shows analyzing market text", () => {
      render(
        <PredictionAccuracyCard
          accuracies={[]}
          predictions={[]}
          generating={true}
        />
      );
      expect(screen.getByText("Analyzing market conditions")).toBeInTheDocument();
    });
  });

  describe("Accuracy Calculations", () => {
    it("calculates overall accuracy correctly", () => {
      render(
        <PredictionAccuracyCard
          accuracies={mockAccuracies}
          predictions={mockPredictions}
        />
      );
      // Total correct: 65 + 55 + 50 = 170
      // Total decisive: (65+20) + (55+15) + (50+25) = 85 + 70 + 75 = 230
      // Accuracy: 170/230 = 73.9%
      // Look for this in the gauge value
      const accuracyText = screen.getByText(/73\.9%/);
      expect(accuracyText).toBeInTheDocument();
    });
  });
});
