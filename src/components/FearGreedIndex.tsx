import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, Text, ProgressCircle } from "@wraith/ghost/components";
import { Size, TextAppearance, Brightness } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";

function getIndexAppearance(value: number): TextAppearance {
  if (value <= 25) return TextAppearance.Danger;
  if (value <= 45) return TextAppearance.Warning;
  if (value <= 55) return TextAppearance.Muted;
  if (value <= 75) return TextAppearance.Success;
  return TextAppearance.Success;
}

function getIndexLabel(value: number): string {
  if (value <= 25) return "Extreme Fear";
  if (value <= 45) return "Fear";
  if (value <= 55) return "Neutral";
  if (value <= 75) return "Greed";
  return "Extreme Greed";
}

export function FearGreedIndex() {
  // Mock data - will be replaced with API data
  const fearGreedValue = 72;
  const appearance = getIndexAppearance(fearGreedValue);
  const label = getIndexLabel(fearGreedValue);

  return (
    <Card style={styles.container}>
      <Text size={Size.Medium} weight="semibold" style={styles.title}>
        Fear & Greed Index
      </Text>

      <View style={styles.content}>
        <ProgressCircle
          value={fearGreedValue}
          max={100}
          size={Size.ExtraLarge}
          appearance={appearance}
          brightness={Brightness.Bright}
          showValue
        />

        <View style={styles.info}>
          <Text
            size={Size.Medium}
            weight="semibold"
            appearance={appearance}
          >
            {label}
          </Text>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
            Updated 1 hour ago
          </Text>

          <View style={styles.scale}>
            <View style={styles.scaleItem}>
              <View style={[styles.scaleDot, { backgroundColor: Colors.status.danger }]} />
              <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>0-25 Fear</Text>
            </View>
            <View style={styles.scaleItem}>
              <View style={[styles.scaleDot, { backgroundColor: Colors.status.warning }]} />
              <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>26-45</Text>
            </View>
            <View style={styles.scaleItem}>
              <View style={[styles.scaleDot, { backgroundColor: Colors.text.muted }]} />
              <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>46-55</Text>
            </View>
            <View style={styles.scaleItem}>
              <View style={[styles.scaleDot, { backgroundColor: Colors.status.success }]} />
              <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>56-100 Greed</Text>
            </View>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    marginBottom: 16,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  info: {
    flex: 1,
    gap: 8,
  },
  scale: {
    marginTop: 8,
    gap: 6,
  },
  scaleItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  scaleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
