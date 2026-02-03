/**
 * @file Profile.tsx
 * @description User profile management and server connection page.
 *
 * ## Features:
 * - View/manage local wallet (public key)
 * - Create new account (generates Ed25519 keypair)
 * - Import existing account via private key
 * - Export/backup private key (copy or download)
 * - Connect to/disconnect from Haunt backend
 * - View server profile when connected
 *
 * ## Authentication Flow:
 * - Local wallet stored in localStorage (encrypted private key)
 * - Backend connection requires signing a challenge
 * - Server connection enables preference sync and predictions
 *
 * ## Security Notes:
 * - Private key never sent to server
 * - Challenge-response authentication
 * - Logout confirmation prevents accidental data loss
 */

import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, Text, Button, Input, Icon } from "@wraith/ghost/components";
import { Size, TextAppearance, Shape, Appearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { Colors } from "@wraith/ghost/tokens";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { Navbar } from "../components/Navbar";
import { LoginProgress } from "../components/LoginProgress";
import { LogoutConfirmModal } from "../components/LogoutConfirmModal";
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

export function Profile() {
  const navigate = useNavigate();
  const { t } = useTranslation(["auth", "common"]);
  const { isDark } = useTheme();
  const themeColors = useThemeColors();
  const colors = isDark ? themes.dark : themes.light;
  const { isMobile, isNarrow } = useBreakpoint();

  const contentPadding = isMobile ? 12 : isNarrow ? 16 : 24;
  const {
    user,
    isAuthenticated,
    createAccount,
    logout,
    exportPrivateKey,
    importPrivateKey,
    // Backend session
    isConnectedToServer,
    loginStep,
    loginError,
    loginToBackend,
    disconnectFromServer,
    serverProfile,
  } = useAuth();

  const [importKey, setImportKey] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [hasBackedUpKey, setHasBackedUpKey] = useState(false);

  const handleRevealKey = () => {
    const key = exportPrivateKey();
    if (key) {
      setRevealedKey(key);
      setShowPrivateKey(true);
    }
  };

  const handleHideKey = () => {
    setShowPrivateKey(false);
    setRevealedKey(null);
  };

  const handleCreateAccount = async () => {
    try {
      await createAccount();
    } catch (e) {
      console.error("Failed to create account:", e);
    }
  };

  const handleImportKey = async () => {
    try {
      setImportError(null);
      await importPrivateKey(importKey.trim());
      setImportKey("");
    } catch (e) {
      setImportError(e instanceof Error ? e.message : "Failed to import key");
    }
  };

  const handleCopyPrivateKey = () => {
    const key = exportPrivateKey();
    if (key) {
      navigator.clipboard.writeText(key);
      setCopied(true);
      setHasBackedUpKey(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadKey = () => {
    const key = exportPrivateKey();
    if (key && user) {
      const blob = new Blob(
        [JSON.stringify({ publicKey: user.publicKey, privateKey: key }, null, 2)],
        { type: "application/json" }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wraith-wallet-${user.publicKey.slice(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setHasBackedUpKey(true);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    setHasBackedUpKey(false);
    logout();
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  const handleBackupFromModal = () => {
    handleDownloadKey();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Logout confirmation modal */}
      <LogoutConfirmModal
        visible={showLogoutModal}
        hasBackedUpKey={hasBackedUpKey}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
        onBackupKey={handleBackupFromModal}
      />

      <Navbar />
      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.content, { paddingHorizontal: contentPadding }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigate(-1)} style={styles.backButton}>
            <Icon name="chevron-left" size={Size.Large} color={themeColors.text.secondary} />
          </Pressable>
          <Text size={Size.ExtraLarge} weight="bold">
            {t("auth:profile.title")}
          </Text>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text
            size={Size.Medium}
            appearance={TextAppearance.Muted}
            style={styles.sectionTitle}
          >
            {t("auth:profile.account")}
          </Text>

          <Card style={styles.card} fullBleed={isMobile}>
            <View style={[styles.cardContent, isMobile && styles.cardContentMobile]}>
              {isAuthenticated && user?.publicKey ? (
                <>
                  {/* Logged in state - header with logout */}
                  <View style={[styles.accountHeader, isMobile && styles.accountHeaderMobile]}>
                    <View style={styles.accountInfo}>
                      <View style={styles.accountRow}>
                        <Text size={Size.Small} appearance={TextAppearance.Muted}>
                          {t("auth:profile.publicKeyLabel")}
                        </Text>
                        <Text size={Size.Medium} weight="medium" style={styles.keyText}>
                          {user.publicKey.slice(0, 16)}...{user.publicKey.slice(-16)}
                        </Text>
                      </View>

                      <View style={styles.accountRow}>
                        <Text size={Size.Small} appearance={TextAppearance.Muted}>
                          {t("auth:profile.accountCreated")}
                        </Text>
                        <Text size={Size.Medium}>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>

                    <Pressable onPress={handleLogoutClick} style={styles.logoutButton}>
                      <Icon name="power" size={Size.Medium} color={Colors.status.danger} />
                      <Text size={Size.Small} style={{ color: Colors.status.danger }}>
                        {t("common:buttons.logout")}
                      </Text>
                    </Pressable>
                  </View>

                  <View
                    style={[
                      styles.divider,
                      { backgroundColor: themeColors.border.subtle },
                    ]}
                  />

                  {/* Private Key Management */}
                  <View style={styles.keySection}>
                    <Text size={Size.Medium} weight="semibold" style={styles.keyTitle}>
                      {t("auth:profile.privateKey")}
                    </Text>
                    <Text
                      size={Size.Small}
                      appearance={TextAppearance.Muted}
                      style={styles.keyWarning}
                    >
                      {t("auth:profile.privateKeyWarning")}
                    </Text>

                    {showPrivateKey && revealedKey ? (
                      <View style={styles.keyDisplay}>
                        <View style={styles.keyTextContainer}>
                          <Text
                            size={Size.ExtraSmall}
                            style={[styles.keyText, { color: themeColors.text.muted }]}
                            numberOfLines={2}
                          >
                            {revealedKey}
                          </Text>
                        </View>
                        <Pressable onPress={handleHideKey} style={styles.hideButton}>
                          <Icon
                            name="eye-off"
                            size={Size.Small}
                            color={themeColors.text.muted}
                          />
                        </Pressable>
                      </View>
                    ) : (
                      <Button
                        label={t("auth:profile.revealPrivateKey")}
                        onPress={handleRevealKey}
                        size={Size.Small}
                        shape={Shape.Rounded}
                        appearance={Appearance.Secondary}
                        style={styles.button}
                      />
                    )}

                    <View style={styles.keyActions}>
                      <Button
                        label={copied ? t("common:buttons.copied") : t("common:buttons.copy")}
                        onPress={handleCopyPrivateKey}
                        size={Size.Small}
                        shape={Shape.Rounded}
                        appearance={Appearance.Secondary}
                        leadingIcon="copy"
                      />
                      <Button
                        label={t("common:buttons.download")}
                        onPress={handleDownloadKey}
                        size={Size.Small}
                        shape={Shape.Rounded}
                        appearance={Appearance.Secondary}
                        leadingIcon="download"
                      />
                    </View>
                  </View>
                </>
              ) : (
                <>
                  {/* Not logged in state */}
                  <View style={styles.noAccount}>
                    <Icon
                      name="wallet"
                      size={Size.ExtraLarge}
                      color={themeColors.text.muted}
                    />
                    <Text size={Size.Large} weight="semibold" style={styles.noAccountTitle}>
                      {t("auth:profile.noAccountTitle")}
                    </Text>
                    <Text
                      size={Size.Medium}
                      appearance={TextAppearance.Muted}
                      style={styles.noAccountDesc}
                    >
                      {t("auth:profile.noAccountDesc")}
                    </Text>
                  </View>

                  <Button
                    label={t("auth:profile.createNewAccount")}
                    onPress={handleCreateAccount}
                    size={Size.Small}
                    shape={Shape.Rounded}
                    style={styles.createButton}
                  />

                  <View
                    style={[
                      styles.divider,
                      { backgroundColor: themeColors.border.subtle },
                    ]}
                  />

                  <Text
                    size={Size.Small}
                    appearance={TextAppearance.Muted}
                    style={styles.importLabel}
                  >
                    {t("auth:profile.importLabel")}
                  </Text>

                  <Input
                    value={importKey}
                    onChangeText={setImportKey}
                    placeholder={t("auth:profile.importPlaceholder")}
                    size={Size.Small}
                    shape={Shape.Rounded}
                    style={styles.importInput}
                  />

                  {importError && (
                    <Text
                      size={Size.Small}
                      appearance={TextAppearance.Danger}
                      style={styles.error}
                    >
                      {importError}
                    </Text>
                  )}

                  <Button
                    label={t("auth:profile.importPrivateKey")}
                    onPress={handleImportKey}
                    size={Size.Small}
                    shape={Shape.Rounded}
                    appearance={Appearance.Secondary}
                    disabled={!importKey.trim()}
                    style={styles.importButton}
                  />
                </>
              )}
            </View>
          </Card>
        </View>

        {/* Server Connection Section */}
        {isAuthenticated && (
          <View style={styles.section}>
            <Text
              size={Size.Medium}
              appearance={TextAppearance.Muted}
              style={styles.sectionTitle}
            >
              {t("auth:profile.serverConnection")}
            </Text>

            <Card style={styles.card} fullBleed={isMobile}>
              <View style={[styles.cardContent, isMobile && styles.cardContentMobile]}>
                {isConnectedToServer ? (
                  <>
                    {/* Connected state */}
                    <View style={styles.connectedHeader}>
                      <View style={styles.statusIndicator}>
                        <View style={[styles.statusDot, { backgroundColor: Colors.status.success }]} />
                        <Text size={Size.Medium} weight="medium">
                          {t("auth:server.connectedToServer")}
                        </Text>
                      </View>
                      <Button
                        label={t("common:buttons.disconnect")}
                        onPress={disconnectFromServer}
                        size={Size.Small}
                        shape={Shape.Rounded}
                        appearance={Appearance.Secondary}
                      />
                    </View>

                    {serverProfile && (
                      <View style={styles.serverInfo}>
                        <View style={styles.serverInfoRow}>
                          <Text size={Size.Small} appearance={TextAppearance.Muted}>
                            {t("auth:server.serverProfileId")}
                          </Text>
                          <Text size={Size.Small} style={styles.keyText}>
                            {serverProfile.id.slice(0, 8)}...
                          </Text>
                        </View>
                        <View style={styles.serverInfoRow}>
                          <Text size={Size.Small} appearance={TextAppearance.Muted}>
                            {t("auth:server.lastSeen")}
                          </Text>
                          <Text size={Size.Small}>
                            {new Date(serverProfile.lastSeen).toLocaleString()}
                          </Text>
                        </View>
                      </View>
                    )}
                  </>
                ) : (
                  <>
                    {/* Not connected state */}
                    <View style={styles.notConnected}>
                      <View style={styles.statusIndicator}>
                        <View style={[styles.statusDot, { backgroundColor: Colors.text.muted }]} />
                        <Text size={Size.Medium} weight="medium">
                          {t("auth:server.notConnected")}
                        </Text>
                      </View>
                      <Text
                        size={Size.Small}
                        appearance={TextAppearance.Muted}
                        style={styles.notConnectedDesc}
                      >
                        {t("auth:server.syncDescription")}
                      </Text>

                      <Button
                        label={t("auth:server.connectToServer")}
                        onPress={loginToBackend}
                        size={Size.Small}
                        shape={Shape.Rounded}
                        disabled={loginStep !== "idle" && loginStep !== "error"}
                        style={styles.connectButton}
                      />

                      {/* Login progress */}
                      <LoginProgress currentStep={loginStep} error={loginError} />
                    </View>
                  </>
                )}
              </View>
            </Card>
          </View>
        )}

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
  accountHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  accountHeaderMobile: {
    flexDirection: "column",
    gap: 16,
  },
  accountInfo: {
    flex: 1,
    gap: 16,
  },
  accountRow: {
    gap: 4,
  },
  keyText: {
    fontFamily: "monospace",
  },
  divider: {
    height: 1,
    marginVertical: 24,
  },
  keySection: {
    gap: 12,
  },
  keyTitle: {
    marginBottom: 4,
  },
  keyWarning: {
    marginBottom: 8,
  },
  keyDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 8,
  },
  keyTextContainer: {
    flex: 1,
    overflow: "hidden",
  },
  hideButton: {
    padding: 4,
  },
  button: {
    alignSelf: "flex-start",
  },
  keyActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "transparent",
  },
  noAccount: {
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  noAccountTitle: {
    marginTop: 8,
  },
  noAccountDesc: {
    textAlign: "center",
    maxWidth: 400,
  },
  createButton: {
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  importLabel: {
    marginBottom: 8,
  },
  importInput: {
    marginBottom: 8,
  },
  error: {
    marginBottom: 8,
  },
  importButton: {
    alignSelf: "flex-start",
  },
  // Server connection styles
  connectedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  serverInfo: {
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  serverInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  notConnected: {
    gap: 12,
  },
  notConnectedDesc: {
    maxWidth: 400,
  },
  connectButton: {
    alignSelf: "flex-start",
    marginTop: 8,
  },
});
