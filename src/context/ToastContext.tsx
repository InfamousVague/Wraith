/**
 * @file ToastContext.tsx
 * @description Context for managing toast notifications app-wide.
 *
 * Provides methods to show different types of toasts:
 * - success: Order filled, alert triggered
 * - error: Trade failed, network error
 * - warning: Liquidation warning
 * - info: General notifications
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { ToastContainer, type ToastType, type ToastProps } from "../components/ui/toast";

type ToastInput = {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
};

type ToastContextValue = {
  showToast: (toast: ToastInput) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
  dismissToast: (id: string) => void;
  dismissAll: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let toastIdCounter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Omit<ToastProps, "onDismiss">[]>([]);

  const showToast = useCallback((toast: ToastInput) => {
    const id = `toast-${++toastIdCounter}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
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

  const value = useMemo(
    () => ({
      showToast,
      showSuccess,
      showError,
      showWarning,
      showInfo,
      dismissToast,
      dismissAll,
    }),
    [showToast, showSuccess, showError, showWarning, showInfo, dismissToast, dismissAll]
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
