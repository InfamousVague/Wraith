/**
 * @file Navbar.test.tsx
 * @description Tests for the Navbar component.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import React from "react";
import { Navbar } from "./Navbar";

// Mock navigation
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "navigation:brand": "WRAITH",
        "navigation:marketFilter": "Market",
        "navigation:theme": "Theme",
        "navigation:settings": "Settings",
        "common:buttons.login": "Login",
      };
      return translations[key] || key;
    },
  }),
}));

// Mock theme contexts
vi.mock("../context/ThemeContext", () => ({
  useTheme: () => ({ isDark: true, toggleTheme: vi.fn() }),
}));

vi.mock("@wraith/ghost/context/ThemeContext", () => ({
  useThemeColors: () => ({
    text: { primary: "#fff", muted: "#888", secondary: "#aaa" },
    background: { canvas: "#0a0a0a", raised: "#1a1a1a" },
    border: { subtle: "#333" },
  }),
}));

// Mock auth context
vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
  }),
}));

// Mock breakpoint hook
vi.mock("../hooks/useBreakpoint", () => ({
  useBreakpoint: () => ({ isMobile: false }),
}));

// Mock Ghost components
vi.mock("@wraith/ghost/components", () => ({
  Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  Toggle: ({ value, onValueChange }: { value: boolean; onValueChange: () => void }) => (
    <button data-testid="theme-toggle" onClick={onValueChange}>
      {value ? "Dark" : "Light"}
    </button>
  ),
  Icon: ({ name }: { name: string }) => <span data-testid={`icon-${name}`} />,
  Button: ({ label, onPress }: { label: string; onPress: () => void }) => (
    <button onClick={onPress}>{label}</button>
  ),
}));

vi.mock("@wraith/ghost/enums", () => ({
  Size: { Small: "sm", Medium: "md", Large: "lg" },
  Shape: { Rounded: "rounded" },
  Appearance: { Secondary: "secondary" },
  TextAppearance: { Muted: "muted" },
}));

// Mock MarketFilter
vi.mock("../market-filter", () => ({
  MarketFilter: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div data-testid="market-filter">
      <button onClick={() => onChange("crypto")}>Crypto</button>
      <button onClick={() => onChange("all")}>All</button>
    </div>
  ),
}));

function renderNavbar(props = {}) {
  return render(
    <MemoryRouter>
      <Navbar {...props} />
    </MemoryRouter>
  );
}

describe("Navbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders brand name", () => {
      renderNavbar();
      expect(screen.getByText("WRAITH")).toBeInTheDocument();
    });

    it("renders theme toggle", () => {
      renderNavbar();
      expect(screen.getByTestId("theme-toggle")).toBeInTheDocument();
    });

    it("renders login button when not authenticated", () => {
      renderNavbar();
      expect(screen.getByText("Login")).toBeInTheDocument();
    });

    it("renders settings icon", () => {
      renderNavbar();
      expect(screen.getByTestId("icon-settings")).toBeInTheDocument();
    });
  });

  describe("Market Filter", () => {
    it("shows market filter when onAssetTypeChange is provided", () => {
      const onAssetTypeChange = vi.fn();
      renderNavbar({ onAssetTypeChange });
      expect(screen.getByTestId("market-filter")).toBeInTheDocument();
    });

    it("hides market filter when onAssetTypeChange is not provided", () => {
      renderNavbar();
      expect(screen.queryByTestId("market-filter")).not.toBeInTheDocument();
    });

    it("calls onAssetTypeChange when filter changes", () => {
      const onAssetTypeChange = vi.fn();
      renderNavbar({ onAssetTypeChange });

      fireEvent.click(screen.getByText("Crypto"));
      expect(onAssetTypeChange).toHaveBeenCalledWith("crypto");
    });
  });

  describe("Navigation", () => {
    it("navigates to profile on login click", () => {
      renderNavbar();
      fireEvent.click(screen.getByText("Login"));
      expect(mockNavigate).toHaveBeenCalledWith("/profile");
    });

    it("navigates to home on brand click", () => {
      renderNavbar();
      // Brand is clickable (Pressable in the component)
      const brand = screen.getByText("WRAITH");
      fireEvent.click(brand);
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });
});

describe("Navbar - Component Structure", () => {
  it("has proper layout with logo, controls, and settings", () => {
    renderNavbar();
    // Verify the essential structure exists
    expect(screen.getByText("WRAITH")).toBeInTheDocument();
    expect(screen.getByTestId("theme-toggle")).toBeInTheDocument();
    expect(screen.getByTestId("icon-settings")).toBeInTheDocument();
  });
});
