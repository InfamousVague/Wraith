/**
 * Server Selector Card
 *
 * Allows users to view and select which Haunt API server to connect to.
 * Shows server health, latency, and allows auto-selection of fastest server.
 */

import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Card, Text, Icon, ProgressBar, Toggle } from "@wraith/ghost/components";
import { Size, TextAppearance, Brightness } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { Colors } from "@wraith/ghost/tokens";
import { spacing } from "../../../styles/tokens";
import { useApiServer } from "../../../context/ApiServerContext";
import { ServerRow } from "./ServerRow";
import { getHealthColor } from "./utils/statusHelpers";

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
  const healthColor = getHealthColor(healthPercent);

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
  autoSelectRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  autoSelectInfo: {
    flex: 1,
    gap: 2,
    marginRight: spacing.md,
  },
  divider: {
    height: 1,
    marginBottom: spacing.md,
  },
  serverList: {
    gap: spacing.xs,
    marginBottom: spacing.md,
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
