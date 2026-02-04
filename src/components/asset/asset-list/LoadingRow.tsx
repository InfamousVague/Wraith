/**
 * LoadingRow Components - Skeleton loading states for asset list
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Skeleton } from "@wraith/ghost/components";
import { spacing, radii } from "../../../styles/tokens";
import type { LoadingRowProps } from "./types";

export function LoadingRow({ borderColor }: LoadingRowProps) {
  return (
    <View style={[styles.row, styles.rowBorder, { borderBottomColor: borderColor }]}>
      <View style={styles.rankCol}>
        <Skeleton width={24} height={14} />
      </View>
      <View style={styles.assetInfo}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={styles.assetName}>
          <Skeleton width={80} height={14} />
          <Skeleton width={40} height={12} style={{ marginTop: 4 }} />
        </View>
      </View>
      <View style={styles.priceCol}>
        <Skeleton width={80} height={14} />
      </View>
      <View style={styles.tradeCol}>
        <Skeleton width={36} height={18} borderRadius={4} />
      </View>
      <View style={styles.changeCol}>
        <Skeleton width={50} height={14} />
      </View>
      <View style={styles.changeCol}>
        <Skeleton width={50} height={14} />
      </View>
      <View style={styles.marketCapCol}>
        <Skeleton width={70} height={14} />
      </View>
      <View style={styles.volumeCol}>
        <Skeleton width={70} height={14} />
      </View>
      <View style={styles.chartCol}>
        <Skeleton width={100} height={32} />
      </View>
    </View>
  );
}

export function MobileLoadingRow({ borderColor }: LoadingRowProps) {
  return (
    <View style={[styles.mobileRow, { borderBottomColor: borderColor, borderBottomWidth: 1 }]}>
      <View style={styles.mobileRowLeft}>
        <Skeleton width={36} height={36} borderRadius={18} />
        <View style={{ gap: 4 }}>
          <Skeleton width={50} height={14} />
          <Skeleton width={35} height={12} />
        </View>
      </View>
      <View style={styles.mobileRowRight}>
        <Skeleton width={56} height={36} />
        <View style={styles.mobileRowPriceStack}>
          <Skeleton width={60} height={14} />
          <Skeleton width={45} height={14} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
  },
  rankCol: {
    width: 40,
  },
  assetInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 2,
    minWidth: 180,
  },
  assetName: {
    gap: 2,
  },
  priceCol: {
    flex: 1,
    minWidth: 100,
  },
  tradeCol: {
    width: 70,
    alignItems: "center",
  },
  changeCol: {
    flex: 1,
    minWidth: 80,
  },
  marketCapCol: {
    flex: 1,
    minWidth: 110,
  },
  volumeCol: {
    flex: 1,
    minWidth: 110,
  },
  chartCol: {
    width: 100,
    alignItems: "flex-end",
  },
  mobileRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    minHeight: 64,
  },
  mobileRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
  },
  mobileRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexShrink: 0,
  },
  mobileRowPriceStack: {
    alignItems: "flex-end",
    gap: 2,
    minWidth: 70,
  },
});
