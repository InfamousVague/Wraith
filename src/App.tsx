import React, { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Colors } from "@wraith/ghost/tokens";
import { Header } from "./components/Header";
import { SearchBar } from "./components/SearchBar";
import { MarketOverview } from "./components/MarketOverview";
import { AssetList } from "./components/AssetList";
import { FearGreedIndex } from "./components/FearGreedIndex";

export function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "gainers" | "losers">("all");

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Header />

        <View style={styles.topSection}>
          <MarketOverview />
          <FearGreedIndex />
        </View>

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
    maxWidth: 1400,
    marginHorizontal: "auto",
    width: "100%",
  },
  topSection: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 24,
  },
});
