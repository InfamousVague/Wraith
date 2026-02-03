/**
 * Profile Page
 *
 * User account management and server connection.
 * Supports both Ethereum wallet authentication and local key management.
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
import { useAuth, type AuthMode } from "../context/AuthContext";
import { useWeb3Safe, ConnectButton, isWeb3Available } from "../context/Web3Context";
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

// Auth mode labels for display
const AUTH_MODE_LABELS: Record<AuthMode, string> = {
  external_wallet: "External Wallet",
  local_eth_key: "Local ETH Key",
  legacy_key: "Legacy Key",
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
    authMode,
    createAccount,
    createEthAccount,
    connectExternalWallet,
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

  // Web3 context for wallet connection
  const web3 = useWeb3Safe();

  const [importKey, setImportKey] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [hasBackedUpKey, setHasBackedUpKey] = useState(false);
  const [showAuthOptions, setShowAuthOptions] = useState(false);

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
      setShowAuthOptions(false);
    } catch (e) {
      console.error("Failed to create account:", e);
    }
  };

  const handleCreateEthAccount = async () => {
    try {
      await createEthAccount();
      setShowAuthOptions(false);
    } catch (e) {
      console.error("Failed to create ETH account:", e);
    }
  };

  const handleConnectWallet = async () => {
    try {
      if (web3?.isConnected) {
        await connectExternalWallet();
        setShowAuthOptions(false);
      }
    } catch (e) {
      console.error("Failed to connect wallet:", e);
    }
  };

  const handleImportKey = async () => {
    try {
      setImportError(null);
      await importPrivateKey(importKey.trim());
      setImportKey("");
      setShowAuthOptions(false);
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

  const handleCopyAddress = () => {
    if (user?.address) {
      navigator.clipboard.writeText(user.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadKey = () => {
    const key = exportPrivateKey();
    if (key && user) {
      const blob = new Blob(
        [JSON.stringify({ address: user.address, privateKey: key, authMode: user.authMode }, null, 2)],
        { type: "application/json" }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wraith-wallet-${user.shortAddress}.json`;
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

  // Check if current auth mode uses a local key (exportable)
  const hasLocalKey = authMode === "local_eth_key" || authMode === "legacy_key";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Logout confirmation modal */}
      <LogoutConfirmModal
        visible={showLogoutModal}
        hasBackedUpKey={hasBackedUpKey || authMode === "external_wallet"}
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
              {isAuthenticated && user ? (
                <>
                  {/* Logged in state - header with logout */}
                  <View style={[styles.accountHeader, isMobile && styles.accountHeaderMobile]}>
                    <View style={styles.accountInfo}>
                      {/* Auth mode badge */}
                      <View style={styles.authModeBadge}>
                        <Icon
                          name={authMode === "external_wallet" ? "lock" : "unlock"}
                          size={Size.ExtraSmall}
                          color={Colors.accent.primary}
                        />
                        <Text size={Size.TwoXSmall} style={{ color: Colors.accent.primary }}>
                          {authMode ? AUTH_MODE_LABELS[authMode] : "Unknown"}
                        </Text>
                      </View>

                      <View style={styles.accountRow}>
                        <Text size={Size.Small} appearance={TextAppearance.Muted}>
                          {user.address?.startsWith("0x") ? "Address" : t("auth:profile.publicKeyLabel")}
                        </Text>
                        <Pressable onPress={handleCopyAddress} style={styles.addressRow}>
                          <Text size={Size.Medium} weight="medium" style={styles.keyText}>
                            {user.shortAddress || "—"}
                          </Text>
                          <Icon name="copy" size={Size.ExtraSmall} color={themeColors.text.muted} />
                        </Pressable>
                      </View>

                      <View style={styles.accountRow}>
                        <Text size={Size.Small} appearance={TextAppearance.Muted}>
                          {t("auth:profile.accountCreated")}
                        </Text>
                        <Text size={Size.Medium}>
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
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

                  {/* Private Key Management - only for local keys */}
                  {hasLocalKey && (
                    <>
                      <View
                        style={[
                          styles.divider,
                          { backgroundColor: themeColors.border.subtle },
                        ]}
                      />

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
                  )}

                  {/* External wallet info */}
                  {authMode === "external_wallet" && (
                    <>
                      <View
                        style={[
                          styles.divider,
                          { backgroundColor: themeColors.border.subtle },
                        ]}
                      />

                      <View style={styles.walletInfo}>
                        <Icon name="lock" size={Size.Large} color={Colors.status.success} />
                        <View style={styles.walletInfoText}>
                          <Text size={Size.Medium} weight="semibold">
                            Secured by External Wallet
                          </Text>
                          <Text size={Size.Small} appearance={TextAppearance.Muted}>
                            Your private key is stored securely in your wallet (MetaMask, etc.)
                          </Text>
                        </View>
                      </View>
                    </>
                  )}
                </>
              ) : (
                <>
                  {/* Not logged in state */}
                  <View style={styles.noAccount}>
                    <Icon
                      name="user"
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

                  {/* Auth options */}
                  {showAuthOptions ? (
                    <View style={styles.authOptions}>
                      {/* External Wallet (RainbowKit) */}
                      <View style={styles.authOption}>
                        <View style={styles.authOptionHeader}>
                          <Icon name="lock" size={Size.Medium} color={Colors.accent.primary} />
                          <Text size={Size.Medium} weight="semibold">
                            Connect Wallet
                          </Text>
                          <View style={[styles.recommendedBadge, { backgroundColor: `${Colors.status.success}20` }]}>
                            <Text size={Size.TwoXSmall} style={{ color: Colors.status.success }}>
                              Recommended
                            </Text>
                          </View>
                        </View>
                        <Text size={Size.Small} appearance={TextAppearance.Muted} style={styles.authOptionDesc}>
                          Use MetaMask, WalletConnect, or other wallets. Most secure option.
                        </Text>
                        {isWeb3Available ? (
                          <>
                            <View style={styles.walletConnectWrapper}>
                              <ConnectButton />
                            </View>
                            {web3?.isConnected && (
                              <Button
                                label="Use Connected Wallet"
                                onPress={handleConnectWallet}
                                size={Size.Small}
                                shape={Shape.Rounded}
                                style={styles.authOptionButton}
                              />
                            )}
                          </>
                        ) : (
                          <Text size={Size.Small} appearance={TextAppearance.Muted}>
                            WalletConnect not configured
                          </Text>
                        )}
                      </View>

                      <View style={[styles.authDivider, { backgroundColor: themeColors.border.subtle }]}>
                        <Text size={Size.Small} appearance={TextAppearance.Muted}>or</Text>
                      </View>

                      {/* Local ETH Key */}
                      <View style={styles.authOption}>
                        <View style={styles.authOptionHeader}>
                          <Icon name="unlock" size={Size.Medium} color={themeColors.text.muted} />
                          <Text size={Size.Medium} weight="semibold">
                            Create Local Key
                          </Text>
                        </View>
                        <Text size={Size.Small} appearance={TextAppearance.Muted} style={styles.authOptionDesc}>
                          Generate an Ethereum-compatible key stored in your browser.
                        </Text>
                        <Button
                          label="Create ETH Key"
                          onPress={handleCreateEthAccount}
                          size={Size.Small}
                          shape={Shape.Rounded}
                          appearance={Appearance.Secondary}
                          style={styles.authOptionButton}
                        />
                      </View>

                      <View style={[styles.authDivider, { backgroundColor: themeColors.border.subtle }]}>
                        <Text size={Size.Small} appearance={TextAppearance.Muted}>or</Text>
                      </View>

                      {/* Import existing key */}
                      <View style={styles.authOption}>
                        <View style={styles.authOptionHeader}>
                          <Icon name="upload" size={Size.Medium} color={themeColors.text.muted} />
                          <Text size={Size.Medium} weight="semibold">
                            Import Key
                          </Text>
                        </View>
                        <Text size={Size.Small} appearance={TextAppearance.Muted} style={styles.authOptionDesc}>
                          Import an existing private key (0x... for ETH or hex for legacy).
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
                          style={styles.authOptionButton}
                        />
                      </View>

                      <Pressable
                        onPress={() => setShowAuthOptions(false)}
                        style={styles.cancelButton}
                      >
                        <Text size={Size.Small} appearance={TextAppearance.Muted}>
                          Cancel
                        </Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Button
                      label="Get Started"
                      onPress={() => setShowAuthOptions(true)}
                      size={Size.Medium}
                      shape={Shape.Rounded}
                      style={styles.createButton}
                    />
                  )}
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
    gap: 12,
  },
  authModeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignSelf: "flex-start",
  },
  accountRow: {
    gap: 4,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  walletInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 16,
    backgroundColor: "rgba(0, 255, 0, 0.05)",
    borderRadius: 12,
  },
  walletInfoText: {
    flex: 1,
    gap: 4,
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
    alignSelf: "center",
    minWidth: 200,
  },
  authOptions: {
    gap: 16,
  },
  authOption: {
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 12,
    gap: 8,
  },
  authOptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  recommendedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: "auto",
  },
  authOptionDesc: {
    marginBottom: 8,
  },
  authOptionButton: {
    alignSelf: "flex-start",
  },
  walletConnectWrapper: {
    marginVertical: 8,
  },
  authDivider: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 1,
    position: "relative",
  },
  cancelButton: {
    alignSelf: "center",
    padding: 12,
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
