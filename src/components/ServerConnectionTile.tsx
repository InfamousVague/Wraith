/**
 * Server Connection Tile
 *
 * A carousel-sized card showing current server connection status.
 * Clickable to open the server selector modal.
 */

import React, { useState, useCallback, useEffect } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { Card, Text, Icon, ProgressBar, Badge } from "@wraith/ghost/components";
import { Size, TextAppearance, Brightness } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { Colors } from "@wraith/ghost/tokens";
import { useApiServer } from "../context/ApiServerContext";
import { usePeerSubscription, type PeerUpdate } from "../hooks/useHauntSocket";
import { ServerSelectorModal } from "./ServerSelectorModal";

// Get latency color
function getLatencyColor(latency: number | null): string {
  if (latency === null) return Colors.data.slate;
  if (latency < 50) return Colors.status.success;
  if (latency < 150) return Colors.status.warning;
  return Colors.status.danger;
}

export function ServerConnectionTile() {
  const { t } = useTranslation("components");
  const themeColors = useThemeColors();
  const { activeServer, servers, autoSelectFastest, peerMesh } = useApiServer();
  const [modalVisible, setModalVisible] = useState(false);
  const [peerData, setPeerData] = useState<PeerUpdate | null>(null);

  // Subscribe to real-time peer updates
  const handlePeerUpdate = useCallback((update: PeerUpdate) => {
    setPeerData(update);
  }, []);

  usePeerSubscription(handlePeerUpdate);

  // Calculate mesh health
  const onlineServers = servers.filter((s) => s.status === "online").length;
  const totalServers = servers.length;
  const meshHealthPercent = totalServers > 0 ? Math.round((onlineServers / totalServers) * 100) : 0;

  // Get peer mesh stats
  const connectedPeers = peerMesh?.connectedCount ?? peerData?.peers.filter((p) => p.status === "connected").length ?? 0;
  const totalPeers = peerMesh?.totalPeers ?? peerData?.peers.length ?? 0;

  const latency = activeServer?.latencyMs ?? null;
  const latencyColor = getLatencyColor(latency);

  return (
    <>
      <Pressable onPress={() => setModalVisible(true)}>
        <Card style={styles.card}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                Server Connection
              </Text>
              {autoSelectFastest && (
                <View style={[styles.autoBadge, { backgroundColor: `${Colors.status.info}20` }]}>
                  <Text size={Size.TwoXSmall} style={{ color: Colors.status.info }}>
                    Auto
                  </Text>
                </View>
              )}
            </View>

            <View style={[styles.divider, { backgroundColor: themeColors.border.subtle }]} />

            {/* Active Server Info */}
            <View style={styles.serverInfo}>
              <View style={styles.serverNameRow}>
                <View style={[styles.statusDot, { backgroundColor: activeServer?.status === "online" ? Colors.status.success : Colors.status.danger }]} />
                <Text size={Size.Large} weight="semibold">
                  {activeServer?.name ?? "Unknown"}
                </Text>
              </View>
              <Text size={Size.Small} appearance={TextAppearance.Muted}>
                {activeServer?.region ?? "Unknown Region"}
              </Text>
            </View>

            {/* Latency */}
            <View style={styles.latencySection}>
              <View style={styles.latencyRow}>
                <Icon name="activity" size={Size.Small} color={latencyColor} />
                <Text size={Size.Small} appearance={TextAppearance.Muted}>
                  Latency
                </Text>
              </View>
              <View style={styles.latencyValue}>
                {latency !== null ? (
                  <>
                    <Text size={Size.ExtraLarge} weight="bold" style={{ color: latencyColor }}>
                      {latency}
                    </Text>
                    <Text size={Size.Small} appearance={TextAppearance.Muted}>
                      {" "}ms
                    </Text>
                  </>
                ) : (
                  <Text size={Size.Medium} appearance={TextAppearance.Muted}>
                    --
                  </Text>
                )}
              </View>
            </View>

            {/* Mesh Health */}
            <View style={styles.healthSection}>
              <View style={styles.healthHeader}>
                <View style={styles.healthLabel}>
                  <Icon name="wifi-off" size={Size.Small} color={themeColors.text.muted} />
                  <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                    Mesh Health
                  </Text>
                </View>
                <Text size={Size.TwoXSmall} style={{ color: meshHealthPercent >= 80 ? Colors.status.success : meshHealthPercent >= 50 ? Colors.status.warning : Colors.status.danger }}>
                  {onlineServers}/{totalServers} servers
                </Text>
              </View>
              <ProgressBar
                value={meshHealthPercent}
                max={100}
                size={Size.ExtraSmall}
                color={meshHealthPercent >= 80 ? Colors.status.success : meshHealthPercent >= 50 ? Colors.status.warning : Colors.status.danger}
                brightness={Brightness.Soft}
              />
            </View>

            {/* Peer Mesh Info */}
            {totalPeers > 0 && (
              <View style={styles.peerInfo}>
                <Icon name="layers" size={Size.ExtraSmall} color={themeColors.text.muted} />
                <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                  {connectedPeers}/{totalPeers} peers connected
                </Text>
              </View>
            )}

            {/* Tap Hint */}
            <View style={styles.tapHint}>
              <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                Tap to change server
              </Text>
              <Icon name="chevron-right" size={Size.ExtraSmall} color={themeColors.text.muted} />
            </View>
          </View>
        </Card>
      </Pressable>

      <ServerSelectorModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 320,
    height: 356,
    flexShrink: 0,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  autoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  divider: {
    height: 1,
    marginBottom: 16,
  },
  serverInfo: {
    marginBottom: 16,
  },
  serverNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  latencySection: {
    marginBottom: 16,
  },
  latencyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  latencyValue: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  healthSection: {
    marginBottom: 12,
    gap: 8,
  },
  healthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  healthLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  peerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  tapHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: "auto",
    paddingTop: 12,
  },
});
