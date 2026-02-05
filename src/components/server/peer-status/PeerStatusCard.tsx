import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Card, Text, AnimatedNumber, Icon, ProgressBar } from "@wraith/ghost/components";
import { Size, TextAppearance, Brightness } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { Colors } from "@wraith/ghost/tokens";
import { spacing, radii } from "../../../styles/tokens";
import { usePeerSubscription, type PeerUpdate } from "../../../hooks/useHauntSocket";
import { hauntClient, type PeerMeshResponse } from "../../../services/haunt";
import { getLatencyColor } from "../servers/utils";
import { PeerRow } from "./PeerRow";
import type { PeerStatusCardProps } from "./types";

export function PeerStatusCard({ loading = false }: PeerStatusCardProps) {
  const { t } = useTranslation("components");
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

  // Fetch on mount
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

  const showLoading = loading || isLoading;
  const peers = peerData?.peers || [];
  const connectedCount = peerData?.connectedCount || 0;
  const totalPeers = peerData?.totalPeers || 0;

  // Calculate average latency of connected peers
  const connectedPeers = peers.filter((p) => p.status === "connected" && p.latencyMs !== undefined);
  const avgLatency = connectedPeers.length > 0
    ? connectedPeers.reduce((sum, p) => sum + (p.latencyMs || 0), 0) / connectedPeers.length
    : 0;

  // Health based on connected peers
  const healthPercent = totalPeers > 0 ? Math.round((connectedCount / totalPeers) * 100) : 0;
  const healthColor = healthPercent >= 80
    ? Colors.status.success
    : healthPercent >= 50
    ? Colors.status.warning
    : Colors.status.danger;

  return (
    <Card style={styles.card} loading={showLoading}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Icon name="globe" size={Size.Small} color={themeColors.text.muted} />
            <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
              Server Mesh
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: `${healthColor}20` }]}>
            <View style={[styles.statusDot, { backgroundColor: healthColor }]} />
            <Text size={Size.TwoXSmall} style={{ color: healthColor }}>
              {connectedCount}/{totalPeers}
            </Text>
          </View>
        </View>

        {/* This server info */}
        {peerData && (
          <View style={styles.serverInfo}>
            <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
              This Server
            </Text>
            <Text size={Size.Small} weight="semibold">
              {peerData.serverRegion}
            </Text>
          </View>
        )}

        <View style={[styles.divider, { backgroundColor: themeColors.border.subtle }]} />

        {error ? (
          <View style={styles.errorState}>
            <Icon name="wifi-off" size={Size.ExtraLarge} color={Colors.status.danger} />
            <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.errorText}>
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
            {/* Peer list */}
            <View style={styles.peerList}>
              {peers.map((peer) => (
                <PeerRow key={peer.id} peer={peer} />
              ))}
            </View>

            {/* Average latency */}
            {connectedPeers.length > 0 && (
              <View style={styles.avgLatency}>
                <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                  Avg Latency
                </Text>
                <View style={styles.latencyContainer}>
                  <AnimatedNumber
                    value={Math.round(avgLatency)}
                    decimals={0}
                    size={Size.Small}
                    weight="semibold"
                    style={{ color: getLatencyColor(avgLatency) }}
                    animate
                    animationDuration={100}
                  />
                  <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                    ms
                  </Text>
                </View>
              </View>
            )}

            {/* Health bar */}
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
    width: 320,
    minHeight: 280,
    flexShrink: 0,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
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
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: radii.lg,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  serverInfo: {
    marginBottom: spacing.sm,
    gap: 2,
  },
  divider: {
    height: 1,
    marginBottom: spacing.sm,
  },
  errorState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 30,
    gap: spacing.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 30,
    gap: spacing.xs,
  },
  errorText: {
    marginTop: spacing.xxs,
  },
  peerList: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  latencyContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  avgLatency: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    marginBottom: spacing.sm,
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
