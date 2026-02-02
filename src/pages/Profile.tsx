/**
 * Profile Page
 *
 * User account management and server connection.
 */

import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useNavigate } from "react-router-dom";
import { Card, Text, Button, Input, Icon } from "@wraith/ghost/components";
import { Size, TextAppearance, Shape, Appearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { Navbar } from "../components/Navbar";
import { LoginProgress } from "../components/LoginProgress";
import { LogoutConfirmModal } from "../components/LogoutConfirmModal";

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
  const { isDark } = useTheme();
  const themeColors = useThemeColors();
  const colors = isDark ? themes.dark : themes.light;
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
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigate(-1)} style={styles.backButton}>
            <Icon name="chevron-left" size={Size.Medium} color={themeColors.text.muted} />
          </Pressable>
          <Text size={Size.ExtraLarge} weight="bold">
            Profile
          </Text>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text
            size={Size.Medium}
            appearance={TextAppearance.Muted}
            style={styles.sectionTitle}
          >
            ACCOUNT
          </Text>

          <Card style={styles.card}>
            <View style={styles.cardContent}>
              {isAuthenticated && user ? (
                <>
                  {/* Logged in state - header with logout */}
                  <View style={styles.accountHeader}>
                    <View style={styles.accountInfo}>
                      <View style={styles.accountRow}>
                        <Text size={Size.Small} appearance={TextAppearance.Muted}>
                          Public Key (Wallet Address)
                        </Text>
                        <Text size={Size.Medium} weight="medium" style={styles.keyText}>
                          {user.publicKey.slice(0, 16)}...{user.publicKey.slice(-16)}
                        </Text>
                      </View>

                      <View style={styles.accountRow}>
                        <Text size={Size.Small} appearance={TextAppearance.Muted}>
                          Account Created
                        </Text>
                        <Text size={Size.Medium}>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>

                    <Pressable onPress={handleLogoutClick} style={styles.logoutButton}>
                      <Icon name="power" size={Size.Medium} color="#EF4444" />
                      <Text size={Size.Small} style={{ color: "#EF4444" }}>
                        Logout
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
                      Private Key
                    </Text>
                    <Text
                      size={Size.Small}
                      appearance={TextAppearance.Muted}
                      style={styles.keyWarning}
                    >
                      Never share your private key. Anyone with this key can access your
                      account.
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
                        label="Reveal Private Key"
                        onPress={handleRevealKey}
                        size={Size.Small}
                        shape={Shape.Rounded}
                        appearance={Appearance.Secondary}
                        style={styles.button}
                      />
                    )}

                    <View style={styles.keyActions}>
                      <Button
                        label={copied ? "Copied!" : "Copy"}
                        onPress={handleCopyPrivateKey}
                        size={Size.Small}
                        shape={Shape.Rounded}
                        appearance={Appearance.Secondary}
                        leadingIcon="copy"
                      />
                      <Button
                        label="Download"
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
                      No Account Connected
                    </Text>
                    <Text
                      size={Size.Medium}
                      appearance={TextAppearance.Muted}
                      style={styles.noAccountDesc}
                    >
                      Create a new wallet or import an existing private key to save your
                      preferences and settings.
                    </Text>
                  </View>

                  <Button
                    label="Create New Account"
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
                    Or import existing private key
                  </Text>

                  <Input
                    value={importKey}
                    onChangeText={setImportKey}
                    placeholder="Enter 64-character hex private key..."
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
                    label="Import Private Key"
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
              SERVER CONNECTION
            </Text>

            <Card style={styles.card}>
              <View style={styles.cardContent}>
                {isConnectedToServer ? (
                  <>
                    {/* Connected state */}
                    <View style={styles.connectedHeader}>
                      <View style={styles.statusIndicator}>
                        <View style={[styles.statusDot, styles.statusOnline]} />
                        <Text size={Size.Medium} weight="medium">
                          Connected to Server
                        </Text>
                      </View>
                      <Button
                        label="Disconnect"
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
                            Server Profile ID
                          </Text>
                          <Text size={Size.Small} style={styles.keyText}>
                            {serverProfile.id.slice(0, 8)}...
                          </Text>
                        </View>
                        <View style={styles.serverInfoRow}>
                          <Text size={Size.Small} appearance={TextAppearance.Muted}>
                            Last Seen
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
                        <View style={[styles.statusDot, styles.statusOffline]} />
                        <Text size={Size.Medium} weight="medium">
                          Not Connected
                        </Text>
                      </View>
                      <Text
                        size={Size.Small}
                        appearance={TextAppearance.Muted}
                        style={styles.notConnectedDesc}
                      >
                        Connect to the Haunt server to sync your profile and settings
                        across devices.
                      </Text>

                      <Button
                        label="Connect to Server"
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
  accountHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
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
  statusOnline: {
    backgroundColor: "#22C55E",
  },
  statusOffline: {
    backgroundColor: "#6B7280",
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
