/**
 * @file SearchInput.tsx
 * @description Search input with dropdown results.
 *
 * Features:
 * - Search input with icon
 * - Keyboard shortcut (Cmd/Ctrl + K)
 * - Dropdown with search results
 * - Recent searches
 * - Keyboard navigation
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { View, StyleSheet, Pressable, TextInput } from "react-native";
import { useNavigate } from "react-router-dom";
import { Text, Icon, Avatar, Currency, PercentChange, Skeleton } from "@wraith/ghost/components";
import { Colors } from "@wraith/ghost/tokens";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { useSearch } from "../../../hooks/useSearch";
import { spacing, radii } from "../../../styles/tokens";
import type { Asset } from "../../../types/asset";

type SearchInputProps = {
  placeholder?: string;
  compact?: boolean;
};

function SearchResult({
  asset,
  isSelected,
  onSelect,
}: {
  asset: Asset;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const themeColors = useThemeColors();

  return (
    <Pressable
      onPress={onSelect}
      style={[
        styles.resultItem,
        { backgroundColor: isSelected ? themeColors.background.sunken : "transparent" },
      ]}
    >
      <Avatar
        uri={asset.image}
        initials={asset.symbol.slice(0, 2)}
        size={Size.Small}
      />
      <View style={styles.resultInfo}>
        <Text size={Size.Small} weight="semibold">
          {asset.symbol}
        </Text>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} numberOfLines={1}>
          {asset.name}
        </Text>
      </View>
      <View style={styles.resultPrice}>
        <Currency value={asset.price} size={Size.Small} decimals={asset.price < 1 ? 6 : 2} />
        <PercentChange value={asset.change24h} size={Size.ExtraSmall} />
      </View>
    </Pressable>
  );
}

export function SearchInput({ placeholder = "Search assets...", compact = false }: SearchInputProps) {
  const navigate = useNavigate();
  const themeColors = useThemeColors();
  const inputRef = useRef<TextInput>(null);
  const containerRef = useRef<View>(null);

  const {
    query,
    setQuery,
    results,
    loading,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    clearResults,
  } = useSearch();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Simple check - close if not clicking within component
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const items = results.length > 0 ? results : [];

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1));
          break;
        case "ArrowUp":
          event.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, -1));
          break;
        case "Enter":
          event.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < items.length) {
            handleSelectAsset(items[selectedIndex]);
          }
          break;
        case "Escape":
          event.preventDefault();
          setIsOpen(false);
          clearResults();
          inputRef.current?.blur();
          break;
      }
    },
    [results, selectedIndex, clearResults]
  );

  const handleSelectAsset = (asset: Asset) => {
    addRecentSearch(asset.symbol);
    clearResults();
    setIsOpen(false);
    navigate(`/asset/${asset.id}`);
  };

  const handleRecentSearchClick = (searchTerm: string) => {
    setQuery(searchTerm);
  };

  const handleFocus = () => {
    setIsOpen(true);
    setSelectedIndex(-1);
  };

  const showDropdown = isOpen && (query.length >= 2 || recentSearches.length > 0);

  return (
    <View ref={containerRef} style={styles.container}>
      <View
        style={[
          styles.inputContainer,
          { backgroundColor: themeColors.background.sunken },
          compact && styles.inputContainerCompact,
        ]}
      >
        <Icon name="search" size={Size.Small} color={themeColors.text.muted} />
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={setQuery}
          onFocus={handleFocus}
          onKeyPress={handleKeyDown as any}
          placeholder={placeholder}
          placeholderTextColor={themeColors.text.muted}
          style={[styles.input, { color: themeColors.text.primary }]}
        />
        {!compact && (
          <View style={styles.shortcut}>
            <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
              ⌘K
            </Text>
          </View>
        )}
        {query && (
          <Pressable onPress={clearResults} style={styles.clearButton}>
            <Icon name="x" size={Size.ExtraSmall} color={themeColors.text.muted} />
          </Pressable>
        )}
      </View>

      {showDropdown && (
        <View style={[styles.dropdown, { backgroundColor: themeColors.background.raised }]}>
          {loading && (
            <View style={styles.loadingContainer}>
              <Skeleton width="100%" height={48} />
              <Skeleton width="100%" height={48} />
              <Skeleton width="100%" height={48} />
            </View>
          )}

          {!loading && results.length > 0 && (
            <View style={styles.resultsSection}>
              {results.map((asset, index) => (
                <SearchResult
                  key={asset.id}
                  asset={asset}
                  isSelected={index === selectedIndex}
                  onSelect={() => handleSelectAsset(asset)}
                />
              ))}
            </View>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <View style={styles.emptyState}>
              <Text size={Size.Small} appearance={TextAppearance.Muted}>
                No results for "{query}"
              </Text>
            </View>
          )}

          {!loading && query.length < 2 && recentSearches.length > 0 && (
            <View style={styles.recentSection}>
              <View style={styles.recentHeader}>
                <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                  Recent Searches
                </Text>
                <Pressable onPress={clearRecentSearches}>
                  <Text size={Size.ExtraSmall} style={{ color: Colors.accent.primary }}>
                    Clear
                  </Text>
                </Pressable>
              </View>
              {recentSearches.map((term) => (
                <Pressable
                  key={term}
                  onPress={() => handleRecentSearchClick(term)}
                  style={styles.recentItem}
                >
                  <Icon name="clock" size={Size.ExtraSmall} color={themeColors.text.muted} />
                  <Text size={Size.Small}>{term.toUpperCase()}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 100,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
    gap: spacing.xs,
    minWidth: 240,
  },
  inputContainerCompact: {
    minWidth: 180,
  },
  input: {
    flex: 1,
    fontSize: 14,
    outlineStyle: "none",
  },
  shortcut: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  clearButton: {
    padding: spacing.xxs,
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: spacing.xs,
    borderRadius: radii.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    maxHeight: 400,
    overflow: "hidden",
  },
  loadingContainer: {
    padding: spacing.sm,
    gap: spacing.xs,
  },
  resultsSection: {
    padding: spacing.xs,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    borderRadius: radii.md,
    gap: spacing.sm,
  },
  resultInfo: {
    flex: 1,
    gap: 2,
  },
  resultPrice: {
    alignItems: "flex-end",
    gap: 2,
  },
  emptyState: {
    padding: spacing.lg,
    alignItems: "center",
  },
  recentSection: {
    padding: spacing.sm,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.md,
  },
});
