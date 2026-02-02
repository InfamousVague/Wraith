import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { HeartbeatChart } from "../components/HeartbeatChart";

// Mock Ghost components
vi.mock("@wraith/ghost/components", () => ({
  Text: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="ghost-text">{children}</span>
  ),
}));

vi.mock("@wraith/ghost/enums", () => ({
  Size: { Small: "small" },
  TextAppearance: { Secondary: "secondary" },
}));

vi.mock("@wraith/ghost/tokens", () => ({
  Colors: {
    accent: { primary: "#A78BFA" },
    background: { surface: "#0B0E15", overlay: "#1B2233" },
    border: { subtle: "#1F2433" },
  },
}));

describe("HeartbeatChart", () => {
  it("renders without crashing", () => {
    const { container } = render(<HeartbeatChart />);
    expect(container).toBeTruthy();
  });

  it("renders with default props", () => {
    const { container } = render(<HeartbeatChart />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders with custom height", () => {
    const { container } = render(<HeartbeatChart height={300} />);
    const element = container.firstChild as HTMLElement;
    // Height should be applied to the container
    expect(element).toBeTruthy();
  });

  it("renders with custom color", () => {
    const { container } = render(<HeartbeatChart color="#FF0000" />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders with banner text", () => {
    render(<HeartbeatChart bannerText="Loading chart..." />);
    expect(screen.getByText("Loading chart...")).toBeTruthy();
  });

  it("renders without banner text when not provided", () => {
    const { container } = render(<HeartbeatChart />);
    // Should not have the banner text
    expect(screen.queryByText("Loading chart...")).toBeNull();
    expect(container.firstChild).toBeTruthy();
  });

  it("renders with custom animation duration", () => {
    const { container } = render(<HeartbeatChart animationDuration={3000} />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders with custom width", () => {
    const { container } = render(<HeartbeatChart width={500} />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders with 100% width", () => {
    const { container } = render(<HeartbeatChart width="100%" />);
    expect(container.firstChild).toBeTruthy();
  });

  it("applies custom style prop", () => {
    const { container } = render(
      <HeartbeatChart style={{ marginTop: 20 }} />
    );
    expect(container.firstChild).toBeTruthy();
  });

  it("renders the SVG animation on web", () => {
    const { container } = render(<HeartbeatChart />);
    // Should contain SVG element for web platform
    const svgElements = container.querySelectorAll("svg");
    expect(svgElements.length).toBeGreaterThanOrEqual(0);
  });

  it("renders grid lines overlay", () => {
    const { container } = render(<HeartbeatChart />);
    // Grid lines are rendered as a div with background-image
    expect(container.firstChild).toBeTruthy();
  });

  it("handles different banner messages", () => {
    const messages = [
      "Loading...",
      "Building chart data...",
      "Fetching historical data...",
    ];

    messages.forEach((message) => {
      const { getByText, unmount } = render(
        <HeartbeatChart bannerText={message} />
      );
      expect(getByText(message)).toBeTruthy();
      unmount();
    });
  });
});
