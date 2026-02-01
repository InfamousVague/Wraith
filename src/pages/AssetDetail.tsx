import React, { useEffect, useState, useCallback } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useParams, useNavigate } from "react-router-dom";
import { Text } from "@wraith/ghost/components";
import { TextAppearance } from "@wraith/ghost/enums";
import { useTheme } from "../context/ThemeContext";
import { Navbar } from "../components/Navbar";
import { AssetHeader } from "../components/AssetHeader";
import { AdvancedChart } from "../components/AdvancedChart";
import { MetricsGrid } from "../components/MetricsGrid";
import { hauntClient } from "../services/haunt";
import { useAssetSubscription, type PriceUpdate } from "../hooks/useHauntSocket";
import type { Asset } from "../types/asset";

// Theme colors
const themes = {
  dark: {
    background: "#050608",
  },
  light: {
    background: "#f8fafc",
  },
};

export function AssetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const colors = isDark ? themes.dark : themes.light;

  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle real-time price updates
  const handlePriceUpdate = useCallback((update: PriceUpdate) => {
    setAsset((prev) =>
      prev
        ? {
            ...prev,
            price: update.price,
            change24h: update.change24h,
            volume24h: update.volume24h,
          }
        : null
    );
  }, []);

  // Subscribe to price updates for this asset
  useAssetSubscription(
    asset ? [asset.symbol] : [],
    handlePriceUpdate
  );

  // Fetch asset data
  useEffect(() => {
    async function fetchAsset() {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        const assetId = parseInt(id, 10);
        if (isNaN(assetId)) {
          throw new Error("Invalid asset ID");
        }

        const response = await hauntClient.getAsset(assetId);
        setAsset(response.data);
      } catch (err) {
        console.error("Failed to fetch asset:", err);
        setError(err instanceof Error ? err.message : "Failed to load asset");
      } finally {
        setLoading(false);
      }
    }

    fetchAsset();
  }, [id]);

  const handleBack = () => {
    navigate("/");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Navbar />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <AssetHeader asset={asset} loading={loading} onBack={handleBack} />

        {error ? (
          <View style={styles.errorContainer}>
            <View style={styles.errorBox}>
              <Text appearance={TextAppearance.Danger}>{error}</Text>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <AdvancedChart asset={asset} loading={loading} height={400} />
            </View>

            <View style={styles.section}>
              <MetricsGrid asset={asset} loading={loading} />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  errorContainer: {
    padding: 24,
    alignItems: "center",
  },
  errorBox: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 8,
    padding: 16,
  },
});
