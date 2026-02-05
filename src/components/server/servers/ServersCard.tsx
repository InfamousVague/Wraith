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
import { spacing, radii } from "../../../styles/tokens";
import { useApiServer } from "../../../context/ApiServerContext";
import { usePeerSubscription, type PeerUpdate, type PeerStatus } from "../../../hooks/useHauntSocket";
import {
  HauntClient,
  hauntClient,
  type PeerMeshResponse,
  type SyncHealthResponse,
  type SyncStatus,
} from "../../../services/haunt";
import { PingIndicator } from "../ping-indicator";
import { ServerRow } from "./ServerRow";
import { getLatencyColor, OFFLINE_THRESHOLD_MS } from "./utils";
import type { ApiServer } from "./types";

export function ServersCard() {
  const themeColors = useThemeColors();
  const {
    servers,
    activeServer,
    setActiveServer,
    useAutoFastest,
    setUseAutoFastest,
    fastestServer,
  } = useApiServer();

  // Peer mesh state
  const [peerData, setPeerData] = useState<PeerMeshResponse | null>(null);

  // Sync health state (per server)
  const [syncHealthByServerId, setSyncHealthByServerId] = useState<Record<string, SyncHealthResponse | null>>({});

  // Fetch peer mesh on mount
  useEffect(() => {
    hauntClient.getPeers()
      .then((response) => setPeerData(response.data))
      .catch(() => {});
  }, []);

  // Fetch sync health from each server directly
  const refreshSyncHealth = useCallback(async () => {
    const results = await Promise.all(
      servers.map(async (server) => {
        if (server.status !== "online" && !server.isLocal) {
          return { id: server.id, health: null as SyncHealthResponse | null };
        }

        try {
          const client = new HauntClient(server.url);
          const health = await client.getSyncHealth();
          return { id: server.id, health };
        } catch {
          return { id: server.id, health: null as SyncHealthResponse | null };
        }
      })
    );

    setSyncHealthByServerId((prev) => {
      const next = { ...prev };
      for (const r of results) next[r.id] = r.health;
      return next;
    });
  }, [servers]);

  useEffect(() => {
    refreshSyncHealth();
    const interval = setInterval(refreshSyncHealth, 10000);
    return () => clearInterval(interval);
  }, [refreshSyncHealth]);

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

  // Get peer status by server ID or name
  const getPeerStatus = (server: ApiServer): PeerStatus | undefined => {
    // Try to match by ID first (most accurate)
    const byId = peerData?.peers.find(
      (p) => p.id.toLowerCase() === server.id.toLowerCase()
    );
    if (byId) return byId;

    // Fall back to matching by name
    return peerData?.peers.find(
      (p) => p.id.toLowerCase() === server.name.toLowerCase()
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

  const syncStatusByServerId = useMemo(() => {
    const healthEntries = servers
      .map((s) => ({ server: s, health: syncHealthByServerId[s.id] }))
      .filter((e) => e.health);

    if (healthEntries.length === 0) return {} as Record<string, SyncStatus | undefined>;

    const primary = healthEntries.find((e) => e.health?.isPrimary);
    const reference = primary ?? healthEntries.reduce((best, cur) =>
      (cur.health?.syncCursorPosition ?? 0) > (best.health?.syncCursorPosition ?? 0) ? cur : best
    );
    const referenceCursor = reference.health?.syncCursorPosition ?? 0;

    const map: Record<string, SyncStatus | undefined> = {};
    for (const server of servers) {
      const health = syncHealthByServerId[server.id];
      if (!health || server.status !== "online") {
        map[server.id] = undefined;
        continue;
      }

      const delta = health.syncCursorPosition - referenceCursor;
      const ahead = delta > 0 ? delta : 0;
      const behind = delta < 0 ? Math.abs(delta) : 0;

      map[server.id] = {
        // Aggregate-only for now; we stuff the delta into one bucket.
        predictionsAhead: ahead,
        predictionsBehind: behind,
        preferencesAhead: 0,
        preferencesBehind: 0,
        syncing: health.pendingSyncCount > 0,
      };
    }

    return map;
  }, [servers, syncHealthByServerId]);

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
              peerStatus={getPeerStatus(server)}
              syncStatus={syncStatusByServerId[server.id]}
            />
          ))}
        </ScrollView>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  meshStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    borderRadius: radii.lg,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  fastestCard: {
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  fastestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fastestTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  fastestDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fastestServerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  divider: {
    height: 1,
    marginBottom: spacing.md,
  },
  serverList: {
    maxHeight: 300,
    marginBottom: spacing.xs,
  },
  serverRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
  serverInfo: {
    gap: spacing.xxs,
    flex: 1,
  },
  serverHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
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
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.soft,
  },
  autoBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.soft,
    marginLeft: spacing.xxs,
  },
  serverStats: {
    alignItems: "flex-end",
    minWidth: 100,
  },
  dualPingContainer: {
    alignItems: "flex-end",
    gap: spacing.xxs,
  },
  pingWithValue: {
    alignItems: "flex-end",
    gap: spacing.xxs,
  },
  latencyContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  footer: {
    gap: spacing.sm,
  },
  healthSection: {
    gap: spacing.xs,
  },
  healthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  // Mesh health visualization styles
  meshHealthSection: {
    marginTop: spacing.xs,
  },
  meshHealthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  meshHealthTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  meshDiagram: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  meshCenterNode: {
    alignItems: "center",
    gap: spacing.xxs,
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
    gap: spacing.md,
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
