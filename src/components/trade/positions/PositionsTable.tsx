/**
 * @file PositionsTable.tsx
 * @description Table displaying open positions with P&L and actions.
 *
 * Columns:
 * - Symbol
 * - Side (Long/Short)
 * - Size
 * - Entry Price
 * - Mark Price
 * - Liquidation Price
 * - Unrealized P&L
 * - Actions (Close, Modify)
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button, Skeleton, Currency, Icon } from "@wraith/ghost/components";
import { Size, TextAppearance, Appearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { spacing, radii } from "../../../styles/tokens";
import { useBreakpoint } from "../../../hooks/useBreakpoint";
import type { PositionsTableProps, Position } from "./types";

export function PositionsTable({
  positions,
  loading = false,
  onClosePosition,
  onModifyPosition,
  updatedPositionIds = new Set(),
}: PositionsTableProps) {
  const { isMobile } = useBreakpoint();

  if (loading) {
    return (
      <View style={styles.container}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} height={48} style={{ marginBottom: spacing.xs }} />
        ))}
      </View>
    );
  }

  if (positions.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text appearance={TextAppearance.Muted} size={Size.Small}>
          No open positions
        </Text>
      </View>
    );
  }

  if (isMobile) {
    return (
      <View style={styles.container}>
        {positions.map((position) => (
          <PositionCard
            key={position.id}
            position={position}
            onClose={() => onClosePosition?.(position.id)}
            onModify={() => onModifyPosition?.(position.id)}
            isUpdated={updatedPositionIds.has(position.id)}
          />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.cell}>
          Symbol
        </Text>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.cell}>
          Side
        </Text>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.cell}>
          Size
        </Text>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.cell}>
          Entry
        </Text>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.cell}>
          Mark
        </Text>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.cell}>
          Liq. Price
        </Text>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.cellWide}>
          Unrealized P&L
        </Text>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.cellActions}>
          Actions
        </Text>
      </View>

      {/* Data Rows */}
      {positions.map((position) => (
        <PositionRow
          key={position.id}
          position={position}
          onClose={() => onClosePosition?.(position.id)}
          onModify={() => onModifyPosition?.(position.id)}
          isUpdated={updatedPositionIds.has(position.id)}
        />
      ))}
    </View>
  );
}

interface PositionRowProps {
  position: Position;
  onClose?: () => void;
  onModify?: () => void;
  isUpdated?: boolean;
}

function PositionRow({ position, onClose, onModify, isUpdated = false }: PositionRowProps) {
  const sideColor = position.side === "long" ? Colors.status.success : Colors.status.danger;
  const pnlColor = position.unrealizedPnl >= 0 ? Colors.status.success : Colors.status.danger;

  // Check if near liquidation (within 10%)
  const priceDistance = Math.abs((position.markPrice - position.liquidationPrice) / position.markPrice);
  const isNearLiquidation = priceDistance < 0.1;

  // Has stop loss or take profit set
  const hasRiskControls = position.stopLoss || position.takeProfit;

  return (
    <View style={[styles.row, isUpdated && styles.rowUpdated]}>
      <Text size={Size.Small} style={[styles.cell, styles.symbolCell]}>
        {position.symbol}
      </Text>
      <View style={[styles.cell, styles.sideCell]}>
        <View style={[styles.sideBadge, { backgroundColor: sideColor }]}>
          <Text size={Size.ExtraSmall} style={styles.sideBadgeText}>
            {position.side.toUpperCase()}
          </Text>
        </View>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
          {position.leverage}x
        </Text>
      </View>
      <Text size={Size.Small} style={styles.cell}>
        {position.size}
      </Text>
      <View style={styles.cell}>
        <Currency value={position.entryPrice} decimals={2} size={Size.Small} />
      </View>
      <View style={styles.cell}>
        <Currency value={position.markPrice} decimals={2} size={Size.Small} />
      </View>
      <View style={[styles.cell, isNearLiquidation && styles.dangerText]}>
        <Currency value={position.liquidationPrice} decimals={2} size={Size.Small} color={isNearLiquidation ? Colors.status.danger : undefined} />
      </View>
      <View style={[styles.cellWide, styles.pnlCell]}>
        <View style={styles.pnlRow}>
          <Text size={Size.Small} style={{ color: pnlColor, fontWeight: "600" }}>
            {position.unrealizedPnl >= 0 ? "+" : ""}<Currency value={Math.abs(position.unrealizedPnl)} decimals={2} size={Size.Small} color={pnlColor} />
          </Text>
          {isUpdated && (
            <View style={[styles.updateDot, { backgroundColor: pnlColor }]} />
          )}
        </View>
        <Text size={Size.ExtraSmall} style={{ color: pnlColor }}>
          ({position.unrealizedPnlPercent >= 0 ? "+" : ""}{position.unrealizedPnlPercent.toFixed(2)}%)
        </Text>
        {hasRiskControls && (
          <View style={styles.riskIndicators}>
            {position.stopLoss && (
              <View style={styles.riskBadge}>
                <Text size={Size.ExtraSmall} style={styles.riskText}>
                  SL: ${position.stopLoss.toFixed(0)}
                </Text>
              </View>
            )}
            {position.takeProfit && (
              <View style={[styles.riskBadge, styles.tpBadge]}>
                <Text size={Size.ExtraSmall} style={styles.riskText}>
                  TP: ${position.takeProfit.toFixed(0)}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
      <View style={[styles.cellActions, styles.actionsCell]}>
        <Button
          label="Close"
          icon="x"
          size={Size.ExtraSmall}
          appearance={Appearance.Danger}
          onPress={onClose}
        />
        <Button
          label="Edit"
          icon="edit-2"
          size={Size.ExtraSmall}
          appearance={Appearance.Secondary}
          onPress={onModify}
        />
      </View>
    </View>
  );
}

// Mobile card layout
function PositionCard({ position, onClose, onModify, isUpdated = false }: PositionRowProps) {
  const sideColor = position.side === "long" ? Colors.status.success : Colors.status.danger;
  const pnlColor = position.unrealizedPnl >= 0 ? Colors.status.success : Colors.status.danger;
  const hasRiskControls = position.stopLoss || position.takeProfit;

  return (
    <View style={[styles.card, isUpdated && styles.cardUpdated]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text size={Size.Medium} style={styles.symbolCell}>
            {position.symbol}
          </Text>
          <View style={[styles.sideBadge, { backgroundColor: sideColor }]}>
            <Text size={Size.ExtraSmall} style={styles.sideBadgeText}>
              {position.side.toUpperCase()} {position.leverage}x
            </Text>
          </View>
        </View>
        <View style={styles.cardHeaderRight}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text size={Size.Medium} style={{ color: pnlColor, fontWeight: "700" }}>
              {position.unrealizedPnl >= 0 ? "+" : "-"}
            </Text>
            <Currency value={Math.abs(position.unrealizedPnl)} decimals={2} size={Size.Medium} color={pnlColor} />
          </View>
          <Text size={Size.Small} style={{ color: pnlColor }}>
            ({position.unrealizedPnlPercent >= 0 ? "+" : ""}{position.unrealizedPnlPercent.toFixed(2)}%)
          </Text>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.cardDetailRow}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>Size</Text>
          <Text size={Size.Small}>{position.size}</Text>
        </View>
        <View style={styles.cardDetailRow}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>Entry</Text>
          <Currency value={position.entryPrice} decimals={2} size={Size.Small} />
        </View>
        <View style={styles.cardDetailRow}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>Mark</Text>
          <Currency value={position.markPrice} decimals={2} size={Size.Small} />
        </View>
        <View style={styles.cardDetailRow}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>Liq.</Text>
          <Currency value={position.liquidationPrice} decimals={2} size={Size.Small} />
        </View>
      </View>

      {/* Risk Controls */}
      {hasRiskControls && (
        <View style={styles.cardRiskControls}>
          {position.stopLoss && (
            <View style={styles.riskBadge}>
              <Text size={Size.ExtraSmall} style={styles.riskText}>
                SL: ${position.stopLoss.toFixed(0)}
              </Text>
            </View>
          )}
          {position.takeProfit && (
            <View style={[styles.riskBadge, styles.tpBadge]}>
              <Text size={Size.ExtraSmall} style={styles.riskText}>
                TP: ${position.takeProfit.toFixed(0)}
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.cardActions}>
        <View style={styles.cardButton}>
          <Button
            label="Edit"
            icon="edit-2"
            size={Size.Small}
            appearance={Appearance.Secondary}
            onPress={onModify}
          />
        </View>
        <View style={styles.cardButton}>
          <Button
            label="Close"
            icon="x"
            size={Size.Small}
            appearance={Appearance.Danger}
            onPress={onClose}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.sm,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  headerRow: {
    flexDirection: "row",
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  row: {
    flexDirection: "row",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
    alignItems: "center",
  },
  rowUpdated: {
    backgroundColor: "rgba(139, 92, 246, 0.08)",
  },
  cell: {
    flex: 1,
    paddingHorizontal: spacing.xxs,
  },
  cellWide: {
    flex: 1.5,
    paddingHorizontal: spacing.xxs,
  },
  cellActions: {
    flex: 1.5,
    paddingHorizontal: spacing.xxs,
  },
  symbolCell: {
    fontWeight: "600",
  },
  sideCell: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
  },
  sideBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radii.soft,
  },
  sideBadgeText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  pnlCell: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
  },
  pnlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  updateDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  riskIndicators: {
    flexDirection: "row",
    gap: spacing.xxs,
    marginTop: 2,
  },
  riskBadge: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    paddingHorizontal: spacing.xxs,
    paddingVertical: 1,
    borderRadius: radii.soft,
  },
  tpBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
  },
  riskText: {
    color: Colors.text.secondary,
    fontSize: 9,
  },
  actionsCell: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  dangerText: {
    color: Colors.status.danger,
  },
  // Mobile card styles
  card: {
    backgroundColor: Colors.background.raised,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardUpdated: {
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)",
    backgroundColor: "rgba(139, 92, 246, 0.05)",
  },
  cardRiskControls: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  cardHeaderRight: {
    alignItems: "flex-end",
  },
  cardDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  cardDetailRow: {
    width: "45%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  cardButton: {
    flex: 1,
  },
});
