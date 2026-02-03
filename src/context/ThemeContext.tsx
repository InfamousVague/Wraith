import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from "react";
import { usePreferenceSyncSafe } from "./PreferenceSyncContext";

type Theme = "dark" | "light";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

type ThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Check localStorage for saved preference
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("wraith-theme");
      if (saved === "light" || saved === "dark") {
        return saved;
      }
    }
    return "dark";
  });

  // Preference sync (may not be available during initial load)
  const prefSync = usePreferenceSyncSafe();

  const isDark = theme === "dark";

  useEffect(() => {
    // Save to localStorage
    localStorage.setItem("wraith-theme", theme);

    // Update document class for CSS variables
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Sync theme changes to server
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);

    // Sync to server if available
    if (prefSync) {
      prefSync.updatePreference("theme", newTheme);
    }
  }, [prefSync]);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  // Apply server preferences when they arrive
  useEffect(() => {
    if (prefSync?.serverPreferences?.theme) {
      const serverTheme = prefSync.serverPreferences.theme as Theme;
      if (serverTheme === "dark" || serverTheme === "light") {
        // Check if server theme is newer than local
        const localPrefs = localStorage.getItem("wraith_user_preferences");
        if (localPrefs) {
          try {
            const parsed = JSON.parse(localPrefs);
            const serverUpdatedAt = prefSync.serverPreferences.updatedAt || 0;
            const localUpdatedAt = parsed.updatedAt || 0;
            if (serverUpdatedAt > localUpdatedAt) {
              setThemeState(serverTheme);
            }
          } catch {
            // On parse error, use server theme
            setThemeState(serverTheme);
          }
        } else {
          // No local prefs, use server theme
          setThemeState(serverTheme);
        }
      }
    }
  }, [prefSync?.serverPreferences?.theme, prefSync?.serverPreferences?.updatedAt]);

  // Memoize context value to prevent unnecessary re-renders of all consumers
  const value = useMemo<ThemeContextType>(
    () => ({ theme, toggleTheme, setTheme, isDark }),
    [theme, toggleTheme, setTheme, isDark]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
