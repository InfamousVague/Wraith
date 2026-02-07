/**
 * @file BetSizeToggle.tsx
 * @description Bottom-right bet size popup picker.
 * Shows current bet size as a Ghost Button pill. Tap to open Ghost Popover with all presets.
 */

import React, { useState, useRef, useCallback } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Button, Popover, Text } from "@wraith/ghost/components";
import { Size, Appearance, Shape } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { spacing } from "../../styles/tokens";

type BetSizeToggleProps = {
  value: number;
  presets: number[];
  onChange: (size: number) => void;
};

export function BetSizeToggle({ value, presets, onChange }: BetSizeToggleProps) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<View>(null);

  const handleSelect = useCallback(
    (preset: number) => {
      onChange(preset);
      setOpen(false);
    },
    [onChange]
  );

  return (
    <View>
      <View ref={anchorRef} collapsable={false}>
        <Button
          label={`$${value}`}
          appearance={Appearance.Ghost}
          size={Size.Small}
          shape={Shape.Pill}
          backgroundOpacity={0.08}
          onPress={() => setOpen(!open)}
        />
      </View>
      <Popover
        visible={open}
        onClose={() => setOpen(false)}
        anchorRef={anchorRef}
        placement="top-end"
        offset={8}
        closeOnClickOutside
        closeOnEscape
        minWidth={80}
        style={styles.popover}
      >
        <View style={styles.presetList}>
          {presets.map((preset) => {
            const isActive = preset === value;
            return (
              <Pressable
                key={preset}
                onPress={() => handleSelect(preset)}
                style={[
                  styles.presetItem,
                  isActive && styles.presetItemActive,
                ]}
              >
                <Text
                  size={Size.Small}
                  weight={isActive ? "semibold" : "regular"}
                  style={{ color: isActive ? Colors.status.success : Colors.text.secondary }}
                >
                  ${preset}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Popover>
    </View>
  );
}

const styles = StyleSheet.create({
  popover: {
    padding: spacing.xxs,
  },
  presetList: {
    gap: 2,
  },
  presetItem: {
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.md,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "transparent",
  },
  presetItemActive: {
    backgroundColor: "rgba(47, 213, 117, 0.12)",
    borderColor: "rgba(47, 213, 117, 0.25)",
  },
});
