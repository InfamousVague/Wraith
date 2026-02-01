import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Icon } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";

export function Header() {
  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <View style={styles.logoIcon}>
          <Icon name="eye" size={Size.Large} appearance={TextAppearance.Link} />
        </View>
        <Text size={Size.ExtraLarge} weight="bold">
          Wraith
        </Text>
      </View>

      <View style={styles.nav}>
        <Text size={Size.Small} appearance={TextAppearance.Muted} style={styles.navItem}>
          Markets
        </Text>
        <Text size={Size.Small} appearance={TextAppearance.Muted} style={styles.navItem}>
          Watchlist
        </Text>
        <Text size={Size.Small} appearance={TextAppearance.Muted} style={styles.navItem}>
          Portfolio
        </Text>
      </View>

      <View style={styles.actions}>
        <Icon name="bell" size={Size.Medium} appearance={TextAppearance.Muted} />
        <Icon name="settings" size={Size.Medium} appearance={TextAppearance.Muted} />
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  logo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.background.overlay,
    alignItems: "center",
    justifyContent: "center",
  },
  nav: {
    flexDirection: "row",
    gap: 32,
  },
  navItem: {
    cursor: "pointer",
  },
  actions: {
    flexDirection: "row",
    gap: 16,
  },
});
