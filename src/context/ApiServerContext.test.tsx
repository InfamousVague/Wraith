/**
 * @file ApiServerContext.test.tsx
 * @description Tests for the API Server context provider.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import React from "react";
import { ApiServerProvider, useApiServer } from "./ApiServerContext";

// Mock HauntClient as a class
vi.mock("../services/haunt", () => ({
  HauntClient: class MockHauntClient {
    health = vi.fn().mockResolvedValue({ status: "ok" });
    getPeers = vi.fn().mockResolvedValue({ data: { peers: [] } });
  },
}));

// Mock PreferenceSyncContext
vi.mock("./PreferenceSyncContext", () => ({
  usePreferenceSyncSafe: () => null,
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

// Mock fetch for server discovery
global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

// Test consumer component
function TestConsumer() {
  const { servers, activeServer, isRefreshing, useAutoFastest } = useApiServer();
  return (
    <div>
      <div data-testid="server-count">{servers.length}</div>
      <div data-testid="active-server">{activeServer?.id || "none"}</div>
      <div data-testid="is-refreshing">{isRefreshing.toString()}</div>
      <div data-testid="auto-fastest">{useAutoFastest.toString()}</div>
    </div>
  );
}

describe("ApiServerContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("ApiServerProvider", () => {
    it("renders children", () => {
      render(
        <ApiServerProvider>
          <div data-testid="child">Hello</div>
        </ApiServerProvider>
      );
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });

    it("provides server list from fallback", () => {
      render(
        <ApiServerProvider>
          <TestConsumer />
        </ApiServerProvider>
      );

      // Should have fallback servers immediately
      const count = parseInt(screen.getByTestId("server-count").textContent || "0");
      expect(count).toBeGreaterThan(0);
    });

    it("provides active server", () => {
      render(
        <ApiServerProvider>
          <TestConsumer />
        </ApiServerProvider>
      );

      // Should have a default active server (local in dev)
      expect(screen.getByTestId("active-server").textContent).not.toBe("none");
    });

    it("auto-fastest defaults to false", () => {
      render(
        <ApiServerProvider>
          <TestConsumer />
        </ApiServerProvider>
      );

      expect(screen.getByTestId("auto-fastest").textContent).toBe("false");
    });
  });

  describe("useApiServer hook", () => {
    it("throws when used outside provider", () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        render(<TestConsumer />);
      }).toThrow("useApiServer must be used within an ApiServerProvider");

      consoleSpy.mockRestore();
    });
  });

  describe("Context value", () => {
    it("provides hauntClient", () => {
      let hauntClientRef: unknown = null;

      function ClientConsumer() {
        const { hauntClient } = useApiServer();
        hauntClientRef = hauntClient;
        return <div>client</div>;
      }

      render(
        <ApiServerProvider>
          <ClientConsumer />
        </ApiServerProvider>
      );

      expect(hauntClientRef).toBeDefined();
    });
  });
});
