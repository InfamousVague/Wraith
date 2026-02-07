/**
 * @file NotificationHistoryModal.tsx
 * @description Glassmorphism notification history modal.
 *
 * Triggered from the notification bell in the navbar.
 * Shows all past notifications with type icons, timestamps, and read state.
 * Supports "Mark all read" and "Clear history" actions.
 */

import React from "react";
import { Modal, Pressable, ScrollView, View, StyleSheet } from "react-native";
import { Text, Icon, Button, type IconName } from "@wraith/ghost/components";
import { Size, Shape, Appearance, TextAppearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { Colors } from "@wraith/ghost/tokens";
import { spacing, radii } from "../../../styles/tokens";
import { useToast, type NotificationRecord } from "../../../context/ToastContext";
import type { ToastType } from "../toast";

// ─── Type config ─────────────────────────────────────────────────

const TYPE_CONFIG: Record<ToastType, { icon: IconName; color: string; label: string }> = {
  success: { icon: "check-circle", color: Colors.status.success, label: "Success" },
  error: { icon: "x-circle", color: Colors.status.danger, label: "Error" },
  warning: { icon: "alert-triangle", color: Colors.status.warning, label: "Warning" },
  info: { icon: "info", color: Colors.accent.primary, label: "Info" },
};

// ─── Relative time formatter ─────────────────────────────────────

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ─── Component ───────────────────────────────────────────────────

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function NotificationHistoryModal({ visible, onClose }: Props) {
  const themeColors = useThemeColors();
  const { notifications, unreadCount, markAllRead, clearHistory } = useToast();

  const handleMarkAllRead = () => {
    markAllRead();
  };

  const handleClear = () => {
    clearHistory();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalWrapper} onPress={(e) => e.stopPropagation()}>
          {/* Glassmorphism card */}
          <div style={glassCardStyle}>
            {/* Header */}
            <div style={headerStyle}>
              <div style={headerLeftStyle}>
                <Icon name="bell" size={Size.Medium} color={themeColors.text.primary} />
                <span style={headerTitleStyle}>Notifications</span>
                {unreadCount > 0 && (
                  <span style={unreadBadgeStyle}>{unreadCount}</span>
                )}
              </div>
              <div style={headerActionsStyle}>
                {unreadCount > 0 && (
                  <button style={headerBtnStyle} onClick={handleMarkAllRead}>
                    Mark all read
                  </button>
                )}
                <button
                  style={closeBtnStyle}
                  onClick={onClose}
                >
                  <Icon name="close" size={Size.Small} color="rgba(255, 255, 255, 0.5)" />
                </button>
              </div>
            </div>

            {/* Divider */}
            <div style={dividerStyle} />

            {/* Notification list */}
            <div style={listContainerStyle}>
              {notifications.length === 0 ? (
                <div style={emptyStateStyle}>
                  <Icon name="bell-off" size={Size.Large} color="rgba(255, 255, 255, 0.15)" />
                  <span style={emptyTextStyle}>No notifications yet</span>
                </div>
              ) : (
                notifications.map((notif) => (
                  <NotificationItem key={notif.id} notification={notif} />
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <>
                <div style={dividerStyle} />
                <div style={footerStyle}>
                  <button style={clearBtnStyle} onClick={handleClear}>
                    Clear history
                  </button>
                  <span style={countStyle}>
                    {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </>
            )}
          </div>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Notification Item ───────────────────────────────────────────

function NotificationItem({ notification }: { notification: NotificationRecord }) {
  const config = TYPE_CONFIG[notification.type];

  return (
    <div style={{
      ...itemStyle,
      opacity: notification.read ? 0.6 : 1,
    }}>
      <div style={{
        ...itemIconStyle,
        backgroundColor: `${config.color}15`,
      }}>
        <Icon name={config.icon} size={Size.Small} color={config.color} />
      </div>
      <div style={itemContentStyle}>
        <span style={itemTitleStyle}>{notification.title}</span>
        {notification.message && (
          <span style={itemMessageStyle}>{notification.message}</span>
        )}
        <span style={itemTimeStyle}>{timeAgo(notification.timestamp)}</span>
      </div>
      {!notification.read && <div style={unreadDotStyle} />}
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalWrapper: {
    maxWidth: 420,
    width: "90%",
    maxHeight: "70%",
  },
});

const glassCardStyle: React.CSSProperties = {
  background: "rgba(18, 18, 24, 0.85)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  borderRadius: 16,
  boxShadow: "0 24px 48px rgba(0, 0, 0, 0.5), inset 0 0 0 0.5px rgba(255, 255, 255, 0.05)",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "16px 20px 12px",
};

const headerLeftStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const headerTitleStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  color: "rgba(255, 255, 255, 0.92)",
  fontFamily: "-apple-system, system-ui, sans-serif",
};

const unreadBadgeStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "#fff",
  backgroundColor: Colors.status.danger,
  borderRadius: 10,
  padding: "1px 7px",
  lineHeight: "16px",
};

const headerActionsStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const headerBtnStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: Colors.accent.primary,
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: "4px 8px",
  borderRadius: 6,
  fontFamily: "-apple-system, system-ui, sans-serif",
};

const closeBtnStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 28,
  height: 28,
  borderRadius: 8,
  background: "rgba(255, 255, 255, 0.05)",
  border: "none",
  cursor: "pointer",
  padding: 0,
};

const dividerStyle: React.CSSProperties = {
  height: 1,
  backgroundColor: "rgba(255, 255, 255, 0.06)",
};

const listContainerStyle: React.CSSProperties = {
  overflowY: "auto",
  maxHeight: 400,
  padding: "4px 0",
};

const emptyStateStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 12,
  padding: "48px 20px",
};

const emptyTextStyle: React.CSSProperties = {
  fontSize: 13,
  color: "rgba(255, 255, 255, 0.3)",
  fontFamily: "-apple-system, system-ui, sans-serif",
};

const footerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 20px",
};

const clearBtnStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: "rgba(255, 255, 255, 0.4)",
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: "4px 8px",
  borderRadius: 6,
  fontFamily: "-apple-system, system-ui, sans-serif",
};

const countStyle: React.CSSProperties = {
  fontSize: 11,
  color: "rgba(255, 255, 255, 0.25)",
  fontFamily: "-apple-system, system-ui, sans-serif",
};

// ─── Notification item styles ────────────────────────────────────

const itemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
  padding: "10px 20px",
  transition: "background 150ms ease",
  cursor: "default",
};

const itemIconStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 32,
  height: 32,
  borderRadius: 8,
  flexShrink: 0,
  marginTop: 1,
};

const itemContentStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: 2,
  minWidth: 0,
};

const itemTitleStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: "rgba(255, 255, 255, 0.85)",
  fontFamily: "-apple-system, system-ui, sans-serif",
  lineHeight: 1.3,
};

const itemMessageStyle: React.CSSProperties = {
  fontSize: 11,
  color: "rgba(255, 255, 255, 0.45)",
  fontFamily: "-apple-system, system-ui, sans-serif",
  lineHeight: 1.3,
};

const itemTimeStyle: React.CSSProperties = {
  fontSize: 10,
  color: "rgba(255, 255, 255, 0.25)",
  fontFamily: "-apple-system, system-ui, sans-serif",
  marginTop: 2,
};

const unreadDotStyle: React.CSSProperties = {
  width: 7,
  height: 7,
  borderRadius: 4,
  backgroundColor: Colors.accent.primary,
  flexShrink: 0,
  marginTop: 5,
};
