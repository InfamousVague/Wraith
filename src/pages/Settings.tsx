/**
 * @file Settings.tsx
 * @description Application settings and preferences page.
 *
 * ## Sections:
 * 1. **Language** - Display language selection (English, Korean)
 * 2. **App Settings** - Update speed/performance settings
 * 3. **Servers** - Server selection, health status, mesh connectivity
 *
 * ## Features:
 * - Language persisted via i18next
 * - Speed settings affect real-time update frequency
 * - Server card shows client ping, mesh ping, connection status
 *
 * ## State:
 * - Language: Managed by i18next (localStorage)
 * - Speed: Managed by SpeedSelector component
 * - Servers: Managed by ApiServerContext
 */

import React from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, Text, Icon, Select, Divider } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { useTheme } from "../context/ThemeContext";
import { SpeedSelector, Navbar } from "../components/ui";
import { ServersCard } from "../components/server";
import { TradingSettingsSection } from "../components/settings";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "../i18n/types";
import { useBreakpoint } from "../hooks/useBreakpoint";

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
  const { t, i18n } = useTranslation(["settings", "common"]);
  const { isDark } = useTheme();
  const themeColors = useThemeColors();
  const colors = isDark ? themes.dark : themes.light;
  const { isMobile, isNarrow } = useBreakpoint();

  const contentPadding = isMobile ? 12 : isNarrow ? 16 : 24;
  const currentLanguage = i18n.language as SupportedLanguage;

  const languageOptions = SUPPORTED_LANGUAGES.map((lang) => ({
    value: lang.code,
    label: lang.nativeLabel,
  }));

  const handleLanguageChange = (value: SupportedLanguage) => {
    i18n.changeLanguage(value);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Navbar />
      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.content, { paddingHorizontal: contentPadding }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigate(-1)} style={styles.backButton}>
            <Icon name="chevron-left" size={Size.Large} color={themeColors.text.secondary} />
          </Pressable>
          <Text size={Size.ExtraLarge} weight="bold">
            {t("settings:title")}
          </Text>
        </View>

        {/* Language Section */}
        <View style={styles.section}>
          <Text
            size={Size.Medium}
            appearance={TextAppearance.Muted}
            style={styles.sectionTitle}
          >
            {t("settings:language.section")}
          </Text>

          <Card style={styles.card} fullBleed={isMobile}>
            <View style={[styles.cardContent, isMobile && styles.cardContentMobile]}>
              <View style={[styles.settingRow, isMobile && styles.settingRowMobile]}>
                <View style={styles.settingInfo}>
                  <Text size={Size.Medium} weight="medium">
                    {t("settings:language.displayLanguage")}
                  </Text>
                  <Text size={Size.Small} appearance={TextAppearance.Muted}>
                    {t("settings:language.chooseLanguage")}
                  </Text>
                </View>
                <Select
                  options={languageOptions}
                  value={currentLanguage}
                  onChange={handleLanguageChange}
                  size={Size.Medium}
                  style={styles.languageSelect}
                />
              </View>
            </View>
          </Card>
        </View>

        {/* App Settings Section */}
        <View style={styles.section}>
          <Text
            size={Size.Medium}
            appearance={TextAppearance.Muted}
            style={styles.sectionTitle}
          >
            {t("settings:appSettings.section")}
          </Text>

          <Card style={styles.card} fullBleed={isMobile}>
            <View style={[styles.cardContent, isMobile && styles.cardContentMobile]}>
              <SpeedSelector />
            </View>
          </Card>
        </View>

        {/* Trading Settings Section */}
        <TradingSettingsSection />

        {/* Servers Section */}
        <View style={styles.section}>
          <Text
            size={Size.Medium}
            appearance={TextAppearance.Muted}
            style={styles.sectionTitle}
          >
            Servers
          </Text>

          <ServersCard />
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
    minHeight: 44,
    minWidth: 44,
    justifyContent: "center",
    alignItems: "center",
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
  cardContentMobile: {
    padding: 16,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  settingRowMobile: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 12,
  },
  settingInfo: {
    flex: 1,
    gap: 4,
  },
  languageSelect: {
    minWidth: 140,
  },
});
