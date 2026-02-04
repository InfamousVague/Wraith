/**
 * ApiStatsCard Component Tests
 *
 * Tests the API statistics card including:
 * - Stats display (TPS, latency, symbols, updates, uptime)
 * - Health score calculation
 * - Error state
 * - Loading state
 * - Uptime formatting
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        "apiStats.title": "API Status",
        "apiStats.online": `${params?.online ?? 0}/${params?.total ?? 0} Sources`,
        "apiStats.apiOffline": "API Offline",
        "apiStats.throughput": "Throughput",
        "apiStats.tps": "req/s",
        "apiStats.latency": "Latency",
        "apiStats.ms": "ms",
        "apiStats.trackedAssets": "Tracked Assets",
        "apiStats.totalUpdates": "Total Updates",
        "apiStats.uptime": "Uptime",
        "apiStats.systemHealth": "System Health",
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
  }),
}));

// Mock Ghost components
vi.mock("@wraith/ghost/components", () => ({
  Card: ({ children, style, loading }: { children: React.ReactNode; style?: object; loading?: boolean }) => (
    <div data-testid="card" data-loading={loading}>{children}</div>
  ),
  Text: ({ children, appearance, size, weight, style }: { children: React.ReactNode; appearance?: string; size?: string; weight?: string; style?: object }) => (
    <span data-testid="text" data-appearance={appearance}>{children}</span>
  ),
  Icon: ({ name, color }: { name: string; color?: string }) => (
    <span data-testid={`icon-${name}`} data-color={color} />
  ),
  AnimatedNumber: ({ value, decimals }: { value: number; decimals?: number }) => (
    <span data-testid="animated-number" data-value={value}>{value}</span>
  ),
  ProgressBar: ({ value, max, color }: { value: number; max: number; color?: string }) => (
    <div data-testid="progress-bar" data-value={value} data-max={max} data-color={color} />
  ),
}));

// Mock Colors
vi.mock("@wraith/ghost/tokens", () => ({
  Colors: {
    status: {
      success: "#2fd575",
      warning: "#ffc107",
      danger: "#ff5c7a",
    },
    data: {
      amber: "#f59e0b",
      violet: "#8b5cf6",
      cyan: "#06b6d4",
      emerald: "#10b981",
    },
  },
}));

// Mock ApiServerContext
const mockGetStats = vi.fn();
let mockStatsResponse = {
  data: {
    tps: 125.5,
    activeSymbols: 1500,
    totalUpdates: 5000000,
    uptimeSecs: 86400, // 1 day
    onlineSources: 8,
    totalSources: 10,
  },
};

vi.mock("../context/ApiServerContext", () => ({
  useApiServer: () => ({
    hauntClient: {
      getStats: mockGetStats,
    },
  }),
}));

import { ApiStatsCard } from "./ApiStatsCard";

describe("ApiStatsCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetStats.mockResolvedValue(mockStatsResponse);
  });

  describe("Rendering", () => {
    it("renders card container", async () => {
      render(<ApiStatsCard />);
      expect(screen.getByTestId("card")).toBeInTheDocument();
    });

    it("renders title", async () => {
      render(<ApiStatsCard />);
      expect(screen.getByText("API Status")).toBeInTheDocument();
    });

    it("fetches stats on mount", async () => {
      render(<ApiStatsCard />);
      await waitFor(() => {
        expect(mockGetStats).toHaveBeenCalled();
      });
    });
  });

  describe("Stats Display", () => {
    it("shows throughput label", async () => {
      render(<ApiStatsCard />);
      await waitFor(() => {
        expect(screen.getByText("Throughput")).toBeInTheDocument();
      });
    });

    it("shows latency label", async () => {
      render(<ApiStatsCard />);
      await waitFor(() => {
        expect(screen.getByText("Latency")).toBeInTheDocument();
      });
    });

    it("shows tracked assets label", async () => {
      render(<ApiStatsCard />);
      await waitFor(() => {
        expect(screen.getByText("Tracked Assets")).toBeInTheDocument();
      });
    });

    it("shows total updates label", async () => {
      render(<ApiStatsCard />);
      await waitFor(() => {
        expect(screen.getByText("Total Updates")).toBeInTheDocument();
      });
    });

    it("shows uptime label", async () => {
      render(<ApiStatsCard />);
      await waitFor(() => {
        expect(screen.getByText("Uptime")).toBeInTheDocument();
      });
    });

    it("shows system health label", async () => {
      render(<ApiStatsCard />);
      await waitFor(() => {
        expect(screen.getByText("System Health")).toBeInTheDocument();
      });
    });
  });

  describe("Stats Icons", () => {
    it("shows zap icon for throughput", async () => {
      render(<ApiStatsCard />);
      await waitFor(() => {
        expect(screen.getByTestId("icon-zap")).toBeInTheDocument();
      });
    });

    it("shows activity icon for latency", async () => {
      render(<ApiStatsCard />);
      await waitFor(() => {
        expect(screen.getByTestId("icon-activity")).toBeInTheDocument();
      });
    });

    it("shows layers icon for tracked assets", async () => {
      render(<ApiStatsCard />);
      await waitFor(() => {
        expect(screen.getByTestId("icon-layers")).toBeInTheDocument();
      });
    });

    it("shows database icon for updates", async () => {
      render(<ApiStatsCard />);
      await waitFor(() => {
        expect(screen.getByTestId("icon-database")).toBeInTheDocument();
      });
    });

    it("shows clock icon for uptime", async () => {
      render(<ApiStatsCard />);
      await waitFor(() => {
        expect(screen.getByTestId("icon-clock")).toBeInTheDocument();
      });
    });
  });

  describe("Online Sources Badge", () => {
    it("shows sources count", async () => {
      render(<ApiStatsCard />);
      await waitFor(() => {
        expect(screen.getByText("8/10 Sources")).toBeInTheDocument();
      });
    });
  });

  describe("Health Score", () => {
    it("renders progress bar", async () => {
      render(<ApiStatsCard />);
      await waitFor(() => {
        expect(screen.getByTestId("progress-bar")).toBeInTheDocument();
      });
    });

    it("calculates health score correctly", async () => {
      render(<ApiStatsCard />);
      await waitFor(() => {
        // 8/10 = 80%
        expect(screen.getByText("80%")).toBeInTheDocument();
      });
    });
  });

  describe("Uptime Formatting", () => {
    it("formats days and hours", async () => {
      render(<ApiStatsCard />);
      await waitFor(() => {
        // 86400 seconds = 1 day
        expect(screen.getByText("1d 0h")).toBeInTheDocument();
      });
    });
  });

  describe("Error State", () => {
    it("shows error message when API fails", async () => {
      mockGetStats.mockRejectedValue(new Error("Network error"));
      render(<ApiStatsCard />);
      await waitFor(() => {
        expect(screen.getByText("API Offline")).toBeInTheDocument();
      });
    });

    it("shows skull icon on error", async () => {
      mockGetStats.mockRejectedValue(new Error("Network error"));
      render(<ApiStatsCard />);
      await waitFor(() => {
        expect(screen.getByTestId("icon-skull")).toBeInTheDocument();
      });
    });
  });

  describe("Loading State", () => {
    it("shows loading when prop is true", () => {
      render(<ApiStatsCard loading={true} />);
      expect(screen.getByTestId("card")).toHaveAttribute("data-loading", "true");
    });
  });
});
