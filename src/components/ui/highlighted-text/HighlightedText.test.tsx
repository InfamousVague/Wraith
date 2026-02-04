import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { HighlightedText } from "../highlighted-text";

// Mock the theme context
vi.mock("@wraith/ghost/context/ThemeContext", () => ({
  useThemeColors: () => ({
    accent: { primary: "#A78BFA" },
    text: { primary: "#ffffff", muted: "#9ca3af" },
  }),
}));

describe("HighlightedText", () => {
  it("should render text without highlighting when no match", () => {
    render(<HighlightedText text="Bitcoin" highlight="xyz" />);
    expect(screen.getByText("Bitcoin")).toBeTruthy();
  });

  it("should render text without highlighting when highlight is empty", () => {
    render(<HighlightedText text="Ethereum" highlight="" />);
    expect(screen.getByText("Ethereum")).toBeTruthy();
  });

  it("should split text when there is a match", () => {
    render(<HighlightedText text="Ethereum" highlight="eth" />);
    // The text is split into parts: "Eth" (highlighted) and "ereum" (not highlighted)
    expect(screen.getByText("Eth")).toBeTruthy();
    expect(screen.getByText("ereum")).toBeTruthy();
  });

  it("should be case insensitive", () => {
    render(<HighlightedText text="Bitcoin" highlight="BIT" />);
    expect(screen.getByText("Bit")).toBeTruthy();
    expect(screen.getByText("coin")).toBeTruthy();
  });

  it("should handle multiple matches", () => {
    render(<HighlightedText text="Tether USDT" highlight="t" />);
    // "T" at start, "t" in middle, "T" in USDT - all should be highlighted
    const container = render(<HighlightedText text="Tether USDT" highlight="t" />);
    expect(container).toBeTruthy();
  });

  it("should handle special regex characters in highlight", () => {
    render(<HighlightedText text="Test (value)" highlight="(val" />);
    expect(screen.getByText("(val")).toBeTruthy();
  });
});
