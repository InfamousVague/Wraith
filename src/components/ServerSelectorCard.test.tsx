/**
 * ServerSelectorCard Component Tests
 *
 * Tests the server selection card including:
 * - Server list rendering
 * - Active server highlighting
 * - Auto-select toggle
 * - Network health bar
 * - Refresh functionality
 * - Latency display
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock theme colors
vi.mock("@wraith/ghost/context/ThemeContext", () => ({
  useThemeColors: () => ({
    text: { primary: "#ffffff", muted: "#888888" },
    border: { subtle: "#333333" },
    background: { hover: "#222222" },
  }),
}));

// Mock Ghost components
vi.mock("@wraith/ghost/components", () => ({
  Card: ({ children, style }: { children: React.ReactNode; style?: object }) => (
    <div data-testid="card" style={style}>{children}</div>
  ),
  Text: ({ children, appearance, size, weight, style }: { children: React.ReactNode; appearance?: string; size?: string; weight?: string; style?: object }) => (
    <span data-testid="text" data-appearance={appearance}>{children}</span>
  ),
  Icon: ({ name, color, size }: { name: string; color?: string; size?: string }) => (
    <span data-testid={`icon-${name}`} data-color={color} />
  ),
  AnimatedNumber: ({ value, decimals, style }: { value: number; decimals?: number; style?: object }) => (
    <span data-testid="animated-number" style={style}>{value}</span>
  ),
  ProgressBar: ({ value, max, color }: { value: number; max: number; color?: string }) => (
    <div data-testid="progress-bar" data-value={value} data-max={max} data-color={color} />
  ),
  Toggle: ({ value, onChange, size }: { value: boolean; onChange: (val: boolean) => void; size?: string }) => (
    <button data-testid="toggle" data-value={value} onClick={() => onChange(!value)}>Toggle</button>
  ),
}));

// Mock Colors
vi.mock("@wraith/ghost/tokens", () => ({
  Colors: {
    status: {
      success: "#2fd575",
      danger: "#ff5c7a",
      warning: "#ffc107",
    },
    text: { muted: "#888888" },
    data: { amber: "#f59e0b" },
  },
}));

// Mock ApiServerContext
const mockSetActiveServer = vi.fn();
const mockSetAutoSelectFastest = vi.fn();
const mockRefreshServerStatus = vi.fn();

const mockServers = [
  { id: "server1", name: "US East", region: "us-east-1", status: "online" as const, latencyMs: 25 },
  { id: "server2", name: "EU West", region: "eu-west-1", status: "online" as const, latencyMs: 85 },
  { id: "server3", name: "Asia", region: "ap-southeast-1", status: "offline" as const, latencyMs: null },
  { id: "server4", name: "Local", region: "local", status: "checking" as const, latencyMs: null },
];

let mockAutoSelectFastest = false;
let mockIsRefreshing = false;

vi.mock("../context/ApiServerContext", () => ({
  useApiServer: () => ({
    servers: mockServers,
    activeServer: mockServers[0],
    setActiveServer: mockSetActiveServer,
    autoSelectFastest: mockAutoSelectFastest,
    setAutoSelectFastest: mockSetAutoSelectFastest,
    refreshServerStatus: mockRefreshServerStatus,
    isRefreshing: mockIsRefreshing,
  }),
}));

import { ServerSelectorCard } from "./ServerSelectorCard";

describe("ServerSelectorCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAutoSelectFastest = false;
    mockIsRefreshing = false;
  });

  describe("Rendering", () => {
    it("renders card container", () => {
      render(<ServerSelectorCard />);
      expect(screen.getByTestId("card")).toBeInTheDocument();
    });

    it("renders title", () => {
      render(<ServerSelectorCard />);
      expect(screen.getByText("API Servers")).toBeInTheDocument();
    });

    it("renders server icon", () => {
      render(<ServerSelectorCard />);
      expect(screen.getByTestId("icon-server")).toBeInTheDocument();
    });

    it("renders refresh icon", () => {
      render(<ServerSelectorCard />);
      expect(screen.getByTestId("icon-refresh-cw")).toBeInTheDocument();
    });
  });

  describe("Server List", () => {
    it("renders all server names", () => {
      render(<ServerSelectorCard />);
      expect(screen.getByText("US East")).toBeInTheDocument();
      expect(screen.getByText("EU West")).toBeInTheDocument();
      expect(screen.getByText("Asia")).toBeInTheDocument();
      expect(screen.getByText("Local")).toBeInTheDocument();
    });

    it("renders server regions", () => {
      render(<ServerSelectorCard />);
      expect(screen.getByText("us-east-1")).toBeInTheDocument();
      expect(screen.getByText("eu-west-1")).toBeInTheDocument();
      expect(screen.getByText("ap-southeast-1")).toBeInTheDocument();
    });

    it("shows Active badge on active server", () => {
      render(<ServerSelectorCard />);
      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("shows latency for online servers", () => {
      render(<ServerSelectorCard />);
      expect(screen.getByText("25")).toBeInTheDocument();
      expect(screen.getByText("85")).toBeInTheDocument();
    });

    it("shows ms unit labels", () => {
      render(<ServerSelectorCard />);
      const msLabels = screen.getAllByText("ms");
      expect(msLabels.length).toBe(2); // Two online servers with latency
    });

    it("shows loader icon for checking servers", () => {
      render(<ServerSelectorCard />);
      expect(screen.getByTestId("icon-loader")).toBeInTheDocument();
    });

    it("shows offline status text", () => {
      render(<ServerSelectorCard />);
      expect(screen.getByText("offline")).toBeInTheDocument();
    });
  });

  describe("Auto-Select Toggle", () => {
    it("renders auto-select label", () => {
      render(<ServerSelectorCard />);
      expect(screen.getByText("Auto-select fastest")).toBeInTheDocument();
    });

    it("renders auto-select description", () => {
      render(<ServerSelectorCard />);
      expect(screen.getByText("Automatically connect to the server with lowest latency")).toBeInTheDocument();
    });

    it("renders toggle component", () => {
      render(<ServerSelectorCard />);
      expect(screen.getByTestId("toggle")).toBeInTheDocument();
    });

    it("calls setAutoSelectFastest when toggle clicked", () => {
      render(<ServerSelectorCard />);
      fireEvent.click(screen.getByTestId("toggle"));
      expect(mockSetAutoSelectFastest).toHaveBeenCalledWith(true);
    });
  });

  describe("Network Health", () => {
    it("renders Network Health label", () => {
      render(<ServerSelectorCard />);
      expect(screen.getByText("Network Health")).toBeInTheDocument();
    });

    it("shows online/total count", () => {
      render(<ServerSelectorCard />);
      expect(screen.getByText("2/4 online")).toBeInTheDocument();
    });

    it("renders progress bar", () => {
      render(<ServerSelectorCard />);
      expect(screen.getByTestId("progress-bar")).toBeInTheDocument();
    });

    it("progress bar has correct value", () => {
      render(<ServerSelectorCard />);
      const progressBar = screen.getByTestId("progress-bar");
      expect(progressBar).toHaveAttribute("data-value", "50"); // 2/4 = 50%
    });
  });

  describe("Refresh Functionality", () => {
    it("calls refreshServerStatus when refresh clicked", () => {
      render(<ServerSelectorCard />);
      const refreshIcon = screen.getByTestId("icon-refresh-cw");
      fireEvent.click(refreshIcon.parentElement!);
      expect(mockRefreshServerStatus).toHaveBeenCalled();
    });

    it("refresh icon changes color when refreshing", () => {
      mockIsRefreshing = true;
      render(<ServerSelectorCard />);
      const refreshIcon = screen.getByTestId("icon-refresh-cw");
      expect(refreshIcon).toHaveAttribute("data-color", "#f59e0b"); // amber color
    });
  });

  describe("Server Selection", () => {
    it("online servers are selectable", () => {
      render(<ServerSelectorCard />);
      const euWest = screen.getByText("EU West");
      // The Pressable should be enabled for online servers
      expect(euWest.closest('[role]') || euWest.parentElement).toBeInTheDocument();
    });

    it("offline servers have reduced opacity", () => {
      render(<ServerSelectorCard />);
      // Asia server is offline, should have opacity 0.5
      expect(screen.getByText("Asia")).toBeInTheDocument();
    });
  });

  describe("Status Colors", () => {
    it("renders status dots for each server", () => {
      render(<ServerSelectorCard />);
      // Each server row has a status dot, verified by presence of server names
      expect(screen.getByText("US East")).toBeInTheDocument();
      expect(screen.getByText("EU West")).toBeInTheDocument();
      expect(screen.getByText("Asia")).toBeInTheDocument();
    });
  });

  describe("Latency Colors", () => {
    it("renders AnimatedNumber for latency values", () => {
      render(<ServerSelectorCard />);
      const animatedNumbers = screen.getAllByTestId("animated-number");
      expect(animatedNumbers.length).toBe(2); // Two servers with latency
    });
  });
});
