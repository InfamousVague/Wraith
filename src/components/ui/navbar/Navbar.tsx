/**
 * @file Navbar.tsx
 * @description Top navigation bar component with responsive mobile/desktop layouts.
 *
 * ## Features:
 * - Brand logo with navigation to home
 * - Server indicator with latency (click to open server selector)
 * - Market filter toggle (crypto/stocks) - always visible
 * - Theme toggle (dark/light)
 * - User profile section (authenticated/guest states)
 * - Settings navigation
 * - Mobile: Hamburger menu with expandable panel
 * - Desktop: Horizontal layout with all controls visible
 *
 * ## Responsive Behavior:
 * - Uses `useBreakpoint` to detect mobile vs desktop
 * - Mobile: Full-screen expandable menu overlay
 * - Desktop: Standard horizontal navigation bar
 */

import React, { useState, useRef } from "react";
import { View, StyleSheet, Pressable, ScrollView } from "react-native";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Text, Icon, Button, Popover, BottomSheet } from "@wraith/ghost/components";
import { Size, Shape, Appearance, TextAppearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { Colors } from "@wraith/ghost/tokens";
import { spacing, radii } from "../../../styles/tokens";
import { useAuth } from "../../../context/AuthContext";
import { useApiServer } from "../../../context/ApiServerContext";
// Theme toggle removed - available in settings
import { useBreakpoint } from "../../../hooks/useBreakpoint";
import { useToast } from "../../../context/ToastContext";
import { ServersCard } from "../../server/servers";
import { NotificationHistoryModal } from "../notification-history";
import { AnimatedHamburger } from "./AnimatedHamburger";
import type { NavbarProps } from "./types";

/** Get status color based on server status and latency */
function getServerStatusColor(status: string, latencyMs: number | null): string {
  if (status === "offline") return Colors.status.danger;
  if (status === "checking") return Colors.status.warning;
  if (latencyMs === null) return Colors.status.warning;
  if (latencyMs < 100) return Colors.status.success;
  if (latencyMs < 300) return Colors.status.warning;
  return Colors.status.danger;
}

export function Navbar() {
  const navigate = useNavigate();
  const { t } = useTranslation(["navigation", "common"]);
  const themeColors = useThemeColors();
  const { isAuthenticated, user, serverProfile } = useAuth();
  const { activeServer } = useApiServer();
  const { isMobile } = useBreakpoint();
  const { unreadCount } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [serverPopoverOpen, setServerPopoverOpen] = useState(false);
  const [notifModalOpen, setNotifModalOpen] = useState(false);
  const serverIndicatorRef = useRef<View>(null);

  const statusColor = getServerStatusColor(activeServer?.status ?? "checking", activeServer?.latencyMs ?? null);

  const handleProfileClick = () => {
    setMenuOpen(false);
    navigate("/profile");
  };

  const handleSettingsClick = () => {
    setMenuOpen(false);
    navigate("/settings");
  };

  const handleHomeClick = () => {
    setMenuOpen(false);
    navigate("/");
  };

  const handlePortfolioClick = () => {
    setMenuOpen(false);
    navigate("/portfolio");
  };

  const handleLeaderboardClick = () => {
    setMenuOpen(false);
    navigate("/leaderboard");
  };

  // Mobile navbar with expandable menu
  if (isMobile) {
    return (
      <>
        <View style={[
          styles.mobileNavWrapper,
          menuOpen && styles.mobileNavWrapperExpanded,
          { backgroundColor: themeColors.background.canvas }
        ]}>
          {/* Header - always visible */}
          <View style={[styles.container, styles.containerMobile, { borderBottomColor: themeColors.border.subtle }]}>
            <View style={styles.mobileLeftSection}>
              <div data-sherpa="navbar-logo">
                <Pressable style={styles.logoSection} onPress={handleHomeClick}>
                  <Text size={Size.Large} weight="bold">{t("navigation:brand")}</Text>
                </Pressable>
              </div>

              {/* Server Indicator - Mobile */}
              <Pressable
                onPress={() => setServerPopoverOpen(true)}
                style={[styles.serverIndicator, { backgroundColor: `${statusColor}15` }]}
              >
                <View
                  style={[
                    styles.serverStatusDot,
                    { backgroundColor: statusColor }
                  ]}
                />
                <Text size={Size.TwoXSmall} style={{ color: statusColor }} numberOfLines={1}>
                  {activeServer?.name ?? "..."}
                </Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => setMenuOpen(!menuOpen)}
              style={styles.hamburgerButton}
            >
              <AnimatedHamburger isOpen={menuOpen} color={themeColors.text.primary} />
            </Pressable>
          </View>

          {/* Expandable Menu Content */}
          {menuOpen && (
            <ScrollView style={styles.mobileMenuExpanded} contentContainerStyle={styles.menuContent}>
              {/* Navigation Items */}
              <View style={styles.menuNavItems}>
                {/* Portfolio - only show when authenticated */}
                {isAuthenticated && (
                  <Pressable
                    onPress={handlePortfolioClick}
                    style={[styles.menuNavItem, { backgroundColor: themeColors.background.raised }]}
                  >
                    <Icon name="pie-chart" size={Size.Medium} color={themeColors.text.primary} />
                    <Text size={Size.Medium}>{t("navigation:portfolio")}</Text>
                  </Pressable>
                )}

                {/* Leaderboard - yellow crown */}
                <Pressable
                  onPress={handleLeaderboardClick}
                  style={[styles.menuNavItem, { backgroundColor: themeColors.background.raised }]}
                >
                  <Icon name="crown" size={Size.Medium} color={Colors.status.warning} />
                  <Text size={Size.Medium}>{t("navigation:leaderboard")}</Text>
                </Pressable>

                {/* Profile */}
                <Pressable
                  onPress={handleProfileClick}
                  style={[styles.menuNavItem, { backgroundColor: themeColors.background.raised }]}
                >
                  <Icon name="user" size={Size.Medium} color={themeColors.text.primary} />
                  <Text size={Size.Medium}>
                    {isAuthenticated && user?.publicKey
                      ? `${user.publicKey.slice(0, 6)}...${user.publicKey.slice(-4)}`
                      : t("common:buttons.login")}
                  </Text>
                </Pressable>

                {/* Notifications */}
                <Pressable
                  onPress={() => { setMenuOpen(false); setNotifModalOpen(true); }}
                  style={[styles.menuNavItem, { backgroundColor: themeColors.background.raised }]}
                >
                  <View style={{ position: "relative" }}>
                    <Icon name="bell" size={Size.Medium} color={themeColors.text.primary} />
                    {unreadCount > 0 && (
                      <View style={styles.bellBadgeMobile}>
                        <Text size={Size.TwoXSmall} style={styles.bellBadgeText}>
                          {unreadCount > 9 ? "9+" : String(unreadCount)}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text size={Size.Medium}>Notifications</Text>
                </Pressable>

                {/* Settings */}
                <Pressable
                  onPress={handleSettingsClick}
                  style={[styles.menuNavItem, { backgroundColor: themeColors.background.raised }]}
                >
                  <Icon name="settings" size={Size.Medium} color={themeColors.text.primary} />
                  <Text size={Size.Medium}>{t("navigation:settings")}</Text>
                </Pressable>
              </View>
            </ScrollView>
          )}
        </View>

        {/* Server Selector BottomSheet (mobile) */}
        <BottomSheet
          visible={serverPopoverOpen}
          onClose={() => setServerPopoverOpen(false)}
          title="Select Server"
        >
          <ServersCard />
        </BottomSheet>

        {/* Notification History Modal (mobile) */}
        <NotificationHistoryModal
          visible={notifModalOpen}
          onClose={() => setNotifModalOpen(false)}
        />
      </>
    );
  }

  // Desktop navbar
  return (
    <>
      <View style={[styles.container, { borderBottomColor: themeColors.border.subtle }]}>
        <View style={styles.leftSection}>
          <div data-sherpa="navbar-logo">
            <Pressable style={styles.logoSection} onPress={() => navigate("/")}>
              <Text size={Size.Large} weight="bold">{t("navigation:brand")}</Text>
            </Pressable>
          </div>

          {/* Server Indicator - Desktop */}
          <View ref={serverIndicatorRef}>
            <Pressable
              onPress={() => setServerPopoverOpen(true)}
              style={[styles.serverIndicatorDesktop, { backgroundColor: `${statusColor}15` }]}
            >
              <View
                style={[
                  styles.serverStatusDot,
                  { backgroundColor: statusColor }
                ]}
              />
              <Text size={Size.Small} style={{ color: statusColor }} numberOfLines={1}>
                {activeServer?.name ?? "..."}
              </Text>
              {activeServer?.latencyMs !== null && activeServer?.latencyMs !== undefined && (
                <Text
                  size={Size.TwoXSmall}
                  style={{ color: statusColor }}
                >
                  {activeServer.latencyMs}ms
                </Text>
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.rightSection}>
          {/* Leaderboard button - dark yellow bg with bright yellow text */}
          <Button
            label={t("navigation:leaderboard")}
            onPress={handleLeaderboardClick}
            size={Size.Medium}
            shape={Shape.Rounded}
            appearance={Appearance.Warning}
            iconLeft="crown"
            backgroundOpacity={0.15}
          />

          {/* Portfolio button - only show when authenticated */}
          {isAuthenticated && (
            <Button
              label={t("navigation:portfolio")}
              onPress={handlePortfolioClick}
              size={Size.Medium}
              shape={Shape.Rounded}
              appearance={Appearance.Secondary}
              iconLeft="pie-chart"
            />
          )}

          {/* Profile button with username or wallet ID */}
          <Button
            label={isAuthenticated
              ? (serverProfile?.username || (user?.publicKey ? `${user.publicKey.slice(0, 4)}...${user.publicKey.slice(-4)}` : ""))
              : t("common:buttons.login")}
            onPress={handleProfileClick}
            size={Size.Medium}
            shape={Shape.Rounded}
            appearance={Appearance.Neutral}
            iconLeft="user"
          />

          {/* Notification bell */}
          <Pressable
            onPress={() => setNotifModalOpen(true)}
            style={styles.bellButton}
          >
            <Icon name="bell" size={Size.Medium} color={themeColors.text.primary} />
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text size={Size.TwoXSmall} style={styles.bellBadgeText}>
                  {unreadCount > 9 ? "9+" : String(unreadCount)}
                </Text>
              </View>
            )}
          </Pressable>

          {/* Settings button (icon-only) */}
          <Button
            label=""
            onPress={handleSettingsClick}
            size={Size.Medium}
            shape={Shape.Rounded}
            appearance={Appearance.Neutral}
            iconLeft="settings"
          />
        </View>
      </View>

      {/* Notification History Modal */}
      <NotificationHistoryModal
        visible={notifModalOpen}
        onClose={() => setNotifModalOpen(false)}
      />

      {/* Server Selector Popover (desktop) */}
      <Popover
        visible={serverPopoverOpen}
        onClose={() => setServerPopoverOpen(false)}
        anchorRef={serverIndicatorRef}
        placement="bottom-start"
        maxWidth={500}
        maxHeight={600}
      >
        <ServersCard />
      </Popover>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
  },
  containerMobile: {
    paddingHorizontal: spacing.md,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  mobileLeftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  logoSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  serverIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.soft,
    maxWidth: 100,
  },
  serverIndicatorDesktop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
  },
  serverStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  logoText: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 4,
    fontFamily: "Plus Jakarta Sans, sans-serif",
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  // Mobile styles
  mobileNavWrapper: {
    // Normal state - just the header
  },
  mobileNavWrapperExpanded: {
    // When menu is open, take full screen
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  hamburgerButton: {
    padding: spacing.sm,
    borderRadius: radii.md,
    minHeight: 44,
    minWidth: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  mobileMenuExpanded: {
    flex: 1,
  },
  menuContent: {
    padding: spacing.lg,
    gap: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  menuNavItems: {
    gap: spacing.sm,
  },
  menuNavItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    minHeight: 56,
  },
  // Bell / notification styles
  bellButton: {
    position: "relative",
    padding: spacing.xs,
    borderRadius: radii.md,
    minHeight: 36,
    minWidth: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  bellBadge: {
    position: "absolute",
    top: 2,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.status.danger,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  bellBadgeMobile: {
    position: "absolute",
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.status.danger,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  bellBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 14,
  },
});
