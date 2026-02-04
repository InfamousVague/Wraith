/**
 * AltcoinSeasonCard Component Tests
 *
 * Tests the Altcoin Season Index card including:
 * - Progress bar rendering
 * - Season status labels
 * - BTC dominance display
 * - Score-based appearance
 * - HintIndicator integration
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
        "altcoinSeason.title": "Altcoin Season Index",
        "altcoinSeason.btcDominance": `BTC Dominance: ${params?.value ?? 0}%`,
        "altcoinSeason.hint.title": "About Altcoin Season",
        "altcoinSeason.hint.content": "Measures relative performance of altcoins vs BTC",
        "altcoinSeason.labels.btc": "BTC",
        "altcoinSeason.labels.alt": "ALT",
        "altcoinSeason.status.bitcoinSeason": "Bitcoin Season",
        "altcoinSeason.status.btcLeaning": "BTC Leaning",
        "altcoinSeason.status.neutral": "Neutral",
        "altcoinSeason.status.altLeaning": "Alt Leaning",
        "altcoinSeason.status.altcoinSeason": "Altcoin Season",
        "altcoinSeason.descriptions.bitcoinSeason": "BTC dominates the market",
        "altcoinSeason.descriptions.btcLeaning": "BTC slightly outperforming alts",
        "altcoinSeason.descriptions.neutral": "No clear trend",
        "altcoinSeason.descriptions.altLeaning": "Alts slightly outperforming BTC",
        "altcoinSeason.descriptions.altcoinSeason": "Alts dominate the market",
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
  ProgressBar: ({ value, max, appearance }: { value: number; max: number; appearance?: string }) => (
    <div data-testid="progress-bar" data-value={value} data-max={max} data-appearance={appearance} />
  ),
  Number: ({ value, appearance }: { value: number; appearance?: string }) => (
    <span data-testid="number" data-value={value} data-appearance={appearance}>{value}</span>
  ),
}));

// Mock Colors
vi.mock("@wraith/ghost/tokens", () => ({
  Colors: {
    accent: { primary: "#3b82f6" },
  },
}));

// Mock HintIndicator
vi.mock("../hint-indicator", () => ({
  HintIndicator: ({ id, title }: { id: string; title: string }) => (
    <span data-testid="hint-indicator" data-id={id}>{title}</span>
  ),
}));

import { AltcoinSeasonCard } from "./AltcoinSeasonCard";

describe("AltcoinSeasonCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders card container", () => {
      render(<AltcoinSeasonCard value={50} />);
      expect(screen.getByTestId("card")).toBeInTheDocument();
    });

    it("renders title", () => {
      render(<AltcoinSeasonCard value={50} />);
      expect(screen.getByText("Altcoin Season Index")).toBeInTheDocument();
    });

    it("renders BTC dominance", () => {
      render(<AltcoinSeasonCard value={50} btcDominance={52.4} />);
      expect(screen.getByText("BTC Dominance: 52.4%")).toBeInTheDocument();
    });

    it("renders progress bar", () => {
      render(<AltcoinSeasonCard value={50} />);
      expect(screen.getByTestId("progress-bar")).toBeInTheDocument();
    });

    it("renders BTC and ALT labels", () => {
      render(<AltcoinSeasonCard value={50} />);
      expect(screen.getByText("BTC")).toBeInTheDocument();
      expect(screen.getByText("ALT")).toBeInTheDocument();
    });

    it("renders score value", () => {
      render(<AltcoinSeasonCard value={50} />);
      expect(screen.getByTestId("number")).toBeInTheDocument();
    });

    it("renders /100 indicator", () => {
      render(<AltcoinSeasonCard value={50} />);
      expect(screen.getByText("/ 100")).toBeInTheDocument();
    });

    it("renders HintIndicator", () => {
      render(<AltcoinSeasonCard value={50} />);
      expect(screen.getByTestId("hint-indicator")).toBeInTheDocument();
    });
  });

  describe("Bitcoin Season (0-20)", () => {
    it("shows Bitcoin Season status", () => {
      render(<AltcoinSeasonCard value={15} />);
      expect(screen.getByText("Bitcoin Season")).toBeInTheDocument();
    });

    it("shows correct description", () => {
      render(<AltcoinSeasonCard value={15} />);
      expect(screen.getByText("BTC dominates the market")).toBeInTheDocument();
    });

    it("uses warning appearance", () => {
      render(<AltcoinSeasonCard value={15} />);
      const progressBar = screen.getByTestId("progress-bar");
      expect(progressBar).toHaveAttribute("data-appearance", "warning");
    });
  });

  describe("BTC Leaning (21-40)", () => {
    it("shows BTC Leaning status", () => {
      render(<AltcoinSeasonCard value={30} />);
      expect(screen.getByText("BTC Leaning")).toBeInTheDocument();
    });

    it("shows correct description", () => {
      render(<AltcoinSeasonCard value={30} />);
      expect(screen.getByText("BTC slightly outperforming alts")).toBeInTheDocument();
    });

    it("uses warning appearance", () => {
      render(<AltcoinSeasonCard value={30} />);
      const progressBar = screen.getByTestId("progress-bar");
      expect(progressBar).toHaveAttribute("data-appearance", "warning");
    });
  });

  describe("Neutral (41-60)", () => {
    it("shows Neutral status", () => {
      render(<AltcoinSeasonCard value={50} />);
      expect(screen.getByText("Neutral")).toBeInTheDocument();
    });

    it("shows correct description", () => {
      render(<AltcoinSeasonCard value={50} />);
      expect(screen.getByText("No clear trend")).toBeInTheDocument();
    });

    it("uses muted appearance", () => {
      render(<AltcoinSeasonCard value={50} />);
      const progressBar = screen.getByTestId("progress-bar");
      expect(progressBar).toHaveAttribute("data-appearance", "muted");
    });
  });

  describe("Alt Leaning (61-80)", () => {
    it("shows Alt Leaning status", () => {
      render(<AltcoinSeasonCard value={70} />);
      expect(screen.getByText("Alt Leaning")).toBeInTheDocument();
    });

    it("shows correct description", () => {
      render(<AltcoinSeasonCard value={70} />);
      expect(screen.getByText("Alts slightly outperforming BTC")).toBeInTheDocument();
    });

    it("uses info appearance", () => {
      render(<AltcoinSeasonCard value={70} />);
      const progressBar = screen.getByTestId("progress-bar");
      expect(progressBar).toHaveAttribute("data-appearance", "info");
    });
  });

  describe("Altcoin Season (81-100)", () => {
    it("shows Altcoin Season status", () => {
      render(<AltcoinSeasonCard value={90} />);
      expect(screen.getByText("Altcoin Season")).toBeInTheDocument();
    });

    it("shows correct description", () => {
      render(<AltcoinSeasonCard value={90} />);
      expect(screen.getByText("Alts dominate the market")).toBeInTheDocument();
    });

    it("uses info appearance", () => {
      render(<AltcoinSeasonCard value={90} />);
      const progressBar = screen.getByTestId("progress-bar");
      expect(progressBar).toHaveAttribute("data-appearance", "info");
    });
  });

  describe("Progress Bar Values", () => {
    it("passes correct value to progress bar", () => {
      render(<AltcoinSeasonCard value={65} />);
      const progressBar = screen.getByTestId("progress-bar");
      expect(progressBar).toHaveAttribute("data-value", "65");
      expect(progressBar).toHaveAttribute("data-max", "100");
    });
  });

  describe("Loading State", () => {
    it("passes loading prop to card", () => {
      render(<AltcoinSeasonCard value={50} loading={true} />);
      expect(screen.getByTestId("card")).toHaveAttribute("data-loading", "true");
    });
  });

  describe("Default Values", () => {
    it("uses default value of 35", () => {
      render(<AltcoinSeasonCard />);
      const progressBar = screen.getByTestId("progress-bar");
      expect(progressBar).toHaveAttribute("data-value", "35");
    });

    it("uses default btcDominance of 52.4", () => {
      render(<AltcoinSeasonCard />);
      expect(screen.getByText("BTC Dominance: 52.4%")).toBeInTheDocument();
    });
  });
});
