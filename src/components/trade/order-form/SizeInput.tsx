/**
 * @file SizeInput.tsx
 * @description Size/quantity input with USD conversion display.
 */

import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Input, Text } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { spacing } from "../../../styles/tokens";
import {
  HintIndicator,
  TooltipContainer,
  TooltipSection,
  TooltipText,
  TooltipMetric,
  TooltipSignal,
} from "../../ui/hint-indicator";
import { validateSize } from "./utils/validators";
import { formatInputValue, formatPrice } from "./utils/formatters";
import type { SizeInputProps } from "./types";

export function SizeInput({
  value,
  onChange,
  currentPrice,
  symbol = "BTC",
}: SizeInputProps) {
  const [error, setError] = useState<string | undefined>();
  const [focused, setFocused] = useState(false);

  const handleChange = useCallback(
    (text: string) => {
      const cleaned = formatInputValue(text);
      onChange(cleaned);

      // Validate on change
      const validation = validateSize(cleaned, { required: false });
      setError(validation.error);
    },
    [onChange]
  );

  const handleBlur = useCallback(() => {
    setFocused(false);
    // Validate on blur
    const validation = validateSize(value, { required: true });
    setError(validation.error);
  }, [value]);

  // Calculate USD equivalent
  const usdEquivalent = useMemo(() => {
    const sizeNum = parseFloat(value) || 0;
    if (sizeNum <= 0 || !currentPrice) return null;
    return sizeNum * currentPrice;
  }, [value, currentPrice]);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
          Size ({symbol})
        </Text>
        <HintIndicator
          id="size-input-hint"
          title="Position Size"
          icon="?"
          color={Colors.accent.primary}
          priority={57}
          width={360}
          inline
        >
          <TooltipContainer>
            <TooltipText>
              Enter the amount of {symbol} you want to trade, or use the quick size buttons below.
            </TooltipText>
            <TooltipSection title="Size Levels">
              <TooltipMetric label="25%" value="Conservative — lower risk" valueColor={Colors.status.success} />
              <TooltipMetric label="50%" value="Moderate position" valueColor={Colors.data.amber} />
              <TooltipMetric label="75%" value="Aggressive sizing" valueColor={Colors.status.warning} />
              <TooltipMetric label="100%" value="Maximum exposure" valueColor={Colors.status.danger} />
            </TooltipSection>
            <TooltipSignal type="warning" text="Higher leverage + larger size = higher liquidation risk" />
          </TooltipContainer>
        </HintIndicator>
      </View>
      <Input
        value={value}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
        placeholder="0.00"
        size={Size.Small}
      />
      {usdEquivalent !== null && (
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.usdValue}>
          ≈ {formatPrice(usdEquivalent, { decimals: 2 })}
        </Text>
      )}
      {error && (
        <Text size={Size.ExtraSmall} style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xxs,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xxs,
  },
  usdValue: {
    marginTop: spacing.xxs,
    textAlign: "right",
  },
  error: {
    color: Colors.status.danger,
    marginTop: spacing.xxs,
  },
});
