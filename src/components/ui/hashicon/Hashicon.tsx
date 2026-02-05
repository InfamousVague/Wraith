/**
 * Hashicon Avatar Component
 *
 * Generates deterministic, unique visual identities (avatars) based on
 * wallet addresses, usernames, or any string input.
 *
 * Uses a hash-based algorithm to generate consistent colors and patterns
 * that are unique to each input string.
 */

import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Rect, Circle, Polygon, G, Defs, ClipPath } from "react-native-svg";
import { Size } from "@wraith/ghost/enums";

export type HashiconProps = {
  /** The input string to generate the hashicon from (wallet address, username, etc.) */
  value: string;
  /** Size of the hashicon */
  size?: Size;
  /** Custom pixel size (overrides size prop) */
  customSize?: number;
  /** Whether to show as a circle (default: true) */
  circular?: boolean;
};

// Size mapping in pixels
const SIZE_MAP: Record<Size, number> = {
  [Size.TwoXSmall]: 20,
  [Size.ExtraSmall]: 24,
  [Size.Small]: 32,
  [Size.Medium]: 40,
  [Size.Large]: 48,
  [Size.ExtraLarge]: 64,
  [Size.TwoXLarge]: 80,
};

// Simple hash function for strings
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Generate multiple hash values from a string
function generateHashValues(input: string, count: number): number[] {
  const results: number[] = [];
  let current = input;

  for (let i = 0; i < count; i++) {
    const hash = hashString(current + i.toString());
    results.push(hash);
    current = hash.toString(16);
  }

  return results;
}

// Convert hash to a color
function hashToColor(hash: number): string {
  const hue = hash % 360;
  const saturation = 50 + (hash % 40); // 50-90%
  const lightness = 45 + (hash % 20); // 45-65%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// Convert hash to a lighter/darker shade
function hashToShade(hash: number, isDark: boolean): string {
  const hue = hash % 360;
  const saturation = 40 + (hash % 30); // 40-70%
  const lightness = isDark ? 25 + (hash % 15) : 65 + (hash % 20); // Dark: 25-40%, Light: 65-85%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// Pattern types
type PatternType = "triangles" | "circles" | "blocks" | "diamonds" | "stripes";

// Get pattern type from hash
function getPatternType(hash: number): PatternType {
  const patterns: PatternType[] = ["triangles", "circles", "blocks", "diamonds", "stripes"];
  return patterns[hash % patterns.length];
}

// Generate pattern elements
function generatePatternElements(
  hashes: number[],
  patternType: PatternType,
  gridSize: number,
  cellSize: number,
  colors: string[]
): React.ReactElement[] {
  const elements: React.ReactElement[] = [];

  // Generate a symmetric pattern (mirror on y-axis)
  const halfGrid = Math.ceil(gridSize / 2);

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < halfGrid; x++) {
      const cellIndex = y * gridSize + x;
      const hash = hashes[cellIndex % hashes.length];
      const shouldFill = hash % 2 === 0;

      if (!shouldFill) continue;

      const color = colors[hash % colors.length];
      const mirrorX = gridSize - 1 - x;

      switch (patternType) {
        case "triangles":
          // Random triangle orientation
          const points1 =
            hash % 4 === 0
              ? `${x * cellSize},${y * cellSize} ${(x + 1) * cellSize},${y * cellSize} ${x * cellSize + cellSize / 2},${(y + 1) * cellSize}`
              : hash % 4 === 1
              ? `${x * cellSize},${(y + 1) * cellSize} ${(x + 1) * cellSize},${(y + 1) * cellSize} ${x * cellSize + cellSize / 2},${y * cellSize}`
              : hash % 4 === 2
              ? `${x * cellSize},${y * cellSize} ${x * cellSize},${(y + 1) * cellSize} ${(x + 1) * cellSize},${y * cellSize + cellSize / 2}`
              : `${(x + 1) * cellSize},${y * cellSize} ${(x + 1) * cellSize},${(y + 1) * cellSize} ${x * cellSize},${y * cellSize + cellSize / 2}`;

          elements.push(<Polygon key={`tri-${x}-${y}`} points={points1} fill={color} />);

          // Mirror
          if (x !== mirrorX) {
            const mirrorPoints1 =
              hash % 4 === 0
                ? `${mirrorX * cellSize},${y * cellSize} ${(mirrorX + 1) * cellSize},${y * cellSize} ${mirrorX * cellSize + cellSize / 2},${(y + 1) * cellSize}`
                : hash % 4 === 1
                ? `${mirrorX * cellSize},${(y + 1) * cellSize} ${(mirrorX + 1) * cellSize},${(y + 1) * cellSize} ${mirrorX * cellSize + cellSize / 2},${y * cellSize}`
                : hash % 4 === 2
                ? `${(mirrorX + 1) * cellSize},${y * cellSize} ${(mirrorX + 1) * cellSize},${(y + 1) * cellSize} ${mirrorX * cellSize},${y * cellSize + cellSize / 2}`
                : `${mirrorX * cellSize},${y * cellSize} ${mirrorX * cellSize},${(y + 1) * cellSize} ${(mirrorX + 1) * cellSize},${y * cellSize + cellSize / 2}`;

            elements.push(<Polygon key={`tri-${mirrorX}-${y}`} points={mirrorPoints1} fill={color} />);
          }
          break;

        case "circles":
          const radius = (cellSize / 2) * (0.6 + (hash % 4) * 0.1);
          elements.push(
            <Circle
              key={`cir-${x}-${y}`}
              cx={x * cellSize + cellSize / 2}
              cy={y * cellSize + cellSize / 2}
              r={radius}
              fill={color}
            />
          );
          if (x !== mirrorX) {
            elements.push(
              <Circle
                key={`cir-${mirrorX}-${y}`}
                cx={mirrorX * cellSize + cellSize / 2}
                cy={y * cellSize + cellSize / 2}
                r={radius}
                fill={color}
              />
            );
          }
          break;

        case "blocks":
          elements.push(
            <Rect
              key={`blk-${x}-${y}`}
              x={x * cellSize}
              y={y * cellSize}
              width={cellSize}
              height={cellSize}
              fill={color}
            />
          );
          if (x !== mirrorX) {
            elements.push(
              <Rect
                key={`blk-${mirrorX}-${y}`}
                x={mirrorX * cellSize}
                y={y * cellSize}
                width={cellSize}
                height={cellSize}
                fill={color}
              />
            );
          }
          break;

        case "diamonds":
          const diamondPoints = `${x * cellSize + cellSize / 2},${y * cellSize} ${(x + 1) * cellSize},${y * cellSize + cellSize / 2} ${x * cellSize + cellSize / 2},${(y + 1) * cellSize} ${x * cellSize},${y * cellSize + cellSize / 2}`;
          elements.push(<Polygon key={`dia-${x}-${y}`} points={diamondPoints} fill={color} />);
          if (x !== mirrorX) {
            const mirrorDiamondPoints = `${mirrorX * cellSize + cellSize / 2},${y * cellSize} ${(mirrorX + 1) * cellSize},${y * cellSize + cellSize / 2} ${mirrorX * cellSize + cellSize / 2},${(y + 1) * cellSize} ${mirrorX * cellSize},${y * cellSize + cellSize / 2}`;
            elements.push(<Polygon key={`dia-${mirrorX}-${y}`} points={mirrorDiamondPoints} fill={color} />);
          }
          break;

        case "stripes":
          const stripeHeight = cellSize / 2;
          elements.push(
            <Rect
              key={`str-${x}-${y}`}
              x={x * cellSize}
              y={y * cellSize + (hash % 2) * stripeHeight}
              width={cellSize}
              height={stripeHeight}
              fill={color}
            />
          );
          if (x !== mirrorX) {
            elements.push(
              <Rect
                key={`str-${mirrorX}-${y}`}
                x={mirrorX * cellSize}
                y={y * cellSize + (hash % 2) * stripeHeight}
                width={cellSize}
                height={stripeHeight}
                fill={color}
              />
            );
          }
          break;
      }
    }
  }

  return elements;
}

export function Hashicon({
  value,
  size = Size.Medium,
  customSize,
  circular = true,
}: HashiconProps) {
  const pixelSize = customSize ?? SIZE_MAP[size];
  const gridSize = 5; // 5x5 grid
  const cellSize = pixelSize / gridSize;

  // Generate deterministic values from input
  const { backgroundColor, patternType, colors, elements } = useMemo(() => {
    const hashes = generateHashValues(value, 50);

    // Generate colors
    const primaryColor = hashToColor(hashes[0]);
    const secondaryColor = hashToColor(hashes[1]);
    const accentColor = hashToColor(hashes[2]);
    const bgColor = hashToShade(hashes[3], true);

    const patternColors = [primaryColor, secondaryColor, accentColor];
    const pattern = getPatternType(hashes[4]);

    const patternElements = generatePatternElements(
      hashes.slice(5),
      pattern,
      gridSize,
      cellSize,
      patternColors
    );

    return {
      backgroundColor: bgColor,
      patternType: pattern,
      colors: patternColors,
      elements: patternElements,
    };
  }, [value, cellSize]);

  const clipId = `hashicon-clip-${value.slice(0, 8)}`;

  return (
    <View style={[styles.container, { width: pixelSize, height: pixelSize }]}>
      <Svg width={pixelSize} height={pixelSize} viewBox={`0 0 ${pixelSize} ${pixelSize}`}>
        {circular && (
          <Defs>
            <ClipPath id={clipId}>
              <Circle cx={pixelSize / 2} cy={pixelSize / 2} r={pixelSize / 2} />
            </ClipPath>
          </Defs>
        )}

        <G clipPath={circular ? `url(#${clipId})` : undefined}>
          {/* Background */}
          <Rect x={0} y={0} width={pixelSize} height={pixelSize} fill={backgroundColor} />

          {/* Pattern */}
          {elements}
        </G>

        {/* Border */}
        {circular && (
          <Circle
            cx={pixelSize / 2}
            cy={pixelSize / 2}
            r={pixelSize / 2 - 1}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={1}
          />
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
});

export default Hashicon;
