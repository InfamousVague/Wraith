/**
 * Hint Context
 *
 * Manages the hint/onboarding system:
 * - Tracks which hints have been viewed
 * - Controls which hint is currently "active" (pulsing)
 * - Only one hint pulses at a time, in sequence
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

type HintContextType = {
  /** IDs of hints that have been viewed */
  viewedHints: string[];
  /** The currently active (pulsing) hint ID */
  activeHint: string | null;
  /** Register a hint - adds to queue if not viewed */
  registerHint: (id: string, priority?: number) => void;
  /** Unregister a hint - removes from queue */
  unregisterHint: (id: string) => void;
  /** Mark a hint as viewed and activate next in queue */
  dismissHint: (id: string) => void;
  /** Check if a specific hint is the active one */
  isActive: (id: string) => boolean;
  /** Check if a hint has been viewed */
  isViewed: (id: string) => boolean;
};

const HintContext = createContext<HintContextType | null>(null);

const VIEWED_KEY = "wraith-hints-viewed";

type HintEntry = {
  id: string;
  priority: number;
};

export function HintProvider({ children }: { children: React.ReactNode }) {
  const [viewedHints, setViewedHints] = useState<string[]>([]);
  const [hintQueue, setHintQueue] = useState<HintEntry[]>([]);
  const [activeHint, setActiveHint] = useState<string | null>(null);

  // Load viewed hints from sessionStorage on mount
  useEffect(() => {
    try {
      const viewed = JSON.parse(sessionStorage.getItem(VIEWED_KEY) || "[]");
      setViewedHints(viewed);
    } catch {}
  }, []);

  // Determine active hint when queue or viewed hints change
  useEffect(() => {
    // Find the first unviewed hint in the queue (sorted by priority)
    const sortedQueue = [...hintQueue].sort((a, b) => a.priority - b.priority);
    const nextActive = sortedQueue.find(h => !viewedHints.includes(h.id));
    setActiveHint(nextActive?.id || null);
  }, [hintQueue, viewedHints]);

  const registerHint = useCallback((id: string, priority: number = 100) => {
    setHintQueue(prev => {
      // Don't add duplicates
      if (prev.some(h => h.id === id)) return prev;
      return [...prev, { id, priority }];
    });
  }, []);

  const unregisterHint = useCallback((id: string) => {
    setHintQueue(prev => prev.filter(h => h.id !== id));
  }, []);

  const dismissHint = useCallback((id: string) => {
    setViewedHints(prev => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      try {
        sessionStorage.setItem(VIEWED_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const isActive = useCallback((id: string) => activeHint === id, [activeHint]);
  const isViewed = useCallback((id: string) => viewedHints.includes(id), [viewedHints]);

  return (
    <HintContext.Provider
      value={{
        viewedHints,
        activeHint,
        registerHint,
        unregisterHint,
        dismissHint,
        isActive,
        isViewed,
      }}
    >
      {children}
    </HintContext.Provider>
  );
}

export function useHints() {
  const context = useContext(HintContext);
  if (!context) {
    throw new Error("useHints must be used within a HintProvider");
  }
  return context;
}
