/**
 * @file OrderSummary.tsx
 * @description Order summary showing entry price, fees, and liquidation estimate.
 */

import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { spacing, radii } from "../../../styles/tokens";
import {
  HintIndicator,
  TooltipContainer,
  TooltipSection,
  TooltipText,
  TooltipMetric,
  TooltipDivider,
  TooltipSignal,
} from "../../ui/hint-indicator";
import { formatPrice, formatPercent } from "./utils/formatters";
import type { OrderSummaryProps } from "./types";

// Fee rate (0.05% = 0.0005)
const FEE_RATE = 0.0005;

export function OrderSummary({
  side,
  orderType,
  price,
  size,
  leverage,
  currentPrice,
}: OrderSummaryProps) {
  const calculations = useMemo(() => {
    // Determine entry price
    const entryPrice = orderType === "market" ? currentPrice : price;
    if (!entryPrice || entryPrice <= 0 || size <= 0) {
      return null;
    }

    // Position value
    const positionValue = size * entryPrice;

    // Required margin
    const margin = positionValue / leverage;

    // Fee
    const fee = positionValue * FEE_RATE;

    // Liquidation price estimation
    // For longs: Liq Price = Entry * (1 - 1/leverage + maintenance margin)
    // For shorts: Liq Price = Entry * (1 + 1/leverage - maintenance margin)
    // Using 0.5% maintenance margin
    const maintenanceMargin = 0.005;
    let liquidationPrice: number;

    if (side === "buy") {
      liquidationPrice = entryPrice * (1 - (1 / leverage) + maintenanceMargin);
    } else {
      liquidationPrice = entryPrice * (1 + (1 / leverage) - maintenanceMargin);
    }

    // Distance to liquidation
    const liquidationDistance = Math.abs((liquidationPrice - entryPrice) / entryPrice);

    return {
      entryPrice,
      positionValue,
      margin,
      fee,
      liquidationPrice,
      liquidationDistance,
    };
  }, [side, orderType, price, size, leverage, currentPrice]);

  if (!calculations) {
    return (
      <View style={styles.container}>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.placeholder}>
          Enter order details to see summary
        </Text>
      </View>
    );
  }

  const {
    entryPrice,
    positionValue,
    margin,
    fee,
    liquidationPrice,
    liquidationDistance,
  } = calculations;

  // Determine if liquidation is dangerously close
  const isHighRisk = liquidationDistance < 0.05; // Less than 5% away

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text size={Size.Small} style={styles.title}>
          Order Summary
        </Text>
        <HintIndicator
          id="order-summary-hint"
          title="Order Summary"
          icon="?"
          color={Colors.accent.primary}
          priority={58}
          width={420}
          inline
        >
          <TooltipContainer>
            <TooltipText>
              Review your order details before submitting.
            </TooltipText>
            <TooltipSection title="Order Details">
              <TooltipMetric label="Entry Price" value="Execution price" />
              <TooltipMetric label="Position Value" value="Size × Price" />
              <TooltipMetric label="Required Margin" value="Collateral locked" />
              <TooltipMetric label="Est. Fee" value="Trading fee" />
            </TooltipSection>
            <TooltipDivider />
            <TooltipSection title="Liquidation Price">
              <TooltipText>
                If price reaches this level, your position is automatically closed to prevent further losses.
              </TooltipText>
              <TooltipSignal type="warning" text="Stay above liquidation price to keep your position open" />
            </TooltipSection>
          </TooltipContainer>
        </HintIndicator>
      </View>

      <SummaryRow
        label="Entry Price"
        value={formatPrice(entryPrice)}
        valueAppearance={orderType === "market" ? TextAppearance.Muted : undefined}
        note={orderType === "market" ? "(market)" : undefined}
      />

      <SummaryRow
        label="Position Value"
        value={formatPrice(positionValue, { decimals: 2 })}
      />

      <SummaryRow
        label="Required Margin"
        value={formatPrice(margin, { decimals: 2 })}
      />

      <SummaryRow
        label={`Est. Fee (${formatPercent(FEE_RATE * 100, { decimals: 2 })})`}
        value={formatPrice(fee, { decimals: 2 })}
      />

      <View style={styles.divider} />

      <SummaryRow
        label="Est. Liquidation"
        value={formatPrice(liquidationPrice)}
        valueStyle={isHighRisk ? styles.dangerValue : undefined}
        note={`(${formatPercent(liquidationDistance * 100, { decimals: 1 })} away)`}
        noteStyle={isHighRisk ? styles.dangerNote : undefined}
      />

      {isHighRisk && (
        <View style={styles.warning}>
          <Text size={Size.ExtraSmall} style={styles.warningText}>
            High liquidation risk! Consider reducing leverage or position size.
          </Text>
        </View>
      )}
    </View>
  );
}

interface SummaryRowProps {
  label: string;
  value: string;
  valueAppearance?: TextAppearance;
  valueStyle?: object;
  note?: string;
  noteStyle?: object;
}

function SummaryRow({
  label,
  value,
  valueAppearance,
  valueStyle,
  note,
  noteStyle,
}: SummaryRowProps) {
  return (
    <View style={styles.row}>
      <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
        {label}
      </Text>
      <View style={styles.valueContainer}>
        <Text
          size={Size.Small}
          appearance={valueAppearance}
          style={valueStyle}
        >
          {value}
        </Text>
        {note && (
          <Text
            size={Size.ExtraSmall}
            appearance={TextAppearance.Muted}
            style={[styles.note, noteStyle]}
          >
            {note}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.sm,
    backgroundColor: Colors.background.raised,
    borderRadius: radii.sm,
    gap: spacing.xs,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xxs,
  },
  title: {
    fontWeight: "600",
  },
  placeholder: {
    textAlign: "center",
    fontStyle: "italic",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  valueContainer: {
    alignItems: "flex-end",
  },
  note: {
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.subtle,
    marginVertical: spacing.xxs,
  },
  dangerValue: {
    color: Colors.status.danger,
    fontWeight: "600",
  },
  dangerNote: {
    color: Colors.status.danger,
  },
  warning: {
    marginTop: spacing.xs,
    padding: spacing.xs,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderRadius: radii.soft,
    borderLeftWidth: 3,
    borderLeftColor: Colors.status.danger,
  },
  warningText: {
    color: Colors.status.danger,
  },
});
