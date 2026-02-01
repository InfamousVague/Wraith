import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable } from "react-native";
import { Text, Icon, Toggle } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { useTheme } from "../context/ThemeContext";

type NavbarProps = {
  onSearch?: (query: string) => void;
};

export function Navbar({ onSearch }: NavbarProps) {
  const { toggleTheme, isDark } = useTheme();
  const themeColors = useThemeColors();
  const [searchValue, setSearchValue] = useState("");

  const handleSearchChange = (text: string) => {
    setSearchValue(text);
    onSearch?.(text);
  };

  return (
    <View style={[styles.container, { borderBottomColor: themeColors.border.subtle }]}>
      <Pressable style={styles.logoSection}>
        <Text size={Size.Large} weight="bold">WRAITH</Text>
      </Pressable>

      <View style={styles.rightSection}>
        <View style={[
          styles.searchContainer,
          {
            backgroundColor: themeColors.background.surface,
            borderColor: themeColors.border.subtle,
          }
        ]}>
          <Icon
            name="search"
            size={Size.Small}
            appearance={TextAppearance.Muted}
          />
          <TextInput
            style={[styles.searchInput, { color: themeColors.text.primary }]}
            value={searchValue}
            onChangeText={handleSearchChange}
            placeholder="Search cryptocurrencies..."
            placeholderTextColor={themeColors.text.muted}
          />
        </View>

        <View style={styles.themeToggle}>
          <Toggle
            value={isDark}
            onValueChange={toggleTheme}
            leftIcon="sun"
            rightIcon="moon"
            size={Size.Medium}
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
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
