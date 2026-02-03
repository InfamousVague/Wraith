/**
 * SignalTags Component Tests
 *
 * Tests the market condition tags display including:
 * - Tag generation based on signal data
 * - Loading state (returns null)
 * - Empty state (no tags)
 * - Various market conditions
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
  Text: ({ children, style }: { children: React.ReactNode; style?: object }) => (
    <span data-testid="text">{children}</span>
  ),
  Tag: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="tag">{children}</span>
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
      info: "#3b82f6",
    },
    text: { muted: "#888888" },
    accent: { primary: "#3b82f6" },
  },
}));

import { SignalTags } from "./SignalTags";
import type { SymbolSignals } from "../types/signals";

const mockSignals: SymbolSignals = {
  symbol: "BTC",
  compositeScore: 30,
  direction: "buy",
  trendScore: 20,
  momentumScore: 35,
  volatilityScore: 10,
  volumeScore: 25,
  timestamp: Date.now(),
  indicators: [],
};

describe("SignalTags", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders container with title when signals exist", () => {
      render(<SignalTags signals={mockSignals} />);
      expect(screen.getByText("MARKET CONDITIONS")).toBeInTheDocument();
    });

    it("renders subtitle", () => {
      render(<SignalTags signals={mockSignals} />);
      expect(screen.getByText("Current patterns detected in market data")).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("returns null when loading", () => {
      const { container } = render(<SignalTags signals={mockSignals} loading={true} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("Empty State", () => {
    it("returns null when signals is null", () => {
      const { container } = render(<SignalTags signals={null} />);
      expect(container.firstChild).toBeNull();
    });

    it("returns null when no tags are generated", () => {
      // Neutral signals with low scores should generate no tags
      const neutralSignals: SymbolSignals = {
        ...mockSignals,
        direction: "neutral",
        compositeScore: 0,
        trendScore: 0,
        momentumScore: 0,
        volatilityScore: 0,
        volumeScore: 0,
      };
      const { container } = render(<SignalTags signals={neutralSignals} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("Direction Tags", () => {
    it("shows Strong Buy Signal tag for strong_buy direction", () => {
      const signals: SymbolSignals = {
        ...mockSignals,
        direction: "strong_buy",
        compositeScore: 70,
      };
      render(<SignalTags signals={signals} />);
      expect(screen.getByText("Strong Buy Signal")).toBeInTheDocument();
    });

    it("shows Strong Sell Signal tag for strong_sell direction", () => {
      const signals: SymbolSignals = {
        ...mockSignals,
        direction: "strong_sell",
        compositeScore: -70,
        trendScore: -60,
        momentumScore: -60,
      };
      render(<SignalTags signals={signals} />);
      expect(screen.getByText("Strong Sell Signal")).toBeInTheDocument();
    });

    it("shows Buy Signal tag for buy direction", () => {
      const signals: SymbolSignals = {
        ...mockSignals,
        direction: "buy",
        compositeScore: 30,
      };
      render(<SignalTags signals={signals} />);
      expect(screen.getByText("Buy Signal")).toBeInTheDocument();
    });

    it("shows Sell Signal tag for sell direction", () => {
      const signals: SymbolSignals = {
        ...mockSignals,
        direction: "sell",
        compositeScore: -30,
      };
      render(<SignalTags signals={signals} />);
      expect(screen.getByText("Sell Signal")).toBeInTheDocument();
    });
  });

  describe("Condition Tags", () => {
    it("shows Falling Knife tag when momentum < -50 and price change < -5%", () => {
      const signals: SymbolSignals = {
        ...mockSignals,
        momentumScore: -55,
        direction: "strong_sell",
      };
      render(<SignalTags signals={signals} priceChange24h={-7} />);
      expect(screen.getByText("Falling Knife")).toBeInTheDocument();
    });

    it("shows Oversold tag when momentum < -60 and trend > -20", () => {
      const signals: SymbolSignals = {
        ...mockSignals,
        momentumScore: -65,
        trendScore: -10,
        direction: "sell",
      };
      render(<SignalTags signals={signals} />);
      expect(screen.getByText("Oversold")).toBeInTheDocument();
    });

    it("shows Overbought tag when momentum > 60 and trend < 20", () => {
      const signals: SymbolSignals = {
        ...mockSignals,
        momentumScore: 65,
        trendScore: 10,
      };
      render(<SignalTags signals={signals} />);
      expect(screen.getByText("Overbought")).toBeInTheDocument();
    });

    it("shows Strong Uptrend tag when trend > 60", () => {
      const signals: SymbolSignals = {
        ...mockSignals,
        trendScore: 70,
      };
      render(<SignalTags signals={signals} />);
      expect(screen.getByText("Strong Uptrend")).toBeInTheDocument();
    });

    it("shows Strong Downtrend tag when trend < -60", () => {
      const signals: SymbolSignals = {
        ...mockSignals,
        trendScore: -70,
        direction: "sell",
      };
      render(<SignalTags signals={signals} />);
      expect(screen.getByText("Strong Downtrend")).toBeInTheDocument();
    });

    it("shows Consolidating tag when all scores are low and volatility negative", () => {
      const signals: SymbolSignals = {
        ...mockSignals,
        direction: "neutral",
        compositeScore: 0,
        trendScore: 5,
        momentumScore: 5,
        volatilityScore: -10,
        volumeScore: 5,
      };
      render(<SignalTags signals={signals} />);
      expect(screen.getByText("Consolidating")).toBeInTheDocument();
    });

    it("shows High Volatility tag when volatility > 50", () => {
      const signals: SymbolSignals = {
        ...mockSignals,
        volatilityScore: 55,
      };
      render(<SignalTags signals={signals} />);
      expect(screen.getByText("High Volatility")).toBeInTheDocument();
    });

    it("shows Volume Surge tag when volume > 50", () => {
      const signals: SymbolSignals = {
        ...mockSignals,
        volumeScore: 55,
      };
      render(<SignalTags signals={signals} />);
      expect(screen.getByText("Volume Surge")).toBeInTheDocument();
    });

    it("shows Bullish Divergence tag when momentum > 30 and trend < -10", () => {
      const signals: SymbolSignals = {
        ...mockSignals,
        momentumScore: 40,
        trendScore: -20,
      };
      render(<SignalTags signals={signals} />);
      expect(screen.getByText("Bullish Divergence")).toBeInTheDocument();
    });

    it("shows Bearish Divergence tag when momentum < -30 and trend > 10", () => {
      const signals: SymbolSignals = {
        ...mockSignals,
        momentumScore: -40,
        trendScore: 20,
      };
      render(<SignalTags signals={signals} />);
      expect(screen.getByText("Bearish Divergence")).toBeInTheDocument();
    });
  });

  describe("Tag Limit", () => {
    it("limits tags to maximum of 5", () => {
      // Create conditions for many tags
      const signals: SymbolSignals = {
        ...mockSignals,
        direction: "strong_buy",
        compositeScore: 70,
        trendScore: 70,
        momentumScore: 65,
        volatilityScore: 55,
        volumeScore: 55,
      };
      render(<SignalTags signals={signals} />);
      // Count tag elements (including labels within tags)
      const textElements = screen.getAllByTestId("text");
      // Should have MARKET CONDITIONS, subtitle, and up to 5 tags (each with 2 text elements)
      expect(textElements.length).toBeLessThanOrEqual(14); // 2 headers + 5 tags * 2 text each + some variation
    });
  });

  describe("Tag Descriptions", () => {
    it("shows description for Strong Buy Signal", () => {
      const signals: SymbolSignals = {
        ...mockSignals,
        direction: "strong_buy",
      };
      render(<SignalTags signals={signals} />);
      expect(screen.getByText("Multiple indicators strongly suggest price increase")).toBeInTheDocument();
    });

    it("shows description for Falling Knife", () => {
      const signals: SymbolSignals = {
        ...mockSignals,
        momentumScore: -55,
        direction: "strong_sell",
      };
      render(<SignalTags signals={signals} priceChange24h={-7} />);
      expect(screen.getByText("Rapid decline - catching the bottom is risky")).toBeInTheDocument();
    });

    it("shows description for Oversold", () => {
      const signals: SymbolSignals = {
        ...mockSignals,
        momentumScore: -65,
        trendScore: -10,
        direction: "sell",
      };
      render(<SignalTags signals={signals} />);
      expect(screen.getByText("Price may have dropped too far, potential bounce ahead")).toBeInTheDocument();
    });
  });
});
