import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, CardBorder, CardGlow, Text, Chart, Icon } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";

// Mock historical data
const MARKET_CAP_DATA = [2.8, 2.9, 3.1, 3.0, 3.2, 3.3, 3.1, 3.4, 3.42];
const VOLUME_DATA = [85, 92, 88, 95, 110, 98, 105, 95, 98.5];
const BTC_DOMINANCE_DATA = [48, 49, 50, 51, 52, 51.5, 52, 52.2, 52.4];
const ETH_DOMINANCE_DATA = [18, 17.5, 17.8, 18.2, 17.9, 17.6, 17.8, 17.9, 17.8];

type MetricCardProps = {
  title: string;
  value: string;
  change: number;
  data: number[];
  glow: "Blue" | "Green" | "Purple" | "Cyan";
  icon?: string;
};

function MetricCard({ title, value, change, data, glow, icon }: MetricCardProps) {
  const glowMap = {
    Blue: CardGlow.Blue,
    Green: CardGlow.Green,
    Purple: CardGlow.Purple,
    Cyan: CardGlow.Cyan,
  };

  const isPositive = change >= 0;

  return (
    <Card style={styles.card} border={CardBorder.Gradient} glow={glowMap[glow]}>
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          {icon && <Icon name={icon as any} size={Size.Small} appearance={TextAppearance.Link} />}
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
            {title}
          </Text>
        </View>
        <View style={styles.changeContainer}>
          <Icon
            name={isPositive ? "arrow-up" : "arrow-down"}
            size={Size.TwoXSmall}
            appearance={isPositive ? TextAppearance.Success : TextAppearance.Danger}
          />
          <Text
            size={Size.TwoXSmall}
            appearance={isPositive ? TextAppearance.Success : TextAppearance.Danger}
          >
            {Math.abs(change).toFixed(2)}%
          </Text>
        </View>
      </View>

      <Text style={styles.value}>{value}</Text>

      <View style={styles.chartContainer}>
        <Chart
          data={data}
          height={80}
          isPositive={isPositive}
        />
      </View>
    </Card>
  );
}

export function MarketCharts() {
  return (
    <View style={styles.container}>
      <Text size={Size.Large} weight="semibold" style={styles.sectionTitle}>
        Market Overview
      </Text>
      <Text size={Size.Small} appearance={TextAppearance.Muted} style={styles.sectionSubtitle}>
        Global cryptocurrency market statistics
      </Text>

      <View style={styles.grid}>
        <MetricCard
          title="Total Market Cap"
          value="$3.42T"
          change={2.34}
          data={MARKET_CAP_DATA}
          glow="Blue"
          icon="chart"
        />
        <MetricCard
          title="24h Trading Volume"
          value="$98.5B"
          change={-5.2}
          data={VOLUME_DATA}
          glow="Purple"
          icon="chart"
        />
        <MetricCard
          title="BTC Dominance"
          value="52.4%"
          change={0.8}
          data={BTC_DOMINANCE_DATA}
          glow="Cyan"
          icon="chart"
        />
        <MetricCard
          title="ETH Dominance"
          value="17.8%"
          change={-0.3}
          data={ETH_DOMINANCE_DATA}
          glow="Green"
          icon="chart"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 4,
  },
  sectionSubtitle: {
    marginBottom: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  card: {
    flex: 1,
    minWidth: 280,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  value: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "Inter, sans-serif",
    color: "#ffffff",
    marginBottom: 12,
  },
  chartContainer: {
    height: 80,
    marginHorizontal: -8,
  },
});
