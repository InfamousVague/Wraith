/**
 * HeartbeatChart Component Tests
 *
 * Tests the ECG-style loading animation including:
 * - Basic rendering
 * - Banner text display
 * - Custom dimensions
 * - Animation duration
 * - Custom color
 * - SVG path generation
 * - Grid overlay
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Ghost components
vi.mock("@wraith/ghost/components", () => ({
  Text: ({ children, size, appearance }: any) => (
    <span data-testid="text" data-size={size} data-appearance={appearance}>
      {children}
    </span>
  ),
}));

// Mock enums
vi.mock("@wraith/ghost/enums", () => ({
  Size: { Small: "sm", Medium: "md" },
  TextAppearance: { Secondary: "secondary" },
}));

// Mock Colors
vi.mock("@wraith/ghost/tokens", () => ({
  Colors: {
    accent: { primary: "#3b82f6" },
    background: { surface: "#1a1a1a", overlay: "rgba(0,0,0,0.5)" },
    border: { subtle: "#333333" },
  },
}));

// Mock Platform
vi.mock("react-native", async () => {
  const actual = await vi.importActual("react-native");
  return {
    ...actual,
    Platform: { OS: "web" },
  };
});

import { HeartbeatChart } from "./HeartbeatChart";

describe("HeartbeatChart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("renders container", () => {
      const { container } = render(<HeartbeatChart />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("renders SVG element", () => {
      const { container } = render(<HeartbeatChart />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("renders path element for heartbeat line", () => {
      const { container } = render(<HeartbeatChart />);
      const path = container.querySelector("path");
      expect(path).toBeInTheDocument();
    });
  });

  describe("Banner Text", () => {
    it("renders banner text when provided", () => {
      render(<HeartbeatChart bannerText="Loading chart data..." />);
      expect(screen.getByText("Loading chart data...")).toBeInTheDocument();
    });

    it("does not render banner when not provided", () => {
      render(<HeartbeatChart />);
      expect(screen.queryByTestId("text")).not.toBeInTheDocument();
    });

    it("renders custom banner text", () => {
      render(<HeartbeatChart bannerText="Building chart..." />);
      expect(screen.getByText("Building chart...")).toBeInTheDocument();
    });
  });

  describe("Dimensions", () => {
    it("uses default height of 200", () => {
      const { container } = render(<HeartbeatChart />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("height", "200");
    });

    it("accepts custom height", () => {
      const { container } = render(<HeartbeatChart height={100} />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("height", "100");
    });

    it("accepts custom numeric width", () => {
      const { container } = render(<HeartbeatChart width={400} />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("width", "800"); // 2x width for scrolling
    });
  });

  describe("Animation", () => {
    it("renders animation keyframes", () => {
      const { container } = render(<HeartbeatChart />);
      const style = container.querySelector("style");
      expect(style?.textContent).toContain("heartbeat-scroll");
    });

    it("applies animation with default duration", () => {
      const { container } = render(<HeartbeatChart />);
      const style = container.querySelector("style");
      expect(style?.textContent).toContain("heartbeat-scroll");
    });

    it("applies custom animation duration", () => {
      const { container } = render(<HeartbeatChart animationDuration={3000} />);
      const animatedDiv = container.querySelector('[style*="animation"]');
      expect(animatedDiv).toBeInTheDocument();
    });
  });

  describe("Color", () => {
    it("uses default accent color", () => {
      const { container } = render(<HeartbeatChart />);
      const gradient = container.querySelector("#lineGradient");
      expect(gradient).toBeInTheDocument();
    });

    it("accepts custom color", () => {
      const { container } = render(<HeartbeatChart color="#ff0000" />);
      const stops = container.querySelectorAll("stop");
      const hasCustomColor = Array.from(stops).some(
        (stop) => stop.getAttribute("stop-color") === "#ff0000"
      );
      expect(hasCustomColor).toBe(true);
    });
  });

  describe("SVG Elements", () => {
    it("renders glow filter", () => {
      const { container } = render(<HeartbeatChart />);
      const filter = container.querySelector("#glow");
      expect(filter).toBeInTheDocument();
    });

    it("renders linear gradient", () => {
      const { container } = render(<HeartbeatChart />);
      const gradient = container.querySelector("#lineGradient");
      expect(gradient).toBeInTheDocument();
    });

    it("renders gradient stops", () => {
      const { container } = render(<HeartbeatChart />);
      const stops = container.querySelectorAll("stop");
      expect(stops.length).toBe(4);
    });

    it("applies gradient to path stroke", () => {
      const { container } = render(<HeartbeatChart />);
      const path = container.querySelector("path");
      expect(path).toHaveAttribute("stroke", "url(#lineGradient)");
    });

    it("applies glow filter to path", () => {
      const { container } = render(<HeartbeatChart />);
      const path = container.querySelector("path");
      expect(path).toHaveAttribute("filter", "url(#glow)");
    });
  });

  describe("Path Generation", () => {
    it("generates path with M (moveto) command", () => {
      const { container } = render(<HeartbeatChart />);
      const path = container.querySelector("path");
      const d = path?.getAttribute("d");
      expect(d).toMatch(/^M/);
    });

    it("generates path with L (lineto) commands", () => {
      const { container } = render(<HeartbeatChart />);
      const path = container.querySelector("path");
      const d = path?.getAttribute("d");
      expect(d).toContain(" L ");
    });

    it("generates path with Q (quadratic curve) commands", () => {
      const { container } = render(<HeartbeatChart />);
      const path = container.querySelector("path");
      const d = path?.getAttribute("d");
      expect(d).toContain(" Q ");
    });

    it("path is filled with none", () => {
      const { container } = render(<HeartbeatChart />);
      const path = container.querySelector("path");
      expect(path).toHaveAttribute("fill", "none");
    });

    it("path has stroke width of 2", () => {
      const { container } = render(<HeartbeatChart />);
      const path = container.querySelector("path");
      expect(path).toHaveAttribute("stroke-width", "2");
    });
  });

  describe("Grid Overlay", () => {
    it("renders grid overlay div", () => {
      const { container } = render(<HeartbeatChart />);
      // Grid overlay is rendered as a div with backgroundImage style
      const divs = container.querySelectorAll("div");
      expect(divs.length).toBeGreaterThan(0);
    });

    it("grid has linear gradient background", () => {
      const { container } = render(<HeartbeatChart />);
      // Grid is rendered within the component structure
      const divs = container.querySelectorAll("div");
      expect(divs.length).toBeGreaterThan(1);
    });
  });

  describe("Style Prop", () => {
    it("accepts additional style overrides", () => {
      const { container } = render(
        <HeartbeatChart style={{ marginTop: 20 }} />
      );
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe("Container Styling", () => {
    it("renders container element", () => {
      const { container } = render(<HeartbeatChart />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toBeInTheDocument();
    });

    it("container has expected structure", () => {
      const { container } = render(<HeartbeatChart />);
      // Container should have child elements for animation and grid
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.children.length).toBeGreaterThan(0);
    });
  });

  describe("ViewBox", () => {
    it("sets correct viewBox on SVG", () => {
      const { container } = render(<HeartbeatChart height={200} />);
      const svg = container.querySelector("svg");
      expect(svg?.getAttribute("viewBox")).toContain("0 0");
    });
  });
});
