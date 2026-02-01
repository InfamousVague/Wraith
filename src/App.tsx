import React, { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Colors } from "@wraith/ghost/tokens";
import { Header } from "./components/Header";
import { SearchBar } from "./components/SearchBar";
import { MarketCharts } from "./components/MarketCharts";
import { AssetList } from "./components/AssetList";
import { FearGreedIndex } from "./components/FearGreedIndex";

export function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "gainers" | "losers">("all");

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Header />

        <MarketCharts />

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
          <View style={styles.sidebar}>
            <FearGreedIndex />
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
});
