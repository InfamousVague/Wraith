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
            key={index}
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
