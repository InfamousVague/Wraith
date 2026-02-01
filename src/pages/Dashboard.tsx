import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { Navbar } from "../components/Navbar";
import { PriceTicker } from "../components/PriceTicker";
import { useTheme } from "../context/ThemeContext";

// Theme colors
const themes = {
  dark: {
    background: "#050608",
    surface: "#0B0E15",
    border: "rgba(255, 255, 255, 0.06)",
    tickerBg: "rgba(255, 255, 255, 0.02)",
  },
  light: {
    background: "#f8fafc",
    surface: "#ffffff",
    border: "rgba(0, 0, 0, 0.08)",
    tickerBg: "rgba(0, 0, 0, 0.02)",
  },
};

export function Dashboard() {
  const { isDark } = useTheme();
  const colors = isDark ? themes.dark : themes.light;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.tickerWrapper, { borderBottomColor: colors.border }]}>
        <PriceTicker />
      </View>
      <Navbar />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.placeholder}>
          <Text size={Size.Large} appearance={TextAppearance.Muted}>
            Dashboard - Coming Soon
          </Text>
          <Text size={Size.Small} appearance={TextAppearance.Muted}>
            Selected components will be added here
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tickerWrapper: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    maxWidth: 1600,
    marginHorizontal: "auto",
    width: "100%",
    gap: 16,
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 100,
    gap: 8,
  },
});
