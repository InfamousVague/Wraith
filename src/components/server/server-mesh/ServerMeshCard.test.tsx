/**
 * ServerMeshCard Component Tests
 *
 * Tests the server mesh settings card including:
 * - Header and title
 * - Server info display
 * - Peer list with detailed metrics
 * - Current and average latency
 * - Uptime percentage
 * - Ping count
 * - Health calculation
 * - Error state
 * - Empty state
 * - Loading state
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock theme colors
vi.mock("@wraith/ghost/context/ThemeContext", () => ({
  useThemeColors: () => ({
    text: { primary: "#ffffff", muted: "#888888" },
    border: { subtle: "#333333" },
  }),
}));

// Mock Ghost components
vi.mock("@wraith/ghost/components", () => ({
  Card: ({ children, style, loading }: any) => (
    <div data-testid="card" data-loading={loading}>{children}</div>
  ),
  Text: ({ children, size, weight, style, appearance }: any) => (
    <span data-testid="text" data-appearance={appearance} data-weight={weight} style={style}>{children}</span>
  ),
  Icon: ({ name, size, color }: any) => (
    <span data-testid={`icon-${name}`} data-color={color} />
  ),
  AnimatedNumber: ({ value, decimals, size, weight, style, animate }: any) => (
    <span data-testid="animated-number" data-value={value} style={style}>{value}</span>
  ),
  ProgressBar: ({ value, max, color, size, brightness }: any) => (
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
    text: { muted: "#888888" },
    data: { amber: "#f59e0b" },
  },
}));

// Mock enums
vi.mock("@wraith/ghost/enums", () => ({
  Size: {
    TwoXSmall: "2xs",
    ExtraSmall: "xs",
    Small: "sm",
    Medium: "md",
    Large: "lg",
    ExtraLarge: "xl",
  },
  TextAppearance: { Muted: "muted" },
  Brightness: { Soft: "soft" },
}));

// Mock haunt client
const mockGetPeers = vi.fn();
vi.mock("../services/haunt", () => ({
  hauntClient: {
    getPeers: () => mockGetPeers(),
  },
}));

// Mock usePeerSubscription
const mockPeerSubscriptionCallback = vi.fn();
vi.mock("../hooks/useHauntSocket", () => ({
  usePeerSubscription: (callback: any) => {
    mockPeerSubscriptionCallback.mockImplementation(callback);
  },
}));

import { ServerMeshCard } from "./ServerMeshCard";

describe("ServerMeshCard", () => {
  const mockPeers = [
    {
      id: "peer-1-abcdef123456",
      region: "US East",
      status: "connected",
      latencyMs: 45,
      avgLatencyMs: 52,
      uptimePercent: 99.5,
      pingCount: 1250,
    },
    {
      id: "peer-2-ghijkl789012",
      region: "EU West",
      status: "connected",
      latencyMs: 120,
      avgLatencyMs: 135,
      uptimePercent: 98.2,
      pingCount: 1180,
    },
    {
      id: "peer-3-mnopqr345678",
      region: "Asia Pacific",
      status: "failed",
      latencyMs: undefined,
      avgLatencyMs: undefined,
      uptimePercent: 85.0,
      pingCount: 450,
    },
  ];

  const mockPeerResponse = {
    data: {
      serverId: "server-main-abcdef1234567890",
      serverRegion: "US Central",
      peers: mockPeers,
      connectedCount: 2,
      totalPeers: 3,
      timestamp: Date.now(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPeers.mockResolvedValue(mockPeerResponse);
  });

  describe("Header", () => {
    it("renders card container", async () => {
      render(<ServerMeshCard />);
      expect(screen.getByTestId("card")).toBeInTheDocument();
    });

    it("renders Server Mesh title", async () => {
      render(<ServerMeshCard />);
      await waitFor(() => {
        expect(screen.getByText("Server Mesh")).toBeInTheDocument();
      });
    });

    it("renders globe icon", async () => {
      render(<ServerMeshCard />);
      await waitFor(() => {
        expect(screen.getByTestId("icon-globe")).toBeInTheDocument();
      });
    });

    it("shows connected count badge", async () => {
      render(<ServerMeshCard />);
      await waitFor(() => {
        expect(screen.getByText("2/3 connected")).toBeInTheDocument();
      });
    });
  });

  describe("Server Info Section", () => {
    it("shows Connected To label", async () => {
      render(<ServerMeshCard />);
      await waitFor(() => {
        expect(screen.getByText("Connected To")).toBeInTheDocument();
      });
    });

    it("shows server region", async () => {
      render(<ServerMeshCard />);
      await waitFor(() => {
        expect(screen.getByText("US Central")).toBeInTheDocument();
      });
    });

    it("shows Server ID label", async () => {
      render(<ServerMeshCard />);
      await waitFor(() => {
        expect(screen.getByText("Server ID")).toBeInTheDocument();
      });
    });

    it("shows truncated server ID", async () => {
      render(<ServerMeshCard />);
      await waitFor(() => {
        expect(screen.getByText("server-main-abcd...")).toBeInTheDocument();
      });
    });

    it("shows Avg Mesh Latency label", async () => {
      render(<ServerMeshCard />);
      await waitFor(() => {
        expect(screen.getByText("Avg Mesh Latency")).toBeInTheDocument();
      });
    });

    it("shows average mesh latency value", async () => {
      render(<ServerMeshCard />);
      await waitFor(() => {
        // Average of 45 and 120 = 82.5, rounded to 83
        const animatedNumbers = screen.getAllByTestId("animated-number");
        expect(animatedNumbers.some(el => el.getAttribute("data-value") === "83")).toBe(true);
      });
    });
  });

  describe("Peer List", () => {
    it("shows Connected Peers section label", async () => {
      render(<ServerMeshCard />);
      await waitFor(() => {
        expect(screen.getByText("Connected Peers")).toBeInTheDocument();
      });
    });

    it("renders all peer regions", async () => {
      render(<ServerMeshCard />);
      await waitFor(() => {
        expect(screen.getByText("US East")).toBeInTheDocument();
        expect(screen.getByText("EU West")).toBeInTheDocument();
        expect(screen.getByText("Asia Pacific")).toBeInTheDocument();
      });
    });

    it("shows truncated peer IDs (12 chars)", async () => {
      render(<ServerMeshCard />);
      await waitFor(() => {
        expect(screen.getByText("peer-1-abcde...")).toBeInTheDocument();
      });
    });
  });

  describe("Peer Status Icons", () => {
    it("shows check-circle for connected peers", async () => {
      render(<ServerMeshCard />);
      await waitFor(() => {
        const checkIcons = screen.getAllByTestId("icon-check-circle");
        expect(checkIcons.length).toBe(2); // 2 connected peers
      });
    });

    it("shows x-circle for failed peers", async () => {
      render(<ServerMeshCard />);
      await waitFor(() => {
        expect(screen.getByTestId("icon-x-circle")).toBeInTheDocument();
      });
    });
  });

  describe("Peer Metrics - Current Latency", () => {
    it("shows Current label for connected peers", async () => {
      render(<ServerMeshCard />);
      await waitFor(() => {
        const currentLabels = screen.getAllByText("Current");
        expect(currentLabels.length).toBe(2); // 2 connected peers
      });
    });

    it("shows current latency values", async () => {
      render(<ServerMeshCard />);
      await waitFor(() => {
        const animatedNumbers = screen.getAllByTestId("animated-number");
        const values = animatedNumbers.map(el => el.getAttribute("data-value"));
        expect(values).toContain("45");
        expect(values).toContain("120");
      });
    });
  });

  describe("Peer Metrics - Average Latency", () => {
    it("shows Avg label for connected peers", async () => {
      render(<ServerMeshCard />);
      await waitFor(() => {
        const avgLabels = screen.getAllByText("Avg");
        expect(avgLabels.length).toBe(2); // 2 connected peers
      });
    });

    it("shows average latency values", async () => {
      render(<ServerMeshCard />);
      await waitFor(() => {
        const animatedNumbers = screen.getAllByTestId("animated-number");
        const values = animatedNumbers.map(el => el.getAttribute("data-value"));
        expect(values).toContain("52");
        expect(values).toContain("135");
      });
    });
  });

  describe("Peer Metrics - Uptime", () => {
    it("shows Uptime label for all peers", async () => {
      render(<ServerMeshCard />);
      await waitFor(() => {
        const uptimeLabels = screen.getAllByText("Uptime");
        expect(uptimeLabels.length).toBe(3); // All 3 peers
      });
    });

    it("shows uptime percentages", async () => {
      render(<ServerMeshCard />);
      await waitFor(() => {
        expect(screen.getByText("99.5%")).toBeInTheDocument();
        expect(screen.getByText("98.2%")).toBeInTheDocument();
        expect(screen.getByText("85.0%")).toBeInTheDocument();
      });
    });
  });

  describe("Peer Metrics - Ping Count", () => {
    it("shows Pings label for all peers", async () => {
      render(<ServerMeshCard />);
      await waitFor(() => {
        const pingsLabels = screen.getAllByText("Pings");
        expect(pingsLabels.length).toBe(3); // All 3 peers
      });
    });

    it("shows ping counts", async () => {
      render(<ServerMeshCard />);
      await waitFor(() => {
        expect(screen.getByText("1250")).toBeInTheDocument();
        expect(screen.getByText("1180")).toBeInTheDocument();
        expect(screen.getByText("450")).toBeInTheDocument();
      });
    });
  });

  describe("Health Section", () => {
    it("shows Mesh Health label", async () => {
      render(<ServerMeshCard />);
      await waitFor(() => {
        expect(screen.getByText("Mesh Health")).toBeInTheDocument();
      });
    });

    it("shows health percentage", async () => {
      render(<ServerMeshCard />);
      await waitFor(() => {
        // 2/3 = 67%
        expect(screen.getByText("67%")).toBeInTheDocument();
      });
    });

    it("renders progress bar with correct values", async () => {
      render(<ServerMeshCard />);
      await waitFor(() => {
        const progressBar = screen.getByTestId("progress-bar");
        expect(progressBar).toHaveAttribute("data-value", "67");
        expect(progressBar).toHaveAttribute("data-max", "100");
      });
    });
  });

  describe("Error State", () => {
    it("shows error message when API fails", async () => {
      mockGetPeers.mockRejectedValue(new Error("Connection failed"));
      render(<ServerMeshCard />);
      await waitFor(() => {
        expect(screen.getByText("Peer mesh unavailable")).toBeInTheDocument();
      });
    });

    it("shows wifi-off icon on error", async () => {
      mockGetPeers.mockRejectedValue(new Error("Connection failed"));
      render(<ServerMeshCard />);
      await waitFor(() => {
        expect(screen.getByTestId("icon-wifi-off")).toBeInTheDocument();
      });
    });
  });

  describe("Empty State", () => {
    it("shows empty message when no peers", async () => {
      mockGetPeers.mockResolvedValue({
        data: { ...mockPeerResponse.data, peers: [], connectedCount: 0, totalPeers: 0 },
      });
      render(<ServerMeshCard />);
      await waitFor(() => {
        expect(screen.getByText("No peer servers configured")).toBeInTheDocument();
      });
    });

    it("shows server icon in empty state", async () => {
      mockGetPeers.mockResolvedValue({
        data: { ...mockPeerResponse.data, peers: [], connectedCount: 0, totalPeers: 0 },
      });
      render(<ServerMeshCard />);
      await waitFor(() => {
        expect(screen.getByTestId("icon-server")).toBeInTheDocument();
      });
    });
  });

  describe("Loading State", () => {
    it("shows loading while fetching data", () => {
      mockGetPeers.mockImplementation(() => new Promise(() => {}));
      render(<ServerMeshCard />);
      expect(screen.getByTestId("card")).toHaveAttribute("data-loading", "true");
    });

    it("removes loading after data loads", async () => {
      render(<ServerMeshCard />);
      await waitFor(() => {
        expect(screen.getByTestId("card")).toHaveAttribute("data-loading", "false");
      });
    });
  });

  describe("Real-time Updates", () => {
    it("updates data when subscription fires", async () => {
      render(<ServerMeshCard />);

      await waitFor(() => {
        expect(mockGetPeers).toHaveBeenCalled();
      });

      // Simulate real-time update
      const newUpdate = {
        serverId: "new-server-id",
        serverRegion: "Asia Pacific",
        peers: [
          {
            id: "peer-new-1",
            region: "Tokyo",
            status: "connected",
            latencyMs: 25,
            avgLatencyMs: 30,
            uptimePercent: 99.9,
            pingCount: 2000,
          },
        ],
        timestamp: Date.now(),
      };

      mockPeerSubscriptionCallback(newUpdate);

      await waitFor(() => {
        expect(screen.getByText("Asia Pacific")).toBeInTheDocument();
        expect(screen.getByText("Tokyo")).toBeInTheDocument();
      });
    });
  });

  describe("Latency Color Coding", () => {
    it("uses success color for low latency (<50ms)", async () => {
      render(<ServerMeshCard />);
      await waitFor(() => {
        const animatedNumbers = screen.getAllByTestId("animated-number");
        const lowLatencyEl = animatedNumbers.find(el => el.getAttribute("data-value") === "45");
        expect(lowLatencyEl).toHaveStyle({ color: "#2fd575" });
      });
    });

    it("uses amber color for medium latency (50-150ms)", async () => {
      render(<ServerMeshCard />);
      await waitFor(() => {
        const animatedNumbers = screen.getAllByTestId("animated-number");
        const mediumLatencyEl = animatedNumbers.find(el => el.getAttribute("data-value") === "120");
        expect(mediumLatencyEl).toHaveStyle({ color: "#f59e0b" });
      });
    });
  });

  describe("Uptime Color Coding", () => {
    it("uses success color for high uptime (>=99%)", async () => {
      render(<ServerMeshCard />);
      await waitFor(() => {
        expect(screen.getByText("99.5%")).toHaveStyle({ color: "#2fd575" });
      });
    });

    it("uses warning color for medium uptime (95-99%)", async () => {
      render(<ServerMeshCard />);
      await waitFor(() => {
        expect(screen.getByText("98.2%")).toHaveStyle({ color: "#ffc107" });
      });
    });

    it("uses danger color for low uptime (<95%)", async () => {
      render(<ServerMeshCard />);
      await waitFor(() => {
        expect(screen.getByText("85.0%")).toHaveStyle({ color: "#ff5c7a" });
      });
    });
  });
});
