/**
 * Sherpa Context Provider
 *
 * Manages the state and logic for hint-based onboarding.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { SherpaState, SherpaContextValue, SherpaProgress } from "./types";

const STORAGE_KEY = "wraith-sherpa-progress";

const initialProgress: SherpaProgress = {
  viewedHints: [],
  lastUpdated: Date.now(),
};

const initialState: SherpaState = {
  progress: initialProgress,
  hintsEnabled: true,
  activeHintId: null,
};

const SherpaContext = createContext<SherpaContextValue | null>(null);

type SherpaProviderProps = {
  children: React.ReactNode;
};

export function SherpaProvider({ children }: SherpaProviderProps) {
  const [state, setState] = useState<SherpaState>(() => {
    // Load progress from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const progress = JSON.parse(stored) as SherpaProgress;
        return { ...initialState, progress };
      }
    } catch {
      // Ignore errors
    }
    return initialState;
  });

  // Persist progress to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
    } catch {
      // Ignore errors
    }
  }, [state.progress]);

  const showHint = useCallback((hintId: string) => {
    setState((prev) => ({
      ...prev,
      activeHintId: hintId,
    }));
  }, []);

  const dismissHint = useCallback(() => {
    setState((prev) => ({
      ...prev,
      activeHintId: null,
    }));
  }, []);

  const markHintViewed = useCallback((hintId: string) => {
    setState((prev) => {
      if (prev.progress.viewedHints.includes(hintId)) {
        return prev;
      }
      return {
        ...prev,
        activeHintId: null,
        progress: {
          ...prev.progress,
          viewedHints: [...prev.progress.viewedHints, hintId],
          lastUpdated: Date.now(),
        },
      };
    });
  }, []);

  const isHintViewed = useCallback(
    (hintId: string) => state.progress.viewedHints.includes(hintId),
    [state.progress.viewedHints]
  );

  const resetHint = useCallback((hintId: string) => {
    setState((prev) => ({
      ...prev,
      progress: {
        ...prev.progress,
        viewedHints: prev.progress.viewedHints.filter((id) => id !== hintId),
        lastUpdated: Date.now(),
      },
    }));
  }, []);

  const resetAllHints = useCallback(() => {
    setState((prev) => ({
      ...prev,
      progress: {
        viewedHints: [],
        lastUpdated: Date.now(),
      },
    }));
  }, []);

  const setHintsEnabled = useCallback((enabled: boolean) => {
    setState((prev) => ({
      ...prev,
      hintsEnabled: enabled,
    }));
  }, []);

  const value: SherpaContextValue = {
    state,
    showHint,
    dismissHint,
    markHintViewed,
    isHintViewed,
    resetHint,
    resetAllHints,
    setHintsEnabled,
  };

  return (
    <SherpaContext.Provider value={value}>{children}</SherpaContext.Provider>
  );
}

export function useSherpa(): SherpaContextValue {
  const context = useContext(SherpaContext);
  if (!context) {
    throw new Error("useSherpa must be used within a SherpaProvider");
  }
  return context;
}
