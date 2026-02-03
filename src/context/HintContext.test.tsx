/**
 * @file HintContext.test.tsx
 * @description Tests for the Hint context provider.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import React from "react";
import { HintProvider, useHints } from "./HintContext";

// Mock sessionStorage
const sessionStorageMock = (() => {
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

Object.defineProperty(window, "sessionStorage", { value: sessionStorageMock });

// Test consumer component
function TestConsumer() {
  const { viewedHints, activeHint, registerHint, dismissHint, isActive, isViewed } = useHints();

  return (
    <div>
      <div data-testid="viewed-hints">{viewedHints.join(",")}</div>
      <div data-testid="active-hint">{activeHint || "none"}</div>
      <div data-testid="hint1-active">{isActive("hint1").toString()}</div>
      <div data-testid="hint1-viewed">{isViewed("hint1").toString()}</div>
      <button data-testid="register-hint1" onClick={() => registerHint("hint1", 1)}>
        Register Hint 1
      </button>
      <button data-testid="register-hint2" onClick={() => registerHint("hint2", 2)}>
        Register Hint 2
      </button>
      <button data-testid="dismiss-hint1" onClick={() => dismissHint("hint1")}>
        Dismiss Hint 1
      </button>
    </div>
  );
}

describe("HintContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorageMock.clear();
  });

  describe("HintProvider", () => {
    it("renders children", () => {
      render(
        <HintProvider>
          <div data-testid="child">Hello</div>
        </HintProvider>
      );
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });

    it("starts with no active hint", () => {
      render(
        <HintProvider>
          <TestConsumer />
        </HintProvider>
      );

      expect(screen.getByTestId("active-hint").textContent).toBe("none");
    });

    it("starts with no viewed hints", () => {
      render(
        <HintProvider>
          <TestConsumer />
        </HintProvider>
      );

      expect(screen.getByTestId("viewed-hints").textContent).toBe("");
    });
  });

  describe("useHints hook", () => {
    it("throws when used outside provider", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        render(<TestConsumer />);
      }).toThrow("useHints must be used within a HintProvider");

      consoleSpy.mockRestore();
    });
  });

  describe("Hint registration", () => {
    it("registers hint and makes it active", async () => {
      render(
        <HintProvider>
          <TestConsumer />
        </HintProvider>
      );

      await act(async () => {
        screen.getByTestId("register-hint1").click();
      });

      expect(screen.getByTestId("active-hint").textContent).toBe("hint1");
      expect(screen.getByTestId("hint1-active").textContent).toBe("true");
    });

    it("respects priority order", async () => {
      render(
        <HintProvider>
          <TestConsumer />
        </HintProvider>
      );

      // Register hint2 first (priority 2)
      await act(async () => {
        screen.getByTestId("register-hint2").click();
      });

      // Then register hint1 (priority 1 - higher priority)
      await act(async () => {
        screen.getByTestId("register-hint1").click();
      });

      // hint1 should be active because it has lower priority number (higher priority)
      expect(screen.getByTestId("active-hint").textContent).toBe("hint1");
    });
  });

  describe("Hint dismissal", () => {
    it("marks hint as viewed", async () => {
      render(
        <HintProvider>
          <TestConsumer />
        </HintProvider>
      );

      await act(async () => {
        screen.getByTestId("register-hint1").click();
      });

      expect(screen.getByTestId("hint1-viewed").textContent).toBe("false");

      await act(async () => {
        screen.getByTestId("dismiss-hint1").click();
      });

      expect(screen.getByTestId("hint1-viewed").textContent).toBe("true");
      expect(screen.getByTestId("viewed-hints").textContent).toBe("hint1");
    });

    it("activates next hint after dismissal", async () => {
      render(
        <HintProvider>
          <TestConsumer />
        </HintProvider>
      );

      // Register both hints
      await act(async () => {
        screen.getByTestId("register-hint1").click();
        screen.getByTestId("register-hint2").click();
      });

      // hint1 is active
      expect(screen.getByTestId("active-hint").textContent).toBe("hint1");

      // Dismiss hint1
      await act(async () => {
        screen.getByTestId("dismiss-hint1").click();
      });

      // hint2 should now be active
      expect(screen.getByTestId("active-hint").textContent).toBe("hint2");
    });

    it("persists viewed hints to sessionStorage", async () => {
      render(
        <HintProvider>
          <TestConsumer />
        </HintProvider>
      );

      await act(async () => {
        screen.getByTestId("register-hint1").click();
      });

      await act(async () => {
        screen.getByTestId("dismiss-hint1").click();
      });

      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
        "wraith-hints-viewed",
        expect.stringContaining("hint1")
      );
    });
  });
});
