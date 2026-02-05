/**
 * @file OrderOptions.tsx
 * @description Order options for advanced order settings.
 *
 * Options:
 * - Reduce Only: Order can only reduce an existing position, not increase it
 * - Post Only: Order will only be placed if it would be a maker order (adds liquidity)
 */

import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Text, Icon } from "@wraith/ghost/components";
import { Colors } from "@wraith/ghost/tokens";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { spacing, radii } from "../../../styles/tokens";
import {
  HintIndicator,
  TooltipContainer,
  TooltipText,
  TooltipListItem,
} from "../../ui/hint-indicator";
import type { OrderType } from "./types";

interface OrderOptionsProps {
  reduceOnly: boolean;
  postOnly: boolean;
  onReduceOnlyChange: (value: boolean) => void;
  onPostOnlyChange: (value: boolean) => void;
  orderType: OrderType;
}

export function OrderOptions({
  reduceOnly,
  postOnly,
  onReduceOnlyChange,
  onPostOnlyChange,
  orderType,
}: OrderOptionsProps) {
  // Post Only only makes sense for limit orders
  const showPostOnly = orderType === "limit";

  return (
    <View style={styles.container}>
      <View style={styles.optionsRow}>
        {/* Reduce Only */}
        <Pressable
          style={[styles.checkbox, reduceOnly && styles.checkboxActive]}
          onPress={() => onReduceOnlyChange(!reduceOnly)}
        >
          <View style={[styles.checkboxBox, reduceOnly && styles.checkboxBoxActive]}>
            {reduceOnly && (
              <Icon name="check" size={Size.ExtraSmall} color="#FFFFFF" />
            )}
          </View>
          <Text
            size={Size.ExtraSmall}
            style={reduceOnly ? styles.labelActive : styles.label}
          >
            Reduce Only
          </Text>
          <HintIndicator
            id="reduce-only-hint"
            title="Reduce Only"
            icon="i"
            color={Colors.accent.primary}
            priority={61}
            width={280}
            inline
          >
            <TooltipContainer>
              <TooltipText>
                When enabled, this order can only reduce your existing position size, never increase it.
              </TooltipText>
              <TooltipListItem icon="shield" color={Colors.data.emerald}>
                Prevents accidentally adding to a position
              </TooltipListItem>
              <TooltipListItem icon="trending-down" color={Colors.data.cyan}>
                Useful for closing or scaling out of positions
              </TooltipListItem>
            </TooltipContainer>
          </HintIndicator>
        </Pressable>

        {/* Post Only (limit orders only) */}
        {showPostOnly && (
          <Pressable
            style={[styles.checkbox, postOnly && styles.checkboxActive]}
            onPress={() => onPostOnlyChange(!postOnly)}
          >
            <View style={[styles.checkboxBox, postOnly && styles.checkboxBoxActive]}>
              {postOnly && (
                <Icon name="check" size={Size.ExtraSmall} color="#FFFFFF" />
              )}
            </View>
            <Text
              size={Size.ExtraSmall}
              style={postOnly ? styles.labelActive : styles.label}
            >
              Post Only
            </Text>
            <HintIndicator
              id="post-only-hint"
              title="Post Only"
              icon="i"
              color={Colors.accent.primary}
              priority={62}
              width={280}
              inline
            >
              <TooltipContainer>
                <TooltipText>
                  Order will only be placed if it adds liquidity to the order book.
                </TooltipText>
                <TooltipListItem icon="plus-circle" color={Colors.data.emerald}>
                  Ensures you pay maker fees (usually lower)
                </TooltipListItem>
                <TooltipListItem icon="x-circle" color={Colors.data.amber}>
                  Order is cancelled if it would execute immediately
                </TooltipListItem>
              </TooltipContainer>
            </HintIndicator>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  checkbox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.sm,
    backgroundColor: "transparent",
  },
  checkboxActive: {
    backgroundColor: "rgba(167, 139, 250, 0.1)",
  },
  checkboxBox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.background.raised,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxBoxActive: {
    backgroundColor: Colors.accent.primary,
    borderColor: Colors.accent.primary,
  },
  label: {
    color: Colors.text.secondary,
  },
  labelActive: {
    color: Colors.text.primary,
  },
});
