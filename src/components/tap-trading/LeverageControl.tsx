/**
 * @file LeverageControl.tsx
 * @description Top toolbar bar with leverage pills, zoom presets, and rolling 24h stats.
 * Uses Ghost SegmentedControl for both leverage and zoom groups.
 */

import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { SegmentedControl, Text, Divider, Icon, type SegmentOption } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { Colors } from "@wraith/ghost/tokens";
import { spacing } from "../../styles/tokens";
import type { TapStats } from "../../types/tap-trading";

const ZOOM_PRESETS = [1.0, 1.5, 2.5];
const ZOOM_LABELS = ["S", "M", "L"];

type LeverageControlProps = {
  value: number;
  presets: number[];
  onChange: (leverage: number) => void;
  zoomLevel?: number;
  onZoomChange?: (zoom: number) => void;
  stats?: TapStats | null;
  symbol: string;
};

export function LeverageControl({ value, presets, onChange, zoomLevel = 1.0, onZoomChange, stats, symbol }: LeverageControlProps) {
  const themeColors = useThemeColors();

  const leverageOptions: SegmentOption<string>[] = useMemo(
    () => presets.map((p) => ({ value: String(p), label: `${p}x` })),
    [presets]
  );

  const zoomOptions: SegmentOption<string>[] = useMemo(
    () => ZOOM_PRESETS.map((z, i) => ({ value: String(z), label: ZOOM_LABELS[i] })),
    []
  );

  return (
    <View style={[styles.toolbar, { borderBottomColor: themeColors.border.subtle }]}>
      <View style={styles.controlsGroup}>
        <SegmentedControl
          options={leverageOptions}
          value={String(value)}
          onChange={(v) => onChange(Number(v))}
          size={Size.ExtraSmall}
        />
        <Divider orientation="vertical" style={styles.divider} />
        <SegmentedControl
          options={zoomOptions}
          value={String(zoomLevel)}
          onChange={(v) => onZoomChange?.(Number(v))}
          size={Size.ExtraSmall}
        />
      </View>

      <View style={styles.statsGroup}>
        {stats && stats.win_streak > 0 && (
          <View style={styles.streakBadge}>
            <Icon name="zap" size={Size.TwoXSmall} color={Colors.status.warning} />
            <Text size={Size.ExtraSmall} weight="semibold" style={{ color: Colors.status.warning }}>
              {stats.win_streak}
            </Text>
          </View>
        )}
        {stats && (
          <Text
            size={Size.ExtraSmall}
            weight="semibold"
            style={{ color: stats.net_pnl >= 0 ? Colors.status.success : Colors.status.danger }}
          >
            {stats.net_pnl >= 0 ? "+" : ""}${stats.net_pnl.toFixed(2)}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  controlsGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  divider: {
    height: 20,
  },
  statsGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
});
