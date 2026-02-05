/**
 * Tauri Integration Hook
 *
 * Provides access to Tauri native functionality when running as a desktop app.
 * Safely handles cases when running in web browser or mobile.
 */

import { useState, useEffect, useCallback } from "react";

// Type definitions for Tauri APIs
type TauriInvoke = (cmd: string, args?: Record<string, unknown>) => Promise<unknown>;
type TauriListen = (event: string, handler: (event: { payload: unknown }) => void) => Promise<() => void>;

export type SystemInfo = {
  platform: "linux" | "darwin" | "windows" | "ios" | "android";
  arch: string;
  family: string;
};

export type TauriState = {
  /** Whether running in Tauri desktop environment */
  isTauri: boolean;
  /** Whether Tauri APIs are ready */
  isReady: boolean;
  /** System information */
  systemInfo: SystemInfo | null;
};

// Check if we're running in Tauri
const isTauriEnvironment = (): boolean => {
  if (typeof window === "undefined") return false;
  // @ts-ignore - Tauri injects __TAURI__ global
  return typeof window.__TAURI__ !== "undefined";
};

// Get Tauri invoke function
const getTauriInvoke = (): TauriInvoke | null => {
  if (!isTauriEnvironment()) return null;
  // @ts-ignore
  return window.__TAURI__.core?.invoke || window.__TAURI__.tauri?.invoke;
};

// Get Tauri event listener
const getTauriListen = (): TauriListen | null => {
  if (!isTauriEnvironment()) return null;
  // @ts-ignore
  return window.__TAURI__.event?.listen;
};

export function useTauri() {
  const [state, setState] = useState<TauriState>({
    isTauri: false,
    isReady: false,
    systemInfo: null,
  });

  // Initialize Tauri state
  useEffect(() => {
    const initTauri = async () => {
      const isTauri = isTauriEnvironment();

      if (!isTauri) {
        setState({
          isTauri: false,
          isReady: true,
          systemInfo: null,
        });
        return;
      }

      try {
        const invoke = getTauriInvoke();
        if (invoke) {
          const systemInfo = (await invoke("get_system_info")) as SystemInfo;
          setState({
            isTauri: true,
            isReady: true,
            systemInfo,
          });
        }
      } catch (err) {
        console.error("Failed to initialize Tauri:", err);
        setState({
          isTauri: true,
          isReady: true,
          systemInfo: null,
        });
      }
    };

    initTauri();
  }, []);

  /**
   * Check for application updates
   */
  const checkForUpdates = useCallback(async (): Promise<boolean> => {
    const invoke = getTauriInvoke();
    if (!invoke) return false;

    try {
      return (await invoke("check_for_updates")) as boolean;
    } catch (err) {
      console.error("Failed to check for updates:", err);
      return false;
    }
  }, []);

  /**
   * Install update and restart
   */
  const installUpdate = useCallback(async (): Promise<void> => {
    const invoke = getTauriInvoke();
    if (!invoke) return;

    try {
      await invoke("install_update");
    } catch (err) {
      console.error("Failed to install update:", err);
      throw err;
    }
  }, []);

  /**
   * Show native notification
   */
  const showNotification = useCallback(async (title: string, body: string): Promise<void> => {
    const invoke = getTauriInvoke();
    if (!invoke) {
      // Fallback to web notifications
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, { body });
      }
      return;
    }

    try {
      await invoke("show_notification", { title, body });
    } catch (err) {
      console.error("Failed to show notification:", err);
    }
  }, []);

  /**
   * Listen for deep link events
   */
  const onDeepLink = useCallback((handler: (url: string) => void): (() => void) => {
    const listen = getTauriListen();
    if (!listen) return () => {};

    let unlisten: (() => void) | null = null;

    listen("deep-link", (event) => {
      handler(event.payload as string);
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  /**
   * Minimize window to system tray
   */
  const minimizeToTray = useCallback(async (): Promise<void> => {
    if (!isTauriEnvironment()) return;

    try {
      // @ts-ignore
      const window = (await import("@tauri-apps/api/window")).getCurrentWindow();
      await window.hide();
    } catch (err) {
      console.error("Failed to minimize to tray:", err);
    }
  }, []);

  /**
   * Close application
   */
  const closeApp = useCallback(async (): Promise<void> => {
    if (!isTauriEnvironment()) return;

    try {
      // @ts-ignore
      const { exit } = await import("@tauri-apps/api/process");
      await exit(0);
    } catch (err) {
      console.error("Failed to close app:", err);
    }
  }, []);

  return {
    ...state,
    checkForUpdates,
    installUpdate,
    showNotification,
    onDeepLink,
    minimizeToTray,
    closeApp,
  };
}

export default useTauri;
