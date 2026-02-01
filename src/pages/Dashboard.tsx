import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { Header } from "../components/Header";
import { PriceTicker } from "../components/PriceTicker";

export function Dashboard() {
  return (
    <View style={styles.container}>
      <View style={styles.tickerWrapper}>
        <PriceTicker />
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Header />

        <View style={styles.placeholder}>
          <Text size={Size.Large} appearance={TextAppearance.Muted}>
            Dashboard - Coming Soon
          </Text>
          <Text size={Size.Small} appearance={TextAppearance.Muted}>
            Selected components will be added here
          </Text>
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
  tickerWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
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
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 100,
    gap: 8,
  },
});
