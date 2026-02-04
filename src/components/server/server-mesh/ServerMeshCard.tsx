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
import { spacing, radii } from "../../../styles/tokens";
import { usePeerSubscription, type PeerUpdate } from "../../../hooks/useHauntSocket";
import { hauntClient, type PeerMeshResponse } from "../../../services/haunt";
import { PeerDetailRow } from "./PeerDetailRow";
import { getLatencyColor } from "./utils/statusHelpers";

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
    padding: spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.lg,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  serverInfo: {
    padding: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.md,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  serverInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  divider: {
    height: 1,
    marginBottom: spacing.md,
  },
  sectionLabel: {
    marginBottom: spacing.sm,
  },
  peerList: {
    maxHeight: 300,
    marginBottom: spacing.md,
  },
  latencyValue: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  errorState: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xxxl,
    gap: spacing.sm,
  },
  emptyState: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xxxl,
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
});
