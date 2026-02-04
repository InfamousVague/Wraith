/**
 * SignalSummaryCard Component Tests
 *
 * Tests the composite trading signal display including:
 * - Composite score and direction badge
 * - Category breakdown (trend, momentum, volatility, volume)
 * - Condition tags (falling knife, oversold, etc.)
 * - Loading state
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        "signals.title": "Trading Signals",
        "signals.subtitle": "Based on {{count}} indicators",
        "signals.compositeScore": "Composite Score",
        "signals.categoryBreakdown": "Category Breakdown",
        "signals.hint.title": "Understanding Signals",
        "signals.hint.content": "Signals help predict price movements",
        "signals.interpretation.strongBuy": "Strong buying opportunity",
        "signals.interpretation.moderateBuy": "Moderate buying opportunity",
        "signals.interpretation.neutral": "Market is neutral",
        "signals.interpretation.moderateSell": "Moderate selling opportunity",
        "signals.interpretation.strongSell": "Strong selling opportunity",
        "signals.categories.trend": "Trend",
        "signals.categories.momentum": "Momentum",
        "signals.categories.volatility": "Volatility",
        "signals.categories.volume": "Volume",
        "signals.conditions.fallingKnife": "Falling Knife",
        "signals.conditions.oversold": "Oversold",
        "signals.conditions.overbought": "Overbought",
        "signals.conditions.uptrend": "Uptrend",
        "signals.conditions.downtrend": "Downtrend",
        "signals.conditions.consolidating": "Consolidating",
        "signals.conditions.highVol": "High Vol",
        "signals.conditions.volSurge": "Volume Surge",
        "signals.conditions.bullDiv": "Bullish Div",
        "signals.conditions.bearDiv": "Bearish Div",
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
  getDirectionLabel: (dir: string) => {
    const labels: Record<string, string> = {
      strong_buy: "Strong Buy",
      buy: "Buy",
      neutral: "Neutral",
      sell: "Sell",
      strong_sell: "Strong Sell",
    };
    return labels[dir] || dir;
  },
  getDirectionColor: (dir: string) => {
    if (dir.includes("buy")) return "#2fd575";
    if (dir.includes("sell")) return "#ff5c7a";
    return "#888888";
  },
  getScoreColor: (score: number) => score > 0 ? "#2fd575" : score < 0 ? "#ff5c7a" : "#888888",
}));

// Mock Ghost components
vi.mock("@wraith/ghost/components", () => ({
  Card: ({ children, loading, fullBleed }: { children: React.ReactNode; loading?: boolean; fullBleed?: boolean }) => (
    <div data-testid="card" data-loading={loading} data-fullbleed={fullBleed}>{children}</div>
  ),
  Text: ({ children, appearance, style }: { children: React.ReactNode; appearance?: string; style?: object }) => (
    <span data-testid="text" data-appearance={appearance}>{children}</span>
  ),
  ProgressBar: ({ value, max, color }: { value: number; max: number; color?: string }) => (
    <div data-testid="progress-bar" data-value={value} data-color={color} />
  ),
  AnimatedNumber: ({ value, prefix, decimals }: { value: number; prefix?: string; decimals?: number }) => (
    <span data-testid="animated-number">{prefix}{value}</span>
  ),
}));

// Mock HintIndicator
vi.mock("../hint-indicator", () => ({
  HintIndicator: ({ title }: { title: string }) => (
    <span data-testid="hint-indicator">{title}</span>
  ),
}));

// Mock Colors
vi.mock("@wraith/ghost/tokens", () => ({
  Colors: {
    status: {
      success: "#2fd575",
      danger: "#ff5c7a",
      warning: "#ffc107",
      info: "#3b82f6",
    },
    text: { muted: "#888888" },
    accent: { primary: "#3b82f6" },
    data: {
      violet: "#8b5cf6",
      cyan: "#06b6d4",
      amber: "#f59e0b",
      emerald: "#10b981",
    },
  },
}));

import { SignalSummaryCard } from "./SignalSummaryCard";

const defaultProps = {
  compositeScore: 45,
  direction: "buy" as const,
  trendScore: 30,
  momentumScore: 50,
  volatilityScore: -10,
  volumeScore: 25,
  indicatorCount: 12,
};

describe("SignalSummaryCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders card container", () => {
      render(<SignalSummaryCard {...defaultProps} />);
      expect(screen.getByTestId("card")).toBeInTheDocument();
    });

    it("renders title", () => {
      render(<SignalSummaryCard {...defaultProps} />);
      expect(screen.getByText("Trading Signals")).toBeInTheDocument();
    });

    it("renders subtitle with indicator count", () => {
      render(<SignalSummaryCard {...defaultProps} />);
      expect(screen.getByText("Based on 12 indicators")).toBeInTheDocument();
    });

    it("renders composite score label", () => {
      render(<SignalSummaryCard {...defaultProps} />);
      expect(screen.getByText("Composite Score")).toBeInTheDocument();
    });

    it("renders animated composite score value", () => {
      render(<SignalSummaryCard {...defaultProps} />);
      const scoreElement = screen.getByTestId("animated-number");
      expect(scoreElement).toHaveTextContent("+45");
    });

    it("renders hint indicator", () => {
      render(<SignalSummaryCard {...defaultProps} />);
      expect(screen.getByTestId("hint-indicator")).toBeInTheDocument();
    });
  });

  describe("Direction Badge", () => {
    it("shows Buy direction label", () => {
      render(<SignalSummaryCard {...defaultProps} direction="buy" />);
      expect(screen.getByText("Buy")).toBeInTheDocument();
    });

    it("shows Strong Buy direction label", () => {
      render(<SignalSummaryCard {...defaultProps} direction="strong_buy" compositeScore={75} />);
      expect(screen.getByText("Strong Buy")).toBeInTheDocument();
    });

    it("shows Sell direction label", () => {
      render(<SignalSummaryCard {...defaultProps} direction="sell" compositeScore={-30} />);
      expect(screen.getByText("Sell")).toBeInTheDocument();
    });

    it("shows Strong Sell direction label", () => {
      render(<SignalSummaryCard {...defaultProps} direction="strong_sell" compositeScore={-75} />);
      expect(screen.getByText("Strong Sell")).toBeInTheDocument();
    });

    it("shows Neutral direction label", () => {
      render(<SignalSummaryCard {...defaultProps} direction="neutral" compositeScore={0} />);
      expect(screen.getByText("Neutral")).toBeInTheDocument();
    });
  });

  describe("Category Breakdown", () => {
    it("renders category breakdown title", () => {
      render(<SignalSummaryCard {...defaultProps} />);
      expect(screen.getByText("Category Breakdown")).toBeInTheDocument();
    });

    it("renders all four category labels", () => {
      render(<SignalSummaryCard {...defaultProps} />);
      expect(screen.getByText("Trend")).toBeInTheDocument();
      expect(screen.getByText("Momentum")).toBeInTheDocument();
      expect(screen.getByText("Volatility")).toBeInTheDocument();
      expect(screen.getByText("Volume")).toBeInTheDocument();
    });

    it("renders progress bars for each category", () => {
      render(<SignalSummaryCard {...defaultProps} />);
      const progressBars = screen.getAllByTestId("progress-bar");
      // 4 category bars + 1 composite bar = 5
      expect(progressBars.length).toBe(5);
    });
  });

  describe("Interpretation Text", () => {
    it("shows strong buy interpretation for score >= 40", () => {
      render(<SignalSummaryCard {...defaultProps} compositeScore={50} />);
      expect(screen.getByText("Strong buying opportunity")).toBeInTheDocument();
    });

    it("shows moderate buy interpretation for score >= 10", () => {
      render(<SignalSummaryCard {...defaultProps} compositeScore={20} />);
      expect(screen.getByText("Moderate buying opportunity")).toBeInTheDocument();
    });

    it("shows neutral interpretation for score between -10 and 10", () => {
      render(<SignalSummaryCard {...defaultProps} compositeScore={0} direction="neutral" />);
      expect(screen.getByText("Market is neutral")).toBeInTheDocument();
    });

    it("shows moderate sell interpretation for score between -40 and -10", () => {
      render(<SignalSummaryCard {...defaultProps} compositeScore={-25} direction="sell" />);
      expect(screen.getByText("Moderate selling opportunity")).toBeInTheDocument();
    });

    it("shows strong sell interpretation for score < -40", () => {
      render(<SignalSummaryCard {...defaultProps} compositeScore={-60} direction="strong_sell" />);
      expect(screen.getByText("Strong selling opportunity")).toBeInTheDocument();
    });
  });

  describe("Condition Tags", () => {
    it("shows Falling Knife tag when momentum < -50 and price change < -5%", () => {
      render(
        <SignalSummaryCard
          {...defaultProps}
          momentumScore={-60}
          direction="strong_sell"
          priceChange24h={-8}
        />
      );
      expect(screen.getByText("Falling Knife")).toBeInTheDocument();
    });

    it("shows Oversold tag when momentum < -60 and trend > -20", () => {
      render(
        <SignalSummaryCard
          {...defaultProps}
          momentumScore={-70}
          trendScore={-10}
          direction="sell"
        />
      );
      expect(screen.getByText("Oversold")).toBeInTheDocument();
    });

    it("shows Overbought tag when momentum > 60 and trend < 20", () => {
      render(
        <SignalSummaryCard
          {...defaultProps}
          momentumScore={70}
          trendScore={10}
        />
      );
      expect(screen.getByText("Overbought")).toBeInTheDocument();
    });

    it("shows Uptrend tag when trend > 60", () => {
      render(<SignalSummaryCard {...defaultProps} trendScore={70} />);
      expect(screen.getByText("Uptrend")).toBeInTheDocument();
    });

    it("shows Downtrend tag when trend < -60", () => {
      render(<SignalSummaryCard {...defaultProps} trendScore={-70} direction="sell" />);
      expect(screen.getByText("Downtrend")).toBeInTheDocument();
    });

    it("shows Volume Surge tag when volume > 50", () => {
      render(<SignalSummaryCard {...defaultProps} volumeScore={60} />);
      expect(screen.getByText("Volume Surge")).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("passes loading prop to card", () => {
      render(<SignalSummaryCard {...defaultProps} loading={true} />);
      expect(screen.getByTestId("card")).toHaveAttribute("data-loading", "true");
    });
  });

  describe("Props", () => {
    it("uses default indicator count of 12", () => {
      const props = { ...defaultProps };
      delete (props as Record<string, unknown>).indicatorCount;
      render(<SignalSummaryCard {...props} />);
      expect(screen.getByText("Based on 12 indicators")).toBeInTheDocument();
    });

    it("accepts custom indicator count", () => {
      render(<SignalSummaryCard {...defaultProps} indicatorCount={8} />);
      expect(screen.getByText("Based on 8 indicators")).toBeInTheDocument();
    });
  });
});
