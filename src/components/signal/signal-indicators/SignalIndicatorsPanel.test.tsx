/**
 * SignalIndicatorsPanel Component Tests
 *
 * Tests the technical indicators panel including:
 * - Category tabs (trend, momentum, volatility, volume)
 * - Indicator rows with values, scores, and directions
 * - Empty and loading states
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        "indicators.title": "Technical Indicators",
        "indicators.subtitle": "Analysis across all categories",
        "indicators.hint.title": "How to use",
        "indicators.hint.content": "Indicators help predict price movements",
        "indicators.columns.indicator": "Indicator",
        "indicators.columns.value": "Value",
        "indicators.columns.score": "Score",
        "indicators.columns.signal": "Signal",
        "indicators.columns.accuracy": "Accuracy",
        "indicators.legend": "Scores range from -100 (bearish) to +100 (bullish)",
        "indicators.categoryDescriptions.trend": "Trend indicators measure direction",
        "indicators.categoryDescriptions.momentum": "Momentum indicators measure speed",
        "indicators.categoryDescriptions.volatility": "Volatility indicators measure risk",
        "indicators.categoryDescriptions.volume": "Volume indicators measure participation",
        "signals.categories.trend": "Trend",
        "signals.categories.momentum": "Momentum",
        "signals.categories.volatility": "Volatility",
        "signals.categories.volume": "Volume",
      };
      if (key === "indicators.noIndicators" && params?.category) {
        return `No ${params.category} indicators available`;
      }
      return translations[key] || key;
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
  getScoreColor: (score: number) => score > 0 ? "#2fd575" : score < 0 ? "#ff5c7a" : "#888888",
  getCategoryName: (category: string) => category.charAt(0).toUpperCase() + category.slice(1),
}));

// Mock Ghost components
vi.mock("@wraith/ghost/components", () => ({
  Card: ({ children, loading, fullBleed }: { children: React.ReactNode; loading?: boolean; fullBleed?: boolean }) => (
    <div data-testid="card" data-loading={loading} data-fullbleed={fullBleed}>{children}</div>
  ),
  Text: ({ children, appearance }: { children: React.ReactNode; appearance?: string }) => (
    <span data-testid="text" data-appearance={appearance}>{children}</span>
  ),
  ProgressBar: ({ value, max, color }: { value: number; max: number; color?: string }) => (
    <div data-testid="progress-bar" data-value={value} data-color={color} />
  ),
  SegmentedControl: ({
    options,
    value,
    onChange,
  }: {
    options: { value: string; label: string }[];
    value: string;
    onChange: (v: string) => void;
  }) => (
    <div data-testid="segmented-control" data-value={value}>
      {options.map((opt) => (
        <button key={opt.value} onClick={() => onChange(opt.value)} data-selected={opt.value === value}>
          {opt.label}
        </button>
      ))}
    </div>
  ),
}));

// Mock sub-components
vi.mock("../accuracy-tag", () => ({
  AccuracyTag: ({ accuracy, sampleSize }: { accuracy: number; sampleSize: number }) => (
    <span data-testid="accuracy-tag">{accuracy}% ({sampleSize})</span>
  ),
}));

vi.mock("../indicator-tooltip", () => ({
  IndicatorTooltip: ({ indicatorName }: { indicatorName: string }) => (
    <span data-testid="indicator-tooltip">{indicatorName}</span>
  ),
}));

vi.mock("../hint-indicator", () => ({
  HintIndicator: ({ title }: { title: string }) => (
    <span data-testid="hint-indicator">{title}</span>
  ),
}));

// Mock Colors
vi.mock("@wraith/ghost/tokens", () => ({
  Colors: {
    accent: { primary: "#3b82f6" },
  },
}));

import { SignalIndicatorsPanel } from "./SignalIndicatorsPanel";
import type { SignalOutput } from "../../types/signals";

const mockSignals: SignalOutput[] = [
  { name: "RSI", category: "momentum", value: 65, score: 30, accuracy: 75, sampleSize: 100 },
  { name: "MACD", category: "momentum", value: 150.5, score: 45, accuracy: 68, sampleSize: 95 },
  { name: "EMA", category: "trend", value: 50000, score: -15, accuracy: 72, sampleSize: 120 },
  { name: "SMA", category: "trend", value: 49500, score: 10, accuracy: 70, sampleSize: 110 },
  { name: "ATR", category: "volatility", value: 1500, score: -40, accuracy: 65, sampleSize: 80 },
  { name: "OBV", category: "volume", value: 5000000, score: 55, accuracy: 78, sampleSize: 90 },
];

describe("SignalIndicatorsPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders card container", () => {
      render(<SignalIndicatorsPanel signals={mockSignals} />);
      expect(screen.getByTestId("card")).toBeInTheDocument();
    });

    it("renders title", () => {
      render(<SignalIndicatorsPanel signals={mockSignals} />);
      expect(screen.getByText("Technical Indicators")).toBeInTheDocument();
    });

    it("renders category tabs", () => {
      render(<SignalIndicatorsPanel signals={mockSignals} />);
      expect(screen.getByText("Trend")).toBeInTheDocument();
      expect(screen.getByText("Momentum")).toBeInTheDocument();
      expect(screen.getByText("Volatility")).toBeInTheDocument();
      expect(screen.getByText("Volume")).toBeInTheDocument();
    });

    it("renders column headers", () => {
      render(<SignalIndicatorsPanel signals={mockSignals} />);
      expect(screen.getByText("Indicator")).toBeInTheDocument();
      expect(screen.getByText("Value")).toBeInTheDocument();
      expect(screen.getByText("Score")).toBeInTheDocument();
      expect(screen.getByText("Signal")).toBeInTheDocument();
      expect(screen.getByText("Accuracy")).toBeInTheDocument();
    });

    it("renders legend", () => {
      render(<SignalIndicatorsPanel signals={mockSignals} />);
      expect(screen.getByText(/Scores range from/)).toBeInTheDocument();
    });
  });

  describe("Category Switching", () => {
    it("starts with trend category selected", () => {
      render(<SignalIndicatorsPanel signals={mockSignals} />);
      const control = screen.getByTestId("segmented-control");
      expect(control).toHaveAttribute("data-value", "trend");
    });

    it("shows trend indicators by default", () => {
      render(<SignalIndicatorsPanel signals={mockSignals} />);
      // EMA/SMA appear both in indicator name and tooltip, so use getAllByText
      expect(screen.getAllByText("EMA").length).toBeGreaterThan(0);
      expect(screen.getAllByText("SMA").length).toBeGreaterThan(0);
    });

    it("switches to momentum category on click", () => {
      render(<SignalIndicatorsPanel signals={mockSignals} />);
      fireEvent.click(screen.getByText("Momentum"));
      // Indicator names appear both in row and tooltip
      expect(screen.getAllByText("RSI").length).toBeGreaterThan(0);
      expect(screen.getAllByText("MACD").length).toBeGreaterThan(0);
    });

    it("switches to volatility category", () => {
      render(<SignalIndicatorsPanel signals={mockSignals} />);
      fireEvent.click(screen.getByText("Volatility"));
      expect(screen.getAllByText("ATR").length).toBeGreaterThan(0);
    });

    it("switches to volume category", () => {
      render(<SignalIndicatorsPanel signals={mockSignals} />);
      fireEvent.click(screen.getByText("Volume"));
      expect(screen.getAllByText("OBV").length).toBeGreaterThan(0);
    });
  });

  describe("Indicator Rows", () => {
    it("renders progress bars for indicators", () => {
      render(<SignalIndicatorsPanel signals={mockSignals} />);
      const progressBars = screen.getAllByTestId("progress-bar");
      expect(progressBars.length).toBeGreaterThan(0);
    });

    it("renders accuracy tags", () => {
      render(<SignalIndicatorsPanel signals={mockSignals} />);
      const accuracyTags = screen.getAllByTestId("accuracy-tag");
      expect(accuracyTags.length).toBeGreaterThan(0);
    });

    it("renders indicator tooltips", () => {
      render(<SignalIndicatorsPanel signals={mockSignals} />);
      const tooltips = screen.getAllByTestId("indicator-tooltip");
      expect(tooltips.length).toBeGreaterThan(0);
    });

    it("shows Buy/Sell/Hold based on score", () => {
      render(<SignalIndicatorsPanel signals={mockSignals} />);
      // Trend category has SMA with score 10 (Hold) and EMA with score -15 (Hold)
      const holdBadges = screen.getAllByText("Hold");
      expect(holdBadges.length).toBeGreaterThan(0);
    });
  });

  describe("Empty State", () => {
    it("shows empty message when no signals for category", () => {
      const emptySignals: SignalOutput[] = [
        { name: "RSI", category: "momentum", value: 65, score: 30 },
      ];
      render(<SignalIndicatorsPanel signals={emptySignals} />);
      // Default is trend, which has no signals
      expect(screen.getByText(/No trend indicators/)).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("passes loading prop to card", () => {
      render(<SignalIndicatorsPanel signals={mockSignals} loading={true} />);
      expect(screen.getByTestId("card")).toHaveAttribute("data-loading", "true");
    });
  });

  describe("Category Descriptions", () => {
    it("shows trend description", () => {
      render(<SignalIndicatorsPanel signals={mockSignals} />);
      expect(screen.getByText(/Trend indicators measure direction/)).toBeInTheDocument();
    });

    it("shows momentum description when switched", () => {
      render(<SignalIndicatorsPanel signals={mockSignals} />);
      fireEvent.click(screen.getByText("Momentum"));
      expect(screen.getByText(/Momentum indicators measure speed/)).toBeInTheDocument();
    });
  });
});
