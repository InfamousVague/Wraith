/**
 * MoverRow Component - Individual mover display row
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Currency, PercentChange, Avatar } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { spacing } from "../../../styles/tokens";
import type { MoverRowProps } from "./types";
import { getAssetImage } from "./utils/assetImages";

export const MoverRow = React.memo(function MoverRow({ mover, rank }: MoverRowProps) {
  const imageUrl = getAssetImage(mover.symbol);

  return (
    <View style={styles.moverRow}>
      <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted} style={styles.rank}>
        {rank}
      </Text>
      <Avatar
        uri={imageUrl}
        initials={mover.symbol.slice(0, 2)}
        size={Size.Small}
      />
      <View style={styles.moverInfo}>
        <Text size={Size.ExtraSmall} weight="medium">
          {mover.symbol}
        </Text>
        <Currency
          value={mover.price}
          size={Size.TwoXSmall}
          appearance={TextAppearance.Muted}
          compact
          decimals={mover.price >= 1 ? 2 : 6}
          mono
          animate
        />
      </View>
      <PercentChange
        value={mover.changePercent}
        size={Size.Small}
        showArrow
      />
    </View>
  );
});

const styles = StyleSheet.create({
  moverRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  rank: {
    width: 16,
    textAlign: "center",
  },
  moverInfo: {
    flex: 1,
    gap: 2,
  },
});
