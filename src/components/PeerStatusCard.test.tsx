/**
 * PeerStatusCard Component Tests
 *
 * Tests the peer status carousel card including:
 * - Peer list rendering
 * - Status icons and colors
 * - Latency display with color coding
 * - Health calculation and progress bar
 * - Error state
 * - Empty state
 * - Loading state
 * - Real-time updates
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
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
  Card: ({ children, style, loading }: any) => (
    <div data-testid="card" data-loading={loading}>{children}</div>
  ),
  Text: ({ children, size, weight, style, appearance }: any) => (
    <span data-testid="text" data-appearance={appearance} style={style}>{children}</span>
  ),
  Icon: ({ name, size, color }: any) => (
    <span data-testid={`icon-${name}`} data-color={color} />
  ),
  AnimatedNumber: ({ value, decimals, size, weight, style }: any) => (
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

import { PeerStatusCard } from "./PeerStatusCard";

describe("PeerStatusCard", () => {
  const mockPeers = [
    { id: "peer-1-abcdef", region: "US East", status: "connected", latencyMs: 45 },
    { id: "peer-2-ghijkl", region: "EU West", status: "connected", latencyMs: 120 },
    { id: "peer-3-mnopqr", region: "Asia", status: "connecting", latencyMs: undefined },
    { id: "peer-4-stuvwx", region: "South America", status: "disconnected", latencyMs: undefined },
  ];

  const mockPeerResponse = {
    data: {
      serverId: "server-123",
      serverRegion: "US Central",
      peers: mockPeers,
      connectedCount: 2,
      totalPeers: 4,
      timestamp: Date.now(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPeers.mockResolvedValue(mockPeerResponse);
  });

  describe("Rendering", () => {
    it("renders card container", async () => {
      render(<PeerStatusCard />);
      expect(screen.getByTestId("card")).toBeInTheDocument();
    });

    it("renders Server Mesh title", async () => {
      render(<PeerStatusCard />);
      await waitFor(() => {
        expect(screen.getByText("Server Mesh")).toBeInTheDocument();
      });
    });

    it("renders globe icon", async () => {
      render(<PeerStatusCard />);
      await waitFor(() => {
        expect(screen.getByTestId("icon-globe")).toBeInTheDocument();
      });
    });

    it("fetches peers on mount", async () => {
      render(<PeerStatusCard />);
      await waitFor(() => {
        expect(mockGetPeers).toHaveBeenCalled();
      });
    });
  });

  describe("Server Info", () => {
    it("shows This Server label", async () => {
      render(<PeerStatusCard />);
      await waitFor(() => {
        expect(screen.getByText("This Server")).toBeInTheDocument();
      });
    });

    it("shows server region", async () => {
      render(<PeerStatusCard />);
      await waitFor(() => {
        expect(screen.getByText("US Central")).toBeInTheDocument();
      });
    });
  });

  describe("Peer List", () => {
    it("renders all peer regions", async () => {
      render(<PeerStatusCard />);
      await waitFor(() => {
        expect(screen.getByText("US East")).toBeInTheDocument();
        expect(screen.getByText("EU West")).toBeInTheDocument();
        expect(screen.getByText("Asia")).toBeInTheDocument();
        expect(screen.getByText("South America")).toBeInTheDocument();
      });
    });

    it("shows truncated peer IDs", async () => {
      render(<PeerStatusCard />);
      await waitFor(() => {
        expect(screen.getByText("peer-1-a...")).toBeInTheDocument();
      });
    });
  });

  describe("Status Icons", () => {
    it("shows check-circle for connected peers", async () => {
      render(<PeerStatusCard />);
      await waitFor(() => {
        const checkIcons = screen.getAllByTestId("icon-check-circle");
        expect(checkIcons.length).toBeGreaterThan(0);
      });
    });

    it("shows loader for connecting peers", async () => {
      render(<PeerStatusCard />);
      await waitFor(() => {
        expect(screen.getByTestId("icon-loader")).toBeInTheDocument();
      });
    });

    it("shows circle for disconnected peers", async () => {
      render(<PeerStatusCard />);
      await waitFor(() => {
        expect(screen.getByTestId("icon-circle")).toBeInTheDocument();
      });
    });
  });

  describe("Latency Display", () => {
    it("shows latency for connected peers", async () => {
      render(<PeerStatusCard />);
      await waitFor(() => {
        const animatedNumbers = screen.getAllByTestId("animated-number");
        const latencyValues = animatedNumbers.map(el => el.getAttribute("data-value"));
        expect(latencyValues).toContain("45");
        expect(latencyValues).toContain("120");
      });
    });

    it("shows ... for connecting peers", async () => {
      render(<PeerStatusCard />);
      await waitFor(() => {
        expect(screen.getByText("...")).toBeInTheDocument();
      });
    });

    it("shows status text for disconnected peers", async () => {
      render(<PeerStatusCard />);
      await waitFor(() => {
        expect(screen.getByText("disconnected")).toBeInTheDocument();
      });
    });

    it("shows ms unit for latency", async () => {
      render(<PeerStatusCard />);
      await waitFor(() => {
        expect(screen.getAllByText("ms").length).toBeGreaterThan(0);
      });
    });
  });

  describe("Connected Count Badge", () => {
    it("shows connected/total count", async () => {
      render(<PeerStatusCard />);
      await waitFor(() => {
        expect(screen.getByText("2/4")).toBeInTheDocument();
      });
    });
  });

  describe("Average Latency", () => {
    it("shows Avg Latency label", async () => {
      render(<PeerStatusCard />);
      await waitFor(() => {
        expect(screen.getByText("Avg Latency")).toBeInTheDocument();
      });
    });

    it("calculates and displays average latency", async () => {
      render(<PeerStatusCard />);
      await waitFor(() => {
        // Average of 45 and 120 = 82.5, rounded to 83
        const animatedNumbers = screen.getAllByTestId("animated-number");
        expect(animatedNumbers.some(el => el.getAttribute("data-value") === "83")).toBe(true);
      });
    });
  });

  describe("Health Section", () => {
    it("shows Mesh Health label", async () => {
      render(<PeerStatusCard />);
      await waitFor(() => {
        expect(screen.getByText("Mesh Health")).toBeInTheDocument();
      });
    });

    it("shows health percentage", async () => {
      render(<PeerStatusCard />);
      await waitFor(() => {
        // 2/4 = 50%
        expect(screen.getByText("50%")).toBeInTheDocument();
      });
    });

    it("renders progress bar", async () => {
      render(<PeerStatusCard />);
      await waitFor(() => {
        expect(screen.getByTestId("progress-bar")).toBeInTheDocument();
      });
    });

    it("passes correct value to progress bar", async () => {
      render(<PeerStatusCard />);
      await waitFor(() => {
        const progressBar = screen.getByTestId("progress-bar");
        expect(progressBar).toHaveAttribute("data-value", "50");
        expect(progressBar).toHaveAttribute("data-max", "100");
      });
    });
  });

  describe("Error State", () => {
    it("shows error message when API fails", async () => {
      mockGetPeers.mockRejectedValue(new Error("Network error"));
      render(<PeerStatusCard />);
      await waitFor(() => {
        expect(screen.getByText("Peer mesh unavailable")).toBeInTheDocument();
      });
    });

    it("shows wifi-off icon on error", async () => {
      mockGetPeers.mockRejectedValue(new Error("Network error"));
      render(<PeerStatusCard />);
      await waitFor(() => {
        expect(screen.getByTestId("icon-wifi-off")).toBeInTheDocument();
      });
    });
  });

  describe("Empty State", () => {
    it("shows empty message when no peers configured", async () => {
      mockGetPeers.mockResolvedValue({
        data: { ...mockPeerResponse.data, peers: [], connectedCount: 0, totalPeers: 0 },
      });
      render(<PeerStatusCard />);
      await waitFor(() => {
        expect(screen.getByText("No peer servers configured")).toBeInTheDocument();
      });
    });

    it("shows server icon in empty state", async () => {
      mockGetPeers.mockResolvedValue({
        data: { ...mockPeerResponse.data, peers: [], connectedCount: 0, totalPeers: 0 },
      });
      render(<PeerStatusCard />);
      await waitFor(() => {
        expect(screen.getByTestId("icon-server")).toBeInTheDocument();
      });
    });
  });

  describe("Loading State", () => {
    it("passes loading prop to card", () => {
      render(<PeerStatusCard loading={true} />);
      expect(screen.getByTestId("card")).toHaveAttribute("data-loading", "true");
    });

    it("shows loading when fetching data", () => {
      // Keep the promise pending
      mockGetPeers.mockImplementation(() => new Promise(() => {}));
      render(<PeerStatusCard />);
      expect(screen.getByTestId("card")).toHaveAttribute("data-loading", "true");
    });
  });

  describe("Real-time Updates", () => {
    it("updates peer data when subscription fires", async () => {
      render(<PeerStatusCard />);

      await waitFor(() => {
        expect(mockGetPeers).toHaveBeenCalled();
      });

      // Simulate real-time update
      const newUpdate = {
        serverId: "server-456",
        serverRegion: "EU Central",
        peers: [
          { id: "peer-new-1", region: "Germany", status: "connected", latencyMs: 30 },
        ],
        timestamp: Date.now(),
      };

      // Trigger the subscription callback
      mockPeerSubscriptionCallback(newUpdate);

      await waitFor(() => {
        expect(screen.getByText("EU Central")).toBeInTheDocument();
        expect(screen.getByText("Germany")).toBeInTheDocument();
      });
    });
  });
});
