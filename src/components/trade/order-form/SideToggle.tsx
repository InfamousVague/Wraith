/**
 * @file SideToggle.tsx
 * @description Buy/Sell toggle with color coding.
 */

import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Text } from "@wraith/ghost/components";
import { Colors } from "@wraith/ghost/tokens";
import { Size } from "@wraith/ghost/enums";
import { spacing, radii } from "../../../styles/tokens";
import type { SideToggleProps, OrderSide } from "./types";

export function SideToggle({ value, onChange }: SideToggleProps) {
  return (
    <View style={styles.container}>
      <Pressable
        style={[
          styles.option,
          styles.buyOption,
          value === "buy" && styles.buyActive,
        ]}
        onPress={() => onChange("buy")}
      >
        <Text
          size={Size.Small}
          style={[
            styles.optionText,
            value === "buy" ? styles.activeText : styles.inactiveText,
          ]}
        >
          Buy / Long
        </Text>
      </Pressable>
      <Pressable
        style={[
          styles.option,
          styles.sellOption,
          value === "sell" && styles.sellActive,
        ]}
        onPress={() => onChange("sell")}
      >
        <Text
          size={Size.Small}
          style={[
            styles.optionText,
            value === "sell" ? styles.activeText : styles.inactiveText,
          ]}
        >
          Sell / Short
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: radii.sm,
    overflow: "hidden",
    backgroundColor: Colors.background.raised,
  },
  option: {
    flex: 1,
    paddingVertical: spacing.xs,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  buyOption: {
    borderTopLeftRadius: radii.sm,
    borderBottomLeftRadius: radii.sm,
  },
  sellOption: {
    borderTopRightRadius: radii.sm,
    borderBottomRightRadius: radii.sm,
  },
  buyActive: {
    backgroundColor: Colors.status.success,
    borderColor: Colors.status.success,
  },
  sellActive: {
    backgroundColor: Colors.status.danger,
    borderColor: Colors.status.danger,
  },
  optionText: {
    fontWeight: "600",
  },
  activeText: {
    color: "#FFFFFF",
  },
  inactiveText: {
    color: Colors.text.secondary,
  },
});
