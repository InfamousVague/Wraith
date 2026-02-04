/**
 * @file Navbar.tsx
 * @description Top navigation bar component with responsive mobile/desktop layouts.
 *
 * ## Features:
 * - Brand logo with navigation to home
 * - Market filter toggle (crypto/stocks) - only on home page
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

import React, { useState } from "react";
import { View, StyleSheet, Pressable, ScrollView } from "react-native";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Text, Toggle, Icon, Button } from "@wraith/ghost/components";
import { Size, Shape, Appearance, TextAppearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { Colors } from "@wraith/ghost/tokens";
import { spacing, radii } from "../../../styles/tokens";
import { useTheme } from "../../../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import { useBreakpoint } from "../../../hooks/useBreakpoint";
import { MarketFilter } from "../../market/market-filter";
import { AnimatedHamburger } from "./AnimatedHamburger";
import type { NavbarProps, AssetType } from "./types";

export function Navbar({ assetType = "all", onAssetTypeChange }: NavbarProps) {
  const navigate = useNavigate();
  const { t } = useTranslation(["navigation", "common"]);
  const { toggleTheme, isDark } = useTheme();
  const themeColors = useThemeColors();
  const { isAuthenticated, user } = useAuth();
  const { isMobile } = useBreakpoint();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleAssetTypeChange = (type: AssetType) => {
    onAssetTypeChange?.(type);
  };

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
      <View style={[
        styles.mobileNavWrapper,
        menuOpen && styles.mobileNavWrapperExpanded,
        { backgroundColor: themeColors.background.canvas }
      ]}>
        {/* Header - always visible */}
        <View style={[styles.container, styles.containerMobile, { borderBottomColor: themeColors.border.subtle }]}>
          <div data-sherpa="navbar-logo">
            <Pressable style={styles.logoSection} onPress={handleHomeClick}>
              <Text size={Size.Large} weight="bold">{t("navigation:brand")}</Text>
            </Pressable>
          </div>

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
            {/* Market Filter - Only show on home page (when callback is provided) */}
            {onAssetTypeChange && (
              <View style={styles.menuSection}>
                <Text size={Size.Small} appearance={TextAppearance.Muted} style={styles.menuSectionLabel}>
                  {t("navigation:marketFilter")}
                </Text>
                <MarketFilter value={assetType} onChange={handleAssetTypeChange} />
              </View>
            )}

            {/* Theme Toggle */}
            <View style={styles.menuSection}>
              <Text size={Size.Small} appearance={TextAppearance.Muted} style={styles.menuSectionLabel}>
                {t("navigation:theme")}
              </Text>
              <Toggle
                value={isDark}
                onValueChange={toggleTheme}
                leftIcon="sun"
                rightIcon="moon"
                size={Size.Large}
              />
            </View>

            {/* Divider */}
            <View style={[styles.menuDivider, { backgroundColor: themeColors.border.subtle }]} />

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

              {/* Leaderboard */}
              <Pressable
                onPress={handleLeaderboardClick}
                style={[styles.menuNavItem, styles.leaderboardNavItem]}
              >
                <Text style={styles.crownIcon}>👑</Text>
                <Text size={Size.Medium} style={{ color: Colors.status.warning }}>{t("navigation:leaderboard")}</Text>
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
    );
  }

  // Desktop navbar
  return (
    <View style={[styles.container, { borderBottomColor: themeColors.border.subtle }]}>
      <div data-sherpa="navbar-logo">
        <Pressable style={styles.logoSection} onPress={() => navigate("/")}>
          <Text size={Size.Large} weight="bold">{t("navigation:brand")}</Text>
        </Pressable>
      </div>

      {/* Center: Market Filter - Only show on home page (when callback is provided) */}
      {onAssetTypeChange ? (
        <MarketFilter value={assetType} onChange={handleAssetTypeChange} />
      ) : (
        <View />
      )}

      <View style={styles.rightSection}>
        {/* Leaderboard Button */}
        <Pressable
          onPress={handleLeaderboardClick}
          style={[styles.leaderboardButton]}
        >
          <Text style={styles.crownIconSmall}>👑</Text>
          <Text size={Size.Small} style={{ color: Colors.status.warning }}>
            {t("navigation:leaderboard")}
          </Text>
        </Pressable>

        {/* Theme Toggle */}
        <View style={styles.themeToggle}>
          <Toggle
            value={isDark}
            onValueChange={toggleTheme}
            leftIcon="sun"
            rightIcon="moon"
            size={Size.Large}
          />
        </View>

        {/* Profile or Login button */}
        {isAuthenticated && user?.publicKey ? (
          <Pressable
            onPress={handleProfileClick}
            style={[styles.profileButton, { backgroundColor: themeColors.background.raised }]}
          >
            <Icon name="user" size={Size.Medium} color={themeColors.text.muted} />
            <Text size={Size.Small} appearance={TextAppearance.Muted} style={styles.accountId}>
              {user.publicKey.slice(0, 3)}...{user.publicKey.slice(-3)}
            </Text>
          </Pressable>
        ) : (
          <Button
            label={t("common:buttons.login")}
            onPress={handleProfileClick}
            size={Size.Small}
            shape={Shape.Rounded}
            appearance={Appearance.Secondary}
            leadingIcon="log-in"
          />
        )}

        {/* Portfolio button - only show when authenticated */}
        {isAuthenticated && (
          <Button
            label={t("navigation:portfolio")}
            onPress={handlePortfolioClick}
            size={Size.Small}
            shape={Shape.Rounded}
            appearance={Appearance.Secondary}
            leadingIcon="pie-chart"
          />
        )}

        {/* Settings cog */}
        <Pressable
          onPress={handleSettingsClick}
          style={[styles.iconButton, { backgroundColor: themeColors.background.raised }]}
        >
          <Icon name="settings" size={Size.Medium} color={themeColors.text.muted} />
        </Pressable>
      </View>
    </View>
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
  logoSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
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
  navLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
  },
  leaderboardButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: "rgba(245, 158, 11, 0.15)", // Dark yellow/amber background
  },
  crownIconSmall: {
    fontSize: 14,
  },
  themeToggle: {
    marginLeft: spacing.xs,
  },
  iconButton: {
    padding: spacing.sm,
    borderRadius: radii.md,
    minHeight: 44,
    minWidth: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  profileButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
  },
  accountId: {
    fontFamily: "monospace",
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
  menuSection: {
    gap: spacing.sm,
  },
  menuSectionLabel: {
    marginBottom: spacing.xxs,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  menuDivider: {
    height: 1,
    marginVertical: spacing.xs,
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
  leaderboardNavItem: {
    backgroundColor: "rgba(245, 158, 11, 0.15)", // Dark yellow/amber background
  },
  crownIcon: {
    fontSize: 18,
  },
});
