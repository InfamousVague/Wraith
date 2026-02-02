import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { Text, Card, Currency, PercentChange, Skeleton } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import type { Asset } from "../types/asset";

type MetricsGridProps = {
  asset: Asset | null;
  loading?: boolean;
};

// Static grid style - defined outside component to prevent recreation
const webGridStyle = {
  display: "grid" as const,
  gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
  gap: 12,
};

const nativeGridStyle = {
  flexDirection: "row" as const,
  flexWrap: "wrap" as const,
  gap: 12,
};

const gridStyle = Platform.OS === "web" ? webGridStyle : nativeGridStyle;

type MetricCardProps = {
  label: string;
  value: React.ReactNode;
  loading?: boolean;
};

function MetricCard({ label, value, loading }: MetricCardProps) {
  const themeColors = useThemeColors();

  return (
    <Card style={styles.metricCard}>
      <View style={styles.metricContent}>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
          {label}
        </Text>
        {loading ? (
          <Skeleton width={80} height={20} style={{ marginTop: 4 }} />
        ) : (
          <View style={styles.metricValue}>{value}</View>
        )}
      </View>
    </Card>
  );
}

export function MetricsGrid({ asset, loading }: MetricsGridProps) {
  return (
    <View style={styles.container}>
      <Text size={Size.Medium} weight="semibold" style={styles.title}>
        Key Metrics
      </Text>
      <View style={gridStyle}>
        <MetricCard
          label="Market Cap"
          loading={loading}
          value={
            asset && (
              <Currency
                value={asset.marketCap}
                size={Size.Medium}
                weight="semibold"
                compact
                decimals={2}
                mono
              />
            )
          }
        />
        <MetricCard
          label="24h Volume"
          loading={loading}
          value={
            asset && (
              <Currency
                value={asset.volume24h}
                size={Size.Medium}
                weight="semibold"
                compact
                decimals={2}
                mono
              />
            )
          }
        />
        <MetricCard
          label="1h Change"
          loading={loading}
          value={
            asset && <PercentChange value={asset.change1h} size={Size.Medium} />
          }
        />
        <MetricCard
          label="24h Change"
          loading={loading}
          value={
            asset && <PercentChange value={asset.change24h} size={Size.Medium} />
          }
        />
        <MetricCard
          label="7d Change"
          loading={loading}
          value={
            asset && <PercentChange value={asset.change7d} size={Size.Medium} />
          }
        />
        <MetricCard
          label="Circulating Supply"
          loading={loading}
          value={
            asset && (
              <Text size={Size.Medium} weight="semibold">
                {formatSupply(asset.circulatingSupply)} {asset.symbol}
              </Text>
            )
          }
        />
        {asset?.maxSupply && (
          <MetricCard
            label="Max Supply"
            loading={loading}
            value={
              <Text size={Size.Medium} weight="semibold">
                {formatSupply(asset.maxSupply)} {asset.symbol}
              </Text>
            }
          />
        )}
        {asset?.maxSupply && asset.maxSupply > 0 && (
          <MetricCard
            label="Supply %"
            loading={loading}
            value={
              <Text size={Size.Medium} weight="semibold">
                {(((asset.circulatingSupply || 0) / asset.maxSupply) * 100).toFixed(1)}%
              </Text>
            }
          />
        )}
      </View>
    </View>
  );
}

function formatSupply(value: number): string {
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toFixed(0);
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  title: {
    paddingHorizontal: 4,
  },
  metricCard: {
    padding: 16,
  },
  metricContent: {
    gap: 8,
  },
  metricValue: {
    flexDirection: "row",
    alignItems: "center",
  },
});
