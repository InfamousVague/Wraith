/**
 * @file Toast.tsx
 * @description Glassmorphism toast notification component.
 *
 * Displays temporary notifications with a frosted-glass aesthetic:
 * - Success messages (order filled, alert triggered)
 * - Error messages (trade failed, network error)
 * - Warning messages (liquidation warning)
 * - Info messages (general notifications)
 *
 * Uses HTML/CSS for backdrop-filter support (glassmorphism effect).
 */

import React, { useEffect, useRef, useState } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export type ToastProps = {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onDismiss: (id: string) => void;
};

const TOAST_CONFIG: Record<ToastType, { icon: string; color: string; glowColor: string }> = {
  success: {
    icon: "✓",
    color: "#10B981",
    glowColor: "rgba(16, 185, 129, 0.2)",
  },
  error: {
    icon: "✕",
    color: "#EF4444",
    glowColor: "rgba(239, 68, 68, 0.2)",
  },
  warning: {
    icon: "⚠",
    color: "#F59E0B",
    glowColor: "rgba(245, 158, 11, 0.2)",
  },
  info: {
    icon: "ℹ",
    color: "#8B5CF6",
    glowColor: "rgba(139, 92, 246, 0.2)",
  },
};

export function Toast({
  id,
  type,
  title,
  message,
  duration = 5000,
  onDismiss,
}: ToastProps) {
  const config = TOAST_CONFIG[type];
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => setVisible(true));

    // Auto dismiss
    timerRef.current = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [duration]);

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(() => onDismiss(id), 200);
  };

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    marginBottom: 8,
    maxWidth: 380,
    borderRadius: 12,
    // Glassmorphism
    background: "rgba(18, 18, 24, 0.75)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderLeft: `3px solid ${config.color}`,
    boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4), inset 0 0 0 0.5px rgba(255, 255, 255, 0.05)`,
    // Animation
    opacity: visible && !exiting ? 1 : 0,
    transform: visible && !exiting ? "translateY(0)" : "translateY(-12px)",
    transition: "opacity 200ms ease, transform 200ms ease",
    cursor: "default",
    pointerEvents: "auto",
  };

  const iconContainerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    borderRadius: 8,
    background: config.glowColor,
    flexShrink: 0,
    fontSize: 13,
    fontWeight: 700,
    color: config.color,
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 1,
    minWidth: 0,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: "rgba(255, 255, 255, 0.92)",
    fontFamily: "-apple-system, system-ui, sans-serif",
    lineHeight: 1.3,
  };

  const messageStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 400,
    color: "rgba(255, 255, 255, 0.5)",
    fontFamily: "-apple-system, system-ui, sans-serif",
    lineHeight: 1.3,
  };

  const closeBtnStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 22,
    height: 22,
    borderRadius: 6,
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "rgba(255, 255, 255, 0.3)",
    fontSize: 14,
    fontWeight: 400,
    flexShrink: 0,
    padding: 0,
    transition: "color 150ms ease, background 150ms ease",
  };

  return (
    <div style={containerStyle}>
      <div style={iconContainerStyle}>{config.icon}</div>
      <div style={contentStyle}>
        <span style={titleStyle}>{title}</span>
        {message && <span style={messageStyle}>{message}</span>}
      </div>
      <button
        style={closeBtnStyle}
        onClick={handleDismiss}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "rgba(255, 255, 255, 0.6)";
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "rgba(255, 255, 255, 0.3)";
          e.currentTarget.style.background = "transparent";
        }}
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
