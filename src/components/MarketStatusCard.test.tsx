/**
 * @file MarketStatusCard.test.tsx
 * @description Tests for the MarketStatusCard component.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { MarketStatusCard } from "./MarketStatusCard";

// Mock theme context
vi.mock("@wraith/ghost/context/ThemeContext", () => ({
  useThemeColors: () => ({
    text: { primary: "#fff", muted: "#888" },
    border: { subtle: "#333" },
  }),
}));

// Mock tokens
vi.mock("@wraith/ghost/tokens", () => ({
  Colors: {
    status: {
      success: "#22c55e",
      danger: "#ef4444",
    },
  },
}));

// Mock market hours utility
const mockIsUSMarketOpen = vi.fn();
const mockGetTimeUntilMarketEvent = vi.fn();
const mockFormatDuration = vi.fn();

vi.mock("../utils/marketHours", () => ({
  isUSMarketOpen: () => mockIsUSMarketOpen(),
  getTimeUntilMarketEvent: () => mockGetTimeUntilMarketEvent(),
  formatDuration: (ms: number) => mockFormatDuration(ms),
}));

// Mock Ghost components
vi.mock("@wraith/ghost/components", () => ({
  Card: ({ children, style }: { children: React.ReactNode; style?: object }) => (
    <div data-testid="card" style={style}>{children}</div>
  ),
  Text: ({ children, size, appearance, weight, style }: { children: React.ReactNode; size?: string; appearance?: string; weight?: string; style?: object }) => (
    <span data-testid="text" data-size={size} data-appearance={appearance} style={style}>{children}</span>
  ),
  Icon: ({ name, size, color }: { name: string; size?: string; color?: string }) => (
    <span data-testid={`icon-${name}`} data-color={color} />
  ),
}));

vi.mock("@wraith/ghost/enums", () => ({
  Size: { Small: "sm", ExtraSmall: "xs", TwoXSmall: "2xs" },
  TextAppearance: { Muted: "muted" },
}));

describe("MarketStatusCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Default: market is open
    mockIsUSMarketOpen.mockReturnValue(true);
    mockGetTimeUntilMarketEvent.mockReturnValue({
      event: "close",
      msUntil: 3600000, // 1 hour
    });
    mockFormatDuration.mockReturnValue("01:00:00");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Rendering", () => {
    it("renders card container", () => {
      render(<MarketStatusCard />);
      expect(screen.getByTestId("card")).toBeInTheDocument();
    });

    it("renders market status header", () => {
      render(<MarketStatusCard />);
      expect(screen.getByText("MARKET STATUS")).toBeInTheDocument();
    });

    it("renders US Stocks section", () => {
      render(<MarketStatusCard />);
      expect(screen.getByText("US Stocks")).toBeInTheDocument();
      expect(screen.getByText("NYSE / NASDAQ")).toBeInTheDocument();
    });

    it("renders Crypto section", () => {
      render(<MarketStatusCard />);
      expect(screen.getByText("Crypto")).toBeInTheDocument();
      expect(screen.getByText("All Exchanges")).toBeInTheDocument();
    });

    it("renders building icon for stocks", () => {
      render(<MarketStatusCard />);
      expect(screen.getByTestId("icon-building-2")).toBeInTheDocument();
    });

    it("renders coins icon for crypto", () => {
      render(<MarketStatusCard />);
      expect(screen.getByTestId("icon-coins")).toBeInTheDocument();
    });
  });

  describe("Market Open State", () => {
    it("shows Trading badge when market is open", () => {
      mockIsUSMarketOpen.mockReturnValue(true);
      render(<MarketStatusCard />);
      expect(screen.getByText("Trading")).toBeInTheDocument();
    });

    it("shows Open status badge when market is open", () => {
      mockIsUSMarketOpen.mockReturnValue(true);
      render(<MarketStatusCard />);
      // "Open" appears in stocks section and crypto section ("Always Open")
      // Just verify both exist
      const openTexts = screen.getAllByText("Open");
      expect(openTexts.length).toBeGreaterThanOrEqual(2);
    });

    it("shows Closes countdown when market is open", () => {
      mockIsUSMarketOpen.mockReturnValue(true);
      mockGetTimeUntilMarketEvent.mockReturnValue({
        event: "close",
        msUntil: 3600000,
      });
      render(<MarketStatusCard />);
      expect(screen.getByText("Closes")).toBeInTheDocument();
    });
  });

  describe("Market Closed State", () => {
    it("shows After Hours badge when market is closed", () => {
      mockIsUSMarketOpen.mockReturnValue(false);
      render(<MarketStatusCard />);
      expect(screen.getByText("After Hours")).toBeInTheDocument();
    });

    it("shows Closed status when market is closed", () => {
      mockIsUSMarketOpen.mockReturnValue(false);
      render(<MarketStatusCard />);
      expect(screen.getByText("Closed")).toBeInTheDocument();
    });

    it("shows Opens countdown when market is closed", () => {
      mockIsUSMarketOpen.mockReturnValue(false);
      mockGetTimeUntilMarketEvent.mockReturnValue({
        event: "open",
        msUntil: 36000000,
      });
      render(<MarketStatusCard />);
      expect(screen.getByText("Opens")).toBeInTheDocument();
    });
  });

  describe("Crypto Section", () => {
    it("always shows 24/7 status", () => {
      render(<MarketStatusCard />);
      expect(screen.getByText("24/7")).toBeInTheDocument();
    });

    it("always shows Always Open label", () => {
      render(<MarketStatusCard />);
      expect(screen.getByText("Always")).toBeInTheDocument();
      // Note: "Open" is also used by stocks, so check that crypto section has it too
    });
  });

  describe("Countdown Timer", () => {
    it("calls formatDuration with ms value", () => {
      mockGetTimeUntilMarketEvent.mockReturnValue({
        event: "close",
        msUntil: 7200000, // 2 hours
      });
      mockFormatDuration.mockReturnValue("02:00:00");

      render(<MarketStatusCard />);

      expect(mockFormatDuration).toHaveBeenCalledWith(7200000);
    });

    it("displays formatted duration", () => {
      mockGetTimeUntilMarketEvent.mockReturnValue({
        event: "close",
        msUntil: 5400000,
      });
      mockFormatDuration.mockReturnValue("01:30:00");

      render(<MarketStatusCard />);
      expect(screen.getByText("01:30:00")).toBeInTheDocument();
    });
  });

  describe("Timer Updates", () => {
    it("sets up interval for updates", () => {
      const setIntervalSpy = vi.spyOn(global, "setInterval");
      render(<MarketStatusCard />);
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 1000);
    });

    it("cleans up interval on unmount", () => {
      const clearIntervalSpy = vi.spyOn(global, "clearInterval");
      const { unmount } = render(<MarketStatusCard />);
      unmount();
      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });
});
