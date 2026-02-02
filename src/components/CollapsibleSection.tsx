import React, { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Text, Icon } from "@wraith/ghost/components";
import { Size } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";

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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    minHeight: 44, // Touch target
  },
  content: {
    paddingTop: 12,
  },
});
