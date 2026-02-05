/**
 * @file AssetPositions.test.tsx
 * @description Tests for the AssetPositions component.
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import { AssetPositions } from "./AssetPositions";

let authState = {
  isAuthenticated: true,
};

vi.mock("../../../context/AuthContext", () => ({
  useAuth: () => authState,
}));

vi.mock("@wraith/ghost/context/ThemeContext", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useThemeColors: () => ({
    border: { subtle: "#333" },
    text: { tertiary: "#888" },
  }),
}));

vi.mock("@wraith/ghost/components", () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  Badge: ({ label }: { label: string }) => <span>{label}</span>,
  Currency: ({ value }: { value: number }) => <span>${value}</span>,
  Skeleton: () => <div data-testid="skeleton" />,
  Icon: () => <span data-testid="icon" />,
}));

vi.mock("@wraith/ghost/enums", () => ({
  Size: {
    ExtraSmall: "ExtraSmall",
    Small: "Small",
    Medium: "Medium",
    Large: "Large",
  },
  TextAppearance: { Muted: "Muted" },
}));

vi.mock("@wraith/ghost/tokens", () => ({
  Colors: {
    accent: { primary: "#3b82f6" },
    data: { blue: "#3b82f6", emerald: "#2fd57a" },
    status: { success: "#2fd57a", danger: "#ff5c7a" },
  },
}));

vi.mock("../../ui/hint-indicator", () => ({
  HintIndicator: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContainer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipSection: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipText: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipHighlight: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipMetric: ({ label, value }: { label: string; value: string }) => (
    <span>
      {label}:{value}
    </span>
  ),
  TooltipDivider: () => <span />,
}));

// Mock the hooks
vi.mock("../../../hooks/usePortfolio", () => ({
  usePortfolio: () => ({
    portfolio: { id: "portfolio-1", name: "Test Portfolio" },
    loading: false,
    error: null,
  }),
}));

vi.mock("../../../hooks/usePositions", () => ({
  usePositions: () => ({
    positions: [],
    loading: false,
    error: null,
    refetch: vi.fn(),
    closePosition: vi.fn(),
    modifyPosition: vi.fn(),
    addMargin: vi.fn(),
    lastPositionUpdate: null,
    updatedPositionIds: new Set(),
  }),
}));

vi.mock("../../../hooks/useBreakpoint", () => ({
  useBreakpoint: () => ({
    isMobile: false,
    isNarrow: false,
    isWide: true,
    height: 1080,
  }),
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe("AssetPositions", () => {
  it("should not render when user is not authenticated", () => {
    authState = { isAuthenticated: false };
    const { container } = renderWithProviders(<AssetPositions symbol="BTC" />);
    expect(container.firstChild).toBeNull();
  });

  it("should not render when there are no positions for the asset", () => {
    authState = { isAuthenticated: true };
    const { container } = renderWithProviders(
      <AssetPositions symbol="BTC" loading={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("should render loading state", () => {
    authState = { isAuthenticated: true };
    renderWithProviders(<AssetPositions symbol="BTC" loading={true} />);
    expect(screen.getByText("Your Positions")).toBeInTheDocument();
  });
});
