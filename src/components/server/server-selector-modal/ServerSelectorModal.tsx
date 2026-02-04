/**
 * Server Selector Modal
 *
 * Modal/bottom sheet for selecting a server from the mesh.
 * Shows all available servers with latency and status.
 */

import React, { useCallback } from "react";
import { View, StyleSheet, ScrollView, Pressable, Modal } from "react-native";
import { useTranslation } from "react-i18next";
import { Text, Icon, ProgressBar, Toggle } from "@wraith/ghost/components";
import { Size, TextAppearance, Brightness } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { Colors } from "@wraith/ghost/tokens";
import { spacing, radii } from "../../../styles/tokens";
import { useApiServer } from "../../../context/ApiServerContext";
import { ServerRow } from "./ServerRow";
import type { ServerSelectorModalProps } from "./types";

export function ServerSelectorModal({ visible, onClose }: ServerSelectorModalProps) {
  const { t } = useTranslation("components");
  const themeColors = useThemeColors();
  const {
    servers,
    activeServer,
    setActiveServer,
    autoSelectFastest,
    setAutoSelectFastest,
    refreshServerStatus,
    isRefreshing,
    peerMesh,
  } = useApiServer();

  const handleServerSelect = useCallback((serverId: string) => {
    setActiveServer(serverId);
    onClose();
  }, [setActiveServer, onClose]);

  const handleAutoSelectToggle = useCallback((value: boolean) => {
    setAutoSelectFastest(value);
    if (value) {
      refreshServerStatus();
    }
  }, [setAutoSelectFastest, refreshServerStatus]);

  // Calculate stats
  const onlineServers = servers.filter((s) => s.status === "online").length;
  const totalServers = servers.length;
  const meshHealthPercent = totalServers > 0 ? Math.round((onlineServers / totalServers) * 100) : 0;

  const connectedPeers = peerMesh?.connectedCount ?? 0;
  const totalPeers = peerMesh?.totalPeers ?? 0;
  const peerHealthPercent = totalPeers > 0 ? Math.round((connectedPeers / totalPeers) * 100) : 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.modal, { backgroundColor: themeColors.background.surface }]} onPress={(e: any) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <Text size={Size.Large} weight="bold">
              Select Server
            </Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={Size.Medium} color={themeColors.text.secondary} />
            </Pressable>
          </View>

          {/* Auto-select Toggle */}
          <View style={[styles.autoSelectSection, { borderBottomColor: themeColors.border.subtle }]}>
            <View style={styles.autoSelectInfo}>
              <View style={styles.autoSelectHeader}>
                <Icon name="zap" size={Size.Small} color={Colors.status.info} />
                <Text size={Size.Medium} weight="medium">
                  Auto-select fastest
                </Text>
              </View>
              <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                Automatically switch to the server with lowest latency
              </Text>
            </View>
            <Toggle
              value={autoSelectFastest}
              onChange={handleAutoSelectToggle}
            />
          </View>

          {/* Server List */}
          <ScrollView style={styles.serverList} showsVerticalScrollIndicator={false}>
            {servers.map((server) => (
              <ServerRow
                key={server.id}
                server={server}
                isActive={server.id === activeServer?.id}
                onSelect={handleServerSelect}
              />
            ))}
          </ScrollView>

          {/* Footer Stats */}
          <View style={[styles.footer, { borderTopColor: themeColors.border.subtle }]}>
            {/* Server Health */}
            <View style={styles.healthRow}>
              <View style={styles.healthLabel}>
                <Icon name="database" size={Size.ExtraSmall} color={themeColors.text.muted} />
                <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                  Servers
                </Text>
              </View>
              <View style={styles.healthBar}>
                <ProgressBar
                  value={meshHealthPercent}
                  max={100}
                  size={Size.ExtraSmall}
                  color={meshHealthPercent >= 80 ? Colors.status.success : meshHealthPercent >= 50 ? Colors.status.warning : Colors.status.danger}
                  brightness={Brightness.Soft}
                />
              </View>
              <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                {onlineServers}/{totalServers}
              </Text>
            </View>

            {/* Peer Health */}
            {totalPeers > 0 && (
              <View style={styles.healthRow}>
                <View style={styles.healthLabel}>
                  <Icon name="layers" size={Size.ExtraSmall} color={themeColors.text.muted} />
                  <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                    Mesh Peers
                  </Text>
                </View>
                <View style={styles.healthBar}>
                  <ProgressBar
                    value={peerHealthPercent}
                    max={100}
                    size={Size.ExtraSmall}
                    color={peerHealthPercent >= 80 ? Colors.status.success : peerHealthPercent >= 50 ? Colors.status.warning : Colors.status.danger}
                    brightness={Brightness.Soft}
                  />
                </View>
                <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                  {connectedPeers}/{totalPeers}
                </Text>
              </View>
            )}

            {/* Refresh Button */}
            <Pressable
              onPress={refreshServerStatus}
              disabled={isRefreshing}
              style={[styles.refreshButton, { borderColor: themeColors.border.subtle }]}
            >
              <Icon
                name="activity"
                size={Size.Small}
                color={isRefreshing ? themeColors.text.muted : themeColors.text.secondary}
              />
              <Text size={Size.Small} appearance={isRefreshing ? TextAppearance.Muted : TextAppearance.Secondary}>
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  modal: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    borderRadius: radii.xl,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
  },
  closeButton: {
    padding: spacing.xs,
  },
  autoSelectSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  autoSelectInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  autoSelectHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xxs,
  },
  serverList: {
    maxHeight: 300,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  healthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  healthLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    width: 90,
  },
  healthBar: {
    flex: 1,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    marginTop: spacing.xs,
  },
});
