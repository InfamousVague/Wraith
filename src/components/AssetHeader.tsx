import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Avatar, PercentChange, Currency, Skeleton, Button } from "@wraith/ghost/components";
import { Size, TextAppearance, Appearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import type { Asset } from "../types/asset";

type AssetHeaderProps = {
  asset: Asset | null;
  loading?: boolean;
  onBack?: () => void;
};

export function AssetHeader({ asset, loading, onBack }: AssetHeaderProps) {
  const themeColors = useThemeColors();

  if (loading || !asset) {
    return (
      <View style={styles.container}>
        <View style={styles.leftSection}>
          <Skeleton width={32} height={32} borderRadius={16} />
          <View style={styles.info}>
            <Skeleton width={120} height={20} />
            <Skeleton width={60} height={14} style={{ marginTop: 4 }} />
          </View>
        </View>
        <View style={styles.rightSection}>
          <Skeleton width={100} height={24} />
          <Skeleton width={60} height={16} style={{ marginTop: 4 }} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {onBack && (
          <Button
            iconLeft="chevron-left"
            appearance={Appearance.Ghost}
            onPress={onBack}
            size={Size.Large}
          />
        )}
        <Avatar
          uri={asset.image}
          initials={asset.symbol.slice(0, 2)}
          size={Size.Large}
        />
        <View style={styles.info}>
          <Text size={Size.ExtraLarge} weight="bold">
            {asset.name}
          </Text>
          <Text size={Size.Small} appearance={TextAppearance.Muted}>
            {asset.symbol} • Rank #{asset.rank}
          </Text>
        </View>
      </View>
      <View style={styles.rightSection}>
        <Currency
          value={asset.price}
          size={Size.ExtraLarge}
          weight="bold"
          decimals={asset.price < 1 ? 6 : 2}
        />
        <PercentChange value={asset.change24h} size={Size.Medium} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  info: {
    gap: 4,
  },
  rightSection: {
    alignItems: "flex-end",
    gap: 4,
  },
});
