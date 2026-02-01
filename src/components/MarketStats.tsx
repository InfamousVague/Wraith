import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, CardBorder, Text, Icon, Badge } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { useGlobalMetrics } from "../hooks/useCryptoData";

type StatCardProps = {
  label: string;
  value: string;
  change?: number;
  icon?: string;
};

function StatCard({ label, value, change, icon }: StatCardProps) {
  return (
    <Card style={styles.statCard} border={CardBorder.Gradient}>
      <View style={styles.statHeader}>
        {icon && <Icon name={icon as any} size={Size.Small} appearance={TextAppearance.Muted} />}
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
          {label}
        </Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      {change !== undefined && (
        <Text
          size={Size.ExtraSmall}
          style={{ color: change >= 0 ? "#22c55e" : "#ef4444" }}
        >
          {change >= 0 ? "+" : ""}{change.toFixed(2)}%
        </Text>
      )}
    </Card>
  );
}

export function MarketStats() {
  const { metrics } = useGlobalMetrics();

  if (!metrics) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text size={Size.Large} weight="semibold">
          Global Market Stats
        </Text>
        <Badge label="Real-time" variant="info" size={Size.Small} />
      </View>

      <View style={styles.grid}>
        <StatCard
          label="Total Market Cap"
          value={`$${(metrics.totalMarketCap / 1e12).toFixed(2)}T`}
          change={metrics.marketCapChange24h}
          icon="chart"
        />
        <StatCard
          label="24h Volume"
          value={`$${(metrics.totalVolume24h / 1e9).toFixed(1)}B`}
          icon="activity"
        />
        <StatCard
          label="BTC Dominance"
          value={`${metrics.btcDominance.toFixed(1)}%`}
          icon="bitcoin"
        />
        <StatCard
          label="ETH Dominance"
          value={`${metrics.ethDominance.toFixed(1)}%`}
          icon="ethereum"
        />
        <StatCard
          label="Active Cryptos"
          value={metrics.activeCryptocurrencies.toLocaleString()}
          icon="grid"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    padding: 16,
    minWidth: 160,
    flex: 1,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Inter, sans-serif",
    color: "#ffffff",
    marginBottom: 4,
  },
});
