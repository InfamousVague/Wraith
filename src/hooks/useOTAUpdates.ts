/**
 * OTA Updates Hook
 *
 * Handles Over-The-Air updates for the Expo mobile app.
 * This hook checks for updates and manages the update lifecycle.
 */

import { useState, useEffect, useCallback } from "react";
import { Platform } from "react-native";

// Type definitions for expo-updates (will be available when expo-updates is installed)
type UpdateCheckResult = {
  isAvailable: boolean;
  manifest?: {
    id: string;
    createdAt: string;
    runtimeVersion: string;
    metadata?: Record<string, unknown>;
  };
};

type UpdateFetchResult = {
  isNew: boolean;
  manifest?: {
    id: string;
    createdAt: string;
    runtimeVersion: string;
  };
};

export type UpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "ready"
  | "error"
  | "up-to-date";

export type OTAUpdateState = {
  /** Current update status */
  status: UpdateStatus;
  /** Whether an update is available */
  isUpdateAvailable: boolean;
  /** Whether the update is downloaded and ready to apply */
  isUpdateReady: boolean;
  /** Whether currently checking/downloading */
  isLoading: boolean;
  /** Error message if update failed */
  error: string | null;
  /** Update manifest info if available */
  updateInfo: {
    id: string;
    createdAt: string;
    runtimeVersion: string;
  } | null;
  /** Last check timestamp */
  lastChecked: Date | null;
};

export type UseOTAUpdatesOptions = {
  /** Auto-check for updates on mount. Default: true */
  checkOnMount?: boolean;
  /** Check interval in milliseconds. Default: 5 minutes */
  checkInterval?: number;
  /** Show alert when update is ready. Default: true */
  showReadyAlert?: boolean;
};

const DEFAULT_OPTIONS: UseOTAUpdatesOptions = {
  checkOnMount: true,
  checkInterval: 5 * 60 * 1000, // 5 minutes
  showReadyAlert: true,
};

// Check if we're in a native environment with expo-updates available
const isNativeWithUpdates = (): boolean => {
  if (Platform.OS === "web") return false;

  try {
    // expo-updates is only available in production builds
    // In development, __DEV__ will be true
    // @ts-ignore - __DEV__ is a global in React Native
    if (typeof __DEV__ !== "undefined" && __DEV__) return false;
    return true;
  } catch {
    return false;
  }
};

// Dynamic import for expo-updates (only available in native builds)
let Updates: any = null;
if (isNativeWithUpdates()) {
  try {
    // Dynamic require to avoid bundling issues on web
    Updates = require("expo-updates");
  } catch {
    // expo-updates not available
  }
}

export function useOTAUpdates(options: UseOTAUpdatesOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const [state, setState] = useState<OTAUpdateState>({
    status: "idle",
    isUpdateAvailable: false,
    isUpdateReady: false,
    isLoading: false,
    error: null,
    updateInfo: null,
    lastChecked: null,
  });

  /**
   * Check for available updates
   */
  const checkForUpdate = useCallback(async () => {
    if (!isNativeWithUpdates() || !Updates) {
      // Not in a native environment with updates support
      setState((prev) => ({
        ...prev,
        status: "up-to-date",
        lastChecked: new Date(),
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      status: "checking",
      isLoading: true,
      error: null,
    }));

    try {
      const update: UpdateCheckResult = await Updates.checkForUpdateAsync();

      if (update.isAvailable && update.manifest) {
        setState((prev) => ({
          ...prev,
          status: "available",
          isUpdateAvailable: true,
          isLoading: false,
          updateInfo: {
            id: update.manifest!.id,
            createdAt: update.manifest!.createdAt,
            runtimeVersion: update.manifest!.runtimeVersion,
          },
          lastChecked: new Date(),
        }));
      } else {
        setState((prev) => ({
          ...prev,
          status: "up-to-date",
          isUpdateAvailable: false,
          isLoading: false,
          lastChecked: new Date(),
        }));
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        status: "error",
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to check for updates",
        lastChecked: new Date(),
      }));
    }
  }, []);

  /**
   * Download the available update
   */
  const downloadUpdate = useCallback(async () => {
    if (!isNativeWithUpdates() || !Updates || !state.isUpdateAvailable) {
      return;
    }

    setState((prev) => ({
      ...prev,
      status: "downloading",
      isLoading: true,
      error: null,
    }));

    try {
      const result: UpdateFetchResult = await Updates.fetchUpdateAsync();

      if (result.isNew) {
        setState((prev) => ({
          ...prev,
          status: "ready",
          isUpdateReady: true,
          isLoading: false,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          status: "up-to-date",
          isLoading: false,
        }));
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        status: "error",
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to download update",
      }));
    }
  }, [state.isUpdateAvailable]);

  /**
   * Apply the downloaded update (will reload the app)
   */
  const applyUpdate = useCallback(async () => {
    if (!isNativeWithUpdates() || !Updates || !state.isUpdateReady) {
      return;
    }

    try {
      await Updates.reloadAsync();
    } catch (err) {
      setState((prev) => ({
        ...prev,
        status: "error",
        error: err instanceof Error ? err.message : "Failed to apply update",
      }));
    }
  }, [state.isUpdateReady]);

  /**
   * Check for update and download if available
   */
  const checkAndDownload = useCallback(async () => {
    await checkForUpdate();

    // Wait for state to update
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Auto-download if update available
    if (state.isUpdateAvailable) {
      await downloadUpdate();
    }
  }, [checkForUpdate, downloadUpdate, state.isUpdateAvailable]);

  // Auto-check on mount
  useEffect(() => {
    if (opts.checkOnMount) {
      checkForUpdate();
    }
  }, [opts.checkOnMount, checkForUpdate]);

  // Periodic check interval
  useEffect(() => {
    if (!opts.checkInterval || opts.checkInterval <= 0) return;

    const interval = setInterval(() => {
      checkForUpdate();
    }, opts.checkInterval);

    return () => clearInterval(interval);
  }, [opts.checkInterval, checkForUpdate]);

  return {
    ...state,
    checkForUpdate,
    downloadUpdate,
    applyUpdate,
    checkAndDownload,
  };
}

export default useOTAUpdates;
