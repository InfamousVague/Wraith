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
import { useApiServer, type ApiServer } from "../context/ApiServerContext";

type ServerSelectorModalProps = {
  visible: boolean;
  onClose: () => void;
};

// Get latency color
function getLatencyColor(latency: number | null): string {
  if (latency === null) return Colors.data.slate;
  if (latency < 50) return Colors.status.success;
  if (latency < 150) return Colors.status.warning;
  if (latency < 300) return Colors.data.amber;
  return Colors.status.danger;
}

// Get status color
function getStatusColor(status: string): string {
  switch (status) {
    case "online":
      return Colors.status.success;
    case "checking":
      return Colors.status.warning;
    case "offline":
    default:
      return Colors.status.danger;
  }
}

type ServerRowProps = {
  server: ApiServer;
  isActive: boolean;
  onSelect: (serverId: string) => void;
};

const ServerRow = React.memo(function ServerRow({ server, isActive, onSelect }: ServerRowProps) {
  const themeColors = useThemeColors();
  const statusColor = getStatusColor(server.status);
  const latencyColor = getLatencyColor(server.latencyMs);
  const isSelectable = server.status === "online";

  return (
    <Pressable
      onPress={() => isSelectable && onSelect(server.id)}
      disabled={!isSelectable}
      style={({ pressed }: { pressed: boolean }) => [
        styles.serverRow,
        { backgroundColor: isActive ? `${Colors.status.success}15` : "transparent" },
        { borderColor: isActive ? Colors.status.success : themeColors.border.subtle },
        pressed && isSelectable && { opacity: 0.7 },
        !isSelectable && { opacity: 0.5 },
      ]}
    >
      <View style={styles.serverRowLeft}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <View style={styles.serverRowInfo}>
          <View style={styles.serverNameRow}>
            <Text size={Size.Medium} weight={isActive ? "semibold" : "regular"}>
              {server.name}
            </Text>
            {server.isLocal && (
              <View style={[styles.badge, { backgroundColor: `${Colors.data.violet}20` }]}>
                <Text size={Size.TwoXSmall} style={{ color: Colors.data.violet }}>
                  Local
                </Text>
              </View>
            )}
            {server.isDiscovered && (
              <View style={[styles.badge, { backgroundColor: `${Colors.data.cyan}20` }]}>
                <Text size={Size.TwoXSmall} style={{ color: Colors.data.cyan }}>
                  Discovered
                </Text>
              </View>
            )}
          </View>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
            {server.region}
          </Text>
        </View>
      </View>
      <View style={styles.serverRowRight}>
        {isActive && (
          <Icon name="check-circle" size={Size.Medium} color={Colors.status.success} />
        )}
        {server.latencyMs !== null ? (
          <Text size={Size.Small} style={{ color: latencyColor }}>
            {server.latencyMs}ms
          </Text>
        ) : (
          <Text size={Size.Small} appearance={TextAppearance.Muted}>
            {server.status === "checking" ? "..." : "--"}
          </Text>
        )}
      </View>
    </Pressable>
  );
});

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
    padding: 24,
  },
  modal: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    borderRadius: 16,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  closeButton: {
    padding: 8,
  },
  autoSelectSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  autoSelectInfo: {
    flex: 1,
    marginRight: 16,
  },
  autoSelectHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  serverList: {
    maxHeight: 300,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  serverRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  serverRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  serverRowInfo: {
    flex: 1,
  },
  serverNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  serverRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  healthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  healthLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    width: 90,
  },
  healthBar: {
    flex: 1,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
});
