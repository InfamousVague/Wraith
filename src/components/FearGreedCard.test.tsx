/**
 * FearGreedCard Component Tests
 *
 * Tests the Fear & Greed Index gauge including:
 * - Progress circle rendering
 * - Score-based labels (Panic to Manic)
 * - Appearance color coding
 * - HintIndicator integration
 * - Loading state
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "fearGreed.title": "Fear & Greed Index",
        "fearGreed.updated": "Updated daily",
        "fearGreed.description": "Measures market sentiment",
        "fearGreed.hint.title": "About Fear & Greed",
        "fearGreed.hint.content": "The index measures overall market sentiment",
        "fearGreed.labels.panic": "Panic",
        "fearGreed.labels.fearful": "Fearful",
        "fearGreed.labels.anxious": "Anxious",
        "fearGreed.labels.cautious": "Cautious",
        "fearGreed.labels.balanced": "Balanced",
        "fearGreed.labels.optimistic": "Optimistic",
        "fearGreed.labels.greedy": "Greedy",
        "fearGreed.labels.euphoric": "Euphoric",
        "fearGreed.labels.manic": "Manic",
        "fearGreed.levels.extremeFear": "Extreme Fear",
        "fearGreed.levels.fear": "Fear",
        "fearGreed.levels.neutral": "Neutral",
        "fearGreed.levels.greed": "Greed",
        "fearGreed.levels.extremeGreed": "Extreme Greed",
      };
      return translations[key] || key;
    },
  }),
}));

// Mock Ghost components
vi.mock("@wraith/ghost/components", () => ({
  Card: ({ children, style, loading }: { children: React.ReactNode; style?: object; loading?: boolean }) => (
    <div data-testid="card" data-loading={loading}>{children}</div>
  ),
  Text: ({ children, appearance, size, weight }: { children: React.ReactNode; appearance?: string; size?: string; weight?: string }) => (
    <span data-testid="text" data-appearance={appearance} data-weight={weight}>{children}</span>
  ),
  ProgressCircle: ({ value, max, appearance, label, showValue }: { value: number; max: number; appearance?: string; label?: string; showValue?: boolean }) => (
    <div data-testid="progress-circle" data-value={value} data-max={max} data-appearance={appearance} data-label={label} data-showvalue={showValue} />
  ),
}));

// Mock Colors
vi.mock("@wraith/ghost/tokens", () => ({
  Colors: {
    accent: { primary: "#3b82f6" },
  },
}));

// Mock HintIndicator
vi.mock("./HintIndicator", () => ({
  HintIndicator: ({ id, title }: { id: string; title: string }) => (
    <span data-testid="hint-indicator" data-id={id}>{title}</span>
  ),
}));

import { FearGreedCard } from "./FearGreedCard";

describe("FearGreedCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders card container", () => {
      render(<FearGreedCard value={50} />);
      expect(screen.getByTestId("card")).toBeInTheDocument();
    });

    it("renders title", () => {
      render(<FearGreedCard value={50} />);
      expect(screen.getByText("Fear & Greed Index")).toBeInTheDocument();
    });

    it("renders updated text", () => {
      render(<FearGreedCard value={50} />);
      expect(screen.getByText("Updated daily")).toBeInTheDocument();
    });

    it("renders description", () => {
      render(<FearGreedCard value={50} />);
      expect(screen.getByText("Measures market sentiment")).toBeInTheDocument();
    });

    it("renders ProgressCircle", () => {
      render(<FearGreedCard value={50} />);
      expect(screen.getByTestId("progress-circle")).toBeInTheDocument();
    });

    it("renders HintIndicator", () => {
      render(<FearGreedCard value={50} />);
      expect(screen.getByTestId("hint-indicator")).toBeInTheDocument();
    });
  });

  describe("Extreme Fear (0-25)", () => {
    it("shows Panic label for value 0-12", () => {
      render(<FearGreedCard value={10} />);
      const circle = screen.getByTestId("progress-circle");
      expect(circle).toHaveAttribute("data-label", "Panic");
      expect(circle).toHaveAttribute("data-appearance", "danger");
    });

    it("shows Fearful label for value 13-25", () => {
      render(<FearGreedCard value={20} />);
      const circle = screen.getByTestId("progress-circle");
      expect(circle).toHaveAttribute("data-label", "Fearful");
      expect(circle).toHaveAttribute("data-appearance", "danger");
    });

    it("shows Extreme Fear level text", () => {
      render(<FearGreedCard value={15} />);
      expect(screen.getByText("Extreme Fear")).toBeInTheDocument();
    });
  });

  describe("Fear (26-45)", () => {
    it("shows Anxious label for value 26-37", () => {
      render(<FearGreedCard value={30} />);
      const circle = screen.getByTestId("progress-circle");
      expect(circle).toHaveAttribute("data-label", "Anxious");
      expect(circle).toHaveAttribute("data-appearance", "warning");
    });

    it("shows Cautious label for value 38-45", () => {
      render(<FearGreedCard value={42} />);
      const circle = screen.getByTestId("progress-circle");
      expect(circle).toHaveAttribute("data-label", "Cautious");
      expect(circle).toHaveAttribute("data-appearance", "warning");
    });

    it("shows Fear level text", () => {
      render(<FearGreedCard value={35} />);
      expect(screen.getByText("Fear")).toBeInTheDocument();
    });
  });

  describe("Neutral (46-55)", () => {
    it("shows Balanced label", () => {
      render(<FearGreedCard value={50} />);
      const circle = screen.getByTestId("progress-circle");
      expect(circle).toHaveAttribute("data-label", "Balanced");
      expect(circle).toHaveAttribute("data-appearance", "muted");
    });

    it("shows Neutral level text", () => {
      render(<FearGreedCard value={50} />);
      expect(screen.getByText("Neutral")).toBeInTheDocument();
    });
  });

  describe("Greed (56-75)", () => {
    it("shows Optimistic label for value 56-65", () => {
      render(<FearGreedCard value={60} />);
      const circle = screen.getByTestId("progress-circle");
      expect(circle).toHaveAttribute("data-label", "Optimistic");
      expect(circle).toHaveAttribute("data-appearance", "success");
    });

    it("shows Greedy label for value 66-75", () => {
      render(<FearGreedCard value={70} />);
      const circle = screen.getByTestId("progress-circle");
      expect(circle).toHaveAttribute("data-label", "Greedy");
      expect(circle).toHaveAttribute("data-appearance", "success");
    });

    it("shows Greed level text", () => {
      render(<FearGreedCard value={65} />);
      expect(screen.getByText("Greed")).toBeInTheDocument();
    });
  });

  describe("Extreme Greed (76-100)", () => {
    it("shows Euphoric label for value 76-87", () => {
      render(<FearGreedCard value={80} />);
      const circle = screen.getByTestId("progress-circle");
      expect(circle).toHaveAttribute("data-label", "Euphoric");
      expect(circle).toHaveAttribute("data-appearance", "success");
    });

    it("shows Manic label for value 88-100", () => {
      render(<FearGreedCard value={95} />);
      const circle = screen.getByTestId("progress-circle");
      expect(circle).toHaveAttribute("data-label", "Manic");
      expect(circle).toHaveAttribute("data-appearance", "success");
    });

    it("shows Extreme Greed level text", () => {
      render(<FearGreedCard value={90} />);
      expect(screen.getByText("Extreme Greed")).toBeInTheDocument();
    });
  });

  describe("Progress Circle Values", () => {
    it("passes correct value to ProgressCircle", () => {
      render(<FearGreedCard value={75} />);
      const circle = screen.getByTestId("progress-circle");
      expect(circle).toHaveAttribute("data-value", "75");
      expect(circle).toHaveAttribute("data-max", "100");
    });

    it("shows value in circle", () => {
      render(<FearGreedCard value={50} />);
      const circle = screen.getByTestId("progress-circle");
      expect(circle).toHaveAttribute("data-showvalue", "true");
    });
  });

  describe("Loading State", () => {
    it("passes loading prop to card", () => {
      render(<FearGreedCard value={50} loading={true} />);
      expect(screen.getByTestId("card")).toHaveAttribute("data-loading", "true");
    });
  });

  describe("Default Values", () => {
    it("uses default value of 72", () => {
      render(<FearGreedCard />);
      const circle = screen.getByTestId("progress-circle");
      expect(circle).toHaveAttribute("data-value", "72");
    });
  });
});
