/**
 * @file AssetHeader.test.tsx
 * @description Tests for the AssetHeader component.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { AssetHeader } from "./AssetHeader";

// Mock theme context
vi.mock("@wraith/ghost/context/ThemeContext", () => ({
  useThemeColors: () => ({
    text: { primary: "#fff", muted: "#888", secondary: "#aaa" },
    background: { raised: "#1a1a1a" },
    border: { subtle: "#333" },
  }),
}));

// Mock breakpoint hook with vi.fn for test control
const mockUseBreakpoint = vi.fn(() => ({
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  isWide: false,
  dimensions: { width: 1024, height: 768 }
}));
vi.mock("../../hooks/useBreakpoint", () => ({
  useBreakpoint: () => mockUseBreakpoint(),
}));

// Mock Ghost components
vi.mock("@wraith/ghost/components", () => ({
  Text: ({ children, size, appearance, weight }: { children: React.ReactNode; size?: string; appearance?: string; weight?: string }) => (
    <span data-testid="text" data-size={size} data-weight={weight} data-appearance={appearance}>{children}</span>
  ),
  Avatar: ({ uri, initials, size }: { uri: string; initials: string; size?: string }) => (
    <div data-testid="avatar" data-uri={uri} data-size={size}>{initials}</div>
  ),
  PercentChange: ({ value, size }: { value: number; size?: string }) => (
    <span data-testid="percent-change" data-value={value}>{value >= 0 ? "+" : ""}{value.toFixed(2)}%</span>
  ),
  Currency: ({ value, size, weight, decimals }: { value: number; size?: string; weight?: string; decimals?: number }) => (
    <span data-testid="currency" data-value={value} data-decimals={decimals}>${value.toLocaleString()}</span>
  ),
  Skeleton: ({ width, height, borderRadius }: { width: number; height: number; borderRadius?: number }) => (
    <div data-testid="skeleton" style={{ width, height, borderRadius }} />
  ),
  Icon: ({ name, size, color }: { name: string; size?: string; color?: string }) => (
    <span data-testid={`icon-${name}`} data-size={size} />
  ),
}));

vi.mock("@wraith/ghost/enums", () => ({
  Size: { Small: "sm", Medium: "md", Large: "lg", ExtraLarge: "xl" },
  TextAppearance: { Muted: "muted" },
}));

const mockAsset = {
  id: 1,
  rank: 1,
  name: "Bitcoin",
  symbol: "BTC",
  image: "https://example.com/btc.png",
  price: 50000,
  change1h: 0.5,
  change24h: 2.5,
  change7d: 5.0,
  marketCap: 1000000000000,
  volume24h: 50000000000,
  circulatingSupply: 19000000,
  sparkline: [48000, 49000, 50000],
};

describe("AssetHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders asset name", () => {
      render(<AssetHeader asset={mockAsset} />);
      expect(screen.getByText("Bitcoin")).toBeInTheDocument();
    });

    it("renders asset symbol and rank", () => {
      render(<AssetHeader asset={mockAsset} />);
      expect(screen.getByText("BTC • Rank #1")).toBeInTheDocument();
    });

    it("renders price", () => {
      render(<AssetHeader asset={mockAsset} />);
      expect(screen.getByTestId("currency")).toBeInTheDocument();
      expect(screen.getByTestId("currency")).toHaveAttribute("data-value", "50000");
    });

    it("renders percent change", () => {
      render(<AssetHeader asset={mockAsset} />);
      const percentChange = screen.getByTestId("percent-change");
      expect(percentChange).toBeInTheDocument();
      expect(percentChange).toHaveAttribute("data-value", "2.5");
    });

    it("renders avatar with image", () => {
      render(<AssetHeader asset={mockAsset} />);
      const avatar = screen.getByTestId("avatar");
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute("data-uri", "https://example.com/btc.png");
    });

    it("renders avatar with initials fallback", () => {
      render(<AssetHeader asset={mockAsset} />);
      const avatar = screen.getByTestId("avatar");
      expect(avatar).toHaveTextContent("BT");
    });
  });

  describe("Loading State", () => {
    it("renders skeletons when loading is true", () => {
      render(<AssetHeader asset={null} loading={true} />);
      const skeletons = screen.getAllByTestId("skeleton");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("renders skeletons when asset is null", () => {
      render(<AssetHeader asset={null} />);
      const skeletons = screen.getAllByTestId("skeleton");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("does not render asset data when loading", () => {
      render(<AssetHeader asset={null} loading={true} />);
      expect(screen.queryByText("Bitcoin")).not.toBeInTheDocument();
    });
  });

  describe("Back Button", () => {
    it("renders back button when onBack is provided", () => {
      const onBack = vi.fn();
      render(<AssetHeader asset={mockAsset} onBack={onBack} />);
      expect(screen.getByTestId("icon-chevron-left")).toBeInTheDocument();
    });

    it("does not render back button when onBack is not provided", () => {
      render(<AssetHeader asset={mockAsset} />);
      expect(screen.queryByTestId("icon-chevron-left")).not.toBeInTheDocument();
    });

    it("calls onBack when back button is pressed", () => {
      const onBack = vi.fn();
      render(<AssetHeader asset={mockAsset} onBack={onBack} />);
      // The back button is a Pressable containing the icon
      const backIcon = screen.getByTestId("icon-chevron-left");
      const pressable = backIcon.closest("[role='button'], [data-testid], button") || backIcon.parentElement;
      if (pressable) {
        fireEvent.click(pressable);
        expect(onBack).toHaveBeenCalled();
      }
    });
  });

  describe("Price Formatting", () => {
    it("uses 2 decimals for prices >= $1", () => {
      render(<AssetHeader asset={mockAsset} />);
      const currency = screen.getByTestId("currency");
      expect(currency).toHaveAttribute("data-decimals", "2");
    });

    it("uses 6 decimals for prices < $1", () => {
      const lowPriceAsset = { ...mockAsset, price: 0.0001234 };
      render(<AssetHeader asset={lowPriceAsset} />);
      const currency = screen.getByTestId("currency");
      expect(currency).toHaveAttribute("data-decimals", "6");
    });
  });
});

describe("AssetHeader - Mobile Responsiveness", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with mobile styling when isMobile is true", async () => {
    mockUseBreakpoint.mockReturnValue({
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      isWide: false,
      dimensions: { width: 375, height: 812 }
    });

    render(<AssetHeader asset={mockAsset} />);
    // Component renders with smaller avatar on mobile (Size.Medium vs Size.Large)
    const avatar = screen.getByTestId("avatar");
    expect(avatar).toHaveAttribute("data-size", "md");
  });
});
