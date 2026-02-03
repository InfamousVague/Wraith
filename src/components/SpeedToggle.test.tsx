/**
 * SpeedSelector Component Tests
 *
 * Tests the update speed selector including:
 * - Speed level options
 * - Current level display
 * - SegmentedControl integration
 * - onChange callback
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Ghost components
vi.mock("@wraith/ghost/components", () => ({
  Text: ({ children, appearance, size, weight }: { children: React.ReactNode; appearance?: string; size?: string; weight?: string }) => (
    <span data-testid="text" data-appearance={appearance} data-weight={weight}>{children}</span>
  ),
  SegmentedControl: ({ options, value, onChange }: { options: Array<{ value: string; label: string }>; value: string; onChange: (val: string) => void }) => (
    <div data-testid="segmented-control" data-value={value}>
      {options.map((opt) => (
        <button key={opt.value} data-testid={`option-${opt.value}`} onClick={() => onChange(opt.value)}>
          {opt.label}
        </button>
      ))}
    </div>
  ),
}));

// Mock PerformanceContext
const mockSetSpeedLevel = vi.fn();
let mockSpeedLevel = "balanced";

vi.mock("../context/PerformanceContext", () => ({
  usePerformance: () => ({
    speedLevel: mockSpeedLevel,
    setSpeedLevel: mockSetSpeedLevel,
  }),
  SPEED_LEVELS: [
    { value: "slow", label: "Slow", icon: "turtle", description: "Less frequent updates, saves battery" },
    { value: "balanced", label: "Balanced", icon: "scale", description: "Standard update frequency" },
    { value: "fast", label: "Fast", icon: "rabbit", description: "Real-time updates, uses more resources" },
  ],
}));

import { SpeedSelector } from "./SpeedToggle";

describe("SpeedSelector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSpeedLevel = "balanced";
  });

  describe("Rendering", () => {
    it("renders Update Speed label", () => {
      render(<SpeedSelector />);
      expect(screen.getByText("Update Speed")).toBeInTheDocument();
    });

    it("renders SegmentedControl", () => {
      render(<SpeedSelector />);
      expect(screen.getByTestId("segmented-control")).toBeInTheDocument();
    });

    it("renders all speed options", () => {
      render(<SpeedSelector />);
      expect(screen.getByTestId("option-slow")).toBeInTheDocument();
      expect(screen.getByTestId("option-balanced")).toBeInTheDocument();
      expect(screen.getByTestId("option-fast")).toBeInTheDocument();
    });

    it("shows option labels", () => {
      render(<SpeedSelector />);
      expect(screen.getByText("Slow")).toBeInTheDocument();
      expect(screen.getByText("Balanced")).toBeInTheDocument();
      expect(screen.getByText("Fast")).toBeInTheDocument();
    });
  });

  describe("Current Level Display", () => {
    it("shows description for balanced level", () => {
      mockSpeedLevel = "balanced";
      render(<SpeedSelector />);
      expect(screen.getByText("Standard update frequency")).toBeInTheDocument();
    });

    it("shows description for slow level", () => {
      mockSpeedLevel = "slow";
      render(<SpeedSelector />);
      expect(screen.getByText("Less frequent updates, saves battery")).toBeInTheDocument();
    });

    it("shows description for fast level", () => {
      mockSpeedLevel = "fast";
      render(<SpeedSelector />);
      expect(screen.getByText("Real-time updates, uses more resources")).toBeInTheDocument();
    });
  });

  describe("Selection", () => {
    it("passes current value to SegmentedControl", () => {
      mockSpeedLevel = "fast";
      render(<SpeedSelector />);
      expect(screen.getByTestId("segmented-control")).toHaveAttribute("data-value", "fast");
    });

    it("calls setSpeedLevel when slow selected", () => {
      render(<SpeedSelector />);
      fireEvent.click(screen.getByTestId("option-slow"));
      expect(mockSetSpeedLevel).toHaveBeenCalledWith("slow");
    });

    it("calls setSpeedLevel when balanced selected", () => {
      mockSpeedLevel = "slow";
      render(<SpeedSelector />);
      fireEvent.click(screen.getByTestId("option-balanced"));
      expect(mockSetSpeedLevel).toHaveBeenCalledWith("balanced");
    });

    it("calls setSpeedLevel when fast selected", () => {
      render(<SpeedSelector />);
      fireEvent.click(screen.getByTestId("option-fast"));
      expect(mockSetSpeedLevel).toHaveBeenCalledWith("fast");
    });
  });
});
