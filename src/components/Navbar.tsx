import React, { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useNavigate } from "react-router-dom";
import { Text, Toggle, Input, Icon } from "@wraith/ghost/components";
import { Size, Shape } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { useTheme } from "../context/ThemeContext";
import { MarketFilter } from "./MarketFilter";
import type { AssetType } from "../services/haunt";

type NavbarProps = {
  onSearch?: (query: string) => void;
  assetType?: AssetType;
  onAssetTypeChange?: (type: AssetType) => void;
};

export function Navbar({ onSearch, assetType = "all", onAssetTypeChange }: NavbarProps) {
  const navigate = useNavigate();
  const { toggleTheme, isDark } = useTheme();
  const themeColors = useThemeColors();
  const [searchValue, setSearchValue] = useState("");

  const handleSearchChange = (text: string) => {
    setSearchValue(text);
    onSearch?.(text);
  };

  const handleAssetTypeChange = (type: AssetType) => {
    onAssetTypeChange?.(type);
  };

  const handleSettingsClick = () => {
    navigate("/settings");
  };

  return (
    <View style={[styles.container, { borderBottomColor: themeColors.border.subtle }]}>
      <Pressable style={styles.logoSection} onPress={() => navigate("/")}>
        <Text size={Size.Large} weight="bold">WRAITH</Text>
      </Pressable>

      {/* Center: Market Filter */}
      <MarketFilter value={assetType} onChange={handleAssetTypeChange} />

      <View style={styles.rightSection}>
        <Input
          value={searchValue}
          onChangeText={handleSearchChange}
          placeholder="Search assets..."
          leadingIcon="search"
          size={Size.Medium}
          shape={Shape.Rounded}
          style={styles.searchInput}
        />

        <View style={styles.themeToggle}>
          <Toggle
            value={isDark}
            onValueChange={toggleTheme}
            leftIcon="sun"
            rightIcon="moon"
            size={Size.Medium}
          />
        </View>

        <Pressable
          onPress={handleSettingsClick}
          style={[styles.settingsButton, { backgroundColor: themeColors.background.raised }]}
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
  searchInput: {
    minWidth: 280,
  },
  themeToggle: {
    marginLeft: 8,
  },
  settingsButton: {
    padding: 10,
    borderRadius: 8,
  },
});
