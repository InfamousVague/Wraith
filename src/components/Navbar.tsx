import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable } from "react-native";
import { Text, Icon, Toggle } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { useTheme } from "../context/ThemeContext";

const themes = {
  dark: {
    border: "rgba(255, 255, 255, 0.06)",
    inputBg: "rgba(255, 255, 255, 0.04)",
    inputBorder: "rgba(255, 255, 255, 0.08)",
    text: "#F4F6FF",
    muted: "#9096AB",
  },
  light: {
    border: "rgba(0, 0, 0, 0.08)",
    inputBg: "rgba(0, 0, 0, 0.04)",
    inputBorder: "rgba(0, 0, 0, 0.1)",
    text: "#0f172a",
    muted: "#64748b",
  },
};

type NavbarProps = {
  onSearch?: (query: string) => void;
};

export function Navbar({ onSearch }: NavbarProps) {
  const { isDark, toggleTheme } = useTheme();
  const [searchValue, setSearchValue] = useState("");
  const colors = isDark ? themes.dark : themes.light;

  const handleSearchChange = (text: string) => {
    setSearchValue(text);
    onSearch?.(text);
  };

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      {/* Logo */}
      <Pressable style={styles.logoSection}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>W</Text>
        </View>
        <Text size={Size.Large} weight="bold" style={styles.brand}>
          Wraith
        </Text>
      </Pressable>

      {/* Right side - Search and Theme Toggle */}
      <View style={styles.rightSection}>
        {/* Search Field */}
        <View style={[styles.searchContainer, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
          <Icon
            name="search"
            size={Size.Small}
            appearance={TextAppearance.Muted}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            value={searchValue}
            onChangeText={handleSearchChange}
            placeholder="Search cryptocurrencies..."
            placeholderTextColor={colors.muted}
          />
        </View>

        {/* Theme Toggle */}
        <View style={styles.themeToggle}>
          <Toggle
            value={!isDark}
            onValueChange={toggleTheme}
            leftIcon="moon"
            rightIcon="sun"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  logoSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    fontFamily: "Plus Jakarta Sans, sans-serif",
  },
  brand: {
    fontFamily: "Plus Jakarta Sans, sans-serif",
    letterSpacing: -0.5,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    minWidth: 280,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Plus Jakarta Sans, sans-serif",
    outlineStyle: "none",
  } as any,
  themeToggle: {
    marginLeft: 8,
  },
});
