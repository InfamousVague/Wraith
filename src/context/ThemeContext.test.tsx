/**
 * @file ThemeContext.test.tsx
 * @description Tests for the Theme context provider.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import React from "react";
import { ThemeProvider, useTheme } from "./ThemeContext";

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

// Mock document.documentElement.setAttribute
const setAttributeMock = vi.fn();
Object.defineProperty(document.documentElement, "setAttribute", {
  value: setAttributeMock,
  writable: true,
});

// Test consumer component
function TestConsumer() {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <div data-testid="is-dark">{isDark.toString()}</div>
      <button data-testid="toggle" onClick={toggleTheme}>
        Toggle
      </button>
    </div>
  );
}

describe("ThemeContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    setAttributeMock.mockClear();
  });

  describe("ThemeProvider", () => {
    it("renders children", () => {
      render(
        <ThemeProvider>
          <div data-testid="child">Hello</div>
        </ThemeProvider>
      );
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });

    it("defaults to dark theme", () => {
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      );

      expect(screen.getByTestId("theme").textContent).toBe("dark");
      expect(screen.getByTestId("is-dark").textContent).toBe("true");
    });

    it("applies theme to document", () => {
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      );

      expect(setAttributeMock).toHaveBeenCalledWith("data-theme", "dark");
    });

    it("persists theme to localStorage", () => {
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      );

      expect(localStorageMock.setItem).toHaveBeenCalledWith("wraith-theme", "dark");
    });

    it("restores theme from localStorage", () => {
      localStorageMock.getItem.mockReturnValue("light");

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      );

      expect(screen.getByTestId("theme").textContent).toBe("light");
      expect(screen.getByTestId("is-dark").textContent).toBe("false");
    });
  });

  describe("useTheme hook", () => {
    it("throws when used outside provider", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        render(<TestConsumer />);
      }).toThrow("useTheme must be used within a ThemeProvider");

      consoleSpy.mockRestore();
    });
  });

  describe("Theme toggle", () => {
    it("toggles from dark to light", async () => {
      // Ensure we start with dark mode
      localStorageMock.getItem.mockReturnValue(null);

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      );

      expect(screen.getByTestId("theme").textContent).toBe("dark");

      await act(async () => {
        screen.getByTestId("toggle").click();
      });

      expect(screen.getByTestId("theme").textContent).toBe("light");
      expect(screen.getByTestId("is-dark").textContent).toBe("false");
    });

    it("toggles from light to dark", async () => {
      localStorageMock.getItem.mockReturnValue("light");

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      );

      expect(screen.getByTestId("theme").textContent).toBe("light");

      await act(async () => {
        screen.getByTestId("toggle").click();
      });

      expect(screen.getByTestId("theme").textContent).toBe("dark");
      expect(screen.getByTestId("is-dark").textContent).toBe("true");
    });

    it("updates localStorage on toggle", async () => {
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      );

      await act(async () => {
        screen.getByTestId("toggle").click();
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith("wraith-theme", "light");
    });

    it("updates document attribute on toggle", async () => {
      // Ensure we start with dark mode
      localStorageMock.getItem.mockReturnValue(null);

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      );

      setAttributeMock.mockClear();

      await act(async () => {
        screen.getByTestId("toggle").click();
      });

      expect(setAttributeMock).toHaveBeenCalledWith("data-theme", "light");
    });
  });
});
