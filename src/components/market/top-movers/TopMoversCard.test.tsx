/**
 * TopMoversCard Component Tests
 *
 * Tests the top gainers/losers display including:
 * - Timeframe selection
 * - Gainers/losers toggle
 * - Mover list rendering
 * - WebSocket integration
 * - Loading and error states
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "topMovers.title": "TOP MOVERS",
        "topMovers.gainers": "Gainers",
        "topMovers.losers": "Losers",
        "topMovers.noGainers": "No gainers found",
        "topMovers.noLosers": "No losers found",
        "topMovers.tryDifferent": "Try a different timeframe",
        "topMovers.unableToLoad": "Unable to load movers",
      };
      return translations[key] || key;
    },
  }),
}));

// Mock haunt client
const mockGainers = [
  { symbol: "BTC", price: 51000, changePercent: 5.5 },
  { symbol: "ETH", price: 3100, changePercent: 4.2 },
  { symbol: "SOL", price: 105, changePercent: 3.8 },
];
const mockLosers = [
  { symbol: "DOGE", price: 0.08, changePercent: -3.5 },
  { symbol: "XRP", price: 0.55, changePercent: -2.8 },
];

let mockFetchError = false;
let mockEmptyGainers = false;

vi.mock("../services/haunt", () => ({
  hauntClient: {
    getMovers: vi.fn().mockImplementation(() => {
      if (mockFetchError) {
        return Promise.reject(new Error("Network error"));
      }
      if (mockEmptyGainers) {
        return Promise.resolve({
          data: { gainers: [], losers: mockLosers },
        });
      }
      return Promise.resolve({
        data: { gainers: mockGainers, losers: mockLosers },
      });
    }),
  },
}));

// Mock WebSocket hook
const mockSubscribe = vi.fn();
const mockOnPriceUpdate = vi.fn((callback) => () => {});

vi.mock("../hooks/useHauntSocket", () => ({
  useHauntSocket: () => ({
    connected: true,
    subscribe: mockSubscribe,
    onPriceUpdate: mockOnPriceUpdate,
  }),
}));

// Mock theme colors
vi.mock("@wraith/ghost/context/ThemeContext", () => ({
  useThemeColors: () => ({
    text: { primary: "#ffffff", muted: "#888888" },
    border: { subtle: "#333333" },
  }),
}));

// Mock Ghost components
vi.mock("@wraith/ghost/components", () => ({
  Card: ({ children, loading, style }: { children: React.ReactNode; loading?: boolean; style?: object }) => (
    <div data-testid="card" data-loading={loading} style={style}>{children}</div>
  ),
  Text: ({ children, appearance }: { children: React.ReactNode; appearance?: string }) => (
    <span data-testid="text" data-appearance={appearance}>{children}</span>
  ),
  Currency: ({ value, compact }: { value: number; compact?: boolean }) => (
    <span data-testid="currency">${value}</span>
  ),
  PercentChange: ({ value }: { value: number }) => (
    <span data-testid="percent-change">{value}%</span>
  ),
  AnimatedNumber: ({ value }: { value: number }) => (
    <span data-testid="animated-number">{value}</span>
  ),
  SegmentedControl: ({
    options,
    value,
    onChange,
  }: {
    options: { value: string; label: string }[];
    value: string;
    onChange: (v: string) => void;
  }) => (
    <div data-testid="timeframe-control" data-value={value}>
      {options.map((opt) => (
        <button key={opt.value} onClick={() => onChange(opt.value)}>
          {opt.label}
        </button>
      ))}
    </div>
  ),
  Avatar: ({ uri, initials, size }: { uri?: string; initials?: string; size?: string }) => (
    <div data-testid="avatar" data-initials={initials} />
  ),
  Icon: ({ name }: { name: string }) => <span data-testid={`icon-${name}`} />,
  Button: ({
    label,
    iconLeft,
    appearance,
    onPress,
  }: {
    label: string;
    iconLeft?: string;
    appearance?: string;
    onPress?: () => void;
  }) => (
    <button data-testid={`button-${label}`} data-appearance={appearance} onClick={onPress}>
      {label}
    </button>
  ),
}));

import { TopMoversCard } from "./TopMoversCard";

describe("TopMoversCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchError = false;
    mockEmptyGainers = false;
  });

  describe("Rendering", () => {
    it("renders card container", async () => {
      render(<TopMoversCard />);
      await waitFor(() => {
        expect(screen.getByTestId("card")).toBeInTheDocument();
      });
    });

    it("renders title", async () => {
      render(<TopMoversCard />);
      await waitFor(() => {
        expect(screen.getByText("TOP MOVERS")).toBeInTheDocument();
      });
    });

    it("renders timeframe selector", async () => {
      render(<TopMoversCard />);
      await waitFor(() => {
        expect(screen.getByTestId("timeframe-control")).toBeInTheDocument();
      });
    });

    it("renders gainers/losers toggle buttons", async () => {
      render(<TopMoversCard />);
      await waitFor(() => {
        expect(screen.getByTestId("button-Gainers")).toBeInTheDocument();
        expect(screen.getByTestId("button-Losers")).toBeInTheDocument();
      });
    });
  });

  describe("Timeframe Options", () => {
    it("shows all timeframe options", async () => {
      render(<TopMoversCard />);
      await waitFor(() => {
        expect(screen.getByText("5m")).toBeInTheDocument();
        expect(screen.getByText("15m")).toBeInTheDocument();
        expect(screen.getByText("1H")).toBeInTheDocument();
        expect(screen.getByText("4H")).toBeInTheDocument();
        expect(screen.getByText("24H")).toBeInTheDocument();
      });
    });

    it("defaults to 1h timeframe", async () => {
      render(<TopMoversCard />);
      await waitFor(() => {
        const control = screen.getByTestId("timeframe-control");
        expect(control).toHaveAttribute("data-value", "1h");
      });
    });
  });

  describe("Mover List", () => {
    it("shows gainers by default", async () => {
      render(<TopMoversCard />);
      await waitFor(() => {
        expect(screen.getByText("BTC")).toBeInTheDocument();
        expect(screen.getByText("ETH")).toBeInTheDocument();
        expect(screen.getByText("SOL")).toBeInTheDocument();
      });
    });

    it("shows avatars for each mover", async () => {
      render(<TopMoversCard />);
      await waitFor(() => {
        const avatars = screen.getAllByTestId("avatar");
        expect(avatars.length).toBe(3);
      });
    });

    it("shows percent changes", async () => {
      render(<TopMoversCard />);
      await waitFor(() => {
        const changes = screen.getAllByTestId("percent-change");
        expect(changes.length).toBe(3);
      });
    });

    it("switches to losers on button click", async () => {
      render(<TopMoversCard />);
      await waitFor(() => {
        expect(screen.getByText("BTC")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("button-Losers"));

      await waitFor(() => {
        expect(screen.getByText("DOGE")).toBeInTheDocument();
        expect(screen.getByText("XRP")).toBeInTheDocument();
      });
    });
  });

  describe("WebSocket Integration", () => {
    it("subscribes to mover symbols when connected", async () => {
      render(<TopMoversCard />);
      await waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalled();
      });
    });

    it("registers for price updates", async () => {
      render(<TopMoversCard />);
      await waitFor(() => {
        expect(mockOnPriceUpdate).toHaveBeenCalled();
      });
    });
  });

  describe("Loading State", () => {
    it("passes loading prop to card", () => {
      render(<TopMoversCard loading={true} />);
      expect(screen.getByTestId("card")).toHaveAttribute("data-loading", "true");
    });
  });

  describe("Error State", () => {
    it("shows error message when fetch fails", async () => {
      mockFetchError = true;
      render(<TopMoversCard />);
      await waitFor(() => {
        expect(screen.getByText("Unable to load movers")).toBeInTheDocument();
      });
    });
  });

  describe("Empty State", () => {
    it("shows no gainers message when list is empty", async () => {
      mockEmptyGainers = true;
      render(<TopMoversCard />);
      await waitFor(() => {
        expect(screen.getByText("No gainers found")).toBeInTheDocument();
      });
    });
  });

  describe("Props", () => {
    it("accepts pollInterval prop", async () => {
      render(<TopMoversCard pollInterval={10000} />);
      await waitFor(() => {
        expect(screen.getByTestId("card")).toBeInTheDocument();
      });
    });

    it("accepts assetType prop", async () => {
      render(<TopMoversCard assetType="crypto" />);
      await waitFor(() => {
        expect(screen.getByTestId("card")).toBeInTheDocument();
      });
    });
  });
});
