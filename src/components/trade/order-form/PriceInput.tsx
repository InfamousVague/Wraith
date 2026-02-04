/**
 * @file PriceInput.tsx
 * @description Price input field with validation.
 */

import React, { useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { Input, Text } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { spacing } from "../../../styles/tokens";
import { validatePrice } from "./utils/validators";
import { formatInputValue } from "./utils/formatters";
import type { PriceInputProps } from "./types";

export function PriceInput({
  value,
  onChange,
  label = "Price",
  placeholder = "0.00",
  disabled = false,
}: PriceInputProps) {
  const [error, setError] = useState<string | undefined>();
  const [focused, setFocused] = useState(false);

  const handleChange = useCallback(
    (text: string) => {
      const cleaned = formatInputValue(text);
      onChange(cleaned);

      // Validate on change
      const validation = validatePrice(cleaned, { required: false });
      setError(validation.error);
    },
    [onChange]
  );

  const handleBlur = useCallback(() => {
    setFocused(false);
    // Validate on blur
    const validation = validatePrice(value, { required: true });
    setError(validation.error);
  }, [value]);

  return (
    <View style={styles.container}>
      <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.label}>
        {label}
      </Text>
      <View style={styles.inputWrapper}>
        <Text size={Size.Small} style={styles.prefix}>
          $
        </Text>
        <View style={styles.input}>
          <Input
            value={value}
            onChangeText={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={handleBlur}
            placeholder={placeholder}
            size={Size.Small}
          />
        </View>
      </View>
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
  label: {
    marginBottom: spacing.xxs,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  prefix: {
    marginRight: spacing.xs,
    color: Colors.text.muted,
  },
  input: {
    flex: 1,
  },
  error: {
    color: Colors.status.danger,
    marginTop: spacing.xxs,
  },
});
