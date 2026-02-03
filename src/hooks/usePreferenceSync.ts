/**
 * usePreferenceSync Hook
 *
 * Manages synchronization of user preferences between local storage
 * and the backend server. Handles:
 * - Fetching preferences on login
 * - Debounced sync on preference changes
 * - Re-sync on server switch
 * - Offline queue for changes when disconnected
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useApiServer } from "../context/ApiServerContext";

/** User preferences structure matching backend */
export type UserPreferences = {
  theme: string;
  language: string;
  performanceLevel: string;
  preferredServer: string | null;
  autoFastest: boolean;
  onboardingProgress: string[];
  updatedAt: number;
};

/** Default preferences */
const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "dark",
  language: "en",
  performanceLevel: "balanced",
  preferredServer: null,
  autoFastest: false,
  onboardingProgress: [],
  updatedAt: Date.now(),
};

const STORAGE_KEY = "wraith_user_preferences";
const DEBOUNCE_MS = 1000;

type PreferenceSyncState = {
  /** Current preferences */
  preferences: UserPreferences;
  /** Whether sync is in progress */
  isSyncing: boolean;
  /** Last sync error if any */
  syncError: string | null;
  /** Whether we have unsynced local changes */
  hasUnsyncedChanges: boolean;
};

type PreferenceSyncActions = {
  /** Update a single preference field */
  updatePreference: <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => void;
  /** Update multiple preference fields at once */
  updatePreferences: (partial: Partial<UserPreferences>) => void;
  /** Force sync preferences to server now */
  syncNow: () => Promise<void>;
  /** Force fetch preferences from server */
  fetchFromServer: () => Promise<void>;
};

/**
 * Hook for managing user preference synchronization.
 */
export function usePreferenceSync(): PreferenceSyncState & PreferenceSyncActions {
  const { isAuthenticated, isConnectedToServer, sessionToken } = useAuth();
  const { activeServer, hauntClient } = useApiServer();

  const [state, setState] = useState<PreferenceSyncState>({
    preferences: loadLocalPreferences(),
    isSyncing: false,
    syncError: null,
    hasUnsyncedChanges: false,
  });

  // Refs for debouncing and tracking
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncedServerRef = useRef<string | null>(null);
  const pendingChangesRef = useRef<Partial<UserPreferences>>({});

  /**
   * Load preferences from localStorage.
   */
  function loadLocalPreferences(): UserPreferences {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_PREFERENCES, ...parsed };
      }
    } catch (e) {
      console.error("Failed to load preferences:", e);
    }
    return DEFAULT_PREFERENCES;
  }

  /**
   * Save preferences to localStorage.
   */
  function saveLocalPreferences(prefs: UserPreferences): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (e) {
      console.error("Failed to save preferences:", e);
    }
  }

  /**
   * Fetch preferences from server.
   */
  const fetchFromServer = useCallback(async () => {
    if (!isConnectedToServer || !sessionToken) return;

    setState((s) => ({ ...s, isSyncing: true, syncError: null }));

    try {
      const response = await hauntClient.getPreferences(sessionToken);
      const serverPrefs = response.data;

      // Merge with local, server wins if newer
      setState((s) => {
        const localPrefs = s.preferences;
        const merged =
          serverPrefs.updatedAt > localPrefs.updatedAt
            ? { ...DEFAULT_PREFERENCES, ...serverPrefs }
            : localPrefs;

        saveLocalPreferences(merged);
        return {
          ...s,
          preferences: merged,
          isSyncing: false,
          hasUnsyncedChanges: false,
        };
      });
    } catch (e) {
      console.error("Failed to fetch preferences:", e);
      setState((s) => ({
        ...s,
        isSyncing: false,
        syncError: e instanceof Error ? e.message : "Failed to fetch preferences",
      }));
    }
  }, [isConnectedToServer, sessionToken, hauntClient]);

  /**
   * Sync local preferences to server.
   */
  const syncToServer = useCallback(
    async (prefs: Partial<UserPreferences>) => {
      if (!isConnectedToServer || !sessionToken) {
        // Queue for later
        pendingChangesRef.current = { ...pendingChangesRef.current, ...prefs };
        setState((s) => ({ ...s, hasUnsyncedChanges: true }));
        return;
      }

      setState((s) => ({ ...s, isSyncing: true, syncError: null }));

      try {
        await hauntClient.updatePreferences(sessionToken, prefs);
        pendingChangesRef.current = {};
        setState((s) => ({
          ...s,
          isSyncing: false,
          hasUnsyncedChanges: false,
        }));
      } catch (e) {
        console.error("Failed to sync preferences:", e);
        // Keep changes for retry
        pendingChangesRef.current = { ...pendingChangesRef.current, ...prefs };
        setState((s) => ({
          ...s,
          isSyncing: false,
          hasUnsyncedChanges: true,
          syncError: e instanceof Error ? e.message : "Failed to sync preferences",
        }));
      }
    },
    [isConnectedToServer, sessionToken, hauntClient]
  );

  /**
   * Update a single preference field.
   */
  const updatePreference = useCallback(
    <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
      setState((s) => {
        const updated = {
          ...s.preferences,
          [key]: value,
          updatedAt: Date.now(),
        };
        saveLocalPreferences(updated);

        // Debounce sync
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
          syncToServer({ [key]: value, updatedAt: updated.updatedAt });
        }, DEBOUNCE_MS);

        return {
          ...s,
          preferences: updated,
          hasUnsyncedChanges: true,
        };
      });
    },
    [syncToServer]
  );

  /**
   * Update multiple preference fields at once.
   */
  const updatePreferences = useCallback(
    (partial: Partial<UserPreferences>) => {
      setState((s) => {
        const updated = {
          ...s.preferences,
          ...partial,
          updatedAt: Date.now(),
        };
        saveLocalPreferences(updated);

        // Debounce sync
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
          syncToServer({ ...partial, updatedAt: updated.updatedAt });
        }, DEBOUNCE_MS);

        return {
          ...s,
          preferences: updated,
          hasUnsyncedChanges: true,
        };
      });
    },
    [syncToServer]
  );

  /**
   * Force sync now (skip debounce).
   */
  const syncNow = useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    await syncToServer({
      ...pendingChangesRef.current,
      updatedAt: state.preferences.updatedAt,
    });
  }, [syncToServer, state.preferences.updatedAt]);

  // Fetch from server on login
  useEffect(() => {
    if (isAuthenticated && isConnectedToServer) {
      fetchFromServer();
    }
  }, [isAuthenticated, isConnectedToServer, fetchFromServer]);

  // Re-sync when server changes
  useEffect(() => {
    if (activeServer && activeServer.id !== lastSyncedServerRef.current) {
      lastSyncedServerRef.current = activeServer.id;

      if (isConnectedToServer) {
        // Fetch from new server
        fetchFromServer();

        // Sync any pending changes
        if (Object.keys(pendingChangesRef.current).length > 0) {
          syncToServer(pendingChangesRef.current);
        }
      }
    }
  }, [activeServer, isConnectedToServer, fetchFromServer, syncToServer]);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    ...state,
    updatePreference,
    updatePreferences,
    syncNow,
    fetchFromServer,
  };
}

/**
 * Create a preference sync context for sharing across components.
 */
export { DEFAULT_PREFERENCES };
