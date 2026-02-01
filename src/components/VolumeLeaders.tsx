import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, CardBorder, Text, Avatar, ProgressBar } from "@wraith/ghost/components";
import { Size, TextAppearance, Brightness } from "@wraith/ghost/enums";
import { useCryptoData } from "../hooks/useCryptoData";

export function VolumeLeaders() {
  const { assets } = useCryptoData({ limit: 10, useMock: true });

  const volumeLeaders = [...assets]
    .sort((a, b) => b.volume24h - a.volume24h)
    .slice(0, 5);

  const maxVolume = volumeLeaders[0]?.volume24h || 1;

  return (
    <Card style={styles.container} border={CardBorder.Gradient}>
      <Text size={Size.Medium} weight="semibold" style={styles.title}>
        24h Volume Leaders
      </Text>

      <View style={styles.list}>
        {volumeLeaders.map((coin, index) => (
          <View key={coin.id} style={styles.item}>
            <View style={styles.coinRow}>
              <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.rank}>
                {index + 1}
              </Text>
              <Avatar initials={coin.symbol.slice(0, 2)} size={Size.Small} />
              <View style={styles.coinInfo}>
                <Text size={Size.Small} weight="medium">
                  {coin.symbol}
                </Text>
              </View>
              <Text size={Size.Small} style={styles.volume}>
                ${formatVolume(coin.volume24h)}
              </Text>
            </View>
            <ProgressBar
              value={coin.volume24h}
              max={maxVolume}
              size={Size.Small}
              appearance={TextAppearance.Info}
              brightness={Brightness.Soft}
            />
          </View>
        ))}
      </View>
    </Card>
  );
}

function formatVolume(num: number): string {
  if (num >= 1e12) return (num / 1e12).toFixed(1) + "T";
  if (num >= 1e9) return (num / 1e9).toFixed(1) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
  return num.toLocaleString();
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    marginBottom: 16,
  },
  list: {
    gap: 16,
  },
  item: {
    gap: 8,
  },
  coinRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rank: {
    width: 16,
  },
  coinInfo: {
    flex: 1,
  },
  volume: {
    fontFamily: "Inter, sans-serif",
  },
});
