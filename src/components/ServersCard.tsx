/**
 * Servers Card
 *
 * Combined card showing all API servers with their status, latency,
 * and ability to select which server to connect to.
 * Also shows peer mesh connectivity between servers.
 * Enhanced with animated ping indicators and mesh health visualization.
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, StyleSheet, Pressable, ScrollView } from "react-native";
import { Card, Text, Icon, AnimatedNumber } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { Colors } from "@wraith/ghost/tokens";
import { useApiServer, type ApiServer, type ServerStatus } from "../context/ApiServerContext";
import { usePeerSubscription, type PeerUpdate, type PeerStatus } from "../hooks/useHauntSocket";
import { hauntClient, type PeerMeshResponse, type SyncStatus } from "../services/haunt";
import { PingIndicator } from "./PingIndicator";

/** Sync indicator showing data ahead/behind arrows */
function SyncIndicator({ syncStatus }: { syncStatus?: SyncStatus }) {
  if (!syncStatus) return null;

  const totalAhead = syncStatus.predictionsAhead + syncStatus.preferencesAhead;
  const totalBehind = syncStatus.predictionsBehind + syncStatus.preferencesBehind;

  // Don't show if perfectly in sync
  if (totalAhead === 0 && totalBehind === 0) {
    return (
      <View style={syncStyles.container}>
        <Icon name="check" size={Size.TwoXSmall} color={Colors.status.success} />
        <Text size={Size.TwoXSmall} style={{ color: Colors.status.success }}>
          synced
        </Text>
      </View>
    );
  }

  return (
    <View style={syncStyles.container}>
      {totalAhead > 0 && (
        <View style={syncStyles.indicator}>
          <Icon name="arrow-up" size={Size.TwoXSmall} color={Colors.status.success} />
          <Text size={Size.TwoXSmall} style={{ color: Colors.status.success }}>
            {totalAhead}
          </Text>
        </View>
      )}
      {totalBehind > 0 && (
        <View style={syncStyles.indicator}>
          <Icon name="arrow-down" size={Size.TwoXSmall} color={Colors.data.amber} />
          <Text size={Size.TwoXSmall} style={{ color: Colors.data.amber }}>
            {totalBehind}
          </Text>
        </View>
      )}
      {syncStatus.syncing && (
        <Icon name="refresh-cw" size={Size.TwoXSmall} color={Colors.data.amber} />
      )}
    </View>
  );
}

const syncStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  indicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
});

// Threshold for removing offline servers from list (5 minutes)
const OFFLINE_THRESHOLD_MS = 5 * 60 * 1000;

function getStatusColor(status: ServerStatus | PeerStatus["status"]): string {
  switch (status) {
    case "online":
    case "connected":
      return Colors.status.success;
    case "offline":
    case "failed":
      return Colors.status.danger;
    case "checking":
    case "connecting":
      return Colors.data.amber;
    case "disconnected":
    default:
      return Colors.text.muted;
  }
}

function getLatencyColor(latencyMs: number | null | undefined): string {
  if (latencyMs === null || latencyMs === undefined) return Colors.text.muted;
  if (latencyMs < 50) return Colors.status.success;
  if (latencyMs < 150) return Colors.data.amber;
  if (latencyMs < 300) return Colors.status.warning;
  return Colors.status.danger;
}

type ServerRowProps = {
  server: ApiServer;
  isActive: boolean;
  onSelect: (id: string) => void;
  peerStatus?: PeerStatus;
  showPingIndicator?: boolean;
};

const ServerRow = React.memo(function ServerRow({
  server,
  isActive,
  onSelect,
  peerStatus,
  showPingIndicator = true,
}: ServerRowProps) {
  const themeColors = useThemeColors();
  const statusColor = getStatusColor(server.status);

  // Use peer latency if available and connected
  const displayLatency = peerStatus?.status === "connected" && peerStatus.latencyMs
    ? peerStatus.latencyMs
    : server.latencyMs;
  const displayLatencyColor = getLatencyColor(displayLatency);

  return (
    <Pressable
      onPress={() => server.status === "online" && onSelect(server.id)}
      style={({ pressed }) => [
        styles.serverRow,
        {
          backgroundColor: isActive
            ? `${Colors.status.success}15`
            : pressed
            ? themeColors.background.hover
            : "transparent",
          borderColor: isActive ? Colors.status.success : themeColors.border.subtle,
          opacity: server.status === "offline" ? 0.5 : 1,
        },
      ]}
      disabled={server.status !== "online"}
    >
      <View style={styles.serverInfo}>
        <View style={styles.serverHeader}>
          {/* Animated status icon based on server state */}
          {server.status === "checking" ? (
            <Icon name="radio" size={Size.ExtraSmall} color={Colors.data.amber} />
          ) : server.status === "online" ? (
            <Icon name="tower" size={Size.ExtraSmall} color={Colors.status.success} />
          ) : (
            <Icon name="wifi-off" size={Size.ExtraSmall} color={Colors.status.danger} />
          )}
          <Text size={Size.Small} weight="semibold">
            {server.name}
          </Text>
          {isActive && (
            <View style={[styles.activeBadge, { backgroundColor: `${Colors.status.success}20` }]}>
              <Text size={Size.TwoXSmall} style={{ color: Colors.status.success }}>
                Active
              </Text>
            </View>
          )}
        </View>
        <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted} style={styles.regionText}>
          {server.region}
        </Text>
      </View>

      <View style={styles.serverStats}>
        {server.status === "checking" ? (
          <PingIndicator latencyMs={null} size={Size.TwoXSmall} />
        ) : server.status === "online" && displayLatency !== null && displayLatency !== undefined ? (
          showPingIndicator ? (
            <View style={styles.pingWithValue}>
              <PingIndicator latencyMs={displayLatency} size={Size.TwoXSmall} />
              <View style={styles.latencyContainer}>
                <AnimatedNumber
                  value={Math.round(displayLatency)}
                  decimals={0}
                  size={Size.ExtraSmall}
                  weight="semibold"
                  style={{ color: displayLatencyColor }}
                  animate
                  animationDuration={100}
                />
                <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                  ms
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.latencyContainer}>
              <AnimatedNumber
                value={Math.round(displayLatency)}
                decimals={0}
                size={Size.Small}
                weight="semibold"
                style={{ color: displayLatencyColor }}
                animate
                animationDuration={100}
              />
              <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                ms
              </Text>
            </View>
          )
        ) : (
          <Text size={Size.ExtraSmall} style={{ color: statusColor }}>
            {server.status}
          </Text>
        )}
      </View>
    </Pressable>
  );
});

export function ServersCard() {
  const themeColors = useThemeColors();
  const {
    servers,
    activeServer,
    setActiveServer,
    refreshServerStatus,
    isRefreshing,
    useAutoFastest,
    setUseAutoFastest,
    fastestServer,
  } = useApiServer();

  // Peer mesh state
  const [peerData, setPeerData] = useState<PeerMeshResponse | null>(null);

  // Fetch peer mesh on mount
  useEffect(() => {
    hauntClient.getPeers()
      .then((response) => setPeerData(response.data))
      .catch(() => {});
  }, []);

  // Subscribe to real-time peer updates
  usePeerSubscription(
    useCallback((update: PeerUpdate) => {
      setPeerData({
        serverId: update.serverId,
        serverRegion: update.serverRegion,
        peers: update.peers,
        connectedCount: update.peers.filter((p) => p.status === "connected").length,
        totalPeers: update.peers.length,
        timestamp: update.timestamp,
      });
    }, [])
  );

  // Get peer status by region name
  const getPeerStatus = (serverName: string): PeerStatus | undefined => {
    return peerData?.peers.find(
      (p) => p.region.toLowerCase().includes(serverName.toLowerCase())
    );
  };

  // Filter out servers that have been offline for more than 5 minutes
  const visibleServers = useMemo(() => {
    const now = Date.now();
    return servers.filter((server) => {
      // Always show online or checking servers
      if (server.status === "online" || server.status === "checking") return true;
      // Always show local server
      if (server.isLocal) return true;
      // Show offline servers only if they went offline recently
      if (server.lastChecked && now - server.lastChecked < OFFLINE_THRESHOLD_MS) return true;
      return false;
    });
  }, [servers]);

  // Calculate mesh health stats
  const meshStats = useMemo(() => {
    if (!peerData) return null;
    const connectedPeers = peerData.peers.filter((p) => p.status === "connected");
    const avgLatency = connectedPeers.length > 0
      ? connectedPeers.reduce((sum, p) => sum + (p.latencyMs || 0), 0) / connectedPeers.length
      : null;
    return {
      connected: connectedPeers.length,
      total: peerData.totalPeers,
      avgLatency,
      healthPercent: peerData.totalPeers > 0
        ? Math.round((connectedPeers.length / peerData.totalPeers) * 100)
        : 0,
    };
  }, [peerData]);

  return (
    <Card style={styles.card}>
      <View style={styles.content}>
        {/* Header with title and mesh status */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text size={Size.Medium} weight="semibold">
              Servers
            </Text>
            {meshStats && (
              <View style={styles.meshStatusBadge}>
                <Icon
                  name="radio"
                  size={Size.TwoXSmall}
                  color={meshStats.healthPercent >= 50 ? Colors.status.success : Colors.status.warning}
                />
                <Text
                  size={Size.TwoXSmall}
                  style={{
                    color: meshStats.healthPercent >= 50 ? Colors.status.success : Colors.status.warning,
                  }}
                >
                  {meshStats.connected}/{meshStats.total} mesh
                </Text>
              </View>
            )}
          </View>
          <Pressable onPress={refreshServerStatus} disabled={isRefreshing}>
            <Icon
              name="clock"
              size={Size.Small}
              color={isRefreshing ? Colors.data.amber : themeColors.text.muted}
            />
          </Pressable>
        </View>

        {/* Fastest Server Card */}
        {fastestServer && (
          <Pressable
            onPress={() => setUseAutoFastest(true)}
            style={({ pressed }) => [
              styles.fastestCard,
              {
                backgroundColor: useAutoFastest
                  ? `${Colors.status.success}15`
                  : pressed
                  ? themeColors.background.hover
                  : themeColors.background.overlay,
                borderColor: useAutoFastest
                  ? Colors.status.success
                  : themeColors.border.subtle,
              },
            ]}
          >
            <View style={styles.fastestHeader}>
              <View style={styles.fastestTitleRow}>
                <Icon name="zap" size={Size.Small} color={Colors.status.success} />
                <Text size={Size.Small} weight="semibold">
                  Fastest Server
                </Text>
                {useAutoFastest && (
                  <View style={[styles.autoBadge, { backgroundColor: `${Colors.accent.primary}20` }]}>
                    <Text size={Size.TwoXSmall} style={{ color: Colors.accent.primary }}>
                      Auto
                    </Text>
                  </View>
                )}
              </View>
              {useAutoFastest ? (
                <View style={[styles.activeBadge, { backgroundColor: `${Colors.status.success}20` }]}>
                  <Text size={Size.TwoXSmall} style={{ color: Colors.status.success }}>
                    Active
                  </Text>
                </View>
              ) : (
                <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                  Tap to enable
                </Text>
              )}
            </View>
            <View style={styles.fastestDetails}>
              <View style={styles.fastestServerInfo}>
                <View style={[styles.statusDot, { backgroundColor: Colors.status.success }]} />
                <Text size={Size.Medium} weight="semibold">
                  {fastestServer.name}
                </Text>
                <Text size={Size.Small} appearance={TextAppearance.Muted}>
                  • {fastestServer.region}
                </Text>
              </View>
              <View style={styles.latencyContainer}>
                <AnimatedNumber
                  value={fastestServer.latencyMs ?? 0}
                  decimals={0}
                  size={Size.Medium}
                  weight="bold"
                  style={{ color: getLatencyColor(fastestServer.latencyMs) }}
                  animate
                  animationDuration={100}
                />
                <Text size={Size.Small} appearance={TextAppearance.Muted}>
                  ms
                </Text>
              </View>
            </View>
            {useAutoFastest && (
              <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted} style={{ marginTop: 4 }}>
                Auto-switching to lowest latency server
              </Text>
            )}
          </Pressable>
        )}

        <View style={[styles.divider, { backgroundColor: themeColors.border.subtle }]} />

        {/* Server list */}
        <ScrollView style={styles.serverList} showsVerticalScrollIndicator={false}>
          {visibleServers.map((server) => (
            <ServerRow
              key={server.id}
              server={server}
              isActive={activeServer?.id === server.id}
              onSelect={setActiveServer}
              peerStatus={getPeerStatus(server.name)}
            />
          ))}
        </ScrollView>

        {/* Mesh Health Visualization */}
        {peerData && peerData.peers.length > 0 && (
          <View style={styles.meshHealthSection}>
            <View style={[styles.divider, { backgroundColor: themeColors.border.subtle }]} />
            <View style={styles.meshHealthHeader}>
              <View style={styles.meshHealthTitleRow}>
                <Icon name="layers" size={Size.Small} color={themeColors.text.muted} />
                <Text size={Size.Small} weight="semibold">
                  Mesh Network
                </Text>
              </View>
              {meshStats && meshStats.avgLatency !== null && (
                <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                  Avg: {Math.round(meshStats.avgLatency)}ms
                </Text>
              )}
            </View>

            {/* Visual mesh diagram showing connected nodes */}
            <View style={styles.meshDiagram}>
              {/* Current server (center node) */}
              <View style={styles.meshCenterNode}>
                <View style={[styles.meshNode, styles.meshNodeActive, { borderColor: Colors.status.success }]}>
                  <Icon name="database" size={Size.ExtraSmall} color={Colors.status.success} />
                </View>
                <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                  {peerData.serverRegion}
                </Text>
              </View>

              {/* Connected peer nodes */}
              <View style={styles.meshPeerNodes}>
                {peerData.peers.slice(0, 4).map((peer, index) => {
                  const isConnected = peer.status === "connected";
                  const nodeColor = isConnected ? Colors.status.success : Colors.text.muted;
                  return (
                    <View key={peer.id} style={styles.meshPeerNode}>
                      {/* Connection line */}
                      <View
                        style={[
                          styles.meshConnectionLine,
                          { backgroundColor: isConnected ? `${nodeColor}50` : `${nodeColor}20` },
                        ]}
                      />
                      <View
                        style={[
                          styles.meshNode,
                          {
                            borderColor: nodeColor,
                            opacity: isConnected ? 1 : 0.5,
                          },
                        ]}
                      >
                        <Icon
                          name={isConnected ? "database" : "wifi-off"}
                          size={Size.TwoXSmall}
                          color={nodeColor}
                        />
                      </View>
                      <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                        {peer.region.split(" ")[0]}
                      </Text>
                      {isConnected && peer.latencyMs && (
                        <Text
                          size={Size.TwoXSmall}
                          style={{ color: getLatencyColor(peer.latencyMs) }}
                        >
                          {Math.round(peer.latencyMs)}ms
                        </Text>
                      )}
                      {/* Sync status indicator */}
                      {isConnected && <SyncIndicator syncStatus={peer.syncStatus} />}
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  meshStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fastestCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  fastestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fastestTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  fastestDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fastestServerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  divider: {
    height: 1,
    marginBottom: 16,
  },
  serverList: {
    maxHeight: 300,
    marginBottom: 8,
  },
  serverRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  serverInfo: {
    gap: 4,
    flex: 1,
  },
  serverHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  regionText: {
    marginLeft: 20, // Align with server name after icon
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  autoBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  serverStats: {
    alignItems: "flex-end",
    minWidth: 80,
  },
  pingWithValue: {
    alignItems: "flex-end",
    gap: 4,
  },
  latencyContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  footer: {
    gap: 12,
  },
  healthSection: {
    gap: 8,
  },
  healthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  // Mesh health visualization styles
  meshHealthSection: {
    marginTop: 8,
  },
  meshHealthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  meshHealthTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  meshDiagram: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 16,
  },
  meshCenterNode: {
    alignItems: "center",
    gap: 4,
  },
  meshNode: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  meshNodeActive: {
    shadowColor: "#00ff00",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  meshPeerNodes: {
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  meshPeerNode: {
    alignItems: "center",
    gap: 2,
  },
  meshConnectionLine: {
    position: "absolute",
    top: 14,
    right: 28,
    width: 20,
    height: 2,
    borderRadius: 1,
  },
});
