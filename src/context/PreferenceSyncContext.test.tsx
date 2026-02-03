/**
 * @file PreferenceSyncContext.test.tsx
 * @description Tests for the Preference Sync context provider.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import React from "react";
import { PreferenceSyncProvider, usePreferenceSync, usePreferenceSyncSafe } from "./PreferenceSyncContext";

// Mock AuthContext
vi.mock("./AuthContext", () => ({
  useAuth: () => ({
    sessionToken: null,
    serverProfile: null,
    isConnectedToServer: false,
  }),
}));

// Mock hauntClient
vi.mock("../services/haunt", () => ({
  hauntClient: {
    getMe: vi.fn().mockResolvedValue({ data: { settings: {} } }),
    updateProfile: vi.fn().mockResolvedValue({}),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Test consumer component
function TestConsumer() {
  const { serverPreferences, syncing, syncError, isEnabled } = usePreferenceSync();

  return (
    <div>
      <div data-testid="syncing">{syncing.toString()}</div>
      <div data-testid="sync-error">{syncError || "none"}</div>
      <div data-testid="is-enabled">{isEnabled.toString()}</div>
      <div data-testid="preferences">{JSON.stringify(serverPreferences)}</div>
    </div>
  );
}

// Test consumer for safe hook
function SafeConsumer() {
  const context = usePreferenceSyncSafe();
  return <div data-testid="safe-result">{context ? "has-context" : "no-context"}</div>;
}

describe("PreferenceSyncContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe("PreferenceSyncProvider", () => {
    it("renders children", () => {
      render(
        <PreferenceSyncProvider>
          <div data-testid="child">Hello</div>
        </PreferenceSyncProvider>
      );
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });

    it("starts not syncing", () => {
      render(
        <PreferenceSyncProvider>
          <TestConsumer />
        </PreferenceSyncProvider>
      );

      expect(screen.getByTestId("syncing").textContent).toBe("false");
    });

    it("starts with no sync error", () => {
      render(
        <PreferenceSyncProvider>
          <TestConsumer />
        </PreferenceSyncProvider>
      );

      expect(screen.getByTestId("sync-error").textContent).toBe("none");
    });

    it("is disabled when not connected", () => {
      render(
        <PreferenceSyncProvider>
          <TestConsumer />
        </PreferenceSyncProvider>
      );

      expect(screen.getByTestId("is-enabled").textContent).toBe("false");
    });
  });

  describe("usePreferenceSync hook", () => {
    it("throws when used outside provider", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        render(<TestConsumer />);
      }).toThrow("usePreferenceSync must be used within PreferenceSyncProvider");

      consoleSpy.mockRestore();
    });
  });

  describe("usePreferenceSyncSafe hook", () => {
    it("returns null when outside provider", () => {
      render(<SafeConsumer />);
      expect(screen.getByTestId("safe-result").textContent).toBe("no-context");
    });

    it("returns context when inside provider", () => {
      render(
        <PreferenceSyncProvider>
          <SafeConsumer />
        </PreferenceSyncProvider>
      );
      expect(screen.getByTestId("safe-result").textContent).toBe("has-context");
    });
  });

  describe("Local storage", () => {
    it("loads preferences from localStorage", () => {
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify({ autoFastest: true, preferredServer: "osaka" })
      );

      render(
        <PreferenceSyncProvider>
          <TestConsumer />
        </PreferenceSyncProvider>
      );

      expect(screen.getByTestId("preferences").textContent).toContain("autoFastest");
    });
  });
});
