import React, { useRef } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { useFearGreed } from "../hooks/useFearGreed";
import { useAltcoinSeason } from "../hooks/useAltcoinSeason";
import { FearGreedCard } from "./FearGreedCard";
import { AltcoinSeasonCard } from "./AltcoinSeasonCard";

export function MetricsCarousel() {
  const themeColors = useThemeColors();
  const scrollRef = useRef<ScrollView>(null);
  const { data: fearGreedData, loading: fearGreedLoading, error: fearGreedError } = useFearGreed();
  const { data: altcoinData, loading: altcoinLoading, error: altcoinError } = useAltcoinSeason();

  // Show loading state when there's an error (no data to display)
  const showFearGreedLoading = fearGreedLoading || (fearGreedError !== null && fearGreedData === null);
  const showAltcoinLoading = altcoinLoading || (altcoinError !== null && altcoinData === null);

  return (
    <View style={[styles.container, { borderBottomColor: themeColors.border.subtle }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToAlignment="start"
      >
        <FearGreedCard
          value={fearGreedData?.value ?? 0}
          loading={showFearGreedLoading}
        />
        <AltcoinSeasonCard
          value={altcoinData?.value ?? 0}
          btcDominance={altcoinData?.btcDominance ?? 0}
          loading={showAltcoinLoading}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 16,
    flexDirection: "row",
  },
});
