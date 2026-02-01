import { useState, useEffect } from "react";
import { Platform } from "react-native";

/**
 * A useState hook that persists the value to localStorage.
 * Only works on web; on native, it behaves like regular useState.
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    if (Platform.OS !== "web" || typeof localStorage === "undefined") {
      return defaultValue;
    }

    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    if (Platform.OS !== "web" || typeof localStorage === "undefined") {
      return;
    }

    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore storage errors (quota exceeded, etc.)
    }
  }, [key, value]);

  return [value, setValue];
}
