import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from "react";

type Theme = "dark" | "light";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
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
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage for saved preference
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("wraith-theme");
      if (saved === "light" || saved === "dark") {
        return saved;
      }
    }
    return "dark";
  });

  const isDark = theme === "dark";

  useEffect(() => {
    // Save to localStorage
    localStorage.setItem("wraith-theme", theme);

    // Update document class for CSS variables
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  // Memoize context value to prevent unnecessary re-renders of all consumers
  const value = useMemo<ThemeContextType>(
    () => ({ theme, toggleTheme, isDark }),
    [theme, toggleTheme, isDark]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
