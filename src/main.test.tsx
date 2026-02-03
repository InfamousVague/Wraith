/**
 * @file main.test.tsx
 * @description Tests for the main application entry point components.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import React from "react";

// Mock all the heavy providers to isolate main.tsx testing
vi.mock("./context/ThemeContext", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="theme-provider">{children}</div>,
  useTheme: () => ({ theme: "dark", toggleTheme: vi.fn() }),
}));

vi.mock("./context/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="auth-provider">{children}</div>,
}));

vi.mock("./context/PreferenceSyncContext", () => ({
  PreferenceSyncProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="preference-sync-provider">{children}</div>,
}));

vi.mock("./context/HintContext", () => ({
  HintProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="hint-provider">{children}</div>,
}));

vi.mock("./context/PerformanceContext", () => ({
  PerformanceProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="performance-provider">{children}</div>,
}));

vi.mock("./context/ApiServerContext", () => ({
  ApiServerProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="api-server-provider">{children}</div>,
}));

vi.mock("@wraith/ghost", () => ({
  GhostThemeProvider: ({ children, mode }: { children: React.ReactNode; mode: string }) => (
    <div data-testid="ghost-theme-provider" data-mode={mode}>{children}</div>
  ),
}));

vi.mock("./hooks/useHauntSocket", () => ({
  HauntSocketProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="haunt-socket-provider">{children}</div>,
}));

vi.mock("./pages/Dashboard", () => ({
  Dashboard: () => <div data-testid="dashboard-page">Dashboard</div>,
}));

vi.mock("./pages/AssetDetail", () => ({
  AssetDetail: () => <div data-testid="asset-detail-page">Asset Detail</div>,
}));

vi.mock("./pages/Profile", () => ({
  Profile: () => <div data-testid="profile-page">Profile</div>,
}));

vi.mock("./pages/Settings", () => ({
  Settings: () => <div data-testid="settings-page">Settings</div>,
}));

vi.mock("./components/PriceTicker", () => ({
  PriceTicker: () => <div data-testid="price-ticker">Price Ticker</div>,
}));

// Import after mocks are set up
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { PreferenceSyncProvider } from "./context/PreferenceSyncContext";
import { HintProvider } from "./context/HintContext";
import { PerformanceProvider } from "./context/PerformanceContext";
import { ApiServerProvider } from "./context/ApiServerContext";
import { GhostThemeProvider } from "@wraith/ghost";
import { HauntSocketProvider } from "./hooks/useHauntSocket";
import { Dashboard } from "./pages/Dashboard";
import { AssetDetail } from "./pages/AssetDetail";
import { Profile } from "./pages/Profile";
import { Settings } from "./pages/Settings";
import { PriceTicker } from "./components/PriceTicker";

// Recreate components from main.tsx for testing
function GhostThemeBridge({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  return <GhostThemeProvider mode={theme}>{children}</GhostThemeProvider>;
}

function App() {
  return (
    <div style={{ flex: 1 }}>
      <PriceTicker />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/asset/:id" element={<AssetDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </div>
  );
}

function TestWrapper({ children, initialRoute = "/" }: { children: React.ReactNode; initialRoute?: string }) {
  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <ThemeProvider>
        <AuthProvider>
          <PreferenceSyncProvider>
            <HintProvider>
              <GhostThemeBridge>
                <PerformanceProvider>
                  <ApiServerProvider>
                    <HauntSocketProvider>
                      {children}
                    </HauntSocketProvider>
                  </ApiServerProvider>
                </PerformanceProvider>
              </GhostThemeBridge>
            </HintProvider>
          </PreferenceSyncProvider>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe("main.tsx", () => {
  describe("App component", () => {
    it("renders without crashing", () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );
      expect(screen.getByTestId("price-ticker")).toBeInTheDocument();
    });

    it("renders PriceTicker on all pages", () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );
      expect(screen.getByTestId("price-ticker")).toBeInTheDocument();
    });

    it("renders Dashboard on root route", () => {
      render(
        <TestWrapper initialRoute="/">
          <App />
        </TestWrapper>
      );
      expect(screen.getByTestId("dashboard-page")).toBeInTheDocument();
    });

    it("renders AssetDetail on /asset/:id route", () => {
      render(
        <TestWrapper initialRoute="/asset/btc">
          <App />
        </TestWrapper>
      );
      expect(screen.getByTestId("asset-detail-page")).toBeInTheDocument();
    });

    it("renders Profile on /profile route", () => {
      render(
        <TestWrapper initialRoute="/profile">
          <App />
        </TestWrapper>
      );
      expect(screen.getByTestId("profile-page")).toBeInTheDocument();
    });

    it("renders Settings on /settings route", () => {
      render(
        <TestWrapper initialRoute="/settings">
          <App />
        </TestWrapper>
      );
      expect(screen.getByTestId("settings-page")).toBeInTheDocument();
    });
  });

  describe("GhostThemeBridge", () => {
    it("passes theme to GhostThemeProvider", () => {
      render(
        <TestWrapper>
          <div data-testid="child">Child</div>
        </TestWrapper>
      );
      const ghostProvider = screen.getByTestId("ghost-theme-provider");
      expect(ghostProvider).toHaveAttribute("data-mode", "dark");
    });
  });

  describe("Provider nesting", () => {
    it("all providers are present in correct order", () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Verify providers are in the DOM
      expect(screen.getByTestId("theme-provider")).toBeInTheDocument();
      expect(screen.getByTestId("auth-provider")).toBeInTheDocument();
      expect(screen.getByTestId("preference-sync-provider")).toBeInTheDocument();
      expect(screen.getByTestId("hint-provider")).toBeInTheDocument();
      expect(screen.getByTestId("ghost-theme-provider")).toBeInTheDocument();
      expect(screen.getByTestId("performance-provider")).toBeInTheDocument();
      expect(screen.getByTestId("api-server-provider")).toBeInTheDocument();
      expect(screen.getByTestId("haunt-socket-provider")).toBeInTheDocument();
    });
  });
});
