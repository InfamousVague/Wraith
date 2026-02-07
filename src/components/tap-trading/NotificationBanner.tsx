/**
 * @file NotificationBanner.tsx
 * @description Top-center notification banners for Tap Trading.
 *
 * Win banners: "You won $X.XX" with green accent, 4s auto-dismiss
 * Error banners: "Insufficient balance", amber accent, 3s auto-dismiss
 * Max 3 banners stacked at once. No loss banners (silent fade only).
 */

import React, { useEffect, useRef } from "react";
import type { TapNotification } from "../../types/tap-trading";

type NotificationBannerProps = {
  notifications: TapNotification[];
  onDismiss: (id: string) => void;
};

export function NotificationBanner({ notifications, onDismiss }: NotificationBannerProps) {
  // Auto-dismiss timers
  const timersRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    for (const notif of notifications) {
      if (timersRef.current.has(notif.id)) continue;
      const duration = notif.type === "win" ? 4000 : 3000;
      const timer = window.setTimeout(() => {
        onDismiss(notif.id);
        timersRef.current.delete(notif.id);
      }, duration);
      timersRef.current.set(notif.id, timer);
    }

    // Cleanup on unmount
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, [notifications, onDismiss]);

  if (notifications.length === 0) return null;

  // Show max 3
  const visible = notifications.slice(-3);

  return (
    <div style={containerStyle}>
      {visible.map((notif) => (
        <div
          key={notif.id}
          style={{
            ...bannerStyle,
            ...(notif.type === "win" ? winStyle : errorStyle),
          }}
          onClick={() => onDismiss(notif.id)}
        >
          <span style={iconStyle}>{notif.type === "win" ? "🪙" : "⚠️"}</span>
          <span style={textStyle}>{notif.message}</span>
        </div>
      ))}
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  position: "absolute",
  top: 8,
  left: "50%",
  transform: "translateX(-50%)",
  display: "flex",
  flexDirection: "column",
  gap: 6,
  zIndex: 100,
  pointerEvents: "none",
};

const bannerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 16px",
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  fontFamily: "-apple-system, system-ui, sans-serif",
  pointerEvents: "auto",
  cursor: "pointer",
  backdropFilter: "blur(8px)",
  animation: "slideIn 0.2s ease-out",
  whiteSpace: "nowrap",
};

const winStyle: React.CSSProperties = {
  backgroundColor: "rgba(47, 213, 117, 0.15)",
  border: "1px solid rgba(47, 213, 117, 0.3)",
  color: "#2FD575",
};

const errorStyle: React.CSSProperties = {
  backgroundColor: "rgba(245, 158, 11, 0.15)",
  border: "1px solid rgba(245, 158, 11, 0.3)",
  color: "#F59E0B",
};

const iconStyle: React.CSSProperties = {
  fontSize: 14,
};

const textStyle: React.CSSProperties = {
  letterSpacing: "-0.01em",
};
