/**
 * Preference Sync Context
 *
 * Syncs user preferences across servers using the authenticated session.
 * Handles bidirectional sync with conflict resolution (server wins on conflict).
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { hauntClient, type ProfileSettings } from "../services/haunt";
import { useAuth } from "./AuthContext";

/** Server preferences with metadata */
export type ServerPreferences = {
  autoFastest?: boolean;
  preferredServer?: string;
  defaultTimeframe?: string;
  preferredIndicators?: string[];
  notificationsEnabled?: boolean;
  updatedAt?: number;
};

type PreferenceSyncContextType = {
  /** Preferences from server */
  serverPreferences: ServerPreferences | null;
  /** Whether sync is in progress */
  syncing: boolean;
  /** Last sync error if any */
  syncError: string | null;
  /** Update a single preference (syncs to server) */
  updatePreference: <K extends keyof ServerPreferences>(key: K, value: ServerPreferences[K]) => void;
  /** Force refresh from server */
  refreshFromServer: () => Promise<void>;
  /** Whether connected and syncing */
  isEnabled: boolean;
};

const PreferenceSyncContext = createContext<PreferenceSyncContextType | null>(null);

const LOCAL_PREFS_KEY = "wraith_user_preferences";
const SYNC_DEBOUNCE_MS = 1000;

export function PreferenceSyncProvider({ children }: { children: React.ReactNode }) {
  const { sessionToken, serverProfile, isConnectedToServer } = useAuth();
  const [serverPreferences, setServerPreferences] = useState<ServerPreferences | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Debounce timer for batching updates
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingUpdatesRef = useRef<Partial<ServerPreferences>>({});

  // Load preferences from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_PREFS_KEY);
      if (stored) {
        setServerPreferences(JSON.parse(stored));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Sync from server when connected
  useEffect(() => {
    if (isConnectedToServer && serverProfile?.settings) {
      const serverPrefs: ServerPreferences = {
        defaultTimeframe: serverProfile.settings.defaultTimeframe,
        preferredIndicators: serverProfile.settings.preferredIndicators,
        notificationsEnabled: serverProfile.settings.notificationsEnabled,
        updatedAt: Date.now(),
      };
      setServerPreferences(prev => ({ ...prev, ...serverPrefs }));

      // Save to local storage
      try {
        localStorage.setItem(LOCAL_PREFS_KEY, JSON.stringify(serverPrefs));
      } catch {
        // Ignore storage errors
      }
    }
  }, [isConnectedToServer, serverProfile]);

  // Refresh preferences from server
  const refreshFromServer = useCallback(async () => {
    if (!sessionToken) return;

    setSyncing(true);
    setSyncError(null);

    try {
      const response = await hauntClient.getMe(sessionToken);
      if (response.data?.settings) {
        const serverPrefs: ServerPreferences = {
          ...serverPreferences,
          defaultTimeframe: response.data.settings.defaultTimeframe,
          preferredIndicators: response.data.settings.preferredIndicators,
          notificationsEnabled: response.data.settings.notificationsEnabled,
          updatedAt: Date.now(),
        };
        setServerPreferences(serverPrefs);

        // Save to local storage
        try {
          localStorage.setItem(LOCAL_PREFS_KEY, JSON.stringify(serverPrefs));
        } catch {
          // Ignore storage errors
        }
      }
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }, [sessionToken, serverPreferences]);

  // Sync pending updates to server
  const flushUpdates = useCallback(async () => {
    if (!sessionToken || Object.keys(pendingUpdatesRef.current).length === 0) return;

    const updates = { ...pendingUpdatesRef.current };
    pendingUpdatesRef.current = {};

    setSyncing(true);
    setSyncError(null);

    try {
      // Build settings object for API
      const settings: ProfileSettings = {
        defaultTimeframe: updates.defaultTimeframe ?? serverPreferences?.defaultTimeframe ?? "1h",
        preferredIndicators: updates.preferredIndicators ?? serverPreferences?.preferredIndicators ?? [],
        notificationsEnabled: updates.notificationsEnabled ?? serverPreferences?.notificationsEnabled ?? false,
      };

      await hauntClient.updateProfile(sessionToken, settings);

      // Update local state
      const newPrefs = {
        ...serverPreferences,
        ...updates,
        updatedAt: Date.now(),
      };
      setServerPreferences(newPrefs);

      // Save to local storage
      try {
        localStorage.setItem(LOCAL_PREFS_KEY, JSON.stringify(newPrefs));
      } catch {
        // Ignore storage errors
      }
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : "Sync failed");
      // Put updates back for retry
      pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...updates };
    } finally {
      setSyncing(false);
    }
  }, [sessionToken, serverPreferences]);

  // Update a single preference with debouncing
  const updatePreference = useCallback(<K extends keyof ServerPreferences>(
    key: K,
    value: ServerPreferences[K]
  ) => {
    // Update local state immediately
    setServerPreferences(prev => {
      const updated = { ...prev, [key]: value, updatedAt: Date.now() };
      // Save to local storage
      try {
        localStorage.setItem(LOCAL_PREFS_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage errors
      }
      return updated;
    });

    // Queue for server sync
    pendingUpdatesRef.current[key] = value;

    // Debounce server sync
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    syncTimeoutRef.current = setTimeout(() => {
      flushUpdates();
    }, SYNC_DEBOUNCE_MS);
  }, [flushUpdates]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  const value: PreferenceSyncContextType = {
    serverPreferences,
    syncing,
    syncError,
    updatePreference,
    refreshFromServer,
    isEnabled: isConnectedToServer,
  };

  return (
    <PreferenceSyncContext.Provider value={value}>
      {children}
    </PreferenceSyncContext.Provider>
  );
}

/**
 * Hook to use preference sync context.
 * Throws if used outside provider.
 */
export function usePreferenceSync() {
  const context = useContext(PreferenceSyncContext);
  if (!context) {
    throw new Error("usePreferenceSync must be used within PreferenceSyncProvider");
  }
  return context;
}

/**
 * Safe hook that returns null when PreferenceSyncContext is not available.
 * This allows components to optionally use preference sync without errors.
 */
export function usePreferenceSyncSafe(): PreferenceSyncContextType | null {
  return useContext(PreferenceSyncContext);
}
