/**
 * ServerRow Component - Individual server display row
 */

import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Text, Icon, AnimatedNumber } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { Colors } from "@wraith/ghost/tokens";
import { spacing, radii } from "../../../styles/tokens";
import { PingIndicator } from "../ping-indicator";
import type { ServerRowProps } from "./types";
import { getStatusColor, getLatencyColor } from "./utils";

export const ServerRow = React.memo(function ServerRow({
  server,
  isActive,
  onSelect,
  peerStatus,
  showPingIndicator = true,
}: ServerRowProps) {
  const themeColors = useThemeColors();
  const statusColor = getStatusColor(server.status);

  // Client ping: frontend → server (from health check)
  const clientLatency = server.latencyMs;
  const clientLatencyColor = getLatencyColor(clientLatency);

  // Mesh ping: server → server (from peer mesh)
  const meshLatency = peerStatus?.status === "connected" ? peerStatus.latencyMs : null;

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
        ) : server.status === "online" ? (
          <View style={styles.dualPingContainer}>
            <PingIndicator latencyMs={clientLatency} size={Size.TwoXSmall} />
            <View style={styles.latencyContainer}>
              <AnimatedNumber
                value={clientLatency !== null && clientLatency !== undefined ? Math.round(clientLatency) : 0}
                decimals={0}
                size={Size.TwoXSmall}
                weight="semibold"
                style={{ color: clientLatencyColor }}
                animate
                animationDuration={100}
              />
              <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                ms
              </Text>
            </View>
            <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
              Mesh {meshLatency !== null && meshLatency !== undefined ? `${Math.round(meshLatency)}ms` : "—"}
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

const styles = StyleSheet.create({
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
    marginLeft: 20,
  },
  activeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.soft,
  },
  serverStats: {
    alignItems: "flex-end",
    minWidth: 100,
  },
  dualPingContainer: {
    alignItems: "flex-end",
    gap: spacing.xxs,
  },
  latencyContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
});
