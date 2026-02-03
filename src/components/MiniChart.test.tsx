/**
 * @file MiniChart.test.tsx
 * @description Tests for the MiniChart component.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { MiniChart } from "./MiniChart";

// Mock theme context
vi.mock("@wraith/ghost/context/ThemeContext", () => ({
  useThemeColors: () => ({
    text: { muted: "#888" },
  }),
}));

// Mock LightweightChart from Ghost
vi.mock("@wraith/ghost/components", () => ({
  LightweightChart: ({
    data,
    type,
    width,
    height,
    isPositive,
    glow,
  }: {
    data: unknown[];
    type: string;
    width: number | string;
    height: number;
    isPositive: boolean;
    glow?: boolean;
    glowIntensity?: number;
    lineWidth?: number;
    showPriceScale?: boolean;
    showTimeScale?: boolean;
    showCrosshair?: boolean;
    interactive?: boolean;
  }) => (
    <div
      data-testid="lightweight-chart"
      data-type={type}
      data-width={width}
      data-height={height}
      data-positive={isPositive}
      data-glow={glow}
      data-points={data.length}
    />
  ),
}));

// Mock HeartbeatChart
vi.mock("./HeartbeatChart", () => ({
  HeartbeatChart: ({
    width,
    height,
    color,
    animationDuration,
  }: {
    width: number;
    height: number;
    color: string;
    animationDuration?: number;
  }) => (
    <div
      data-testid="heartbeat-chart"
      data-width={width}
      data-height={height}
      data-color={color}
    />
  ),
}));

describe("MiniChart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering with Data", () => {
    it("renders LightweightChart when data has 2+ points", () => {
      render(
        <MiniChart
          data={[100, 110, 105]}
          isPositive={true}
        />
      );
      expect(screen.getByTestId("lightweight-chart")).toBeInTheDocument();
    });

    it("passes isPositive prop to chart", () => {
      render(<MiniChart data={[100, 110]} isPositive={true} />);
      expect(screen.getByTestId("lightweight-chart")).toHaveAttribute("data-positive", "true");

      const { container } = render(<MiniChart data={[100, 90]} isPositive={false} />);
      const charts = container.querySelectorAll('[data-testid="lightweight-chart"]');
      expect(charts[0]).toHaveAttribute("data-positive", "false");
    });

    it("passes dimensions to chart", () => {
      render(<MiniChart data={[100, 110]} isPositive={true} width={120} height={50} />);
      const chart = screen.getByTestId("lightweight-chart");
      expect(chart).toHaveAttribute("data-width", "120");
      expect(chart).toHaveAttribute("data-height", "50");
    });

    it("passes glow prop to chart", () => {
      render(<MiniChart data={[100, 110]} isPositive={true} glow={true} />);
      expect(screen.getByTestId("lightweight-chart")).toHaveAttribute("data-glow", "true");
    });

    it("uses area chart type", () => {
      render(<MiniChart data={[100, 110]} isPositive={true} />);
      expect(screen.getByTestId("lightweight-chart")).toHaveAttribute("data-type", "area");
    });
  });

  describe("Loading State", () => {
    it("renders HeartbeatChart when loading is true", () => {
      render(<MiniChart data={[100, 110]} isPositive={true} loading={true} />);
      expect(screen.getByTestId("heartbeat-chart")).toBeInTheDocument();
      expect(screen.queryByTestId("lightweight-chart")).not.toBeInTheDocument();
    });

    it("renders HeartbeatChart when data has less than 2 points", () => {
      render(<MiniChart data={[100]} isPositive={true} />);
      expect(screen.getByTestId("heartbeat-chart")).toBeInTheDocument();
    });

    it("renders HeartbeatChart when data is empty", () => {
      render(<MiniChart data={[]} isPositive={true} />);
      expect(screen.getByTestId("heartbeat-chart")).toBeInTheDocument();
    });

    it("passes muted color to HeartbeatChart", () => {
      render(<MiniChart data={[]} isPositive={true} />);
      expect(screen.getByTestId("heartbeat-chart")).toHaveAttribute("data-color", "#888");
    });
  });

  describe("Default Props", () => {
    it("uses default height of 40", () => {
      render(<MiniChart data={[100, 110]} isPositive={true} />);
      expect(screen.getByTestId("lightweight-chart")).toHaveAttribute("data-height", "40");
    });

    it("uses default glow of false", () => {
      render(<MiniChart data={[100, 110]} isPositive={true} />);
      expect(screen.getByTestId("lightweight-chart")).toHaveAttribute("data-glow", "false");
    });
  });

  describe("Data Conversion", () => {
    it("converts number array to chart data points", () => {
      render(<MiniChart data={[100, 110, 105, 120]} isPositive={true} />);
      expect(screen.getByTestId("lightweight-chart")).toHaveAttribute("data-points", "4");
    });
  });
});

describe("MiniChart - Memoization", () => {
  it("re-renders when data changes", () => {
    const { rerender } = render(<MiniChart data={[100, 110]} isPositive={true} />);
    expect(screen.getByTestId("lightweight-chart")).toHaveAttribute("data-points", "2");

    rerender(<MiniChart data={[100, 110, 120]} isPositive={true} />);
    expect(screen.getByTestId("lightweight-chart")).toHaveAttribute("data-points", "3");
  });

  it("re-renders when isPositive changes", () => {
    const { rerender } = render(<MiniChart data={[100, 110]} isPositive={true} />);
    expect(screen.getByTestId("lightweight-chart")).toHaveAttribute("data-positive", "true");

    rerender(<MiniChart data={[100, 110]} isPositive={false} />);
    expect(screen.getByTestId("lightweight-chart")).toHaveAttribute("data-positive", "false");
  });
});
