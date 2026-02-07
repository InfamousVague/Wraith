/**
 * @file BalancePill.tsx
 * @description Bottom-left balance display. Shows portfolio cash balance.
 * Flashes green on win, red on loss.
 */

import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet } from "react-native";
import { Text, Icon, Currency } from "@wraith/ghost/components";
import { Size } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { spacing } from "../../styles/tokens";

type BalancePillProps = {
  balance: number;
};

export function BalancePill({ balance }: BalancePillProps) {
  const themeColors = useThemeColors();
  const [flash, setFlash] = useState<"none" | "win" | "loss">("none");
  const prevBalanceRef = useRef(balance);

  useEffect(() => {
    if (prevBalanceRef.current !== balance) {
      const diff = balance - prevBalanceRef.current;
      if (diff > 0.01) {
        setFlash("win");
      } else if (diff < -0.01) {
        setFlash("loss");
      }
      prevBalanceRef.current = balance;

      const timer = setTimeout(() => setFlash("none"), 600);
      return () => clearTimeout(timer);
    }
  }, [balance]);

  const flashBorderColor =
    flash === "win"
      ? Colors.status.success
      : flash === "loss"
      ? Colors.status.danger
      : themeColors.border.subtle;

  return (
    <View
      style={[
        styles.pill,
        { borderColor: flashBorderColor },
      ]}
    >
      <Icon name="wallet" size={Size.TwoXSmall} color={Colors.text.muted} />
      <Currency
        value={balance}
        size={Size.Small}
        weight="semibold"
        decimals={2}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.sm,
    backgroundColor: Colors.overlay.white.faint,
    borderRadius: 20,
    borderWidth: 1,
  },
});
