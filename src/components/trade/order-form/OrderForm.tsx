/**
 * @file OrderForm.tsx
 * @description Main order entry form for paper trading.
 *
 * Composes sub-components:
 * - OrderTypeSelector (Market/Limit/Stop Loss/Take Profit)
 * - SideToggle (Buy/Sell toggle with color coding)
 * - PriceInput (for limit/stop orders)
 * - SizeInput (with USD conversion)
 * - LeverageSlider (1x-100x with presets)
 * - QuickSizeButtons (25%/50%/75%/100%)
 * - OrderSummary (entry price, fees, liquidation estimate)
 */

import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Card, Text, Button, Skeleton } from "@wraith/ghost/components";
import { Size, TextAppearance, Appearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { spacing } from "../../../styles/tokens";
import {
  HintIndicator,
  TooltipContainer,
  TooltipSection,
  TooltipText,
  TooltipListItem,
  TooltipHighlight,
} from "../../ui/hint-indicator";

import { OrderTypeSelector } from "./OrderTypeSelector";
import { SideToggle } from "./SideToggle";
import { PriceInput } from "./PriceInput";
import { SizeInput } from "./SizeInput";
import { LeverageSlider } from "./LeverageSlider";
import { QuickSizeButtons } from "./QuickSizeButtons";
import { OrderSummary } from "./OrderSummary";

import type {
  OrderFormProps,
  OrderType,
  OrderSide,
} from "./types";

export function OrderForm({
  symbol,
  currentPrice,
  availableMargin,
  onSubmit,
  loading = false,
  disabled = false,
  disabledMessage,
}: OrderFormProps) {
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [side, setSide] = useState<OrderSide>("buy");
  const [price, setPrice] = useState("");
  const [size, setSize] = useState("");
  const [leverage, setLeverage] = useState(1);

  const needsPrice = orderType !== "market";

  const handleSizeSelect = useCallback((selectedSize: number) => {
    setSize(selectedSize.toFixed(6));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!onSubmit) return;
    onSubmit({
      orderType,
      side,
      price,
      size,
      leverage,
      marginMode: "isolated",
    });
  }, [onSubmit, orderType, side, price, size, leverage]);

  const isValid = useMemo(() => {
    const sizeNum = parseFloat(size);
    if (!sizeNum || sizeNum <= 0) return false;
    if (needsPrice) {
      const priceNum = parseFloat(price);
      if (!priceNum || priceNum <= 0) return false;
    }
    return true;
  }, [size, price, needsPrice]);

  const sizeNum = parseFloat(size) || 0;
  const priceNum = parseFloat(price) || undefined;

  if (loading) {
    return (
      <Card style={styles.card}>
        <View style={styles.container}>
          <Skeleton height={40} />
          <Skeleton height={48} style={{ marginTop: spacing.sm }} />
          <Skeleton height={48} style={{ marginTop: spacing.sm }} />
          <Skeleton height={48} style={{ marginTop: spacing.sm }} />
          <Skeleton height={60} style={{ marginTop: spacing.sm }} />
          <Skeleton height={48} style={{ marginTop: spacing.md }} />
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text size={Size.Medium} style={styles.headerText}>
              {symbol}
            </Text>
            <HintIndicator
              id="order-form-hint"
              title="Place Orders"
              icon="?"
              color={Colors.accent.primary}
              priority={51}
              width={400}
              inline
            >
              <TooltipContainer>
                <TooltipText>
                  Use this form to place paper trading orders for practice without risking real capital.
                </TooltipText>
                <TooltipSection title="Order Flow">
                  <TooltipListItem icon="1" color={Colors.data.violet}>
                    Select order type (Market, Limit, Stop)
                  </TooltipListItem>
                  <TooltipListItem icon="2" color={Colors.data.cyan}>
                    Choose direction — Buy/Long or Sell/Short
                  </TooltipListItem>
                  <TooltipListItem icon="3" color={Colors.data.amber}>
                    Set position size and leverage
                  </TooltipListItem>
                  <TooltipListItem icon="4" color={Colors.data.emerald}>
                    Review summary and submit
                  </TooltipListItem>
                </TooltipSection>
                <TooltipHighlight color={Colors.data.blue} icon="info">
                  Paper trading simulates real market conditions for learning
                </TooltipHighlight>
              </TooltipContainer>
            </HintIndicator>
          </View>
          {currentPrice && (
            <Text size={Size.Small} appearance={TextAppearance.Secondary}>
              ${currentPrice.toLocaleString()}
            </Text>
          )}
        </View>

        {/* Order Type Selector */}
        <OrderTypeSelector value={orderType} onChange={setOrderType} />

        {/* Buy/Sell Toggle */}
        <SideToggle value={side} onChange={setSide} />

        {/* Price Input (for non-market orders) */}
        {needsPrice && (
          <PriceInput
            value={price}
            onChange={setPrice}
            label={orderType === "limit" ? "Limit Price" : "Trigger Price"}
          />
        )}

        {/* Size Input */}
        <SizeInput
          value={size}
          onChange={setSize}
          currentPrice={currentPrice}
          symbol={symbol}
        />

        {/* Quick Size Buttons */}
        <QuickSizeButtons
          availableMargin={availableMargin}
          currentPrice={currentPrice}
          leverage={leverage}
          onSizeSelect={handleSizeSelect}
        />

        {/* Leverage Slider */}
        <LeverageSlider value={leverage} onChange={setLeverage} />

        {/* Order Summary */}
        <OrderSummary
          side={side}
          orderType={orderType}
          price={priceNum}
          size={sizeNum}
          leverage={leverage}
          currentPrice={currentPrice}
        />

        {/* Submit Button */}
        <View style={styles.submitButton}>
          {disabled && disabledMessage && (
            <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.disabledMessage}>
              {disabledMessage}
            </Text>
          )}
          <Button
            label={side === "buy" ? `Buy / Long ${symbol}` : `Sell / Short ${symbol}`}
            appearance={side === "buy" ? Appearance.Success : Appearance.Danger}
            size={Size.Medium}
            onPress={handleSubmit}
            disabled={!isValid || disabled}
          />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  container: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  headerText: {
    fontWeight: "700",
  },
  submitButton: {
    marginTop: spacing.sm,
  },
  disabledMessage: {
    textAlign: "center",
    marginBottom: spacing.xs,
  },
});
