import React, { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { Header } from "./components/Header";
import { SearchBar } from "./components/SearchBar";
import { MarketCharts } from "./components/MarketCharts";
import { AssetList } from "./components/AssetList";
import { FearGreedIndex } from "./components/FearGreedIndex";
import { MarketOverview } from "./components/MarketOverview";
import { PriceTicker } from "./components/PriceTicker";
import { TrendingCoins } from "./components/TrendingCoins";
import { TopGainersLosers } from "./components/TopGainersLosers";
import { CryptoConverter } from "./components/CryptoConverter";
import { CoinCard } from "./components/CoinCard";
import { VolumeLeaders } from "./components/VolumeLeaders";
import { MarketStats } from "./components/MarketStats";
import { CoinCompare } from "./components/CoinCompare";
import { WatchlistPreview } from "./components/WatchlistPreview";
import { useCryptoData } from "./hooks/useCryptoData";

function SectionTitle({ children }: { children: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.sectionLabel}>
        COMPONENT
      </Text>
      <Text size={Size.Medium} weight="semibold">
        {children}
      </Text>
    </View>
  );
}

export function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "gainers" | "losers">("all");
  const { assets } = useCryptoData({ limit: 10, useMock: true });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Header />

        {/* Price Ticker */}
        <SectionTitle>PriceTicker</SectionTitle>
        <PriceTicker />

        {/* Market Stats Grid */}
        <SectionTitle>MarketStats</SectionTitle>
        <MarketStats />

        {/* Market Charts */}
        <SectionTitle>MarketCharts</SectionTitle>
        <MarketCharts />

        {/* Top Gainers & Losers */}
        <SectionTitle>TopGainersLosers</SectionTitle>
        <TopGainersLosers />

        {/* Coin Cards Row */}
        <SectionTitle>CoinCard (detailed)</SectionTitle>
        <View style={styles.cardsRow}>
          {assets.slice(0, 3).map((asset) => (
            <CoinCard key={asset.id} asset={asset} variant="detailed" />
          ))}
        </View>

        {/* Coin Cards Compact */}
        <SectionTitle>CoinCard (compact)</SectionTitle>
        <View style={styles.compactCardsRow}>
          {assets.slice(0, 5).map((asset) => (
            <CoinCard key={asset.id} asset={asset} variant="compact" />
          ))}
        </View>

        {/* Three Column Layout */}
        <View style={styles.threeCol}>
          <View style={styles.threeColItem}>
            <SectionTitle>TrendingCoins</SectionTitle>
            <TrendingCoins />
          </View>
          <View style={styles.threeColItem}>
            <SectionTitle>VolumeLeaders</SectionTitle>
            <VolumeLeaders />
          </View>
          <View style={styles.threeColItem}>
            <SectionTitle>WatchlistPreview</SectionTitle>
            <WatchlistPreview />
          </View>
        </View>

        {/* Two Column Layout */}
        <View style={styles.twoCol}>
          <View style={styles.twoColItem}>
            <SectionTitle>CryptoConverter</SectionTitle>
            <CryptoConverter />
          </View>
          <View style={styles.twoColItem}>
            <SectionTitle>CoinCompare</SectionTitle>
            <CoinCompare />
          </View>
        </View>

        {/* Market Overview + Fear & Greed */}
        <View style={styles.twoCol}>
          <View style={styles.twoColItem}>
            <SectionTitle>MarketOverview</SectionTitle>
            <MarketOverview />
          </View>
          <View style={styles.twoColItem}>
            <SectionTitle>FearGreedIndex</SectionTitle>
            <FearGreedIndex />
          </View>
        </View>

        {/* Asset List with Search */}
        <SectionTitle>AssetList + SearchBar</SectionTitle>
        <View style={styles.sideBySide}>
          <View style={styles.mainContent}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              filter={filter}
              onFilterChange={setFilter}
            />
            <AssetList
              searchQuery={searchQuery}
              filter={filter}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.canvas,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    maxWidth: 1600,
    marginHorizontal: "auto",
    width: "100%",
    gap: 16,
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 8,
    gap: 4,
  },
  sectionLabel: {
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  sideBySide: {
    flexDirection: "row",
    gap: 24,
  },
  mainContent: {
    flex: 1,
    gap: 16,
  },
  sidebar: {
    width: 320,
  },
  cardsRow: {
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap",
  },
  compactCardsRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  threeCol: {
    flexDirection: "row",
    gap: 16,
  },
  threeColItem: {
    flex: 1,
  },
  twoCol: {
    flexDirection: "row",
    gap: 16,
  },
  twoColItem: {
    flex: 1,
  },
});
