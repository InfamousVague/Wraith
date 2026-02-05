/**
 * FeedEventLine Component - Individual price update event line
 */

import React, { memo } from "react";
import { Animated, StyleSheet } from "react-native";
import { Text, Currency, PercentChange } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { spacing, radii } from "../../../styles/tokens";
import type { FeedEventLineProps } from "./types";
import { formatSource } from "./utils/formatters";

export const FeedEventLine = memo(function FeedEventLine({ event }: FeedEventLineProps) {
  const sourceName = formatSource(event.source);

  return (
    <Animated.View
      style={[
        styles.eventLine,
        { opacity: event.opacity },
      ]}
    >
      <Text size={Size.ExtraSmall} weight="medium" style={styles.eventSymbol}>
        {event.symbol.toUpperCase()}
      </Text>

      <Currency
        value={event.price}
        size={Size.ExtraSmall}
        weight="medium"
        compact
        decimals={event.price >= 1 ? 2 : 6}
        mono
      />

      {event.percentChange !== undefined && Math.abs(event.percentChange) >= 0.01 ? (
        <PercentChange
          value={event.percentChange}
          size={Size.TwoXSmall}
          showArrow={false}
        />
      ) : null}

      {sourceName ? (
        <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted} style={styles.eventSource}>
          via {sourceName}
        </Text>
      ) : null}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  eventLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.xxs,
    borderRadius: radii.soft,
  },
  eventSymbol: {
    width: 40,
  },
  eventSource: {
    marginLeft: "auto" as any, // flexbox auto margin for pushing to right
  },
});
