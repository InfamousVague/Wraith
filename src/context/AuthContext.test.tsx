/**
 * @file AuthContext.test.tsx
 * @description Tests for the Auth context provider.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import React from "react";
import { AuthProvider, useAuth } from "./AuthContext";

// Mock hauntClient
vi.mock("../services/haunt", () => ({
  hauntClient: {
    getChallenge: vi.fn().mockResolvedValue({
      data: { challenge: "test-challenge", timestamp: Date.now() },
    }),
    verify: vi.fn().mockResolvedValue({
      data: {
        sessionToken: "test-token",
        profile: { id: "1", displayName: "Test User" },
      },
    }),
    logout: vi.fn().mockResolvedValue({}),
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
function TestConsumer({ onMount }: { onMount?: (auth: ReturnType<typeof useAuth>) => void }) {
  const auth = useAuth();
  React.useEffect(() => {
    onMount?.(auth);
  }, [auth, onMount]);

  return (
    <div>
      <div data-testid="is-authenticated">{auth.isAuthenticated.toString()}</div>
      <div data-testid="loading">{auth.loading.toString()}</div>
      <div data-testid="login-step">{auth.loginStep}</div>
      <div data-testid="is-connected">{auth.isConnectedToServer.toString()}</div>
      <button data-testid="create-account" onClick={auth.createAccount}>
        Create Account
      </button>
      <button data-testid="logout" onClick={auth.logout}>
        Logout
      </button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe("AuthProvider", () => {
    it("renders children", () => {
      render(
        <AuthProvider>
          <div data-testid="child">Hello</div>
        </AuthProvider>
      );
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });

    it("starts with loading state", () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Initial state before useEffect runs
      expect(screen.getByTestId("is-authenticated").textContent).toBe("false");
    });

    it("finishes loading after initialization", async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading").textContent).toBe("false");
      });
    });

    it("starts not authenticated", async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("is-authenticated").textContent).toBe("false");
      });
    });

    it("login step starts as idle", async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("login-step").textContent).toBe("idle");
      });
    });
  });

  describe("useAuth hook", () => {
    it("throws when used outside provider", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        render(<TestConsumer />);
      }).toThrow("useAuth must be used within an AuthProvider");

      consoleSpy.mockRestore();
    });
  });

  describe("Account creation", () => {
    it("creates account with keypair", async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading").textContent).toBe("false");
      });

      await act(async () => {
        screen.getByTestId("create-account").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("is-authenticated").textContent).toBe("true");
      });
    });
  });

  describe("Logout", () => {
    it("clears authentication state", async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Create account first
      await waitFor(() => {
        expect(screen.getByTestId("loading").textContent).toBe("false");
      });

      await act(async () => {
        screen.getByTestId("create-account").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("is-authenticated").textContent).toBe("true");
      });

      // Now logout
      await act(async () => {
        screen.getByTestId("logout").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("is-authenticated").textContent).toBe("false");
      });
    });
  });
});
