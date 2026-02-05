/**
 * @file TradingSettingsSection.test.tsx
 * @description Tests for the TradingSettingsSection component.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

// Create default settings inline to avoid hoisting issues
const DEFAULT_DRAWDOWN_PROTECTION = {
  enabled: true,
  maxDrawdownPercent: 20,
  calculationMethod: "from_peak" as const,
  allowBypass: true,
  autoResetAfter: "never" as const,
  warningThresholdPercent: 75,
};

const DEFAULT_TRADING_SETTINGS = {
  drawdownProtection: DEFAULT_DRAWDOWN_PROTECTION,
};

// Mock useTradingSettings hook
const mockUpdateDrawdownSettings = vi.fn().mockResolvedValue(undefined);
const mockResetToDefaults = vi.fn().mockResolvedValue(undefined);

vi.mock("../../hooks/useTradingSettings", () => ({
  useTradingSettings: vi.fn(() => ({
    settings: {
      drawdownProtection: {
        enabled: true,
        maxDrawdownPercent: 20,
        calculationMethod: "from_peak",
        allowBypass: true,
        autoResetAfter: "never",
        warningThresholdPercent: 75,
      },
    },
    loading: false,
    error: null,
    updateSettings: vi.fn(),
    updateDrawdownSettings: vi.fn().mockResolvedValue(undefined),
    resetToDefaults: vi.fn().mockResolvedValue(undefined),
    isDrawdownEnabled: true,
    currentDrawdownPercent: 0,
    isApproachingLimit: false,
    isAtLimit: false,
    setCurrentDrawdown: vi.fn(),
  })),
}));

// Mock useBreakpoint
vi.mock("../../hooks/useBreakpoint", () => ({
  useBreakpoint: vi.fn(() => ({
    isMobile: false,
    isNarrow: false,
    isDesktop: true,
    isTablet: false,
    breakpoint: "desktop",
    width: 1024,
    height: 768,
  })),
}));

// Mock Ghost library components
vi.mock("@wraith/ghost/components", () => ({
  Card: ({ children, style, fullBleed }: { children: React.ReactNode; style?: object; fullBleed?: boolean }) => (
    <div data-testid="card" style={style}>{children}</div>
  ),
  Text: ({ children, size, appearance, weight, style }: { children: React.ReactNode; size?: string; appearance?: string; weight?: string; style?: object }) => (
    <span data-testid="text" style={style}>{children}</span>
  ),
  Toggle: ({ value, onValueChange, disabled, size }: { value?: boolean; onValueChange?: (v: boolean) => void; disabled?: boolean; size?: string }) => (
    <button
      role="switch"
      aria-checked={value}
      disabled={disabled}
      onClick={() => onValueChange?.(!value)}
      data-testid="toggle"
    >
      Toggle {value ? "On" : "Off"}
    </button>
  ),
  Slider: ({ value, min, max, step, onChange, disabled, size, appearance }: { value?: number; min?: number; max?: number; step?: number; onChange?: (v: number) => void; disabled?: boolean; size?: string; appearance?: string }) => (
    <input
      type="range"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange?.(Number(e.target.value))}
      disabled={disabled}
      data-testid="slider"
    />
  ),
  Select: ({ options, value, onChange, disabled, size, style }: { options: Array<{ value: string; label: string }>; value?: string; onChange?: (v: string) => void; disabled?: boolean; size?: string; style?: object }) => (
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      data-testid="select"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  ),
  Button: ({ label, onPress, disabled, size, shape, appearance, leadingIcon, style }: { label: string; onPress?: () => void; disabled?: boolean; size?: string; shape?: string; appearance?: string; leadingIcon?: string; style?: object }) => (
    <button onClick={onPress} disabled={disabled} data-testid="button">
      {label}
    </button>
  ),
  Icon: ({ name, size, color }: { name: string; size?: string; color?: string }) => (
    <span data-testid={`icon-${name}`}>{name}</span>
  ),
}));

vi.mock("@wraith/ghost/enums", () => ({
  Size: {
    TwoXSmall: "2xs",
    ExtraSmall: "xs",
    Small: "sm",
    Medium: "md",
    Large: "lg",
    ExtraLarge: "xl",
    TwoXLarge: "2xl",
  },
  TextAppearance: {
    Primary: "primary",
    Secondary: "secondary",
    Muted: "muted",
    Link: "link",
    Inverse: "inverse",
    Success: "success",
    Warning: "warning",
    Danger: "danger",
    Info: "info",
  },
  Shape: {
    Square: "square",
    Rounded: "rounded",
    Pill: "pill",
  },
  Appearance: {
    Primary: "primary",
    Secondary: "secondary",
    Tertiary: "tertiary",
  },
}));

vi.mock("@wraith/ghost/tokens", () => ({
  Colors: {
    status: {
      danger: "#ff0000",
      dangerSurface: "#ff000020",
      warning: "#ffaa00",
      success: "#00ff00",
      info: "#0000ff",
    },
    text: {
      primary: "#ffffff",
      secondary: "#aaaaaa",
      muted: "#666666",
    },
  },
}));

import { TradingSettingsSection } from "./TradingSettingsSection";
import { useTradingSettings } from "../../hooks/useTradingSettings";
const mockUseTradingSettings = vi.mocked(useTradingSettings);

describe("TradingSettingsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTradingSettings.mockReturnValue({
      settings: DEFAULT_TRADING_SETTINGS,
      loading: false,
      error: null,
      updateSettings: vi.fn(),
      updateDrawdownSettings: mockUpdateDrawdownSettings,
      resetToDefaults: mockResetToDefaults,
      isDrawdownEnabled: true,
      currentDrawdownPercent: 0,
      isApproachingLimit: false,
      isAtLimit: false,
      setCurrentDrawdown: vi.fn(),
    });
  });

  describe("rendering", () => {
    it("renders section title", () => {
      render(<TradingSettingsSection />);
      expect(screen.getByText("Trading & Risk Management")).toBeInTheDocument();
    });

    it("renders all setting labels", () => {
      render(<TradingSettingsSection />);

      expect(screen.getByText("Enable Drawdown Protection")).toBeInTheDocument();
      expect(screen.getByText("Max Drawdown Threshold")).toBeInTheDocument();
      expect(screen.getByText("Calculation Method")).toBeInTheDocument();
      expect(screen.getByText("Allow Single-Trade Bypass")).toBeInTheDocument();
      expect(screen.getByText("Warning Threshold")).toBeInTheDocument();
      expect(screen.getByText("Auto-Reset After")).toBeInTheDocument();
      expect(screen.getByText("Reset to Defaults")).toBeInTheDocument();
    });

    it("displays current max drawdown value", () => {
      render(<TradingSettingsSection />);
      expect(screen.getByText("20%")).toBeInTheDocument();
    });

    it("displays current warning threshold value", () => {
      render(<TradingSettingsSection />);
      expect(screen.getByText("75%")).toBeInTheDocument();
    });
  });

  describe("reset to defaults", () => {
    it("shows confirmation modal when reset button clicked", async () => {
      render(<TradingSettingsSection />);

      const resetButton = screen.getByText("Reset to Defaults");
      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(screen.getByText("Reset Settings?")).toBeInTheDocument();
      });
    });

    it("calls resetToDefaults on confirm", async () => {
      render(<TradingSettingsSection />);

      // Open modal
      const resetButton = screen.getByText("Reset to Defaults");
      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(screen.getByText("Reset Settings?")).toBeInTheDocument();
      });

      // Click confirm - find the Reset button in the modal
      const buttons = screen.getAllByTestId("button");
      const confirmButton = buttons.find((btn) => btn.textContent === "Reset");
      if (confirmButton) {
        fireEvent.click(confirmButton);
      }

      await waitFor(() => {
        expect(mockResetToDefaults).toHaveBeenCalled();
      });
    });

    it("cancel button exists in modal", async () => {
      render(<TradingSettingsSection />);

      // Open modal
      const resetButton = screen.getByText("Reset to Defaults");
      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(screen.getByText("Reset Settings?")).toBeInTheDocument();
      });

      // Verify cancel button exists
      const buttons = screen.getAllByTestId("button");
      const cancelButton = buttons.find((btn) => btn.textContent === "Cancel");
      expect(cancelButton).toBeDefined();
    });
  });

  describe("error state", () => {
    it("displays error message when error exists", () => {
      mockUseTradingSettings.mockReturnValue({
        settings: DEFAULT_TRADING_SETTINGS,
        loading: false,
        error: "Failed to save settings",
        updateSettings: vi.fn(),
        updateDrawdownSettings: mockUpdateDrawdownSettings,
        resetToDefaults: mockResetToDefaults,
        isDrawdownEnabled: true,
        currentDrawdownPercent: 0,
        isApproachingLimit: false,
        isAtLimit: false,
        setCurrentDrawdown: vi.fn(),
      });

      render(<TradingSettingsSection />);
      expect(screen.getByText("Failed to save settings")).toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("renders in loading state", () => {
      mockUseTradingSettings.mockReturnValue({
        settings: DEFAULT_TRADING_SETTINGS,
        loading: true,
        error: null,
        updateSettings: vi.fn(),
        updateDrawdownSettings: mockUpdateDrawdownSettings,
        resetToDefaults: mockResetToDefaults,
        isDrawdownEnabled: true,
        currentDrawdownPercent: 0,
        isApproachingLimit: false,
        isAtLimit: false,
        setCurrentDrawdown: vi.fn(),
      });

      render(<TradingSettingsSection />);
      expect(screen.getByText("Trading & Risk Management")).toBeInTheDocument();
    });
  });
});
