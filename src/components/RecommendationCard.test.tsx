/**
 * RecommendationCard Component Tests
 *
 * Tests the recommendation display card including:
 * - Action label (BUY/SELL/HOLD)
 * - Confidence bar
 * - Stats display
 * - Color coding
 * - Null/loading states
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
  Card: ({ children, style, loading }: { children: React.ReactNode; style?: object; loading?: boolean }) => (
    <div data-testid="card" data-loading={loading}>{children}</div>
  ),
  Text: ({ children, appearance, size, weight, style }: { children: React.ReactNode; appearance?: string; size?: string; weight?: string; style?: object }) => (
    <span data-testid="text" data-appearance={appearance} data-weight={weight}>{children}</span>
  ),
  ProgressBar: ({ value, max, color }: { value: number; max: number; color?: string }) => (
    <div data-testid="progress-bar" data-value={value} data-max={max} data-color={color} />
  ),
}));

// Mock signals types
vi.mock("../types/signals", () => ({
  getRecommendationColor: (action: string) => {
    const colors: Record<string, string> = {
      buy: "#2fd575",
      strong_buy: "#2fd575",
      sell: "#ff5c7a",
      strong_sell: "#ff5c7a",
      hold: "#888888",
    };
    return colors[action] || "#888888";
  },
}));

import { RecommendationCard } from "./RecommendationCard";
import type { Recommendation } from "../types/signals";

const mockBuyRecommendation: Recommendation = {
  action: "buy",
  confidence: 75,
  description: "Strong bullish signals across indicators",
  indicatorsWithAccuracy: 8,
  totalIndicators: 10,
  averageAccuracy: 68.5,
};

const mockSellRecommendation: Recommendation = {
  action: "sell",
  confidence: 62,
  description: "Bearish divergence detected",
  indicatorsWithAccuracy: 6,
  totalIndicators: 10,
  averageAccuracy: 55.2,
};

const mockHoldRecommendation: Recommendation = {
  action: "hold",
  confidence: 45,
  indicatorsWithAccuracy: 4,
  totalIndicators: 10,
  averageAccuracy: 50.0,
};

describe("RecommendationCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Null State", () => {
    it("returns null when no recommendation and not loading", () => {
      const { container } = render(<RecommendationCard recommendation={null} />);
      expect(container.firstChild).toBeNull();
    });

    it("renders card when loading even without recommendation", () => {
      render(<RecommendationCard recommendation={null} loading={true} />);
      expect(screen.getByTestId("card")).toBeInTheDocument();
    });
  });

  describe("Buy Recommendation", () => {
    it("renders card", () => {
      render(<RecommendationCard recommendation={mockBuyRecommendation} />);
      expect(screen.getByTestId("card")).toBeInTheDocument();
    });

    it("shows BUY label", () => {
      render(<RecommendationCard recommendation={mockBuyRecommendation} />);
      expect(screen.getByText("BUY")).toBeInTheDocument();
    });

    it("shows confidence percentage", () => {
      render(<RecommendationCard recommendation={mockBuyRecommendation} />);
      expect(screen.getByText("75%")).toBeInTheDocument();
    });

    it("shows confidence label", () => {
      render(<RecommendationCard recommendation={mockBuyRecommendation} />);
      expect(screen.getByText("Confidence")).toBeInTheDocument();
    });

    it("renders progress bar with correct value", () => {
      render(<RecommendationCard recommendation={mockBuyRecommendation} />);
      const progressBar = screen.getByTestId("progress-bar");
      expect(progressBar).toHaveAttribute("data-value", "75");
    });

    it("shows description", () => {
      render(<RecommendationCard recommendation={mockBuyRecommendation} />);
      expect(screen.getByText("Strong bullish signals across indicators")).toBeInTheDocument();
    });
  });

  describe("Sell Recommendation", () => {
    it("shows SELL label", () => {
      render(<RecommendationCard recommendation={mockSellRecommendation} />);
      expect(screen.getByText("SELL")).toBeInTheDocument();
    });

    it("shows correct confidence", () => {
      render(<RecommendationCard recommendation={mockSellRecommendation} />);
      expect(screen.getByText("62%")).toBeInTheDocument();
    });

    it("shows description", () => {
      render(<RecommendationCard recommendation={mockSellRecommendation} />);
      expect(screen.getByText("Bearish divergence detected")).toBeInTheDocument();
    });
  });

  describe("Hold Recommendation", () => {
    it("shows HOLD label", () => {
      render(<RecommendationCard recommendation={mockHoldRecommendation} />);
      expect(screen.getByText("HOLD")).toBeInTheDocument();
    });

    it("shows correct confidence", () => {
      render(<RecommendationCard recommendation={mockHoldRecommendation} />);
      expect(screen.getByText("45%")).toBeInTheDocument();
    });

    it("does not show description when not provided", () => {
      render(<RecommendationCard recommendation={mockHoldRecommendation} />);
      // Hold recommendation has no description
      expect(screen.queryByText("Strong bullish")).not.toBeInTheDocument();
    });
  });

  describe("Stats Display", () => {
    it("shows Indicators Used label", () => {
      render(<RecommendationCard recommendation={mockBuyRecommendation} />);
      expect(screen.getByText("Indicators Used")).toBeInTheDocument();
    });

    it("shows indicators count", () => {
      render(<RecommendationCard recommendation={mockBuyRecommendation} />);
      expect(screen.getByText("8/10")).toBeInTheDocument();
    });

    it("shows Avg Accuracy label", () => {
      render(<RecommendationCard recommendation={mockBuyRecommendation} />);
      expect(screen.getByText("Avg Accuracy")).toBeInTheDocument();
    });

    it("shows average accuracy value", () => {
      render(<RecommendationCard recommendation={mockBuyRecommendation} />);
      expect(screen.getByText("69%")).toBeInTheDocument(); // 68.5 rounded
    });
  });

  describe("Loading State", () => {
    it("passes loading prop to card", () => {
      render(<RecommendationCard recommendation={mockBuyRecommendation} loading={true} />);
      expect(screen.getByTestId("card")).toHaveAttribute("data-loading", "true");
    });
  });
});
