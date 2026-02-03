/**
 * @file HighlightedText.tsx
 * @description Text component that highlights search query matches.
 *
 * ## Features:
 * - Case-insensitive matching
 * - Escapes special regex characters in search query
 * - Highlights matching portions in accent color
 * - Renders plain text when no match or empty query
 *
 * ## Props:
 * - `text`: The full text to display
 * - `highlight`: The search query to highlight
 * - `style`: Optional TextStyle for the text
 */
import React from "react";
import { Text as RNText, StyleSheet, type TextStyle } from "react-native";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";

type HighlightedTextProps = {
  text: string;
  highlight: string;
  style?: TextStyle;
};

/**
 * Renders text with matching portions highlighted in the primary accent color.
 * Useful for showing search matches in asset names and symbols.
 */
export function HighlightedText({ text, highlight, style }: HighlightedTextProps) {
  const themeColors = useThemeColors();

  if (!highlight.trim()) {
    return <RNText style={style}>{text}</RNText>;
  }

  const regex = new RegExp(`(${escapeRegex(highlight)})`, "gi");
  const parts = text.split(regex);

  return (
    <RNText style={style}>
      {parts.map((part, index) => {
        const isMatch = part.toLowerCase() === highlight.toLowerCase();
        return (
          <RNText
            key={`${index}-${part}`}
            style={isMatch ? { color: themeColors.accent.primary } : undefined}
          >
            {part}
          </RNText>
        );
      })}
    </RNText>
  );
}

/** Escape special regex characters in a string */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
