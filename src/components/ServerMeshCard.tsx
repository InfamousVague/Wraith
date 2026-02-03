/**
 * Server Mesh Card
 *
 * Enhanced peer mesh display for the Settings page.
 * Shows all servers in the mesh, their connectivity status,
 * and latency between servers.
 */

import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Card, Text, Icon, AnimatedNumber, ProgressBar } from "@wraith/ghost/components";
import { Size, TextAppearance, Brightness } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { Colors } from "@wraith/ghost/tokens";
import { usePeerSubscription, type PeerUpdate, type PeerStatus } from "../hooks/useHauntSocket";
import { hauntClient, type PeerMeshResponse } from "../services/haunt";

function getLatencyColor(latencyMs: number | undefined): string {
  if (latencyMs === undefined) return Colors.text.muted;
  if (latencyMs < 50) return Colors.status.success;
  if (latencyMs < 150) return Colors.data.amber;
  if (latencyMs < 300) return Colors.status.warning;
  return Colors.status.danger;
}

function getStatusColor(status: PeerStatus["status"]): string {
  switch (status) {
    case "connected":
      return Colors.status.success;
    case "connecting":
      return Colors.data.amber;
    case "disconnected":
      return Colors.text.muted;
    case "failed":
      return Colors.status.danger;
    default:
      return Colors.text.muted;
  }
}

function getStatusIcon(status: PeerStatus["status"]): string {
  switch (status) {
    case "connected":
      return "check-circle";
    case "connecting":
      return "loader";
    case "disconnected":
      return "circle";
    case "failed":
      return "x-circle";
    default:
      return "circle";
  }
}

type PeerDetailRowProps = {
  peer: PeerStatus;
};

const PeerDetailRow = React.memo(function PeerDetailRow({ peer }: PeerDetailRowProps) {
  const themeColors = useThemeColors();
  const statusColor = getStatusColor(peer.status);
  const latencyColor = getLatencyColor(peer.latencyMs);

  return (
    <View style={[styles.peerRow, { borderColor: themeColors.border.subtle }]}>
      <View style={styles.peerInfo}>
        <View style={styles.peerHeader}>
          <Icon
            name={getStatusIcon(peer.status) as any}
            size={Size.Small}
            color={statusColor}
          />
          <Text size={Size.Small} weight="semibold">
            {peer.region}
          </Text>
        </View>
        <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
          {peer.id.slice(0, 12)}...
        </Text>
      </View>

      <View style={styles.peerMetrics}>
        {/* Current Latency */}
        {peer.status === "connected" && peer.latencyMs !== undefined && (
          <View style={styles.metricCol}>
            <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
              Current
            </Text>
            <View style={styles.latencyValue}>
              <AnimatedNumber
                value={Math.round(peer.latencyMs)}
                decimals={0}
                size={Size.Small}
                weight="semibold"
                style={{ color: latencyColor }}
                animate
                animationDuration={100}
              />
              <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                ms
              </Text>
            </View>
          </View>
        )}

        {/* Average Latency */}
        {peer.status === "connected" && peer.avgLatencyMs !== undefined && (
          <View style={styles.metricCol}>
            <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
              Avg
            </Text>
            <View style={styles.latencyValue}>
              <AnimatedNumber
                value={Math.round(peer.avgLatencyMs)}
                decimals={0}
                size={Size.Small}
                weight="semibold"
                style={{ color: getLatencyColor(peer.avgLatencyMs) }}
                animate
                animationDuration={100}
              />
              <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                ms
              </Text>
            </View>
          </View>
        )}

        {/* Uptime */}
        <View style={styles.metricCol}>
          <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
            Uptime
          </Text>
          <Text
            size={Size.Small}
            weight="semibold"
            style={{
              color:
                peer.uptimePercent >= 99
                  ? Colors.status.success
                  : peer.uptimePercent >= 95
                  ? Colors.status.warning
                  : Colors.status.danger,
            }}
          >
            {peer.uptimePercent.toFixed(1)}%
          </Text>
        </View>

        {/* Ping Count */}
        <View style={styles.metricCol}>
          <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
            Pings
          </Text>
          <Text size={Size.Small} weight="semibold">
            {peer.pingCount}
          </Text>
        </View>
      </View>
    </View>
  );
});

export function ServerMeshCard() {
  const themeColors = useThemeColors();
  const [peerData, setPeerData] = useState<PeerMeshResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial peer status
  const fetchPeers = useCallback(async () => {
    try {
      const response = await hauntClient.getPeers();
      setPeerData(response.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPeers();
  }, [fetchPeers]);

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

  const peers = peerData?.peers || [];
  const connectedCount = peerData?.connectedCount || 0;
  const totalPeers = peerData?.totalPeers || 0;

  // Calculate average latency
  const connectedPeers = peers.filter((p) => p.status === "connected" && p.latencyMs !== undefined);
  const avgLatency =
    connectedPeers.length > 0
      ? connectedPeers.reduce((sum, p) => sum + (p.latencyMs || 0), 0) / connectedPeers.length
      : 0;

  // Health calculation
  const healthPercent = totalPeers > 0 ? Math.round((connectedCount / totalPeers) * 100) : 0;
  const healthColor =
    healthPercent >= 80
      ? Colors.status.success
      : healthPercent >= 50
      ? Colors.status.warning
      : Colors.status.danger;

  return (
    <Card style={styles.card} loading={isLoading}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Icon name="globe" size={Size.Small} color={themeColors.text.muted} />
            <Text size={Size.Medium} weight="semibold">
              Server Mesh
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: `${healthColor}20` }]}>
            <View style={[styles.statusDot, { backgroundColor: healthColor }]} />
            <Text size={Size.TwoXSmall} style={{ color: healthColor }}>
              {connectedCount}/{totalPeers} connected
            </Text>
          </View>
        </View>

        {/* Current Server Info */}
        {peerData && (
          <View style={[styles.serverInfo, { borderColor: themeColors.border.subtle }]}>
            <View style={styles.serverInfoRow}>
              <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                Connected To
              </Text>
              <Text size={Size.Small} weight="semibold">
                {peerData.serverRegion}
              </Text>
            </View>
            <View style={styles.serverInfoRow}>
              <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                Server ID
              </Text>
              <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                {peerData.serverId.slice(0, 16)}...
              </Text>
            </View>
            {connectedPeers.length > 0 && (
              <View style={styles.serverInfoRow}>
                <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                  Avg Mesh Latency
                </Text>
                <View style={styles.latencyValue}>
                  <AnimatedNumber
                    value={Math.round(avgLatency)}
                    decimals={0}
                    size={Size.Small}
                    weight="semibold"
                    style={{ color: getLatencyColor(avgLatency) }}
                    animate
                  />
                  <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                    ms
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        <View style={[styles.divider, { backgroundColor: themeColors.border.subtle }]} />

        {error ? (
          <View style={styles.errorState}>
            <Icon name="wifi-off" size={Size.ExtraLarge} color={Colors.status.danger} />
            <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
              Peer mesh unavailable
            </Text>
          </View>
        ) : peers.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="server" size={Size.ExtraLarge} color={themeColors.text.muted} />
            <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
              No peer servers configured
            </Text>
          </View>
        ) : (
          <>
            {/* Peer List */}
            <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.sectionLabel}>
              Connected Peers
            </Text>
            <ScrollView style={styles.peerList} showsVerticalScrollIndicator={false}>
              {peers.map((peer) => (
                <PeerDetailRow key={peer.id} peer={peer} />
              ))}
            </ScrollView>

            {/* Health Bar */}
            <View style={styles.healthSection}>
              <View style={styles.healthHeader}>
                <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                  Mesh Health
                </Text>
                <Text size={Size.TwoXSmall} style={{ color: healthColor }}>
                  {healthPercent}%
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
          </>
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
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  serverInfo: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  serverInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  divider: {
    height: 1,
    marginBottom: 16,
  },
  sectionLabel: {
    marginBottom: 12,
  },
  peerList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  peerRow: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  peerInfo: {
    marginBottom: 12,
    gap: 2,
  },
  peerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  peerMetrics: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metricCol: {
    alignItems: "center",
    gap: 2,
  },
  latencyValue: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  errorState: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyState: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
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
