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
 */

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { ToastContainer, type ToastType, type ToastProps } from "../components/ui/toast";

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

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Omit<ToastProps, "onDismiss">[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>(() => loadNotifications());

  // Persist notifications to localStorage when they change
  useEffect(() => {
    saveNotifications(notifications);
  }, [notifications]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const showToast = useCallback((toast: ToastInput) => {
    const id = `toast-${++toastIdCounter}`;

    // Add to active toasts (visible popups)
    setToasts((prev) => [...prev, { ...toast, id }]);

    // Add to notification history
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
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearHistory = useCallback(() => {
    setNotifications([]);
  }, []);

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
    }),
    [showToast, showSuccess, showError, showWarning, showInfo, dismissToast, dismissAll, notifications, unreadCount, markAllRead, clearHistory]
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
