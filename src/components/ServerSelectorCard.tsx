/**
 * Server Selector Card
 *
 * Allows users to view and select which Haunt API server to connect to.
 * Shows server health, latency, and allows auto-selection of fastest server.
 */

import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Card, Text, Icon, AnimatedNumber, ProgressBar, Toggle } from "@wraith/ghost/components";
import { Size, TextAppearance, Brightness } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { Colors } from "@wraith/ghost/tokens";
import { useApiServer, type ApiServer, type ServerStatus } from "../context/ApiServerContext";

function getStatusColor(status: ServerStatus): string {
  switch (status) {
    case "online":
      return Colors.status.success;
    case "offline":
      return Colors.status.danger;
    case "checking":
      return Colors.data.amber;
    default:
      return Colors.text.muted;
  }
}

function getLatencyColor(latencyMs: number | null): string {
  if (latencyMs === null) return Colors.text.muted;
  if (latencyMs < 50) return Colors.status.success;
  if (latencyMs < 150) return Colors.data.amber;
  if (latencyMs < 300) return Colors.status.warning;
  return Colors.status.danger;
}

type ServerRowProps = {
  server: ApiServer;
  isActive: boolean;
  onSelect: (id: string) => void;
};

const ServerRow = React.memo(function ServerRow({ server, isActive, onSelect }: ServerRowProps) {
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

export function ServerSelectorCard() {
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

  // Calculate overall health
  const onlineCount = servers.filter((s) => s.status === "online").length;
  const healthPercent = Math.round((onlineCount / servers.length) * 100);
  const healthColor =
    healthPercent >= 80
      ? Colors.status.success
      : healthPercent >= 50
      ? Colors.status.warning
      : Colors.status.danger;

  return (
    <Card style={styles.card}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Icon name="server" size={Size.Small} color={themeColors.text.muted} />
            <Text size={Size.Medium} weight="semibold">
              API Servers
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
        <View style={styles.serverList}>
          {servers.map((server) => (
            <ServerRow
              key={server.id}
              server={server}
              isActive={activeServer?.id === server.id}
              onSelect={setActiveServer}
            />
          ))}
        </View>

        {/* Health bar */}
        <View style={styles.healthSection}>
          <View style={styles.healthHeader}>
            <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
              Network Health
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
    gap: 8,
    marginBottom: 16,
  },
  serverRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
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
  healthSection: {
    gap: 8,
  },
  healthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
