/**
 * ServerRow Component
 *
 * Memoized row showing server name, region, status, and latency.
 */

import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Text, Icon, AnimatedNumber } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { Colors } from "@wraith/ghost/tokens";
import { spacing, radii } from "../../../styles/tokens";
import { getStatusColor, getLatencyColor } from "./utils/statusHelpers";
import type { ServerRowProps } from "./types";

export const ServerRow = React.memo(function ServerRow({
  server,
  isActive,
  onSelect,
}: ServerRowProps) {
  const themeColors = useThemeColors();
  const statusColor = getStatusColor(server.status);
  const latencyColor = getLatencyColor(server.latencyMs);

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
        ) : server.status === "online" && server.latencyMs !== null ? (
          <View style={styles.latencyContainer}>
            <AnimatedNumber
              value={server.latencyMs}
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
  },
  serverInfo: {
    gap: 2,
  },
  serverHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
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
  serverStats: {
    alignItems: "flex-end",
  },
  latencyContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
});
