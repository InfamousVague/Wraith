/**
 * Performance Context
 *
 * Manages application performance settings including update throttling.
 * - Fast mode (rabbit): Real-time updates at full speed
 * - Slow mode (turtle): Throttled updates for smoother animations
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { usePreferenceSyncSafe } from "./PreferenceSyncContext";

/**
 * Speed levels for update throttling.
 * - slow: Heavy throttling, ~2 updates/sec (turtle)
 * - balanced: Moderate throttling, ~5 updates/sec (scale)
 * - fast: No throttling, all updates instantly (rabbit)
 */
export type SpeedLevel = "slow" | "balanced" | "fast";

export const SPEED_LEVELS: { value: SpeedLevel; label: string; icon: string; description: string }[] = [
  { value: "slow", label: "Slow", icon: "turtle", description: "Relaxed updates (~1/sec)" },
  { value: "balanced", label: "Balanced", icon: "scale", description: "Balanced updates (~5/sec)" },
  { value: "fast", label: "Fast", icon: "rabbit", description: "Real-time updates" },
];

type PerformanceContextType = {
  /** Current speed level */
  speedLevel: SpeedLevel;
  /** Set the speed level */
  setSpeedLevel: (level: SpeedLevel) => void;
  /** Throttle delay in milliseconds */
  throttleMs: number;
  /** Whether updates are currently throttled */
  isThrottled: boolean;
  /** Create a throttled callback that respects the current speed level */
  createThrottledCallback: <T extends (...args: any[]) => void>(
    callback: T,
    key?: string
  ) => T;
};

const STORAGE_KEY = "wraith-speed-level";

// Throttle settings in milliseconds
const THROTTLE_CONFIG: Record<SpeedLevel, number> = {
  slow: 1000,     // 1000ms throttle - ~1 update/sec (dramatic slowdown)
  balanced: 200,  // 200ms throttle - ~5 updates/sec
  fast: 0,        // No throttling - full speed
};

const PerformanceContext = createContext<PerformanceContextType>({
  speedLevel: "fast",
  setSpeedLevel: () => {},
  throttleMs: 100,
  isThrottled: true,
  createThrottledCallback: (cb) => cb,
});

export function usePerformance() {
  return useContext(PerformanceContext);
}

/**
 * Hook to get just the throttle value (for components that only need this)
 */
export function useThrottleMs() {
  const { throttleMs } = useContext(PerformanceContext);
  return throttleMs;
}

/**
 * Validate and return a valid speed level
 */
function isValidSpeedLevel(value: string | null): value is SpeedLevel {
  return value === "slow" || value === "balanced" || value === "fast";
}

type PerformanceProviderProps = {
  children: ReactNode;
};

export function PerformanceProvider({ children }: PerformanceProviderProps) {
  const [speedLevel, setSpeedLevelState] = useState<SpeedLevel>(() => {
    // Initialize from localStorage
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (isValidSpeedLevel(stored)) {
        return stored;
      }
    }
    return "fast"; // Default to fast mode
  });

  // Preference sync (may not be available during initial load)
  const prefSync = usePreferenceSyncSafe();

  // Track last call times for throttled callbacks
  const lastCallTimes = useRef<Map<string, number>>(new Map());
  const pendingCalls = useRef<Map<string, { args: any[]; timeout: NodeJS.Timeout }>>(new Map());

  const throttleMs = THROTTLE_CONFIG[speedLevel];
  const isThrottled = throttleMs > 0;

  // Persist to localStorage when level changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, speedLevel);
  }, [speedLevel]);

  const setSpeedLevel = useCallback((level: SpeedLevel) => {
    setSpeedLevelState(level);
    // Clear any pending throttled calls when level changes
    pendingCalls.current.forEach(({ timeout }) => clearTimeout(timeout));
    pendingCalls.current.clear();
    lastCallTimes.current.clear();

    // Sync to server if available
    if (prefSync) {
      prefSync.updatePreference("performanceLevel", level);
    }
  }, [prefSync]);

  // Apply server preferences when they arrive
  useEffect(() => {
    if (prefSync?.serverPreferences?.performanceLevel) {
      const serverLevel = prefSync.serverPreferences.performanceLevel as SpeedLevel;
      if (isValidSpeedLevel(serverLevel)) {
        // Check if server is newer than local
        const localPrefs = localStorage.getItem("wraith_user_preferences");
        if (localPrefs) {
          try {
            const parsed = JSON.parse(localPrefs);
            const serverUpdatedAt = prefSync.serverPreferences.updatedAt || 0;
            const localUpdatedAt = parsed.updatedAt || 0;
            if (serverUpdatedAt > localUpdatedAt) {
              setSpeedLevelState(serverLevel);
            }
          } catch {
            setSpeedLevelState(serverLevel);
          }
        } else {
          setSpeedLevelState(serverLevel);
        }
      }
    }
  }, [prefSync?.serverPreferences?.performanceLevel, prefSync?.serverPreferences?.updatedAt]);

  /**
   * Creates a throttled version of a callback that respects the current speed level.
   * In realtime mode, callbacks execute immediately.
   * In other modes, callbacks are throttled to execute at most every `throttleMs`.
   */
  const createThrottledCallback = useCallback(<T extends (...args: any[]) => void>(
    callback: T,
    key: string = Math.random().toString(36)
  ): T => {
    return ((...args: any[]) => {
      const currentThrottleMs = THROTTLE_CONFIG[speedLevel];

      // Realtime mode - execute immediately
      if (currentThrottleMs === 0) {
        callback(...args);
        return;
      }

      const now = Date.now();
      const lastCallTime = lastCallTimes.current.get(key) ?? 0;
      const timeSinceLastCall = now - lastCallTime;

      // If enough time has passed, execute immediately
      if (timeSinceLastCall >= currentThrottleMs) {
        lastCallTimes.current.set(key, now);
        callback(...args);
        return;
      }

      // Otherwise, schedule for later (replacing any existing pending call)
      const existing = pendingCalls.current.get(key);
      if (existing) {
        clearTimeout(existing.timeout);
      }

      const delay = currentThrottleMs - timeSinceLastCall;
      const timeout = setTimeout(() => {
        lastCallTimes.current.set(key, Date.now());
        const pending = pendingCalls.current.get(key);
        if (pending) {
          callback(...pending.args);
          pendingCalls.current.delete(key);
        }
      }, delay);

      pendingCalls.current.set(key, { args, timeout });
    }) as T;
  }, [speedLevel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      pendingCalls.current.forEach(({ timeout }) => clearTimeout(timeout));
    };
  }, []);

  return (
    <PerformanceContext.Provider
      value={{
        speedLevel,
        setSpeedLevel,
        throttleMs,
        isThrottled,
        createThrottledCallback,
      }}
    >
      {children}
    </PerformanceContext.Provider>
  );
}
