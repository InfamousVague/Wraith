/**
 * @file AccuracyTag.test.tsx
 * @description Tests for the AccuracyTag component.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { AccuracyTag } from "./AccuracyTag";

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "status.new": "New",
      };
      return translations[key] || key;
    },
  }),
}));

// Mock tokens
vi.mock("@wraith/ghost/tokens", () => ({
  Colors: {
    status: {
      success: "#22c55e",
      warning: "#f59e0b",
    },
    text: { muted: "#888" },
  },
}));

// Mock Ghost components
vi.mock("@wraith/ghost/components", () => ({
  Text: ({ children, size, weight, appearance, style }: { children: React.ReactNode; size?: string; weight?: string; appearance?: string; style?: object }) => (
    <span data-testid="text" data-size={size} data-weight={weight} data-appearance={appearance} style={style}>{children}</span>
  ),
}));

vi.mock("@wraith/ghost/enums", () => ({
  Size: { Small: "sm" },
  TextAppearance: { Muted: "muted" },
}));

describe("AccuracyTag", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders accuracy percentage", () => {
      render(<AccuracyTag accuracy={75} sampleSize={100} />);
      expect(screen.getByText("75%")).toBeInTheDocument();
    });

    it("rounds accuracy to nearest integer", () => {
      render(<AccuracyTag accuracy={75.6} sampleSize={100} />);
      expect(screen.getByText("76%")).toBeInTheDocument();
    });
  });

  describe("Sample Size Threshold", () => {
    it("shows New when sample size below minimum", () => {
      render(<AccuracyTag accuracy={80} sampleSize={5} />);
      expect(screen.getByText("New")).toBeInTheDocument();
    });

    it("shows accuracy when sample size at minimum", () => {
      render(<AccuracyTag accuracy={80} sampleSize={10} />);
      expect(screen.getByText("80%")).toBeInTheDocument();
    });

    it("shows accuracy when sample size above minimum", () => {
      render(<AccuracyTag accuracy={80} sampleSize={100} />);
      expect(screen.getByText("80%")).toBeInTheDocument();
    });

    it("respects custom minSamples prop", () => {
      render(<AccuracyTag accuracy={80} sampleSize={15} minSamples={20} />);
      expect(screen.getByText("New")).toBeInTheDocument();
    });
  });

  describe("Color Coding", () => {
    it("uses success color for accuracy >= 70%", () => {
      render(<AccuracyTag accuracy={75} sampleSize={100} />);
      const text = screen.getByText("75%");
      expect(text).toHaveStyle({ color: "#22c55e" });
    });

    it("uses warning color for accuracy >= 55% and < 70%", () => {
      render(<AccuracyTag accuracy={60} sampleSize={100} />);
      const text = screen.getByText("60%");
      expect(text).toHaveStyle({ color: "#f59e0b" });
    });

    it("uses muted color for accuracy < 55%", () => {
      render(<AccuracyTag accuracy={40} sampleSize={100} />);
      const text = screen.getByText("40%");
      expect(text).toHaveStyle({ color: "#888" });
    });
  });

  describe("Edge Cases", () => {
    it("handles 0% accuracy", () => {
      render(<AccuracyTag accuracy={0} sampleSize={100} />);
      expect(screen.getByText("0%")).toBeInTheDocument();
    });

    it("handles 100% accuracy", () => {
      render(<AccuracyTag accuracy={100} sampleSize={100} />);
      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("handles boundary at 70%", () => {
      render(<AccuracyTag accuracy={70} sampleSize={100} />);
      const text = screen.getByText("70%");
      expect(text).toHaveStyle({ color: "#22c55e" });
    });

    it("handles boundary at 55%", () => {
      render(<AccuracyTag accuracy={55} sampleSize={100} />);
      const text = screen.getByText("55%");
      expect(text).toHaveStyle({ color: "#f59e0b" });
    });
  });
});

describe("AccuracyTag - Helper Function", () => {
  // Test getAccuracyColor logic indirectly through the component
  it("correctly determines color for high accuracy", () => {
    render(<AccuracyTag accuracy={85} sampleSize={100} />);
    expect(screen.getByText("85%")).toHaveStyle({ color: "#22c55e" });
  });

  it("correctly determines color for medium accuracy", () => {
    render(<AccuracyTag accuracy={65} sampleSize={100} />);
    expect(screen.getByText("65%")).toHaveStyle({ color: "#f59e0b" });
  });

  it("correctly determines color for low accuracy", () => {
    render(<AccuracyTag accuracy={45} sampleSize={100} />);
    expect(screen.getByText("45%")).toHaveStyle({ color: "#888" });
  });
});
