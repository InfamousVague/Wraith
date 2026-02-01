import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button, Toggle } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";

export function Header() {
  return (
    <View style={styles.container}>
      <View style={styles.logoSection}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>W</Text>
        </View>
        <Text size={Size.Large} weight="bold" style={styles.brand}>
          Wraith
        </Text>
      </View>

      <View style={styles.nav}>
        <Text size={Size.Small} weight="medium" style={styles.navItemActive}>
          Market
        </Text>
        <Text size={Size.Small} appearance={TextAppearance.Muted} style={styles.navItem}>
          Portfolio
        </Text>
        <Text size={Size.Small} appearance={TextAppearance.Muted} style={styles.navItem}>
          Watchlist
        </Text>
        <Text size={Size.Small} appearance={TextAppearance.Muted} style={styles.navItem}>
          News
        </Text>
      </View>

      <View style={styles.actions}>
        <Toggle
          value={false}
          onValueChange={() => {}}
          leftIcon="sun"
          rightIcon="moon"
        />
        <Button size={Size.Small} variant="secondary">
          Connect Wallet
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    marginBottom: 24,
  },
  logoSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    fontFamily: "Plus Jakarta Sans, sans-serif",
  },
  brand: {
    fontFamily: "Plus Jakarta Sans, sans-serif",
    letterSpacing: -0.5,
  },
  nav: {
    flexDirection: "row",
    gap: 32,
  },
  navItem: {
    cursor: "pointer",
  },
  navItemActive: {
    color: "#ffffff",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});
