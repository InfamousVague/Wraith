/**
 * Individual peer row component for peer status display
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Icon, AnimatedNumber } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { spacing } from "../../../styles/tokens";
import { getLatencyColor, getStatusColor, getStatusIcon } from "../server-mesh";
import type { PeerRowProps } from "./types";

export const PeerRow = React.memo(function PeerRow({ peer }: PeerRowProps) {
  const statusColor = getStatusColor(peer.status);
  const latencyColor = getLatencyColor(peer.latencyMs);

  return (
    <View style={styles.peerRow}>
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
          {peer.id.slice(0, 8)}...
        </Text>
      </View>

      <View style={styles.peerStats}>
        {peer.status === "connected" && peer.latencyMs !== undefined ? (
          <View style={styles.latencyContainer}>
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
        ) : (
          <Text size={Size.ExtraSmall} style={{ color: statusColor }}>
            {peer.status === "connecting" ? "..." : peer.status}
          </Text>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  peerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  peerInfo: {
    gap: 2,
  },
  peerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  peerStats: {
    alignItems: "flex-end",
  },
  latencyContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
});
