/**
 * IndicatorTooltip Component Tests
 *
 * Tests the indicator explanation tooltip including:
 * - Rendering with valid indicator name
 * - Returns null for unknown indicators
 * - Displays all sections (description, calculation, interpretation, signals)
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock indicator explanations data
const mockExplanation = {
  id: "rsi",
  name: "RSI (Relative Strength Index)",
  description: "Measures the speed and magnitude of recent price changes to evaluate overbought or oversold conditions.",
  calculation: "RSI = 100 - (100 / (1 + RS)), where RS = Average Gain / Average Loss over 14 periods.",
  interpretation: "Values above 70 suggest overbought conditions, while values below 30 suggest oversold conditions.",
  bullishSignal: "RSI crossing above 30 from oversold territory indicates potential price reversal upward.",
  bearishSignal: "RSI crossing below 70 from overbought territory indicates potential price reversal downward.",
};

vi.mock("../data/indicatorExplanations", () => ({
  getIndicatorExplanation: (name: string) => {
    if (name === "RSI" || name === "MACD") {
      return mockExplanation;
    }
    return null;
  },
  hasIndicatorExplanation: (name: string) => {
    return name === "RSI" || name === "MACD";
  },
}));

// Mock Ghost components
vi.mock("@wraith/ghost/components", () => ({
  Text: ({ children, style }: { children: React.ReactNode; style?: object }) => (
    <span data-testid="text">{children}</span>
  ),
}));

// Mock Colors
vi.mock("@wraith/ghost/tokens", () => ({
  Colors: {
    status: {
      success: "#2fd575",
      danger: "#ff5c7a",
    },
    text: { muted: "#888888", secondary: "#aaaaaa" },
    accent: { primary: "#3b82f6" },
  },
}));

// Mock HintIndicator - capture and render its children
vi.mock("../hint-indicator", () => ({
  HintIndicator: ({
    children,
    title,
    id
  }: {
    children?: React.ReactNode;
    title: string;
    id: string;
  }) => (
    <div data-testid="hint-indicator" data-id={id} data-title={title}>
      {children}
    </div>
  ),
}));

import { IndicatorTooltip } from "../indicator-tooltip";

describe("IndicatorTooltip", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders HintIndicator for valid indicator", () => {
      render(<IndicatorTooltip indicatorName="RSI" />);
      expect(screen.getByTestId("hint-indicator")).toBeInTheDocument();
    });

    it("passes correct id to HintIndicator", () => {
      render(<IndicatorTooltip indicatorName="RSI" />);
      expect(screen.getByTestId("hint-indicator")).toHaveAttribute("data-id", "indicator-hint-rsi");
    });

    it("passes indicator name as title to HintIndicator", () => {
      render(<IndicatorTooltip indicatorName="RSI" />);
      expect(screen.getByTestId("hint-indicator")).toHaveAttribute("data-title", "RSI (Relative Strength Index)");
    });
  });

  describe("Content Sections", () => {
    it("renders description", () => {
      render(<IndicatorTooltip indicatorName="RSI" />);
      expect(screen.getByText(/Measures the speed and magnitude/)).toBeInTheDocument();
    });

    it("renders CALCULATION header", () => {
      render(<IndicatorTooltip indicatorName="RSI" />);
      expect(screen.getByText("CALCULATION")).toBeInTheDocument();
    });

    it("renders calculation content", () => {
      render(<IndicatorTooltip indicatorName="RSI" />);
      expect(screen.getByText(/RSI = 100 - \(100/)).toBeInTheDocument();
    });

    it("renders INTERPRETATION header", () => {
      render(<IndicatorTooltip indicatorName="RSI" />);
      expect(screen.getByText("INTERPRETATION")).toBeInTheDocument();
    });

    it("renders interpretation content", () => {
      render(<IndicatorTooltip indicatorName="RSI" />);
      expect(screen.getByText(/Values above 70 suggest overbought/)).toBeInTheDocument();
    });

    it("renders SIGNALS header", () => {
      render(<IndicatorTooltip indicatorName="RSI" />);
      expect(screen.getByText("SIGNALS")).toBeInTheDocument();
    });

    it("renders Bullish signal badge", () => {
      render(<IndicatorTooltip indicatorName="RSI" />);
      expect(screen.getByText("Bullish")).toBeInTheDocument();
    });

    it("renders Bearish signal badge", () => {
      render(<IndicatorTooltip indicatorName="RSI" />);
      expect(screen.getByText("Bearish")).toBeInTheDocument();
    });

    it("renders bullish signal text", () => {
      render(<IndicatorTooltip indicatorName="RSI" />);
      expect(screen.getByText(/RSI crossing above 30/)).toBeInTheDocument();
    });

    it("renders bearish signal text", () => {
      render(<IndicatorTooltip indicatorName="RSI" />);
      expect(screen.getByText(/RSI crossing below 70/)).toBeInTheDocument();
    });
  });

  describe("Unknown Indicator", () => {
    it("returns null for unknown indicator", () => {
      const { container } = render(<IndicatorTooltip indicatorName="UNKNOWN_INDICATOR" />);
      expect(container.firstChild).toBeNull();
    });

    it("returns null for empty indicator name", () => {
      const { container } = render(<IndicatorTooltip indicatorName="" />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("Props", () => {
    it("uses default priority of 50", () => {
      render(<IndicatorTooltip indicatorName="RSI" />);
      // Can't directly test default prop, but component should render without error
      expect(screen.getByTestId("hint-indicator")).toBeInTheDocument();
    });

    it("accepts custom priority", () => {
      render(<IndicatorTooltip indicatorName="RSI" priority={10} />);
      expect(screen.getByTestId("hint-indicator")).toBeInTheDocument();
    });

    it("accepts custom color", () => {
      render(<IndicatorTooltip indicatorName="RSI" color="#ff0000" />);
      expect(screen.getByTestId("hint-indicator")).toBeInTheDocument();
    });
  });

  describe("Multiple Indicators", () => {
    it("renders different indicator (MACD)", () => {
      render(<IndicatorTooltip indicatorName="MACD" />);
      expect(screen.getByTestId("hint-indicator")).toBeInTheDocument();
    });
  });
});
