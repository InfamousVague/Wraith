/**
 * @file TpSlSection.tsx
 * @description Collapsible Take Profit / Stop Loss section for order entry.
 */

import React, { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Text, Icon, Input } from "@wraith/ghost/components";
import { Colors } from "@wraith/ghost/tokens";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { spacing, radii } from "../../../styles/tokens";
import {
  HintIndicator,
  TooltipContainer,
  TooltipText,
  TooltipListItem,
} from "../../ui/hint-indicator";

interface TpSlSectionProps {
  takeProfit: string;
  stopLoss: string;
  onTakeProfitChange: (value: string) => void;
  onStopLossChange: (value: string) => void;
  currentPrice?: number;
  side: "buy" | "sell";
}

export function TpSlSection({
  takeProfit,
  stopLoss,
  onTakeProfitChange,
  onStopLossChange,
  currentPrice,
  side,
}: TpSlSectionProps) {
  const [expanded, setExpanded] = useState(false);

  const hasValues = takeProfit || stopLoss;

  return (
    <View style={styles.container}>
      {/* Header - clickable to expand/collapse */}
      <Pressable style={styles.header} onPress={() => setExpanded(!expanded)}>
        <View style={styles.headerLeft}>
          <Icon
            name={expanded ? "chevron-down" : "chevron-right"}
            size={Size.Small}
            color={Colors.text.secondary}
          />
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
            TP / SL
          </Text>
          {hasValues && !expanded && (
            <View style={styles.badge}>
              <Text size={Size.TwoXSmall} style={styles.badgeText}>
                Set
              </Text>
            </View>
          )}
        </View>
        <HintIndicator
          id="tp-sl-hint"
          title="Take Profit / Stop Loss"
          icon="i"
          color={Colors.accent.primary}
          priority={63}
          width={320}
          inline
        >
          <TooltipContainer>
            <TooltipText>
              Attach automatic exit orders to your position.
            </TooltipText>
            <TooltipListItem icon="trending-up" color={Colors.data.emerald}>
              Take Profit - Closes position when price reaches your profit target
            </TooltipListItem>
            <TooltipListItem icon="shield" color={Colors.status.danger}>
              Stop Loss - Closes position to limit losses at specified price
            </TooltipListItem>
            <TooltipText>
              {side === "buy"
                ? "For long positions: TP above entry, SL below entry"
                : "For short positions: TP below entry, SL above entry"}
            </TooltipText>
          </TooltipContainer>
        </HintIndicator>
      </Pressable>

      {/* Expanded content */}
      {expanded && (
        <View style={styles.content}>
          {/* Take Profit */}
          <View style={styles.inputRow}>
            <View style={styles.inputLabel}>
              <View style={[styles.dot, styles.dotTp]} />
              <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                Take Profit
              </Text>
            </View>
            <View style={styles.inputWrapper}>
              <Input
                value={takeProfit}
                onChangeText={onTakeProfitChange}
                placeholder={currentPrice ? `e.g. ${(currentPrice * (side === "buy" ? 1.05 : 0.95)).toFixed(2)}` : "Price"}
                keyboardType="decimal-pad"
                size={Size.Small}
                style={styles.input}
              />
            </View>
          </View>

          {/* Stop Loss */}
          <View style={styles.inputRow}>
            <View style={styles.inputLabel}>
              <View style={[styles.dot, styles.dotSl]} />
              <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                Stop Loss
              </Text>
            </View>
            <View style={styles.inputWrapper}>
              <Input
                value={stopLoss}
                onChangeText={onStopLossChange}
                placeholder={currentPrice ? `e.g. ${(currentPrice * (side === "buy" ? 0.95 : 1.05)).toFixed(2)}` : "Price"}
                keyboardType="decimal-pad"
                size={Size.Small}
                style={styles.input}
              />
            </View>
          </View>

          {/* Validation hint */}
          {currentPrice && (
            <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted} style={styles.hint}>
              Current price: {currentPrice.toLocaleString()}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.raised,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
  },
  badge: {
    backgroundColor: "rgba(167, 139, 250, 0.2)",
    paddingHorizontal: spacing.xxs,
    paddingVertical: 2,
    borderRadius: radii.soft,
    marginLeft: spacing.xxs,
  },
  badgeText: {
    color: Colors.accent.primary,
  },
  content: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  inputLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
    width: 90,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotTp: {
    backgroundColor: Colors.data.emerald,
  },
  dotSl: {
    backgroundColor: Colors.status.danger,
  },
  inputWrapper: {
    flex: 1,
  },
  input: {
    textAlign: "right",
  },
  hint: {
    textAlign: "center",
    marginTop: spacing.xxs,
  },
});
