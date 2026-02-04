/**
 * SentimentMeter Component Tests
 *
 * Tests the market sentiment gauge including:
 * - Score display and normalization
 * - Direction label
 * - Appearance based on score ranges
 * - Description text
 * - Loading state
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock theme colors
vi.mock("@wraith/ghost/context/ThemeContext", () => ({
  useThemeColors: () => ({
    text: { primary: "#ffffff", muted: "#888888" },
    border: { subtle: "#333333" },
  }),
}));

// Mock Ghost components
vi.mock("@wraith/ghost/components", () => ({
  Card: ({ children, style, loading }: { children: React.ReactNode; style?: object; loading?: boolean }) => (
    <div data-testid="card" data-loading={loading}>{children}</div>
  ),
  Text: ({ children, appearance, size, style }: { children: React.ReactNode; appearance?: string; size?: string; style?: object }) => (
    <span data-testid="text" data-appearance={appearance}>{children}</span>
  ),
  ProgressCircle: ({ value, max, appearance, label }: { value: number; max: number; appearance?: string; label?: string }) => (
    <div data-testid="progress-circle" data-value={value} data-max={max} data-appearance={appearance} data-label={label} />
  ),
  AnimatedNumber: ({ value, prefix, appearance }: { value: number; prefix?: string; appearance?: string }) => (
    <span data-testid="animated-number" data-value={value} data-appearance={appearance}>{prefix}{value}</span>
  ),
}));

// Mock signals types
vi.mock("../types/signals", () => ({
  getDirectionLabel: (direction: string) => {
    const labels: Record<string, string> = {
      strong_buy: "Strong Buy",
      buy: "Buy",
      neutral: "Neutral",
      sell: "Sell",
      strong_sell: "Strong Sell",
    };
    return labels[direction] || "Unknown";
  },
}));

import { SentimentMeter } from "./SentimentMeter";

describe("SentimentMeter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders card container", () => {
      render(<SentimentMeter score={50} direction="buy" />);
      expect(screen.getByTestId("card")).toBeInTheDocument();
    });

    it("renders header label", () => {
      render(<SentimentMeter score={50} direction="buy" />);
      expect(screen.getByText("MARKET SENTIMENT")).toBeInTheDocument();
    });

    it("renders subheader", () => {
      render(<SentimentMeter score={50} direction="buy" />);
      expect(screen.getByText("Overall market direction")).toBeInTheDocument();
    });

    it("renders ProgressCircle", () => {
      render(<SentimentMeter score={50} direction="buy" />);
      expect(screen.getByTestId("progress-circle")).toBeInTheDocument();
    });

    it("renders AnimatedNumber with score", () => {
      render(<SentimentMeter score={50} direction="buy" />);
      const animatedNumber = screen.getByTestId("animated-number");
      expect(animatedNumber).toHaveAttribute("data-value", "50");
    });
  });

  describe("Score Normalization", () => {
    it("normalizes score -100 to 0", () => {
      render(<SentimentMeter score={-100} direction="sell" />);
      const circle = screen.getByTestId("progress-circle");
      expect(circle).toHaveAttribute("data-value", "0");
    });

    it("normalizes score 0 to 50", () => {
      render(<SentimentMeter score={0} direction="neutral" />);
      const circle = screen.getByTestId("progress-circle");
      expect(circle).toHaveAttribute("data-value", "50");
    });

    it("normalizes score +100 to 100", () => {
      render(<SentimentMeter score={100} direction="strong_buy" />);
      const circle = screen.getByTestId("progress-circle");
      expect(circle).toHaveAttribute("data-value", "100");
    });

    it("normalizes score 50 to 75", () => {
      render(<SentimentMeter score={50} direction="buy" />);
      const circle = screen.getByTestId("progress-circle");
      expect(circle).toHaveAttribute("data-value", "75");
    });
  });

  describe("Direction Label", () => {
    it("shows STRONG BUY label", () => {
      render(<SentimentMeter score={80} direction="strong_buy" />);
      const circle = screen.getByTestId("progress-circle");
      expect(circle).toHaveAttribute("data-label", "STRONG BUY");
    });

    it("shows BUY label", () => {
      render(<SentimentMeter score={30} direction="buy" />);
      const circle = screen.getByTestId("progress-circle");
      expect(circle).toHaveAttribute("data-label", "BUY");
    });

    it("shows NEUTRAL label", () => {
      render(<SentimentMeter score={0} direction="neutral" />);
      const circle = screen.getByTestId("progress-circle");
      expect(circle).toHaveAttribute("data-label", "NEUTRAL");
    });

    it("shows SELL label", () => {
      render(<SentimentMeter score={-30} direction="sell" />);
      const circle = screen.getByTestId("progress-circle");
      expect(circle).toHaveAttribute("data-label", "SELL");
    });
  });

  describe("Appearance Based on Score", () => {
    it("uses success appearance for score >= 40", () => {
      render(<SentimentMeter score={50} direction="buy" />);
      const circle = screen.getByTestId("progress-circle");
      expect(circle).toHaveAttribute("data-appearance", "success");
    });

    it("uses info appearance for score 10-39", () => {
      render(<SentimentMeter score={20} direction="buy" />);
      const circle = screen.getByTestId("progress-circle");
      expect(circle).toHaveAttribute("data-appearance", "info");
    });

    it("uses muted appearance for score -9 to 9", () => {
      render(<SentimentMeter score={5} direction="neutral" />);
      const circle = screen.getByTestId("progress-circle");
      expect(circle).toHaveAttribute("data-appearance", "muted");
    });

    it("uses danger appearance for score < -10", () => {
      render(<SentimentMeter score={-30} direction="sell" />);
      const circle = screen.getByTestId("progress-circle");
      expect(circle).toHaveAttribute("data-appearance", "danger");
    });
  });

  describe("Description Text", () => {
    it("shows bullish description for high score", () => {
      render(<SentimentMeter score={50} direction="buy" />);
      expect(screen.getByText("Market is bullish - most indicators point upward")).toBeInTheDocument();
    });

    it("shows slight bullish description for moderate positive", () => {
      render(<SentimentMeter score={20} direction="buy" />);
      expect(screen.getByText("Slight bullish lean - positive but watch for changes")).toBeInTheDocument();
    });

    it("shows uncertain description for neutral score", () => {
      render(<SentimentMeter score={0} direction="neutral" />);
      expect(screen.getByText("Market is uncertain - no clear direction yet")).toBeInTheDocument();
    });

    it("shows slight bearish description for moderate negative", () => {
      render(<SentimentMeter score={-20} direction="sell" />);
      expect(screen.getByText("Slight bearish lean - caution advised")).toBeInTheDocument();
    });

    it("shows bearish description for low score", () => {
      render(<SentimentMeter score={-50} direction="strong_sell" />);
      expect(screen.getByText("Market is bearish - most indicators point downward")).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("passes loading prop to card", () => {
      render(<SentimentMeter score={0} direction="neutral" loading={true} />);
      expect(screen.getByTestId("card")).toHaveAttribute("data-loading", "true");
    });

    it("does not have loading by default", () => {
      render(<SentimentMeter score={0} direction="neutral" />);
      expect(screen.getByTestId("card")).not.toHaveAttribute("data-loading", "true");
    });
  });

  describe("Score Display", () => {
    it("shows positive prefix for positive scores", () => {
      render(<SentimentMeter score={50} direction="buy" />);
      expect(screen.getByText("+50")).toBeInTheDocument();
    });

    it("shows no prefix for zero", () => {
      render(<SentimentMeter score={0} direction="neutral" />);
      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("shows negative score without prefix", () => {
      render(<SentimentMeter score={-50} direction="sell" />);
      expect(screen.getByText("-50")).toBeInTheDocument();
    });
  });
});
