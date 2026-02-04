/**
 * @file CollapsibleSection.tsx
 * @description Expandable/collapsible content section with animated toggle.
 *
 * ## Features:
 * - Click header to expand/collapse content
 * - Chevron icon indicates open/closed state
 * - Configurable default state (open/closed)
 * - Minimum touch target size (44px) for accessibility
 *
 * ## Props:
 * - `title`: Section header text
 * - `defaultOpen`: Initial collapsed state (default: true)
 * - `children`: Content to show when expanded
 */

import React, { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Text, Icon } from "@wraith/ghost/components";
import { Size } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { spacing } from "../../../styles/tokens";

type CollapsibleSectionProps = {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

export function CollapsibleSection({
  title,
  defaultOpen = true,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const themeColors = useThemeColors();

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => setIsOpen(!isOpen)}
        style={[styles.header, { borderBottomColor: themeColors.border.subtle }]}
      >
        <Text weight="semibold" size={Size.Medium}>
          {title}
        </Text>
        <Icon
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={Size.Medium}
          color={themeColors.text.secondary}
        />
      </Pressable>
      {isOpen && <View style={styles.content}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    minHeight: 44, // Touch target
  },
  content: {
    paddingTop: spacing.sm,
  },
});
