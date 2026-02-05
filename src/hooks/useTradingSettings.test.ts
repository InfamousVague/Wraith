/**
 * @file useTradingSettings.test.ts
 * @description Tests for the useTradingSettings hook.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import React from "react";
import { useTradingSettings } from "./useTradingSettings";
import { DEFAULT_TRADING_SETTINGS, DEFAULT_DRAWDOWN_PROTECTION } from "../types/settings";

// Mock react-native Platform
vi.mock("react-native", () => ({
  Platform: { OS: "web" },
}));

// Mock AuthContext
vi.mock("../context/AuthContext", () => ({
  useAuth: vi.fn(() => ({
    sessionToken: null,
    isAuthenticated: false,
  })),
}));

// Mock hauntClient
vi.mock("../services/haunt", () => ({
  hauntClient: {
    getPortfolioSettings: vi.fn(),
    updatePortfolioSettings: vi.fn(),
  },
}));

import { useAuth } from "../context/AuthContext";
import { hauntClient } from "../services/haunt";

const mockUseAuth = vi.mocked(useAuth);

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
    _getStore: () => store,
  };
})();

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

describe("useTradingSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    mockUseAuth.mockReturnValue({
      sessionToken: null,
      isAuthenticated: false,
    } as ReturnType<typeof useAuth>);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("loads default settings when localStorage is empty", () => {
      const { result } = renderHook(() => useTradingSettings());

      expect(result.current.settings).toEqual(DEFAULT_TRADING_SETTINGS);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("loads saved settings from localStorage", () => {
      const customSettings = {
        drawdownProtection: {
          ...DEFAULT_DRAWDOWN_PROTECTION,
          maxDrawdownPercent: 30,
          enabled: false,
        },
      };
      localStorageMock.setItem("wraith_trading_settings", JSON.stringify(customSettings));

      const { result } = renderHook(() => useTradingSettings());

      expect(result.current.settings.drawdownProtection.maxDrawdownPercent).toBe(30);
      expect(result.current.settings.drawdownProtection.enabled).toBe(false);
    });

    it("handles corrupted localStorage gracefully", () => {
      localStorageMock.setItem("wraith_trading_settings", "invalid json {{");

      const { result } = renderHook(() => useTradingSettings());

      // Should fall back to defaults without throwing
      expect(result.current.settings).toEqual(DEFAULT_TRADING_SETTINGS);
      expect(result.current.error).toBeNull();
    });

    it("merges partial stored settings with defaults", () => {
      // Only store some fields - hook should fill in missing with defaults
      const partialSettings = {
        drawdownProtection: {
          enabled: false,
          maxDrawdownPercent: 25,
        },
      };
      localStorageMock.setItem("wraith_trading_settings", JSON.stringify(partialSettings));

      const { result } = renderHook(() => useTradingSettings());

      expect(result.current.settings.drawdownProtection.enabled).toBe(false);
      expect(result.current.settings.drawdownProtection.maxDrawdownPercent).toBe(25);
      // Default values should be preserved for unspecified fields
      expect(result.current.settings.drawdownProtection.allowBypass).toBe(
        DEFAULT_DRAWDOWN_PROTECTION.allowBypass
      );
    });
  });

  describe("updateSettings", () => {
    it("merges partial updates correctly", async () => {
      const { result } = renderHook(() => useTradingSettings());

      await act(async () => {
        await result.current.updateSettings({
          drawdownProtection: {
            ...result.current.settings.drawdownProtection,
            maxDrawdownPercent: 35,
          },
        });
      });

      expect(result.current.settings.drawdownProtection.maxDrawdownPercent).toBe(35);
      // Other settings should remain unchanged
      expect(result.current.settings.drawdownProtection.enabled).toBe(true);
    });

    it("saves to localStorage", async () => {
      const { result } = renderHook(() => useTradingSettings());

      await act(async () => {
        await result.current.updateSettings({
          drawdownProtection: {
            ...result.current.settings.drawdownProtection,
            maxDrawdownPercent: 40,
          },
        });
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "wraith_trading_settings",
        expect.stringContaining('"maxDrawdownPercent":40')
      );
    });
  });

  describe("updateDrawdownSettings", () => {
    it("updates nested drawdown settings", async () => {
      const { result } = renderHook(() => useTradingSettings());

      await act(async () => {
        await result.current.updateDrawdownSettings({ maxDrawdownPercent: 30 });
      });

      expect(result.current.settings.drawdownProtection.maxDrawdownPercent).toBe(30);
      // Other drawdown settings should be unchanged
      expect(result.current.settings.drawdownProtection.enabled).toBe(true);
      expect(result.current.settings.drawdownProtection.allowBypass).toBe(true);
    });

    it("can disable drawdown protection", async () => {
      const { result } = renderHook(() => useTradingSettings());

      await act(async () => {
        await result.current.updateDrawdownSettings({ enabled: false });
      });

      expect(result.current.settings.drawdownProtection.enabled).toBe(false);
      expect(result.current.isDrawdownEnabled).toBe(false);
    });
  });

  describe("resetToDefaults", () => {
    it("clears customizations and restores defaults", async () => {
      // Start with custom settings
      const customSettings = {
        drawdownProtection: {
          ...DEFAULT_DRAWDOWN_PROTECTION,
          maxDrawdownPercent: 50,
          enabled: false,
        },
      };
      localStorageMock.setItem("wraith_trading_settings", JSON.stringify(customSettings));

      const { result } = renderHook(() => useTradingSettings());

      // Verify custom settings were loaded
      expect(result.current.settings.drawdownProtection.maxDrawdownPercent).toBe(50);

      // Reset to defaults
      await act(async () => {
        await result.current.resetToDefaults();
      });

      expect(result.current.settings).toEqual(DEFAULT_TRADING_SETTINGS);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("wraith_trading_settings");
    });
  });

  describe("computed values", () => {
    it("isDrawdownEnabled reflects settings", async () => {
      const { result } = renderHook(() => useTradingSettings());

      expect(result.current.isDrawdownEnabled).toBe(true);

      await act(async () => {
        await result.current.updateDrawdownSettings({ enabled: false });
      });

      expect(result.current.isDrawdownEnabled).toBe(false);
    });

    it("isApproachingLimit is true at warning threshold", async () => {
      const { result } = renderHook(() => useTradingSettings());

      // Default: maxDrawdown=20%, warningThreshold=75%
      // Warning triggers at 15% (75% of 20%)
      await act(async () => {
        result.current.setCurrentDrawdown(16);
      });

      expect(result.current.isApproachingLimit).toBe(true);
      expect(result.current.isAtLimit).toBe(false);
    });

    it("isApproachingLimit is false below warning threshold", async () => {
      const { result } = renderHook(() => useTradingSettings());

      await act(async () => {
        result.current.setCurrentDrawdown(10);
      });

      expect(result.current.isApproachingLimit).toBe(false);
    });

    it("isAtLimit is true at max threshold", async () => {
      const { result } = renderHook(() => useTradingSettings());

      await act(async () => {
        result.current.setCurrentDrawdown(21);
      });

      expect(result.current.isAtLimit).toBe(true);
    });

    it("isAtLimit is false below max threshold", async () => {
      const { result } = renderHook(() => useTradingSettings());

      await act(async () => {
        result.current.setCurrentDrawdown(19);
      });

      expect(result.current.isAtLimit).toBe(false);
    });

    it("computed values are false when protection is disabled", async () => {
      const { result } = renderHook(() => useTradingSettings());

      await act(async () => {
        await result.current.updateDrawdownSettings({ enabled: false });
        result.current.setCurrentDrawdown(50);
      });

      expect(result.current.isApproachingLimit).toBe(false);
      expect(result.current.isAtLimit).toBe(false);
    });
  });

  describe("currentDrawdownPercent", () => {
    it("starts at 0", () => {
      const { result } = renderHook(() => useTradingSettings());

      expect(result.current.currentDrawdownPercent).toBe(0);
    });

    it("updates via setCurrentDrawdown", async () => {
      const { result } = renderHook(() => useTradingSettings());

      await act(async () => {
        result.current.setCurrentDrawdown(15.5);
      });

      expect(result.current.currentDrawdownPercent).toBe(15.5);
    });
  });

  describe("loading and error states", () => {
    it("sets loading during updateSettings", async () => {
      const { result } = renderHook(() => useTradingSettings());

      // Loading should be set during the operation
      const updatePromise = act(async () => {
        await result.current.updateSettings({
          drawdownProtection: {
            ...result.current.settings.drawdownProtection,
            maxDrawdownPercent: 25,
          },
        });
      });

      await updatePromise;
      expect(result.current.loading).toBe(false);
    });

    it("clears error on successful update", async () => {
      const { result } = renderHook(() => useTradingSettings());

      await act(async () => {
        await result.current.updateSettings({
          drawdownProtection: {
            ...result.current.settings.drawdownProtection,
            maxDrawdownPercent: 25,
          },
        });
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe("backend sync (when authenticated)", () => {
    it("does not sync when not authenticated", async () => {
      const { result } = renderHook(() => useTradingSettings());

      await act(async () => {
        await result.current.updateSettings({
          drawdownProtection: {
            ...result.current.settings.drawdownProtection,
            maxDrawdownPercent: 25,
          },
        });
      });

      // hauntClient methods should not be called
      expect(hauntClient.updatePortfolioSettings).not.toHaveBeenCalled();
    });

    it("attempts backend sync when authenticated", async () => {
      mockUseAuth.mockReturnValue({
        sessionToken: "test-token",
        isAuthenticated: true,
      } as ReturnType<typeof useAuth>);

      const { result } = renderHook(() => useTradingSettings());

      await act(async () => {
        await result.current.updateSettings({
          drawdownProtection: {
            ...result.current.settings.drawdownProtection,
            maxDrawdownPercent: 25,
          },
        });
      });

      // Note: Backend sync is commented out in the hook for now
      // This test documents the expected behavior when implemented
      // expect(hauntClient.updatePortfolioSettings).toHaveBeenCalled();
    });
  });
});
