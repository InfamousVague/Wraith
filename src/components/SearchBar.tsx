import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Input, Text, Icon } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";

type Filter = "all" | "gainers" | "losers";

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  filter: Filter;
  onFilterChange: (filter: Filter) => void;
};

export function SearchBar({ value, onChangeText, filter, onFilterChange }: SearchBarProps) {
  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "gainers", label: "Gainers" },
    { key: "losers", label: "Losers" },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Input
          placeholder="Search assets..."
          value={value}
          onChangeText={onChangeText}
          leadingIcon="search"
          size={Size.Large}
          style={styles.input}
        />
      </View>

      <View style={styles.filters}>
        {filters.map(({ key, label }) => (
          <Pressable
            key={key}
            onPress={() => onFilterChange(key)}
            style={[
              styles.filterButton,
              filter === key && styles.filterButtonActive,
            ]}
          >
            <Text
              size={Size.Small}
              appearance={filter === key ? TextAppearance.Primary : TextAppearance.Muted}
              weight={filter === key ? "semibold" : "regular"}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.sortContainer}>
        <Icon name="filter" size={Size.Small} appearance={TextAppearance.Muted} />
        <Text size={Size.Small} appearance={TextAppearance.Muted}>
          Sort by: Market Cap
        </Text>
        <Icon name="chevron-down" size={Size.Small} appearance={TextAppearance.Muted} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },
  searchContainer: {
    flex: 1,
    maxWidth: 400,
  },
  input: {
    width: "100%",
  },
  filters: {
    flexDirection: "row",
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.background.overlay,
  },
  filterButtonActive: {
    backgroundColor: Colors.accent.secondary,
    borderWidth: 1,
    borderColor: Colors.accent.primary,
  },
  sortContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: "auto",
  },
});
