/**
 * Server row component for server selector
 */

import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Text, Icon } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { Colors } from "@wraith/ghost/tokens";
import { spacing, radii } from "../../../styles/tokens";
import { getLatencyColor, getStatusColor } from "./utils/statusHelpers";
import type { ServerRowProps } from "./types";

export const ServerRow = React.memo(function ServerRow({ server, isActive, onSelect }: ServerRowProps) {
  const themeColors = useThemeColors();
  const statusColor = getStatusColor(server.status);
  const latencyColor = getLatencyColor(server.latencyMs);
  const isSelectable = server.status === "online";

  return (
    <Pressable
      onPress={() => isSelectable && onSelect(server.id)}
      disabled={!isSelectable}
      style={({ pressed }: { pressed: boolean }) => [
        styles.serverRow,
        { backgroundColor: isActive ? `${Colors.status.success}15` : "transparent" },
        { borderColor: isActive ? Colors.status.success : themeColors.border.subtle },
        pressed && isSelectable && { opacity: 0.7 },
        !isSelectable && { opacity: 0.5 },
      ]}
    >
      <View style={styles.serverRowLeft}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <View style={styles.serverRowInfo}>
          <View style={styles.serverNameRow}>
            <Text size={Size.Medium} weight={isActive ? "semibold" : "regular"}>
              {server.name}
            </Text>
            {server.isLocal && (
              <View style={[styles.badge, { backgroundColor: `${Colors.data.violet}20` }]}>
                <Text size={Size.TwoXSmall} style={{ color: Colors.data.violet }}>
                  Local
                </Text>
              </View>
            )}
            {server.isDiscovered && (
              <View style={[styles.badge, { backgroundColor: `${Colors.data.cyan}20` }]}>
                <Text size={Size.TwoXSmall} style={{ color: Colors.data.cyan }}>
                  Discovered
                </Text>
              </View>
            )}
          </View>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
            {server.region}
          </Text>
        </View>
      </View>
      <View style={styles.serverRowRight}>
        {isActive && (
          <Icon name="check-circle" size={Size.Medium} color={Colors.status.success} />
        )}
        {server.latencyMs !== null ? (
          <Text size={Size.Small} style={{ color: latencyColor }}>
            {server.latencyMs}ms
          </Text>
        ) : (
          <Text size={Size.Small} appearance={TextAppearance.Muted}>
            {server.status === "checking" ? "..." : "--"}
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
    marginVertical: spacing.xxs,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  serverRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  serverRowInfo: {
    flex: 1,
  },
  serverNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: 2,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  serverRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
});
