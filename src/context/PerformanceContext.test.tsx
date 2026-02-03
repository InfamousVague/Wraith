/**
 * @file PerformanceContext.test.tsx
 * @description Tests for the Performance context provider.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import React from "react";
import { PerformanceProvider, usePerformance, useThrottleMs, type SpeedLevel } from "./PerformanceContext";

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
  const { speedLevel, setSpeedLevel, throttleMs, isThrottled } = usePerformance();

  return (
    <div>
      <div data-testid="speed-level">{speedLevel}</div>
      <div data-testid="throttle-ms">{throttleMs}</div>
      <div data-testid="is-throttled">{isThrottled.toString()}</div>
      <button data-testid="set-slow" onClick={() => setSpeedLevel("slow")}>
        Set Slow
      </button>
      <button data-testid="set-balanced" onClick={() => setSpeedLevel("balanced")}>
        Set Balanced
      </button>
      <button data-testid="set-fast" onClick={() => setSpeedLevel("fast")}>
        Set Fast
      </button>
    </div>
  );
}

// Test consumer for useThrottleMs hook
function ThrottleMsConsumer() {
  const throttleMs = useThrottleMs();
  return <div data-testid="throttle-only">{throttleMs}</div>;
}

describe("PerformanceContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe("PerformanceProvider", () => {
    it("renders children", () => {
      render(
        <PerformanceProvider>
          <div data-testid="child">Hello</div>
        </PerformanceProvider>
      );
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });

    it("defaults to fast speed level", () => {
      render(
        <PerformanceProvider>
          <TestConsumer />
        </PerformanceProvider>
      );

      expect(screen.getByTestId("speed-level").textContent).toBe("fast");
    });

    it("fast mode has 0 throttle", () => {
      render(
        <PerformanceProvider>
          <TestConsumer />
        </PerformanceProvider>
      );

      expect(screen.getByTestId("throttle-ms").textContent).toBe("0");
      expect(screen.getByTestId("is-throttled").textContent).toBe("false");
    });
  });

  describe("Speed level changes", () => {
    it("changes to slow mode", async () => {
      render(
        <PerformanceProvider>
          <TestConsumer />
        </PerformanceProvider>
      );

      await act(async () => {
        screen.getByTestId("set-slow").click();
      });

      expect(screen.getByTestId("speed-level").textContent).toBe("slow");
      expect(screen.getByTestId("throttle-ms").textContent).toBe("1000");
      expect(screen.getByTestId("is-throttled").textContent).toBe("true");
    });

    it("changes to balanced mode", async () => {
      render(
        <PerformanceProvider>
          <TestConsumer />
        </PerformanceProvider>
      );

      await act(async () => {
        screen.getByTestId("set-balanced").click();
      });

      expect(screen.getByTestId("speed-level").textContent).toBe("balanced");
      expect(screen.getByTestId("throttle-ms").textContent).toBe("200");
      expect(screen.getByTestId("is-throttled").textContent).toBe("true");
    });

    it("persists speed level to localStorage", async () => {
      render(
        <PerformanceProvider>
          <TestConsumer />
        </PerformanceProvider>
      );

      await act(async () => {
        screen.getByTestId("set-slow").click();
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith("wraith-speed-level", "slow");
    });

    it("restores speed level from localStorage", () => {
      localStorageMock.getItem.mockReturnValue("balanced");

      render(
        <PerformanceProvider>
          <TestConsumer />
        </PerformanceProvider>
      );

      expect(screen.getByTestId("speed-level").textContent).toBe("balanced");
    });
  });

  describe("useThrottleMs hook", () => {
    it("returns throttle value", () => {
      // Ensure we start with fast mode
      localStorageMock.getItem.mockReturnValue("fast");

      render(
        <PerformanceProvider>
          <ThrottleMsConsumer />
        </PerformanceProvider>
      );

      expect(screen.getByTestId("throttle-only").textContent).toBe("0");
    });
  });

  describe("Throttled callbacks", () => {
    it("creates throttled callback", async () => {
      let callbackCalled = 0;

      function ThrottleTestConsumer() {
        const { createThrottledCallback, setSpeedLevel } = usePerformance();
        const throttledFn = createThrottledCallback(() => {
          callbackCalled++;
        }, "test-key");

        return (
          <div>
            <button data-testid="call-throttled" onClick={throttledFn}>
              Call
            </button>
            <button data-testid="set-slow-mode" onClick={() => setSpeedLevel("slow")}>
              Set Slow
            </button>
          </div>
        );
      }

      render(
        <PerformanceProvider>
          <ThrottleTestConsumer />
        </PerformanceProvider>
      );

      // In fast mode, callback should execute immediately
      await act(async () => {
        screen.getByTestId("call-throttled").click();
      });

      expect(callbackCalled).toBe(1);
    });
  });
});
