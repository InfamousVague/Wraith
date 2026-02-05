/**
 * @file OrderForm.tsx
 * @description Main order entry form for paper trading.
 *
 * Composes sub-components:
 * - OrderTypeSelector (Market/Limit/Stop Loss/Take Profit/Stop Limit/Trailing Stop)
 * - SideToggle (Buy/Sell toggle with color coding)
 * - PriceInput (for limit/stop orders)
 * - SizeInput (with USD conversion)
 * - LeverageSlider (1x-100x with presets)
 * - QuickSizeButtons (25%/50%/75%/100%)
 * - OrderSummary (collapsible - entry price, fees, liquidation estimate)
 */

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Card, Text, Button, Skeleton, Icon } from "@wraith/ghost/components";
import { Size, TextAppearance, Appearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { spacing, radii } from "../../../styles/tokens";
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
import { TimeInForceSelector } from "./TimeInForceSelector";
import { OrderOptions } from "./OrderOptions";
import { MarginModeToggle } from "./MarginModeToggle";
import { TpSlSection } from "./TpSlSection";

import type {
  OrderFormProps,
  OrderType,
  OrderSide,
  TimeInForce,
  MarginMode,
} from "./types";

export function OrderForm({
  symbol,
  currentPrice,
  availableMargin,
  onSubmit,
  loading = false,
  disabled = false,
  disabledMessage,
  priceSelection,
}: OrderFormProps) {
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [side, setSide] = useState<OrderSide>("buy");
  const [price, setPrice] = useState("");
  const [stopPrice, setStopPrice] = useState("");
  const [size, setSize] = useState("");
  const [leverage, setLeverage] = useState(1);
  const [timeInForce, setTimeInForce] = useState<TimeInForce>("gtc");
  const [reduceOnly, setReduceOnly] = useState(false);
  const [postOnly, setPostOnly] = useState(false);
  const [marginMode, setMarginMode] = useState<MarginMode>("isolated");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [trailPercent, setTrailPercent] = useState("");
  const [showSummary, setShowSummary] = useState(false);

  const formatPriceForInput = useCallback((value: number): string => {
    if (!Number.isFinite(value)) return "";
    if (value >= 10000) return value.toFixed(0);
    if (value >= 100) return value.toFixed(2);
    if (value >= 1) return value.toFixed(4);
    return value.toFixed(6);
  }, []);

  useEffect(() => {
    if (!priceSelection) return;
    setOrderType("limit");
    setPrice(formatPriceForInput(priceSelection.price));
    // Set side based on order book click:
    // Clicking on asks (sell orders) = user wants to BUY (take liquidity from sellers)
    // Clicking on bids (buy orders) = user wants to SELL (take liquidity from buyers)
    setSide(priceSelection.side === "ask" ? "buy" : "sell");
  }, [priceSelection, formatPriceForInput]);

  // Determine which price inputs are needed based on order type
  const needsLimitPrice = orderType === "limit" || orderType === "stop_limit";
  const needsStopPrice = orderType === "stop_loss" || orderType === "take_profit" || orderType === "stop_limit";
  const needsTrailInput = orderType === "trailing_stop";
  const needsAnyPrice = needsLimitPrice || needsStopPrice || needsTrailInput;

  const handleSizeSelect = useCallback((selectedSize: number) => {
    setSize(selectedSize.toFixed(6));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!onSubmit) return;
    onSubmit({
      orderType,
      side,
      price,
      stopPrice: stopPrice || undefined,
      size,
      leverage,
      marginMode,
      timeInForce,
      reduceOnly: reduceOnly || undefined,
      postOnly: postOnly || undefined,
      stopLoss: stopLoss || undefined,
      takeProfit: takeProfit || undefined,
      trailPercent: trailPercent || undefined,
    });
  }, [onSubmit, orderType, side, price, stopPrice, size, leverage, marginMode, timeInForce, reduceOnly, postOnly, stopLoss, takeProfit, trailPercent]);

  const isValid = useMemo(() => {
    const sizeNum = parseFloat(size);
    if (!sizeNum || sizeNum <= 0) return false;

    if (needsLimitPrice) {
      const priceNum = parseFloat(price);
      if (!priceNum || priceNum <= 0) return false;
    }

    if (needsStopPrice) {
      const stopNum = parseFloat(stopPrice);
      if (!stopNum || stopNum <= 0) return false;
    }

    if (needsTrailInput) {
      const trailNum = parseFloat(trailPercent);
      if (!trailNum || trailNum <= 0) return false;
    }

    return true;
  }, [size, price, stopPrice, trailPercent, needsLimitPrice, needsStopPrice, needsTrailInput]);

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
              icon="i"
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
                    Choose direction - Buy/Long or Sell/Short
                  </TooltipListItem>
                  <TooltipListItem icon="3" color={Colors.data.amber}>
                    Set position size and leverage
                  </TooltipListItem>
                  <TooltipListItem icon="4" color={Colors.data.emerald}>
                    Review summary and submit
                  </TooltipListItem>
                </TooltipSection>
                <TooltipHighlight color={Colors.data.blue} icon="i">
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

        {/* Margin Mode Toggle */}
        <MarginModeToggle value={marginMode} onChange={setMarginMode} />

        {/* Limit Price Input (for limit and stop-limit orders) */}
        {needsLimitPrice && (
          <PriceInput
            value={price}
            onChange={setPrice}
            label="Limit Price"
          />
        )}

        {/* Stop/Trigger Price Input (for stop orders) */}
        {needsStopPrice && (
          <PriceInput
            value={stopPrice}
            onChange={setStopPrice}
            label="Trigger Price"
          />
        )}

        {/* Trailing Stop Input */}
        {needsTrailInput && (
          <PriceInput
            value={trailPercent}
            onChange={setTrailPercent}
            label="Trail %"
            placeholder="e.g. 2.5"
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

        {/* TP/SL Section (collapsible) */}
        <TpSlSection
          stopLoss={stopLoss}
          takeProfit={takeProfit}
          onStopLossChange={setStopLoss}
          onTakeProfitChange={setTakeProfit}
          side={side}
          currentPrice={currentPrice}
        />

        {/* Time In Force (for limit/stop orders) */}
        {needsAnyPrice && (
          <TimeInForceSelector value={timeInForce} onChange={setTimeInForce} />
        )}

        {/* Order Options (Reduce Only, Post Only) */}
        {needsAnyPrice && (
          <OrderOptions
            reduceOnly={reduceOnly}
            postOnly={postOnly}
            onReduceOnlyChange={setReduceOnly}
            onPostOnlyChange={setPostOnly}
            orderType={orderType}
          />
        )}

        {/* Order Summary (collapsible) */}
        <Pressable
          style={styles.summaryToggle}
          onPress={() => setShowSummary(!showSummary)}
        >
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
            Order Summary
          </Text>
          <Icon
            name={showSummary ? "chevron-up" : "chevron-down"}
            size={Size.Small}
            color={Colors.text.secondary}
          />
        </Pressable>
        {showSummary && (
          <OrderSummary
            side={side}
            orderType={orderType}
            price={priceNum}
            size={sizeNum}
            leverage={leverage}
            currentPrice={currentPrice}
          />
        )}

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
  summaryToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: Colors.background.raised,
    borderRadius: radii.sm,
  },
});
