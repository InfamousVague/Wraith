import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Text, Avatar, PercentChange, Currency, Skeleton, Icon } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { useBreakpoint } from "../hooks/useBreakpoint";
import type { Asset } from "../types/asset";

type AssetHeaderProps = {
  asset: Asset | null;
  loading?: boolean;
  onBack?: () => void;
};

export function AssetHeader({ asset, loading, onBack }: AssetHeaderProps) {
  const themeColors = useThemeColors();
  const { isMobile } = useBreakpoint();

  // Responsive sizes
  const avatarSize = isMobile ? Size.Medium : Size.Large;
  const nameSize = isMobile ? Size.Large : Size.ExtraLarge;
  const priceSize = isMobile ? Size.Large : Size.ExtraLarge;

  if (loading || !asset) {
    return (
      <View style={[styles.container, isMobile && styles.containerMobile]}>
        <View style={[styles.leftSection, isMobile && styles.leftSectionMobile]}>
          <Skeleton width={isMobile ? 28 : 32} height={isMobile ? 28 : 32} borderRadius={16} />
          <View style={styles.info}>
            <Skeleton width={100} height={18} />
            <Skeleton width={50} height={12} style={{ marginTop: 4 }} />
          </View>
        </View>
        <View style={styles.rightSection}>
          <Skeleton width={80} height={20} />
          <Skeleton width={50} height={14} style={{ marginTop: 4 }} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, isMobile && styles.containerMobile]}>
      <View style={[styles.leftSection, isMobile && styles.leftSectionMobile]}>
        {onBack && (
          <Pressable onPress={onBack} style={styles.backButton}>
            <Icon name="chevron-left" size={Size.Large} color={themeColors.text.secondary} />
          </Pressable>
        )}
        <Avatar
          uri={asset.image}
          initials={asset.symbol.slice(0, 2)}
          size={avatarSize}
        />
        <View style={styles.info}>
          <Text size={nameSize} weight="bold">
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
          size={priceSize}
          weight="bold"
          decimals={asset.price < 1 ? 6 : 2}
        />
        <PercentChange value={asset.change24h} size={isMobile ? Size.Small : Size.Medium} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  containerMobile: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  leftSectionMobile: {
    gap: 8,
  },
  backButton: {
    padding: 8,
    minHeight: 44,
    minWidth: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  info: {
    gap: 2,
  },
  rightSection: {
    alignItems: "flex-end",
    gap: 2,
  },
});
