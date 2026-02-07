/**
 * @file ToastContainer.tsx
 * @description Container component that renders all active toasts.
 *
 * Positions toasts at the top-right of the screen with glassmorphism styling.
 */

import React from "react";
import { Toast, type ToastProps } from "./Toast";

type ToastContainerProps = {
  toasts: Omit<ToastProps, "onDismiss">[];
  onDismiss: (id: string) => void;
};

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  const containerStyle: React.CSSProperties = {
    position: "fixed",
    top: 24,
    right: 20,
    zIndex: 9999,
    maxWidth: 400,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    pointerEvents: "none",
  };

  return (
    <div style={containerStyle}>
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
