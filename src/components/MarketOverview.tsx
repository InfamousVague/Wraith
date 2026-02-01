import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, Text, Currency, Number, Icon, Badge, ProgressBar } from "@wraith/ghost/components";
import { Size, TextAppearance, Brightness } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";

export function MarketOverview() {
  // Mock data - will be replaced with API data
  const marketData = {
    totalMarketCap: 3.42,
    marketCapChange: 2.34,
    btcDominance: 52.4,
    ethDominance: 17.8,
    volume24h: 98.5,
    volumeChange: -5.2,
  };

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Text size={Size.Medium} weight="semibold">
          Market Overview
        </Text>
        <Badge label="Live" variant="success" icon="success" size={Size.Small} />
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.stat}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
            Total Market Cap
          </Text>
          <View style={styles.statValue}>
            <Currency
              value={marketData.totalMarketCap}
              size={Size.Large}
              weight="bold"
              decimals={2}
            />
            <Text size={Size.Small} appearance={TextAppearance.Muted}>T</Text>
          </View>
          <View style={styles.change}>
            <Icon
              name={marketData.marketCapChange >= 0 ? "arrow-up" : "arrow-down"}
              size={Size.ExtraSmall}
              appearance={marketData.marketCapChange >= 0 ? TextAppearance.Success : TextAppearance.Danger}
            />
            <Text
              size={Size.ExtraSmall}
              appearance={marketData.marketCapChange >= 0 ? TextAppearance.Success : TextAppearance.Danger}
            >
              {Math.abs(marketData.marketCapChange).toFixed(2)}%
            </Text>
          </View>
        </View>

        <View style={styles.stat}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
            24h Volume
          </Text>
          <View style={styles.statValue}>
            <Currency
              value={marketData.volume24h}
              size={Size.Large}
              weight="bold"
              decimals={1}
            />
            <Text size={Size.Small} appearance={TextAppearance.Muted}>B</Text>
          </View>
          <View style={styles.change}>
            <Icon
              name={marketData.volumeChange >= 0 ? "arrow-up" : "arrow-down"}
              size={Size.ExtraSmall}
              appearance={marketData.volumeChange >= 0 ? TextAppearance.Success : TextAppearance.Danger}
            />
            <Text
              size={Size.ExtraSmall}
              appearance={marketData.volumeChange >= 0 ? TextAppearance.Success : TextAppearance.Danger}
            >
              {Math.abs(marketData.volumeChange).toFixed(2)}%
            </Text>
          </View>
        </View>

        <View style={styles.dominanceSection}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
            Dominance
          </Text>
          <View style={styles.dominanceBar}>
            <View style={styles.dominanceLabel}>
              <Text size={Size.ExtraSmall}>BTC</Text>
              <Text size={Size.ExtraSmall} appearance={TextAppearance.Link}>
                {marketData.btcDominance}%
              </Text>
            </View>
            <ProgressBar
              value={marketData.btcDominance}
              max={100}
              size={Size.Small}
              appearance={TextAppearance.Link}
            />
          </View>
          <View style={styles.dominanceBar}>
            <View style={styles.dominanceLabel}>
              <Text size={Size.ExtraSmall}>ETH</Text>
              <Text size={Size.ExtraSmall} appearance={TextAppearance.Info}>
                {marketData.ethDominance}%
              </Text>
            </View>
            <ProgressBar
              value={marketData.ethDominance}
              max={100}
              size={Size.Small}
              appearance={TextAppearance.Info}
            />
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 2,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 32,
  },
  stat: {
    gap: 4,
  },
  statValue: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  change: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dominanceSection: {
    flex: 1,
    gap: 8,
  },
  dominanceBar: {
    gap: 4,
  },
  dominanceLabel: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
