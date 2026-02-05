/**
 * @file useTradingSettings.ts
 * @description Hook for managing trading settings including drawdown protection.
 *
 * Settings are stored in localStorage for persistence and optionally synced
 * to the backend when authenticated. Provides computed values for determining
 * if drawdown limits are being approached or exceeded.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { Platform } from "react-native";
import {
  type TradingSettings,
  type DrawdownProtectionSettings,
  DEFAULT_TRADING_SETTINGS,
} from "../types/settings";
import { useAuth } from "../context/AuthContext";
import { hauntClient } from "../services/haunt";

/** LocalStorage key for trading settings */
const STORAGE_KEY = "wraith_trading_settings";

/**
 * Result type for useTradingSettings hook
 */
export type UseTradingSettingsResult = {
  /** Current trading settings */
  settings: TradingSettings;
  /** Whether settings are currently being loaded */
  loading: boolean;
  /** Error message if loading or saving failed */
  error: string | null;
  /** Update trading settings (partial update supported) */
  updateSettings: (updates: Partial<TradingSettings>) => Promise<void>;
  /** Update drawdown protection settings specifically */
  updateDrawdownSettings: (updates: Partial<DrawdownProtectionSettings>) => Promise<void>;
  /** Reset all settings to defaults */
  resetToDefaults: () => Promise<void>;
  /** Whether drawdown protection is enabled */
  isDrawdownEnabled: boolean;
  /** Current drawdown percentage (requires portfolio context) */
  currentDrawdownPercent: number;
  /** Whether current drawdown is approaching the warning threshold */
  isApproachingLimit: boolean;
  /** Whether current drawdown has reached the max threshold */
  isAtLimit: boolean;
  /** Set the current drawdown percentage (from portfolio data) */
  setCurrentDrawdown: (percent: number) => void;
};

/**
 * Load settings from localStorage
 * Returns defaults if not found or invalid
 */
function loadSettingsFromStorage(): TradingSettings {
  if (Platform.OS !== "web" || typeof localStorage === "undefined") {
    return DEFAULT_TRADING_SETTINGS;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to handle new fields added in updates
      return {
        ...DEFAULT_TRADING_SETTINGS,
        ...parsed,
        drawdownProtection: {
          ...DEFAULT_TRADING_SETTINGS.drawdownProtection,
          ...parsed.drawdownProtection,
        },
      };
    }
  } catch (err) {
    console.warn("[useTradingSettings] Failed to load from localStorage:", err);
  }

  return DEFAULT_TRADING_SETTINGS;
}

/**
 * Save settings to localStorage
 */
function saveSettingsToStorage(settings: TradingSettings): void {
  if (Platform.OS !== "web" || typeof localStorage === "undefined") {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    // Handle quota exceeded errors
    console.warn("[useTradingSettings] Failed to save to localStorage:", err);
  }
}

/**
 * Hook for managing trading settings with persistence and optional backend sync.
 *
 * @example
 * ```tsx
 * const {
 *   settings,
 *   isDrawdownEnabled,
 *   isApproachingLimit,
 *   updateDrawdownSettings,
 * } = useTradingSettings();
 *
 * // Update a setting
 * await updateDrawdownSettings({ maxDrawdownPercent: 25 });
 *
 * // Check if warning should be shown
 * if (isApproachingLimit) {
 *   showDrawdownWarning();
 * }
 * ```
 */
export function useTradingSettings(): UseTradingSettingsResult {
  const { sessionToken, isAuthenticated } = useAuth();
  const [settings, setSettings] = useState<TradingSettings>(loadSettingsFromStorage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDrawdownPercent, setCurrentDrawdown] = useState(0);

  // Sync from backend on auth change
  useEffect(() => {
    if (!isAuthenticated || !sessionToken) {
      return;
    }

    const syncFromBackend = async () => {
      try {
        // Note: Backend API for settings may not exist yet
        // This will be implemented in Phase 1.4
        // For now, we just use localStorage
        // const response = await hauntClient.getPortfolioSettings(sessionToken, portfolioId);
        // setSettings(mergedSettings);
      } catch (err) {
        // Silently fail - use local settings as fallback
        console.warn("[useTradingSettings] Backend sync skipped (API not available):", err);
      }
    };

    syncFromBackend();
  }, [isAuthenticated, sessionToken]);

  /**
   * Update trading settings with partial values
   */
  const updateSettings = useCallback(
    async (updates: Partial<TradingSettings>): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const newSettings: TradingSettings = {
          ...settings,
          ...updates,
          drawdownProtection: updates.drawdownProtection
            ? { ...settings.drawdownProtection, ...updates.drawdownProtection }
            : settings.drawdownProtection,
        };

        // Save to localStorage first
        saveSettingsToStorage(newSettings);
        setSettings(newSettings);

        // Sync to backend if authenticated
        if (isAuthenticated && sessionToken) {
          try {
            // Note: Backend API for settings may not exist yet
            // await hauntClient.updatePortfolioSettings(sessionToken, portfolioId, newSettings);
          } catch (err) {
            // Log but don't fail - local storage is the primary source
            console.warn("[useTradingSettings] Backend sync failed:", err);
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to save settings";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [settings, isAuthenticated, sessionToken]
  );

  /**
   * Convenience method to update only drawdown settings
   */
  const updateDrawdownSettings = useCallback(
    async (updates: Partial<DrawdownProtectionSettings>): Promise<void> => {
      return updateSettings({
        drawdownProtection: {
          ...settings.drawdownProtection,
          ...updates,
        },
      });
    },
    [updateSettings, settings.drawdownProtection]
  );

  /**
   * Reset all settings to defaults
   */
  const resetToDefaults = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Clear localStorage
      if (Platform.OS === "web" && typeof localStorage !== "undefined") {
        localStorage.removeItem(STORAGE_KEY);
      }

      setSettings(DEFAULT_TRADING_SETTINGS);

      // Sync reset to backend if authenticated
      if (isAuthenticated && sessionToken) {
        try {
          // Note: Backend API for settings may not exist yet
          // await hauntClient.updatePortfolioSettings(sessionToken, portfolioId, DEFAULT_TRADING_SETTINGS);
        } catch (err) {
          console.warn("[useTradingSettings] Backend sync failed on reset:", err);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reset settings";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, sessionToken]);

  // Computed values
  const isDrawdownEnabled = settings.drawdownProtection.enabled;

  const isApproachingLimit = useMemo(() => {
    if (!isDrawdownEnabled) return false;
    const { maxDrawdownPercent, warningThresholdPercent } = settings.drawdownProtection;
    const warningLevel = maxDrawdownPercent * (warningThresholdPercent / 100);
    return currentDrawdownPercent >= warningLevel;
  }, [isDrawdownEnabled, settings.drawdownProtection, currentDrawdownPercent]);

  const isAtLimit = useMemo(() => {
    if (!isDrawdownEnabled) return false;
    return currentDrawdownPercent >= settings.drawdownProtection.maxDrawdownPercent;
  }, [isDrawdownEnabled, settings.drawdownProtection.maxDrawdownPercent, currentDrawdownPercent]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    updateDrawdownSettings,
    resetToDefaults,
    isDrawdownEnabled,
    currentDrawdownPercent,
    isApproachingLimit,
    isAtLimit,
    setCurrentDrawdown,
  };
}
