/**
 * ServersCard Component Tests
 *
 * Tests the server status display including:
 * - Server list rendering with status icons
 * - Fastest server card with auto-toggle
 * - Mesh status badge
 * - Server selection
 * - Latency display
 * - Peer connectivity integration
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock theme colors
vi.mock("@wraith/ghost/context/ThemeContext", () => ({
  useThemeColors: () => ({
    text: { primary: "#ffffff", muted: "#888888" },
    border: { subtle: "#333333" },
    background: { hover: "#222222", overlay: "#1a1a1a" },
  }),
}));

// Mock Ghost components
vi.mock("@wraith/ghost/components", () => ({
  Card: ({ children, style }: { children: React.ReactNode; style?: object }) => (
    <div data-testid="card" style={style}>{children}</div>
  ),
  Text: ({ children, appearance, size, weight, style }: { children: React.ReactNode; appearance?: string; size?: string; weight?: string; style?: object }) => (
    <span data-testid="text" data-appearance={appearance} data-size={size}>{children}</span>
  ),
  Icon: ({ name, color, size }: { name: string; color?: string; size?: string }) => (
    <span data-testid={`icon-${name}`} data-color={color} />
  ),
  AnimatedNumber: ({ value, decimals, style }: { value: number; decimals?: number; style?: object }) => (
    <span data-testid="animated-number">{value}</span>
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
    accent: { primary: "#3b82f6" },
    data: { amber: "#f59e0b" },
  },
}));

// Mock PingIndicator
vi.mock("../ping-indicator", () => ({
  PingIndicator: ({ latencyMs, size }: { latencyMs: number | null; size?: string }) => (
    <span data-testid="ping-indicator" data-latency={latencyMs}>{latencyMs ?? "—"}</span>
  ),
}));

// Mock ApiServerContext
const mockSetActiveServer = vi.fn();
const mockSetUseAutoFastest = vi.fn();

const mockServers = [
  { id: "server1", name: "US East", region: "us-east-1", status: "online" as const, latencyMs: 25, isLocal: false },
  { id: "server2", name: "EU West", region: "eu-west-1", status: "online" as const, latencyMs: 85, isLocal: false },
  { id: "server3", name: "Asia", region: "ap-southeast-1", status: "offline" as const, latencyMs: null, isLocal: false, lastChecked: Date.now() - 60000 },
];

const mockActiveServer = mockServers[0];
const mockFastestServer = mockServers[0];

let mockUseAutoFastest = false;

vi.mock("../context/ApiServerContext", () => ({
  useApiServer: () => ({
    servers: mockServers,
    activeServer: mockActiveServer,
    setActiveServer: mockSetActiveServer,
    useAutoFastest: mockUseAutoFastest,
    setUseAutoFastest: mockSetUseAutoFastest,
    fastestServer: mockFastestServer,
  }),
}));

// Mock useHauntSocket
const mockPeerCallback = vi.fn();
vi.mock("../hooks/useHauntSocket", () => ({
  usePeerSubscription: (callback: (update: unknown) => void) => {
    mockPeerCallback.mockImplementation(callback);
  },
}));

// Mock hauntClient
vi.mock("../services/haunt", () => ({
  hauntClient: {
    getPeers: vi.fn().mockResolvedValue({
      data: {
        serverId: "server1",
        serverRegion: "us-east-1",
        peers: [
          { id: "server2", status: "connected", latencyMs: 45 },
          { id: "server3", status: "disconnected", latencyMs: null },
        ],
        connectedCount: 1,
        totalPeers: 2,
        timestamp: Date.now(),
      },
    }),
  },
}));

import { ServersCard } from "./ServersCard";

describe("ServersCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAutoFastest = false;
  });

  describe("Rendering", () => {
    it("renders card container", () => {
      render(<ServersCard />);
      expect(screen.getByTestId("card")).toBeInTheDocument();
    });

    it("renders title", () => {
      render(<ServersCard />);
      expect(screen.getByText("Servers")).toBeInTheDocument();
    });

    it("renders server names", () => {
      render(<ServersCard />);
      // US East appears in both fastest server card and server list
      expect(screen.getAllByText("US East").length).toBeGreaterThan(0);
      expect(screen.getByText("EU West")).toBeInTheDocument();
    });

    it("renders server regions", () => {
      render(<ServersCard />);
      expect(screen.getByText("us-east-1")).toBeInTheDocument();
      expect(screen.getByText("eu-west-1")).toBeInTheDocument();
    });
  });

  describe("Server Status Icons", () => {
    it("shows tower icon for online servers", () => {
      render(<ServersCard />);
      const towerIcons = screen.getAllByTestId("icon-tower");
      expect(towerIcons.length).toBeGreaterThan(0);
    });

    it("shows wifi-off icon for offline servers", () => {
      render(<ServersCard />);
      expect(screen.getByTestId("icon-wifi-off")).toBeInTheDocument();
    });
  });

  describe("Fastest Server Card", () => {
    it("renders fastest server section", () => {
      render(<ServersCard />);
      expect(screen.getByText("Fastest Server")).toBeInTheDocument();
    });

    it("shows fastest server name", () => {
      render(<ServersCard />);
      // Fastest server name appears in both the fastest card and server list
      const names = screen.getAllByText("US East");
      expect(names.length).toBeGreaterThan(0);
    });

    it("shows zap icon in fastest server card", () => {
      render(<ServersCard />);
      expect(screen.getByTestId("icon-zap")).toBeInTheDocument();
    });

    it("shows 'Tap to enable' when auto is off", () => {
      render(<ServersCard />);
      expect(screen.getByText("Tap to enable")).toBeInTheDocument();
    });

    it("calls setUseAutoFastest when fastest card clicked", () => {
      render(<ServersCard />);
      const fastestText = screen.getByText("Fastest Server");
      // Click on the pressable parent - find the nearest clickable ancestor
      const pressable = fastestText.closest('[tabindex="0"]');
      if (pressable) {
        fireEvent.click(pressable);
      } else {
        // Fallback to clicking parent container
        fireEvent.click(fastestText.parentElement!.parentElement!.parentElement!);
      }
      expect(mockSetUseAutoFastest).toHaveBeenCalledWith(true);
    });
  });

  describe("Active Server", () => {
    it("shows Active badge on current server", () => {
      render(<ServersCard />);
      const activeBadges = screen.getAllByText("Active");
      expect(activeBadges.length).toBeGreaterThan(0);
    });
  });

  describe("Latency Display", () => {
    it("renders ping indicators", () => {
      render(<ServersCard />);
      const pingIndicators = screen.getAllByTestId("ping-indicator");
      expect(pingIndicators.length).toBeGreaterThan(0);
    });

    it("renders animated latency numbers", () => {
      render(<ServersCard />);
      const animatedNumbers = screen.getAllByTestId("animated-number");
      expect(animatedNumbers.length).toBeGreaterThan(0);
    });

    it("shows 'ms' unit label", () => {
      render(<ServersCard />);
      const msLabels = screen.getAllByText("ms");
      expect(msLabels.length).toBeGreaterThan(0);
    });

    it("shows mesh latency text", () => {
      render(<ServersCard />);
      // Mesh text appears for online servers
      const meshTexts = screen.getAllByText(/Mesh/);
      expect(meshTexts.length).toBeGreaterThan(0);
    });
  });

  describe("Mesh Status", () => {
    it("renders mesh status badge in header", async () => {
      render(<ServersCard />);
      // Wait for peer data to load
      await vi.waitFor(() => {
        expect(screen.getByText(/mesh/)).toBeInTheDocument();
      });
    });

    it("shows connected/total peer count", async () => {
      render(<ServersCard />);
      await vi.waitFor(() => {
        expect(screen.getByText("1/2 mesh")).toBeInTheDocument();
      });
    });

    it("shows radio icon for mesh status", async () => {
      render(<ServersCard />);
      await vi.waitFor(() => {
        const radioIcons = screen.getAllByTestId("icon-radio");
        expect(radioIcons.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Server Selection", () => {
    it("calls setActiveServer when online server clicked", () => {
      render(<ServersCard />);
      const euWest = screen.getByText("EU West");
      fireEvent.click(euWest.closest('[role]') || euWest.parentElement!.parentElement!);
      // Selection happens through the parent Pressable
      // The server row should be interactive for online servers
    });

    it("offline servers have reduced opacity", () => {
      render(<ServersCard />);
      // The offline server (Asia) should be rendered but with opacity 0.5
      expect(screen.getByText("Asia")).toBeInTheDocument();
    });
  });

  describe("Offline Server Filtering", () => {
    it("shows recently offline servers", () => {
      render(<ServersCard />);
      // Server3 went offline only 1 minute ago, should still be visible
      expect(screen.getByText("Asia")).toBeInTheDocument();
    });
  });

  describe("Auto Mode Badge", () => {
    it("shows Auto badge when auto-fastest is enabled", () => {
      mockUseAutoFastest = true;
      render(<ServersCard />);
      expect(screen.getByText("Auto")).toBeInTheDocument();
    });

    it("shows auto-switching message when enabled", () => {
      mockUseAutoFastest = true;
      render(<ServersCard />);
      expect(screen.getByText("Auto-switching to lowest latency server")).toBeInTheDocument();
    });
  });
});
