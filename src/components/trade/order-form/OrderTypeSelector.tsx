/**
 * @file OrderTypeSelector.tsx
 * @description Dropdown selector for order types.
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Select, Text } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { spacing } from "../../../styles/tokens";
import {
  HintIndicator,
  TooltipContainer,
  TooltipSection,
  TooltipText,
  TooltipBadge,
  TooltipDivider,
} from "../../ui/hint-indicator";
import type { OrderTypeSelectorProps, OrderType } from "./types";

const ORDER_TYPE_OPTIONS = [
  { value: "market", label: "Market" },
  { value: "limit", label: "Limit" },
  { value: "stop_loss", label: "Stop Loss" },
  { value: "take_profit", label: "Take Profit" },
  { value: "stop_limit", label: "Stop Limit" },
  { value: "trailing_stop", label: "Trailing Stop" },
];

const ORDER_TYPE_DESCRIPTIONS: Record<OrderType, string> = {
  market: "Execute immediately at best available price",
  limit: "Execute at specified price or better",
  stop_loss: "Trigger sell when price drops to threshold",
  take_profit: "Trigger sell when price reaches target",
  stop_limit: "Stop that triggers a limit order at specified price",
  trailing_stop: "Stop that follows price by fixed amount or percentage",
};

export function OrderTypeSelector({ value, onChange }: OrderTypeSelectorProps) {
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.label}>
          Order Type
        </Text>
        <HintIndicator
          id="order-type-hint"
          title="Order Types"
          icon="i"
          color={Colors.accent.primary}
          priority={54}
          width={420}
          inline
        >
          <TooltipContainer>
            <TooltipSection title="Market Order">
              <TooltipBadge label="Speed" value="Executes immediately at best available price" color={Colors.status.success} />
              <TooltipText>Fast execution but price may slip during high volatility.</TooltipText>
            </TooltipSection>
            <TooltipDivider />
            <TooltipSection title="Limit Order">
              <TooltipBadge label="Price" value="Executes only at your specified price or better" color={Colors.data.blue} />
              <TooltipText>Better price control but may not fill if market doesn't reach your level.</TooltipText>
            </TooltipSection>
            <TooltipDivider />
            <TooltipSection title="Stop Loss">
              <TooltipBadge label="Protect" value="Triggers when price drops to threshold" color={Colors.status.danger} />
              <TooltipText>Automatically limits losses by closing position at specified price.</TooltipText>
            </TooltipSection>
            <TooltipDivider />
            <TooltipSection title="Take Profit">
              <TooltipBadge label="Lock In" value="Triggers when price rises to target" color={Colors.status.success} />
              <TooltipText>Automatically secures gains by closing at your profit target.</TooltipText>
            </TooltipSection>
            <TooltipDivider />
            <TooltipSection title="Stop Limit">
              <TooltipBadge label="Precision" value="Stop triggers a limit order" color={Colors.data.violet} />
              <TooltipText>Combines stop trigger with limit execution for price control.</TooltipText>
            </TooltipSection>
            <TooltipDivider />
            <TooltipSection title="Trailing Stop">
              <TooltipBadge label="Dynamic" value="Follows price by fixed offset" color={Colors.data.cyan} />
              <TooltipText>Stop price adjusts as market moves in your favor.</TooltipText>
            </TooltipSection>
          </TooltipContainer>
        </HintIndicator>
      </View>
      <Select
        options={ORDER_TYPE_OPTIONS}
        value={value}
        onChange={(val) => onChange(val as OrderType)}
        size={Size.Small}
      />
      <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.description}>
        {ORDER_TYPE_DESCRIPTIONS[value]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xxs,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  label: {
    marginBottom: spacing.xxs,
  },
  description: {
    marginTop: spacing.xxs,
    fontStyle: "italic",
  },
});
