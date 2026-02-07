/**
 * @file NotificationHistoryModal.tsx
 * @description Glassmorphism notification history modal with pagination.
 *
 * Triggered from the notification bell in the navbar.
 * Shows all past notifications with type icons, timestamps, and read state.
 * Supports "Mark all read", "Clear history", and pagination.
 */

import React, { useState, useMemo } from "react";
import { Modal, Pressable, View, StyleSheet } from "react-native";
import { Text, Icon, Badge, type IconName } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { Colors } from "@wraith/ghost/tokens";
import { spacing } from "../../../styles/tokens";
import { useToast, type NotificationRecord } from "../../../context/ToastContext";
import type { ToastType } from "../toast";

// ─── Constants ──────────────────────────────────────────────────

const PAGE_SIZE = 15;

const TYPE_CONFIG: Record<ToastType, { icon: IconName; color: string; label: string }> = {
  success: { icon: "check-circle", color: Colors.status.success, label: "Success" },
  error: { icon: "x-circle", color: Colors.status.danger, label: "Error" },
  warning: { icon: "alert-triangle", color: Colors.status.warning, label: "Warning" },
  info: { icon: "info", color: Colors.accent.primary, label: "Info" },
};

// ─── Relative time formatter ────────────────────────────────────

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

// ─── Component ──────────────────────────────────────────────────

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function NotificationHistoryModal({ visible, onClose }: Props) {
  const themeColors = useThemeColors();
  const { notifications, unreadCount, markAllRead, clearHistory } = useToast();
  const [page, setPage] = useState(1);

  // Reset page when modal opens
  React.useEffect(() => {
    if (visible) setPage(1);
  }, [visible]);

  const totalPages = Math.max(1, Math.ceil(notifications.length / PAGE_SIZE));
  const paginatedNotifications = useMemo(
    () => notifications.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [notifications, page]
  );

  const handlePrevPage = () => setPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setPage((p) => Math.min(totalPages, p + 1));

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
                <Text size={Size.Medium} weight="semibold" style={{ color: Colors.text.primary }}>
                  Notifications
                </Text>
                {unreadCount > 0 && (
                  <Badge
                    label={String(unreadCount)}
                    variant="danger"
                    size={Size.TwoXSmall}
                  />
                )}
              </div>
              <div style={headerActionsStyle}>
                {unreadCount > 0 && (
                  <button style={headerBtnStyle} onClick={() => markAllRead()}>
                    Mark all read
                  </button>
                )}
                <button style={closeBtnStyle} onClick={onClose}>
                  <Icon name="x" size={Size.Small} color="rgba(255, 255, 255, 0.5)" />
                </button>
              </div>
            </div>

            {/* Divider */}
            <div style={dividerStyle} />

            {/* Notification list */}
            <div style={listContainerStyle}>
              {paginatedNotifications.length === 0 ? (
                <div style={emptyStateStyle}>
                  <Icon name="bell-off" size={Size.Large} color="rgba(255, 255, 255, 0.15)" />
                  <Text size={Size.Small} appearance={TextAppearance.Muted}>
                    No notifications yet
                  </Text>
                </div>
              ) : (
                paginatedNotifications.map((notif) => (
                  <NotificationItem key={notif.id} notification={notif} />
                ))
              )}
            </div>

            {/* Footer with pagination */}
            {notifications.length > 0 && (
              <>
                <div style={dividerStyle} />
                <div style={footerStyle}>
                  <button style={clearBtnStyle} onClick={() => clearHistory()}>
                    <Icon name="trash-2" size={Size.TwoXSmall} color="rgba(255, 255, 255, 0.35)" />
                    <span>Clear</span>
                  </button>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div style={paginationStyle}>
                      <button
                        style={{
                          ...pageBtnStyle,
                          opacity: page <= 1 ? 0.3 : 1,
                          cursor: page <= 1 ? "default" : "pointer",
                        }}
                        onClick={handlePrevPage}
                        disabled={page <= 1}
                      >
                        <Icon name="chevron-left" size={Size.TwoXSmall} color="rgba(255, 255, 255, 0.6)" />
                      </button>
                      <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                        {page} / {totalPages}
                      </Text>
                      <button
                        style={{
                          ...pageBtnStyle,
                          opacity: page >= totalPages ? 0.3 : 1,
                          cursor: page >= totalPages ? "default" : "pointer",
                        }}
                        onClick={handleNextPage}
                        disabled={page >= totalPages}
                      >
                        <Icon name="chevron-right" size={Size.TwoXSmall} color="rgba(255, 255, 255, 0.6)" />
                      </button>
                    </div>
                  )}

                  <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                    {notifications.length} total
                  </Text>
                </div>
              </>
            )}
          </div>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Notification Item ──────────────────────────────────────────

function NotificationItem({ notification }: { notification: NotificationRecord }) {
  const config = TYPE_CONFIG[notification.type];

  return (
    <div style={{
      ...itemStyle,
      opacity: notification.read ? 0.55 : 1,
    }}>
      <div style={{
        ...itemIconStyle,
        backgroundColor: `${config.color}12`,
        border: `1px solid ${config.color}20`,
      }}>
        <Icon name={config.icon} size={Size.Small} color={config.color} />
      </div>
      <div style={itemContentStyle}>
        <Text size={Size.Small} weight="medium" style={{ color: Colors.text.primary }}>
          {notification.title}
        </Text>
        {notification.message && (
          <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted} numberOfLines={2}>
            {notification.message}
          </Text>
        )}
        <Text size={Size.TwoXSmall} style={{ color: "rgba(255, 255, 255, 0.2)", marginTop: 2 }}>
          {timeAgo(notification.timestamp)}
        </Text>
      </div>
      {!notification.read && <div style={unreadDotStyle} />}
    </div>
  );
}

// ─── Styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalWrapper: {
    maxWidth: 440,
    width: "92%",
    maxHeight: "75%",
  },
});

const glassCardStyle: React.CSSProperties = {
  background: "rgba(18, 18, 24, 0.92)",
  backdropFilter: "blur(32px)",
  WebkitBackdropFilter: "blur(32px)",
  border: "1px solid rgba(255, 255, 255, 0.10)",
  borderRadius: 20,
  boxShadow: "0 32px 64px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
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

const headerActionsStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const headerBtnStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: Colors.accent.primary,
  background: "rgba(167, 139, 250, 0.10)",
  border: "1px solid rgba(167, 139, 250, 0.20)",
  cursor: "pointer",
  padding: "4px 10px",
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
  background: "rgba(255, 255, 255, 0.06)",
  border: "1px solid rgba(255, 255, 255, 0.06)",
  cursor: "pointer",
  padding: 0,
};

const dividerStyle: React.CSSProperties = {
  height: 1,
  backgroundColor: "rgba(255, 255, 255, 0.08)",
};

const listContainerStyle: React.CSSProperties = {
  overflowY: "auto",
  maxHeight: 420,
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

const footerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "8px 16px",
  gap: 8,
};

const clearBtnStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  fontSize: 11,
  fontWeight: 500,
  color: "rgba(255, 255, 255, 0.35)",
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: "4px 8px",
  borderRadius: 6,
  fontFamily: "-apple-system, system-ui, sans-serif",
};

const paginationStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const pageBtnStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 24,
  height: 24,
  borderRadius: 6,
  background: "rgba(255, 255, 255, 0.06)",
  border: "1px solid rgba(255, 255, 255, 0.06)",
  padding: 0,
};

// ─── Notification item styles ───────────────────────────────────

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
  width: 34,
  height: 34,
  borderRadius: 10,
  flexShrink: 0,
  marginTop: 1,
};

const itemContentStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: 1,
  minWidth: 0,
};

const unreadDotStyle: React.CSSProperties = {
  width: 7,
  height: 7,
  borderRadius: 4,
  backgroundColor: Colors.accent.primary,
  flexShrink: 0,
  marginTop: 6,
};
