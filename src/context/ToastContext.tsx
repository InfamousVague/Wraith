/**
 * @file ToastContext.tsx
 * @description Context for managing toast notifications and notification history.
 *
 * Provides methods to show different types of toasts:
 * - success: Order filled, alert triggered
 * - error: Trade failed, network error
 * - warning: Liquidation warning
 * - info: General notifications
 *
 * Also maintains a persistent notification history accessible via the
 * notification bell in the navbar.
 *
 * When authenticated, notification history is synced with the backend API.
 * Falls back to localStorage for unauthenticated users.
 */

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from "react";
import { ToastContainer, type ToastType, type ToastProps } from "../components/ui/toast";
import { useAuth } from "./AuthContext";
import { hauntClient, type BackendNotification } from "../services/haunt";

// ─── Types ────────────────────────────────────────────────────────

type ToastInput = {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
};

export type NotificationRecord = {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  timestamp: number;
  read: boolean;
};

type ToastContextValue = {
  showToast: (toast: ToastInput) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
  dismissToast: (id: string) => void;
  dismissAll: () => void;
  /** Notification history (most recent first) */
  notifications: NotificationRecord[];
  /** Count of unread notifications */
  unreadCount: number;
  /** Mark all notifications as read */
  markAllRead: () => void;
  /** Clear notification history */
  clearHistory: () => void;
  /** Refresh notifications from backend */
  refreshNotifications: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let toastIdCounter = 0;

const STORAGE_KEY = "wraith-notifications";
const MAX_NOTIFICATIONS = 100;

/** Load notification history from localStorage */
function loadNotifications(): NotificationRecord[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed.slice(0, MAX_NOTIFICATIONS);
    }
  } catch {}
  return [];
}

/** Save notification history to localStorage */
function saveNotifications(notifications: NotificationRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, MAX_NOTIFICATIONS)));
  } catch {}
}

/** Convert backend notification to frontend NotificationRecord */
function backendToRecord(n: BackendNotification): NotificationRecord {
  return {
    id: n.id,
    type: n.type as ToastType,
    title: n.title,
    message: n.message ?? undefined,
    timestamp: n.timestamp,
    read: n.read,
  };
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Omit<ToastProps, "onDismiss">[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>(() => loadNotifications());
  const { sessionToken, isAuthenticated } = useAuth();
  const fetchingRef = useRef(false);
  const lastFetchRef = useRef(0);

  // Persist notifications to localStorage when they change (fallback for unauthenticated)
  useEffect(() => {
    saveNotifications(notifications);
  }, [notifications]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  // Fetch notifications from backend
  const fetchFromBackend = useCallback(async () => {
    if (!sessionToken || fetchingRef.current) return;

    // Throttle: max once every 10 seconds
    const now = Date.now();
    if (now - lastFetchRef.current < 10000) return;

    fetchingRef.current = true;
    lastFetchRef.current = now;

    try {
      const response = await hauntClient.getNotifications(sessionToken, 1, MAX_NOTIFICATIONS);
      if (response?.data?.notifications) {
        const backendNotifs = response.data.notifications.map(backendToRecord);

        // Merge: backend notifications + any local-only ones (client-side toasts not yet synced)
        setNotifications((prev) => {
          const backendIds = new Set(backendNotifs.map((n) => n.id));
          // Keep local-only notifications that aren't from backend (e.g., client-side errors)
          const localOnly = prev.filter(
            (n) => !backendIds.has(n.id) && n.id.startsWith("toast-")
          );
          // Merge and sort by timestamp, most recent first
          const merged = [...localOnly, ...backendNotifs]
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, MAX_NOTIFICATIONS);
          return merged;
        });
      }
    } catch {
      // Silently fail — keep local state
    } finally {
      fetchingRef.current = false;
    }
  }, [sessionToken]);

  // Fetch on mount and when authentication changes
  useEffect(() => {
    if (isAuthenticated && sessionToken) {
      fetchFromBackend();
    }
  }, [isAuthenticated, sessionToken, fetchFromBackend]);

  // Periodically poll for new notifications (every 30s when authenticated)
  useEffect(() => {
    if (!isAuthenticated || !sessionToken) return;

    const interval = setInterval(() => {
      fetchFromBackend();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, sessionToken, fetchFromBackend]);

  // Refresh on page visibility change (user switches back to tab)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && isAuthenticated && sessionToken) {
        fetchFromBackend();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [isAuthenticated, sessionToken, fetchFromBackend]);

  const showToast = useCallback((toast: ToastInput) => {
    const id = `toast-${++toastIdCounter}`;

    // Add to active toasts (visible popups)
    setToasts((prev) => [...prev, { ...toast, id }]);

    // Add to notification history (local)
    const record: NotificationRecord = {
      id,
      type: toast.type,
      title: toast.title,
      message: toast.message,
      timestamp: Date.now(),
      read: false,
    };
    setNotifications((prev) => [record, ...prev].slice(0, MAX_NOTIFICATIONS));
  }, []);

  const showSuccess = useCallback((title: string, message?: string) => {
    showToast({ type: "success", title, message });
  }, [showToast]);

  const showError = useCallback((title: string, message?: string) => {
    showToast({ type: "error", title, message, duration: 8000 });
  }, [showToast]);

  const showWarning = useCallback((title: string, message?: string) => {
    showToast({ type: "warning", title, message, duration: 6000 });
  }, [showToast]);

  const showInfo = useCallback((title: string, message?: string) => {
    showToast({ type: "info", title, message });
  }, [showToast]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const markAllRead = useCallback(() => {
    // Optimistically update local state
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    // Sync with backend
    if (sessionToken) {
      hauntClient.markAllNotificationsRead(sessionToken).catch(() => {});
    }
  }, [sessionToken]);

  const clearHistory = useCallback(() => {
    // Optimistically update local state
    setNotifications([]);

    // Sync with backend
    if (sessionToken) {
      hauntClient.clearNotifications(sessionToken).catch(() => {});
    }
  }, [sessionToken]);

  const refreshNotifications = useCallback(() => {
    lastFetchRef.current = 0; // Reset throttle
    fetchFromBackend();
  }, [fetchFromBackend]);

  const value = useMemo(
    () => ({
      showToast,
      showSuccess,
      showError,
      showWarning,
      showInfo,
      dismissToast,
      dismissAll,
      notifications,
      unreadCount,
      markAllRead,
      clearHistory,
      refreshNotifications,
    }),
    [showToast, showSuccess, showError, showWarning, showInfo, dismissToast, dismissAll, notifications, unreadCount, markAllRead, clearHistory, refreshNotifications]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
