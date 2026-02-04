/**
 * TimeframeSelector Component Tests
 *
 * Tests the trading timeframe selector including:
 * - Timeframe options rendering
 * - Selection state styling
 * - onChange callback
 * - Mobile responsive layout
 * - HintIndicator integration
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "timeframe.title": "Trading Style",
        "timeframe.subtitle": "Select your trading style",
        "timeframe.hint.title": "Timeframe Hint",
        "timeframe.hint.content": "Choose your preferred timeframe",
      };
      return translations[key] || key;
    },
  }),
}));

// Mock theme colors
vi.mock("@wraith/ghost/context/ThemeContext", () => ({
  useThemeColors: () => ({
    text: { primary: "#ffffff", muted: "#888888" },
    border: { subtle: "#333333" },
    background: { raised: "#1a1a1a" },
    accent: { primary: "#3b82f6" },
  }),
}));

// Mock Ghost components
vi.mock("@wraith/ghost/components", () => ({
  Text: ({ children, appearance, size, weight, style }: { children: React.ReactNode; appearance?: string; size?: string; weight?: string; style?: object }) => (
    <span data-testid="text" data-appearance={appearance} data-weight={weight}>{children}</span>
  ),
}));

// Mock Colors
vi.mock("@wraith/ghost/tokens", () => ({
  Colors: {
    accent: { primary: "#3b82f6" },
    text: { muted: "#888888" },
  },
}));

// Mock HintIndicator
vi.mock("../hint-indicator", () => ({
  HintIndicator: ({ id, title }: { id: string; title: string }) => (
    <span data-testid="hint-indicator" data-id={id}>{title}</span>
  ),
}));

// Mock useBreakpoint
let mockIsMobile = false;
vi.mock("../../hooks/useBreakpoint", () => ({
  useBreakpoint: () => ({ isMobile: mockIsMobile }),
}));

// Mock signals types
vi.mock("../types/signals", () => ({
  TRADING_TIMEFRAMES: [
    { value: "short", label: "Short Term", description: "5m - 1h" },
    { value: "medium", label: "Medium Term", description: "1h - 4h" },
    { value: "long", label: "Long Term", description: "4h - 1d" },
  ],
}));

import { TimeframeSelector } from "../timeframe-selector";

describe("TimeframeSelector", () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsMobile = false;
  });

  describe("Rendering", () => {
    it("renders title", () => {
      render(<TimeframeSelector value="short" onChange={mockOnChange} />);
      expect(screen.getByText("Trading Style")).toBeInTheDocument();
    });

    it("renders subtitle on desktop", () => {
      render(<TimeframeSelector value="short" onChange={mockOnChange} />);
      expect(screen.getByText("Select your trading style")).toBeInTheDocument();
    });

    it("hides subtitle on mobile", () => {
      mockIsMobile = true;
      render(<TimeframeSelector value="short" onChange={mockOnChange} />);
      expect(screen.queryByText("Select your trading style")).not.toBeInTheDocument();
    });

    it("renders HintIndicator", () => {
      render(<TimeframeSelector value="short" onChange={mockOnChange} />);
      expect(screen.getByTestId("hint-indicator")).toBeInTheDocument();
    });
  });

  describe("Timeframe Options", () => {
    it("renders all timeframe labels", () => {
      render(<TimeframeSelector value="short" onChange={mockOnChange} />);
      expect(screen.getByText("Short Term")).toBeInTheDocument();
      expect(screen.getByText("Medium Term")).toBeInTheDocument();
      expect(screen.getByText("Long Term")).toBeInTheDocument();
    });

    it("renders timeframe descriptions", () => {
      render(<TimeframeSelector value="short" onChange={mockOnChange} />);
      expect(screen.getByText("5m - 1h")).toBeInTheDocument();
      expect(screen.getByText("1h - 4h")).toBeInTheDocument();
      expect(screen.getByText("4h - 1d")).toBeInTheDocument();
    });
  });

  describe("Selection", () => {
    it("shows selected timeframe with semibold weight", () => {
      render(<TimeframeSelector value="short" onChange={mockOnChange} />);
      const shortTerm = screen.getByText("Short Term");
      expect(shortTerm).toHaveAttribute("data-weight", "semibold");
    });

    it("shows unselected timeframes with regular weight", () => {
      render(<TimeframeSelector value="short" onChange={mockOnChange} />);
      const mediumTerm = screen.getByText("Medium Term");
      expect(mediumTerm).toHaveAttribute("data-weight", "regular");
    });

    it("calls onChange when option clicked", () => {
      render(<TimeframeSelector value="short" onChange={mockOnChange} />);
      const mediumTerm = screen.getByText("Medium Term");
      // Click the parent Pressable
      fireEvent.click(mediumTerm.closest('[tabindex="0"]') || mediumTerm.parentElement!);
      expect(mockOnChange).toHaveBeenCalledWith("medium");
    });

    it("calls onChange with long value when long term clicked", () => {
      render(<TimeframeSelector value="short" onChange={mockOnChange} />);
      const longTerm = screen.getByText("Long Term");
      fireEvent.click(longTerm.closest('[tabindex="0"]') || longTerm.parentElement!);
      expect(mockOnChange).toHaveBeenCalledWith("long");
    });
  });

  describe("Different Selected Values", () => {
    it("highlights medium term when selected", () => {
      render(<TimeframeSelector value="medium" onChange={mockOnChange} />);
      const mediumTerm = screen.getByText("Medium Term");
      expect(mediumTerm).toHaveAttribute("data-weight", "semibold");
    });

    it("highlights long term when selected", () => {
      render(<TimeframeSelector value="long" onChange={mockOnChange} />);
      const longTerm = screen.getByText("Long Term");
      expect(longTerm).toHaveAttribute("data-weight", "semibold");
    });
  });
});
