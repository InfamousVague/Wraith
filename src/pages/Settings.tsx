/**
 * Settings Page
 *
 * Application settings and preferences.
 */

import React from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useNavigate } from "react-router-dom";
import { Card, Text, Icon } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { useTheme } from "../context/ThemeContext";
import { Navbar } from "../components/Navbar";

// Theme colors
const themes = {
  dark: {
    background: "#050608",
  },
  light: {
    background: "#f8fafc",
  },
};

export function Settings() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const themeColors = useThemeColors();
  const colors = isDark ? themes.dark : themes.light;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Navbar />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigate(-1)} style={styles.backButton}>
            <Icon name="chevron-left" size={Size.Medium} color={themeColors.text.muted} />
          </Pressable>
          <Text size={Size.ExtraLarge} weight="bold">
            Settings
          </Text>
        </View>

        {/* App Settings Section - Coming Soon */}
        <View style={styles.section}>
          <Text
            size={Size.Medium}
            appearance={TextAppearance.Muted}
            style={styles.sectionTitle}
          >
            APP SETTINGS
          </Text>

          <Card style={styles.card}>
            <View style={styles.cardContent}>
              <View style={styles.comingSoon}>
                <Icon name="settings" size={Size.ExtraLarge} color={themeColors.text.muted} />
                <Text size={Size.Large} weight="semibold" style={styles.comingSoonTitle}>
                  Coming Soon
                </Text>
                <Text
                  size={Size.Medium}
                  appearance={TextAppearance.Muted}
                  style={styles.comingSoonText}
                >
                  Application settings including notification preferences, display options,
                  signal customization, and more will be available here.
                </Text>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 24,
  },
  backButton: {
    padding: 8,
    backgroundColor: "transparent",
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  card: {
    flex: 1,
  },
  cardContent: {
    padding: 24,
  },
  comingSoon: {
    alignItems: "center",
    gap: 16,
    paddingVertical: 48,
  },
  comingSoonTitle: {
    marginTop: 8,
  },
  comingSoonText: {
    textAlign: "center",
    maxWidth: 400,
  },
});
