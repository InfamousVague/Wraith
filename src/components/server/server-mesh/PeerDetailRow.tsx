/**
 * Peer detail row component for server mesh display
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Icon, AnimatedNumber } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { Colors } from "@wraith/ghost/tokens";
import { spacing, radii } from "../../../styles/tokens";
import { getLatencyColor, getStatusColor, getStatusIcon } from "./utils/statusHelpers";
import type { PeerDetailRowProps } from "./types";

export const PeerDetailRow = React.memo(function PeerDetailRow({ peer }: PeerDetailRowProps) {
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

const styles = StyleSheet.create({
  peerRow: {
    padding: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.md,
    marginBottom: spacing.xs,
  },
  peerInfo: {
    marginBottom: spacing.sm,
    gap: 2,
  },
  peerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
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
});
