/**
 * Servers Card
 *
 * Combined card showing all API servers with their status, latency,
 * and ability to select which server to connect to.
 * Also shows peer mesh connectivity between servers.
 */

import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Pressable, ScrollView } from "react-native";
import { Card, Text, Icon, AnimatedNumber, ProgressBar, Toggle } from "@wraith/ghost/components";
import { Size, TextAppearance, Brightness } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { Colors } from "@wraith/ghost/tokens";
import { useApiServer, type ApiServer, type ServerStatus } from "../context/ApiServerContext";
import { usePeerSubscription, type PeerUpdate, type PeerStatus } from "../hooks/useHauntSocket";
import { hauntClient, type PeerMeshResponse } from "../services/haunt";

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
};

const ServerRow = React.memo(function ServerRow({ server, isActive, onSelect, peerStatus }: ServerRowProps) {
  const themeColors = useThemeColors();
  const statusColor = getStatusColor(server.status);
  const latencyColor = getLatencyColor(server.latencyMs);

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
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
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
        <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
          {server.region}
        </Text>
      </View>

      <View style={styles.serverStats}>
        {server.status === "checking" ? (
          <Icon name="loader" size={Size.Small} color={Colors.data.amber} />
        ) : server.status === "online" && displayLatency !== null && displayLatency !== undefined ? (
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
    autoSelectFastest,
    setAutoSelectFastest,
    refreshServerStatus,
    isRefreshing,
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

  // Calculate overall health
  const onlineCount = servers.filter((s) => s.status === "online").length;
  const healthPercent = Math.round((onlineCount / servers.length) * 100);
  const healthColor =
    healthPercent >= 80
      ? Colors.status.success
      : healthPercent >= 50
      ? Colors.status.warning
      : Colors.status.danger;

  // Peer mesh health
  const meshConnected = peerData?.connectedCount || 0;
  const meshTotal = peerData?.totalPeers || 0;

  return (
    <Card style={styles.card}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Icon name="server" size={Size.Small} color={themeColors.text.muted} />
            <Text size={Size.Medium} weight="semibold">
              Servers
            </Text>
          </View>
          <Pressable onPress={refreshServerStatus} disabled={isRefreshing}>
            <Icon
              name="refresh-cw"
              size={Size.Small}
              color={isRefreshing ? Colors.data.amber : themeColors.text.muted}
            />
          </Pressable>
        </View>

        {/* Auto-select toggle */}
        <View style={styles.autoSelectRow}>
          <View style={styles.autoSelectInfo}>
            <Text size={Size.Small}>Auto-select fastest</Text>
            <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
              Automatically connect to the server with lowest latency
            </Text>
          </View>
          <Toggle
            value={autoSelectFastest}
            onChange={setAutoSelectFastest}
            size={Size.Small}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: themeColors.border.subtle }]} />

        {/* Server list */}
        <ScrollView style={styles.serverList} showsVerticalScrollIndicator={false}>
          {servers.map((server) => (
            <ServerRow
              key={server.id}
              server={server}
              isActive={activeServer?.id === server.id}
              onSelect={setActiveServer}
              peerStatus={getPeerStatus(server.name)}
            />
          ))}
        </ScrollView>

        {/* Status footer */}
        <View style={styles.footer}>
          {/* Network health */}
          <View style={styles.healthSection}>
            <View style={styles.healthHeader}>
              <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                API Servers
              </Text>
              <Text size={Size.TwoXSmall} style={{ color: healthColor }}>
                {onlineCount}/{servers.length} online
              </Text>
            </View>
            <ProgressBar
              value={healthPercent}
              max={100}
              size={Size.ExtraSmall}
              color={healthColor}
              brightness={Brightness.Soft}
            />
          </View>

          {/* Mesh health (if available) */}
          {meshTotal > 0 && (
            <View style={styles.healthSection}>
              <View style={styles.healthHeader}>
                <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                  Server Mesh
                </Text>
                <Text
                  size={Size.TwoXSmall}
                  style={{
                    color: meshConnected === meshTotal
                      ? Colors.status.success
                      : meshConnected > 0
                      ? Colors.status.warning
                      : Colors.status.danger,
                  }}
                >
                  {meshConnected}/{meshTotal} connected
                </Text>
              </View>
              <ProgressBar
                value={(meshConnected / meshTotal) * 100}
                max={100}
                size={Size.ExtraSmall}
                color={
                  meshConnected === meshTotal
                    ? Colors.status.success
                    : meshConnected > 0
                    ? Colors.status.warning
                    : Colors.status.danger
                }
                brightness={Brightness.Soft}
              />
            </View>
          )}
        </View>
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
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  autoSelectRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  autoSelectInfo: {
    flex: 1,
    gap: 2,
    marginRight: 16,
  },
  divider: {
    height: 1,
    marginBottom: 16,
  },
  serverList: {
    maxHeight: 300,
    marginBottom: 16,
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
    gap: 2,
  },
  serverHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  serverStats: {
    alignItems: "flex-end",
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
});
