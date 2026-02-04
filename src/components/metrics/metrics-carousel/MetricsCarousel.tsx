import React, { useRef } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { spacing } from "../../../styles/tokens";
import { useFearGreed } from "../../../hooks/useFearGreed";
import { useAltcoinSeason } from "../../../hooks/useAltcoinSeason";
import { FearGreedCard, AltcoinSeasonCard, ExchangeLiquidity, TopMoversCard, MarketStatusCard } from "../../market";
import { PriceFeedCard } from "../price-feed";
import { ApiStatsCard } from "../api-stats";
import type { AssetType } from "../../../services/haunt";

type MetricsCarouselProps = {
  assetType?: AssetType;
};

export function MetricsCarousel({ assetType = "all" }: MetricsCarouselProps) {
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
        <TopMoversCard assetType={assetType} />
        <MarketStatusCard />
        <FearGreedCard
          value={fearGreedData?.value ?? 0}
          loading={showFearGreedLoading}
        />
        <AltcoinSeasonCard
          value={altcoinData?.value ?? 0}
          btcDominance={altcoinData?.btcDominance ?? 0}
          loading={showAltcoinLoading}
        />
        <PriceFeedCard />
        <ExchangeLiquidity />
        <ApiStatsCard />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    gap: spacing.md,
    flexDirection: "row",
    alignItems: "stretch",
  },
});
