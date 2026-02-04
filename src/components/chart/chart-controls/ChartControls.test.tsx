/**
 * ChartControls Component Tests
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

// Mock Ghost components
vi.mock("@wraith/ghost/components", () => ({
  SegmentedControl: ({
    options,
    value,
    onChange,
  }: {
    options: { value: string; label: string }[];
    value: string;
    onChange: (v: string) => void;
  }) => (
    <div data-testid="segmented-control" data-value={value}>
      {options.map((opt) => (
        <button
          key={opt.value}
          data-testid={`option-${opt.value}`}
          data-selected={opt.value === value}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  ),
}));

import { ChartControls } from "./ChartControls";

describe("ChartControls", () => {
  const defaultProps = {
    timeRange: "1D" as const,
    onTimeRangeChange: vi.fn(),
    chartType: "area" as const,
    onChartTypeChange: vi.fn(),
  };

  it("renders two segmented controls", () => {
    render(<ChartControls {...defaultProps} />);

    const controls = screen.getAllByTestId("segmented-control");
    expect(controls.length).toBe(2);
  });

  it("renders all time range options", () => {
    render(<ChartControls {...defaultProps} />);

    expect(screen.getByText("1H")).toBeInTheDocument();
    expect(screen.getByText("4H")).toBeInTheDocument();
    expect(screen.getByText("1D")).toBeInTheDocument();
    expect(screen.getByText("1W")).toBeInTheDocument();
    expect(screen.getByText("1M")).toBeInTheDocument();
    expect(screen.getByText("3M")).toBeInTheDocument();
    expect(screen.getByText("1Y")).toBeInTheDocument();
    expect(screen.getByText("ALL")).toBeInTheDocument();
  });

  it("renders all chart type options", () => {
    render(<ChartControls {...defaultProps} />);

    expect(screen.getByText("Line")).toBeInTheDocument();
    expect(screen.getByText("Area")).toBeInTheDocument();
    expect(screen.getByText("Candle")).toBeInTheDocument();
  });

  it("calls onTimeRangeChange when time range is clicked", () => {
    const onTimeRangeChange = vi.fn();
    render(<ChartControls {...defaultProps} onTimeRangeChange={onTimeRangeChange} />);

    fireEvent.click(screen.getByText("1W"));
    expect(onTimeRangeChange).toHaveBeenCalledWith("1W");
  });

  it("calls onChartTypeChange when chart type is clicked", () => {
    const onChartTypeChange = vi.fn();
    render(<ChartControls {...defaultProps} onChartTypeChange={onChartTypeChange} />);

    fireEvent.click(screen.getByText("Candle"));
    expect(onChartTypeChange).toHaveBeenCalledWith("candle");
  });

  it("shows current time range as selected", () => {
    render(<ChartControls {...defaultProps} timeRange="1W" />);

    const weekButton = screen.getByTestId("option-1W");
    expect(weekButton).toHaveAttribute("data-selected", "true");
  });

  it("shows current chart type as selected", () => {
    render(<ChartControls {...defaultProps} chartType="candle" />);

    const candleButton = screen.getByTestId("option-candle");
    expect(candleButton).toHaveAttribute("data-selected", "true");
  });
});
