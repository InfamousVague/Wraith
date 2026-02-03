/**
 * PreferenceSyncContext
 *
 * Centralized preference synchronization that coordinates between:
 * - Local context providers (ThemeContext, PerformanceContext, etc.)
 * - Backend server via usePreferenceSync hook
 * - Cross-server sync on server switch
 *
 * This provider should wrap all preference-related contexts and provides
 * a unified interface for syncing preferences to/from the server.
 */

import React, { createContext, useContext, useEffect, useRef, useCallback, useState } from "react";
import { useAuth } from "./AuthContext";
import { useApiServer } from "./ApiServerContext";
import type { UserPreferences } from "../hooks/usePreferenceSync";

const DEBOUNCE_MS = 1000;
const STORAGE_KEY = "wraith_user_preferences";

type SyncStatus = "idle" | "syncing" | "error";

type PreferenceSyncContextType = {
  /** Current sync status */
  syncStatus: SyncStatus;
  /** Last sync error if any */
  syncError: string | null;
  /** Whether we have unsynced local changes */
  hasUnsyncedChanges: boolean;
  /** Server preferences (last fetched) */
  serverPreferences: Partial<UserPreferences> | null;
  /** Update a preference and trigger sync */
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  /** Update multiple preferences and trigger sync */
  updatePreferences: (partial: Partial<UserPreferences>) => void;
  /** Force sync to server now */
  syncNow: () => Promise<void>;
  /** Force fetch from server */
  fetchFromServer: () => Promise<void>;
};

const PreferenceSyncContext = createContext<PreferenceSyncContextType | null>(null);

/**
 * Load preferences from localStorage.
 */
function loadLocalPreferences(): Partial<UserPreferences> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load preferences:", e);
  }
  return {};
}

/**
 * Save preferences to localStorage.
 */
function saveLocalPreferences(prefs: Partial<UserPreferences>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.error("Failed to save preferences:", e);
  }
}

export function PreferenceSyncProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isConnectedToServer, sessionToken } = useAuth();
  const { activeServer, hauntClient } = useApiServer();

  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [syncError, setSyncError] = useState<string | null>(null);
  const [hasUnsyncedChanges, setHasUnsyncedChanges] = useState(false);
  const [serverPreferences, setServerPreferences] = useState<Partial<UserPreferences> | null>(null);

  // Refs for debouncing and tracking
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncedServerRef = useRef<string | null>(null);
  const pendingChangesRef = useRef<Partial<UserPreferences>>({});
  const onPreferenceChangeCallbacksRef = useRef<Set<(prefs: Partial<UserPreferences>) => void>>(new Set());

  /**
   * Fetch preferences from server.
   */
  const fetchFromServer = useCallback(async () => {
    if (!isConnectedToServer || !sessionToken) return;

    setSyncStatus("syncing");
    setSyncError(null);

    try {
      const response = await hauntClient.getPreferences(sessionToken);
      const serverPrefs = response.data;

      // Store server preferences
      setServerPreferences(serverPrefs);

      // Merge with local - server wins if newer
      const localPrefs = loadLocalPreferences();
      const serverUpdatedAt = serverPrefs.updatedAt || 0;
      const localUpdatedAt = localPrefs.updatedAt || 0;

      if (serverUpdatedAt > localUpdatedAt) {
        // Server is newer, apply to local
        saveLocalPreferences(serverPrefs);
        // Notify listeners of preference changes
        onPreferenceChangeCallbacksRef.current.forEach((cb) => cb(serverPrefs));
      }

      setSyncStatus("idle");
      setHasUnsyncedChanges(false);
    } catch (e) {
      console.error("Failed to fetch preferences:", e);
      setSyncStatus("error");
      setSyncError(e instanceof Error ? e.message : "Failed to fetch preferences");
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
        setHasUnsyncedChanges(true);
        return;
      }

      setSyncStatus("syncing");
      setSyncError(null);

      try {
        await hauntClient.updatePreferences(sessionToken, prefs);
        pendingChangesRef.current = {};
        setSyncStatus("idle");
        setHasUnsyncedChanges(false);
      } catch (e) {
        console.error("Failed to sync preferences:", e);
        // Keep changes for retry
        pendingChangesRef.current = { ...pendingChangesRef.current, ...prefs };
        setSyncStatus("error");
        setHasUnsyncedChanges(true);
        setSyncError(e instanceof Error ? e.message : "Failed to sync preferences");
      }
    },
    [isConnectedToServer, sessionToken, hauntClient]
  );

  /**
   * Update a single preference field.
   */
  const updatePreference = useCallback(
    <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
      const localPrefs = loadLocalPreferences();
      const updated = {
        ...localPrefs,
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

      setHasUnsyncedChanges(true);
    },
    [syncToServer]
  );

  /**
   * Update multiple preference fields at once.
   */
  const updatePreferences = useCallback(
    (partial: Partial<UserPreferences>) => {
      const localPrefs = loadLocalPreferences();
      const updated = {
        ...localPrefs,
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

      setHasUnsyncedChanges(true);
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
    const localPrefs = loadLocalPreferences();
    await syncToServer({
      ...pendingChangesRef.current,
      updatedAt: localPrefs.updatedAt || Date.now(),
    });
  }, [syncToServer]);

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

  return (
    <PreferenceSyncContext.Provider
      value={{
        syncStatus,
        syncError,
        hasUnsyncedChanges,
        serverPreferences,
        updatePreference,
        updatePreferences,
        syncNow,
        fetchFromServer,
      }}
    >
      {children}
    </PreferenceSyncContext.Provider>
  );
}

export function usePreferenceSyncContext() {
  const context = useContext(PreferenceSyncContext);
  if (!context) {
    throw new Error("usePreferenceSyncContext must be used within a PreferenceSyncProvider");
  }
  return context;
}

/**
 * Safe version that returns null if not in provider (for contexts that load before sync).
 */
export function usePreferenceSyncSafe() {
  return useContext(PreferenceSyncContext);
}
