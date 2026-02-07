/**
 * ChartSettings Component
 *
 * @fileoverview Settings popover for configuring chart display options.
 * Provides controls for log scale, auto-scale, grid visibility, and crosshair mode.
 */

import React, { useState, useRef } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Text, Icon, Popover, Toggle } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { spacing, radii } from "../../../styles/tokens";

export type CrosshairMode = "normal" | "magnet" | "hidden";

export type ChartSettings = {
  /** Use logarithmic scale for price axis */
  logScale: boolean;
  /** Auto-scale price axis to fit visible data */
  autoScale: boolean;
  /** Show horizontal grid lines */
  showHorizontalGrid: boolean;
  /** Show vertical grid lines */
  showVerticalGrid: boolean;
  /** Crosshair behavior mode */
  crosshairMode: CrosshairMode;
  /** Invert price scale (flip chart upside down) */
  invertScale: boolean;
  /** Show position entry arrows on the chart */
  showPositions: boolean;
};

export type ChartSettingsProps = {
  settings: ChartSettings;
  onSettingsChange: (settings: ChartSettings) => void;
  size?: Size;
};

const CROSSHAIR_OPTIONS: { value: CrosshairMode; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "magnet", label: "Magnet" },
  { value: "hidden", label: "Hidden" },
];

export const DEFAULT_CHART_SETTINGS: ChartSettings = {
  logScale: false,
  autoScale: true,
  showHorizontalGrid: true,
  showVerticalGrid: true,
  crosshairMode: "normal",
  invertScale: false,
  showPositions: false,
};

export function ChartSettingsButton({ settings, onSettingsChange, size = Size.Small }: ChartSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<View>(null);
  const themeColors = useThemeColors();

  const handleToggle = (key: keyof ChartSettings) => {
    if (typeof settings[key] === "boolean") {
      onSettingsChange({
        ...settings,
        [key]: !settings[key],
      });
    }
  };

  const handleCrosshairChange = (mode: CrosshairMode) => {
    onSettingsChange({
      ...settings,
      crosshairMode: mode,
    });
  };

  return (
    <>
      <View ref={triggerRef}>
        <Pressable
          style={[
            styles.settingsButton,
            { backgroundColor: themeColors.background.raised },
            isOpen && { backgroundColor: themeColors.background.overlay },
          ]}
          onPress={() => setIsOpen(!isOpen)}
        >
          <Icon
            name="settings"
            size={size}
            color={isOpen ? Colors.accent.primary : themeColors.text.muted}
          />
        </Pressable>
      </View>

      <Popover
        visible={isOpen}
        onClose={() => setIsOpen(false)}
        anchorRef={triggerRef}
        placement="bottom-end"
      >
        <View style={[styles.popoverContent, { backgroundColor: themeColors.background.raised }]}>
          <Text size={Size.Small} weight="semibold" style={styles.sectionTitle}>
            Chart Settings
          </Text>

          {/* Scale Settings */}
          <View style={styles.section}>
            <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted} style={styles.sectionLabel}>
              Scale
            </Text>

            <SettingRow
              label="Log Scale"
              description="Logarithmic price axis for exponential trends"
              value={settings.logScale}
              onToggle={() => handleToggle("logScale")}
            />

            <SettingRow
              label="Auto Scale"
              description="Automatically fit price range to visible data"
              value={settings.autoScale}
              onToggle={() => handleToggle("autoScale")}
            />

            <SettingRow
              label="Invert Scale"
              description="Flip chart vertically"
              value={settings.invertScale}
              onToggle={() => handleToggle("invertScale")}
            />
          </View>

          {/* Grid Settings */}
          <View style={styles.section}>
            <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted} style={styles.sectionLabel}>
              Grid
            </Text>

            <SettingRow
              label="Horizontal Lines"
              value={settings.showHorizontalGrid}
              onToggle={() => handleToggle("showHorizontalGrid")}
            />

            <SettingRow
              label="Vertical Lines"
              value={settings.showVerticalGrid}
              onToggle={() => handleToggle("showVerticalGrid")}
            />
          </View>

          {/* Overlay Settings */}
          <View style={styles.section}>
            <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted} style={styles.sectionLabel}>
              Overlays
            </Text>

            <SettingRow
              label="Position Arrows"
              description="Show entry points on the chart"
              value={settings.showPositions}
              onToggle={() => handleToggle("showPositions")}
            />
          </View>

          {/* Crosshair Settings */}
          <View style={styles.section}>
            <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted} style={styles.sectionLabel}>
              Crosshair
            </Text>

            <View style={styles.crosshairOptions}>
              {CROSSHAIR_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.crosshairOption,
                    { backgroundColor: themeColors.background.overlay },
                    settings.crosshairMode === option.value && {
                      backgroundColor: Colors.accent.primary + "30",
                      borderColor: Colors.accent.primary,
                    },
                  ]}
                  onPress={() => handleCrosshairChange(option.value)}
                >
                  <Text
                    size={Size.TwoXSmall}
                    style={{
                      color: settings.crosshairMode === option.value
                        ? Colors.accent.primary
                        : themeColors.text.muted,
                    }}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Popover>
    </>
  );
}

type SettingRowProps = {
  label: string;
  description?: string;
  value: boolean;
  onToggle: () => void;
};

function SettingRow({ label, description, value, onToggle }: SettingRowProps) {
  return (
    <Pressable style={styles.settingRow} onPress={onToggle}>
      <View style={styles.settingInfo}>
        <Text size={Size.Small}>{label}</Text>
        {description && (
          <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted} numberOfLines={1}>
            {description}
          </Text>
        )}
      </View>
      <Toggle value={value} onValueChange={onToggle} size={Size.Small} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  settingsButton: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  popoverContent: {
    width: 280,
    padding: spacing.md,
    borderRadius: radii.md,
    gap: spacing.md,
  },
  sectionTitle: {
    marginBottom: spacing.xs,
  },
  section: {
    gap: spacing.xs,
  },
  sectionLabel: {
    marginBottom: spacing.xxs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  settingInfo: {
    flex: 1,
    gap: 2,
  },
  crosshairOptions: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  crosshairOption: {
    flex: 1,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
});
