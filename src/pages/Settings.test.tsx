/**
 * @file Settings.test.tsx
 * @description Tests for the Settings page.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import React from "react";

// Mock theme contexts
vi.mock("../context/ThemeContext", () => ({
  useTheme: () => ({ isDark: true, theme: "dark" }),
}));

vi.mock("@wraith/ghost/context/ThemeContext", () => ({
  useThemeColors: () => ({
    text: { primary: "#fff", muted: "#888", secondary: "#aaa" },
    background: { raised: "#1a1a1a" },
    border: { subtle: "#333" },
  }),
}));

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "settings:title": "Settings",
        "settings:language.section": "Language",
        "settings:language.displayLanguage": "Display Language",
        "settings:language.chooseLanguage": "Choose your preferred language",
        "settings:appSettings.section": "App Settings",
      };
      return translations[key] || key;
    },
    i18n: {
      language: "en",
      changeLanguage: vi.fn(),
    },
  }),
}));

// Mock Ghost components
vi.mock("@wraith/ghost/components", () => ({
  Card: ({ children, fullBleed }: { children: React.ReactNode; fullBleed?: boolean }) => (
    <div data-testid="card" data-full-bleed={fullBleed}>{children}</div>
  ),
  Text: ({ children, appearance }: { children: React.ReactNode; appearance?: string }) => (
    <span data-testid="text" data-appearance={appearance}>{children}</span>
  ),
  Icon: ({ name }: { name: string }) => <span data-testid={`icon-${name}`} />,
  Select: ({ options, value, onChange }: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) => (
    <select data-testid="language-select" value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  ),
  Divider: () => <hr data-testid="divider" />,
}));

vi.mock("@wraith/ghost/enums", () => ({
  Size: { Small: "sm", Medium: "md", Large: "lg", ExtraLarge: "xl" },
  TextAppearance: { Muted: "muted" },
}));

vi.mock("@wraith/ghost/tokens", () => ({
  Colors: { status: { success: "#22c55e" }, text: { muted: "#888" } },
}));

// Mock components
vi.mock("../components/navbar", () => ({
  Navbar: () => <nav data-testid="navbar">Navbar</nav>,
}));

vi.mock("../components/speed-toggle", () => ({
  SpeedSelector: () => <div data-testid="speed-selector">Speed Selector</div>,
}));

vi.mock("../components/servers", () => ({
  ServersCard: () => <div data-testid="servers-card">Servers Card</div>,
}));

vi.mock("../hooks/useBreakpoint", () => ({
  useBreakpoint: () => ({ isMobile: false, isNarrow: false }),
}));

vi.mock("../i18n/types", () => ({
  SUPPORTED_LANGUAGES: [
    { code: "en", label: "English", nativeLabel: "English" },
    { code: "ko", label: "Korean", nativeLabel: "한국어" },
  ],
}));

import { Settings } from "./Settings";

function TestWrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

describe("Settings Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders without crashing", () => {
      render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );
      expect(screen.getByTestId("navbar")).toBeInTheDocument();
    });

    it("renders page title", () => {
      render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    it("renders language section", () => {
      render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );
      expect(screen.getByText("Language")).toBeInTheDocument();
      expect(screen.getByText("Display Language")).toBeInTheDocument();
    });

    it("renders app settings section", () => {
      render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );
      expect(screen.getByText("App Settings")).toBeInTheDocument();
      expect(screen.getByTestId("speed-selector")).toBeInTheDocument();
    });

    it("renders servers section", () => {
      render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );
      expect(screen.getByText("Servers")).toBeInTheDocument();
      expect(screen.getByTestId("servers-card")).toBeInTheDocument();
    });
  });

  describe("Language Selection", () => {
    it("renders language select with options", () => {
      render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );
      const select = screen.getByTestId("language-select");
      expect(select).toBeInTheDocument();
    });

    it("displays current language", () => {
      render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );
      const select = screen.getByTestId("language-select") as HTMLSelectElement;
      expect(select.value).toBe("en");
    });
  });

  describe("Navigation", () => {
    it("has back button", () => {
      render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );
      expect(screen.getByTestId("icon-chevron-left")).toBeInTheDocument();
    });
  });
});
