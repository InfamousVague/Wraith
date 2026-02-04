/**
 * AnimatedHamburger Component - Animated hamburger icon that transforms to X
 */

import React from "react";
import { View, StyleSheet } from "react-native";

type AnimatedHamburgerProps = {
  isOpen: boolean;
  color: string;
};

export function AnimatedHamburger({ isOpen, color }: AnimatedHamburgerProps) {
  return (
    <View style={styles.hamburgerIcon}>
      <View
        style={[
          styles.hamburgerBar,
          { backgroundColor: color },
          isOpen && styles.hamburgerBarTopOpen,
        ]}
      />
      <View
        style={[
          styles.hamburgerBar,
          { backgroundColor: color },
          isOpen && styles.hamburgerBarMiddleOpen,
        ]}
      />
      <View
        style={[
          styles.hamburgerBar,
          { backgroundColor: color },
          isOpen && styles.hamburgerBarBottomOpen,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hamburgerIcon: {
    width: 20,
    height: 16,
    justifyContent: "space-between",
  },
  hamburgerBar: {
    width: 20,
    height: 2,
    borderRadius: 1,
    transitionProperty: "transform, opacity",
    transitionDuration: "0.25s",
    transitionTimingFunction: "ease-in-out",
  },
  hamburgerBarTopOpen: {
    transform: [{ translateY: 7 }, { rotate: "45deg" }],
  },
  hamburgerBarMiddleOpen: {
    opacity: 0,
    transform: [{ scaleX: 0 }],
  },
  hamburgerBarBottomOpen: {
    transform: [{ translateY: -7 }, { rotate: "-45deg" }],
  },
});
