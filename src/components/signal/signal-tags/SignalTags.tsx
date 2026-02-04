/**
 * SignalTags Component
 *
 * Displays signal condition tags like "Falling Knife", "Strong Buy", etc.
 * based on current signal data and market conditions.
 */

import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { spacing, radii } from "../../../styles/tokens";
import { generateTags } from "./utils/tagGenerator";
import { TAG_DESCRIPTIONS } from "./constants";
import type { SignalTagsProps } from "./types";

export function SignalTags({
  signals,
  priceChange24h,
  loading = false,
}: SignalTagsProps) {
  const tags = useMemo(
    () => generateTags(signals, priceChange24h),
    [signals, priceChange24h]
  );

  if (loading || tags.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text
        size={Size.Medium}
        appearance={TextAppearance.Muted}
        style={styles.label}
      >
        MARKET CONDITIONS
      </Text>
      <Text
        size={Size.Small}
        appearance={TextAppearance.Muted}
        style={styles.subtitle}
      >
        Current patterns detected in market data
      </Text>
      <View style={styles.tagsRow}>
        {tags.map((tag, index) => (
          <View
            key={index}
            style={[styles.tag, { backgroundColor: tag.bgColor }]}
          >
            <Text
              size={Size.Medium}
              weight="semibold"
              style={{ color: tag.color }}
            >
              {tag.label}
            </Text>
            <Text
              size={Size.ExtraSmall}
              style={{ color: tag.color, opacity: 0.8 }}
            >
              {TAG_DESCRIPTIONS[tag.label] ?? "Market condition detected"}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xs,
  },
  label: {
    marginBottom: spacing.xxs,
  },
  subtitle: {
    marginBottom: spacing.md,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    gap: spacing.xxs,
  },
});
