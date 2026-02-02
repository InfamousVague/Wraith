import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useNavigate } from "react-router-dom";
import { Text, Toggle, Icon, Button } from "@wraith/ghost/components";
import { Size, Shape, Appearance, TextAppearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { MarketFilter } from "./MarketFilter";
import type { AssetType } from "../services/haunt";

type NavbarProps = {
  assetType?: AssetType;
  onAssetTypeChange?: (type: AssetType) => void;
};

export function Navbar({ assetType = "all", onAssetTypeChange }: NavbarProps) {
  const navigate = useNavigate();
  const { toggleTheme, isDark } = useTheme();
  const themeColors = useThemeColors();
  const { isAuthenticated, user } = useAuth();

  const handleAssetTypeChange = (type: AssetType) => {
    onAssetTypeChange?.(type);
  };

  const handleProfileClick = () => {
    navigate("/profile");
  };

  const handleSettingsClick = () => {
    navigate("/settings");
  };

  return (
    <View style={[styles.container, { borderBottomColor: themeColors.border.subtle }]}>
      <div data-sherpa="navbar-logo">
        <Pressable style={styles.logoSection} onPress={() => navigate("/")}>
          <Text size={Size.Large} weight="bold">WRAITH</Text>
        </Pressable>
      </div>

      {/* Center: Market Filter */}
      <MarketFilter value={assetType} onChange={handleAssetTypeChange} />

      <View style={styles.rightSection}>
        <View style={styles.themeToggle}>
          <Toggle
            value={isDark}
            onValueChange={toggleTheme}
            leftIcon="sun"
            rightIcon="moon"
            size={Size.Medium}
          />
        </View>

        {/* Profile or Login button */}
        {isAuthenticated && user ? (
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
            label="Login"
            onPress={handleProfileClick}
            size={Size.Small}
            shape={Shape.Rounded}
            appearance={Appearance.Secondary}
            leadingIcon="log-in"
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
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
  },
  logoSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
    gap: 16,
  },
  themeToggle: {
    marginLeft: 8,
  },
  iconButton: {
    padding: 10,
    borderRadius: 8,
  },
  profileButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  accountId: {
    fontFamily: "monospace",
  },
});
