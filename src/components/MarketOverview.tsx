import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, CardBorder, CardGlow, Text, Icon, Badge, ProgressBar } from "@wraith/ghost/components";
import { Size, TextAppearance, Brightness } from "@wraith/ghost/enums";

export function MarketOverview() {
  const marketData = {
    totalMarketCap: 3.42,
    marketCapChange: 2.34,
    btcDominance: 52.4,
    ethDominance: 17.8,
    volume24h: 98.5,
    volumeChange: -5.2,
  };

  return (
    <Card style={styles.container} border={CardBorder.Gradient} glow={CardGlow.Blue}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Icon name="chart" size={Size.Small} appearance={TextAppearance.Link} />
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
            Total Market Cap
          </Text>
        </View>
        <Badge label="Live" variant="success" size={Size.Small} />
      </View>

      <View style={styles.valueRow}>
        <Text style={styles.dollarSign}>$</Text>
        <Text style={styles.mainValue}>
          {marketData.totalMarketCap.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </Text>
        <Text style={styles.unit}>T</Text>
      </View>

      <View style={styles.changeRow}>
        <Icon
          name={marketData.marketCapChange >= 0 ? "arrow-up" : "arrow-down"}
          size={Size.TwoXSmall}
          appearance={marketData.marketCapChange >= 0 ? TextAppearance.Success : TextAppearance.Danger}
        />
        <Text
          size={Size.Small}
          appearance={marketData.marketCapChange >= 0 ? TextAppearance.Success : TextAppearance.Danger}
        >
          {Math.abs(marketData.marketCapChange).toFixed(2)}%
        </Text>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
          vs last 24h
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.statsSection}>
        <View style={styles.statRow}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
            24h Volume
          </Text>
          <View style={styles.statValue}>
            <Text size={Size.Small} weight="medium">
              ${marketData.volume24h}B
            </Text>
            <Text
              size={Size.TwoXSmall}
              appearance={marketData.volumeChange >= 0 ? TextAppearance.Success : TextAppearance.Danger}
            >
              {marketData.volumeChange >= 0 ? "+" : ""}{marketData.volumeChange}%
            </Text>
          </View>
        </View>

        <View style={styles.dominanceSection}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
            Dominance
          </Text>
          <View style={styles.dominanceItem}>
            <View style={styles.dominanceLabel}>
              <Text size={Size.ExtraSmall} weight="medium">BTC</Text>
              <Text size={Size.ExtraSmall} style={{ color: "#3b82f6" }}>
                {marketData.btcDominance}%
              </Text>
            </View>
            <ProgressBar
              value={marketData.btcDominance}
              max={100}
              size={Size.Small}
              appearance={TextAppearance.Link}
              brightness={Brightness.Soft}
            />
          </View>
          <View style={styles.dominanceItem}>
            <View style={styles.dominanceLabel}>
              <Text size={Size.ExtraSmall} weight="medium">ETH</Text>
              <Text size={Size.ExtraSmall} style={{ color: "#8b5cf6" }}>
                {marketData.ethDominance}%
              </Text>
            </View>
            <ProgressBar
              value={marketData.ethDominance}
              max={100}
              size={Size.Small}
              appearance={TextAppearance.Info}
              brightness={Brightness.Soft}
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
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
  },
  dollarSign: {
    fontSize: 24,
    fontWeight: "500",
    color: "#3b82f6",
    fontFamily: "Inter, sans-serif",
  },
  mainValue: {
    fontSize: 42,
    fontWeight: "700",
    fontFamily: "Inter, sans-serif",
    color: "#ffffff",
    letterSpacing: -1,
  },
  unit: {
    fontSize: 20,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.5)",
    fontFamily: "Inter, sans-serif",
    marginLeft: 4,
  },
  changeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    marginVertical: 16,
  },
  statsSection: {
    gap: 12,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dominanceSection: {
    gap: 8,
  },
  dominanceItem: {
    gap: 4,
  },
  dominanceLabel: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
