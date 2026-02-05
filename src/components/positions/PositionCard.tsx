/**
 * @file PositionCard.tsx
 * @description Shared position renderer used across Asset + Portfolio + Trade views.
 *
 * Variants:
 * - compact: lightweight card (mobile-friendly) with logo + key stats
 * - detailed: richer card used on asset detail page with tooltips + grid
 */

import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import {
  Card,
  Text,
  Badge,
  Currency,
  Icon,
  Button,
  Avatar,
} from "@wraith/ghost/components";
import { Size, TextAppearance, Appearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { spacing, radii } from "../../styles/tokens";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import type { Position } from "../../services/haunt";
import { getAssetImage } from "../market/top-movers/utils/assetImages";
import {
  HintIndicator,
  TooltipContainer,
  TooltipSection,
  TooltipText,
  TooltipHighlight,
  TooltipMetric,
  TooltipDivider,
} from "../ui/hint-indicator";

export type PositionCardVariant = "compact" | "detailed" | "row";

export type PositionCardProps = {
  position: Position;
  variant?: PositionCardVariant;
  onPress?: () => void;
  onClose?: () => void;
  onEdit?: () => void;
  isUpdated?: boolean;
};

function formatLeverage(leverage: number): string {
  return `${leverage.toFixed(0)}x`;
}

function formatQuantity(quantity: number): string {
  if (quantity >= 1000) {
    return quantity.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }
  if (quantity >= 1) {
    return quantity.toLocaleString("en-US", { maximumFractionDigits: 4 });
  }
  return quantity.toLocaleString("en-US", { maximumFractionDigits: 6 });
}

function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function PositionCard({
  position,
  variant = "compact",
  onPress,
  onClose,
  onEdit,
  isUpdated = false,
}: PositionCardProps) {
  if (variant === "detailed") {
    return (
      <DetailedPositionCard
        position={position}
        onPress={onPress}
        onClose={onClose}
        onEdit={onEdit}
        isUpdated={isUpdated}
      />
    );
  }

  if (variant === "row") {
    return (
      <RowPositionCard
        position={position}
        onPress={onPress}
        onClose={onClose}
        onEdit={onEdit}
        isUpdated={isUpdated}
      />
    );
  }

  return (
    <CompactPositionCard
      position={position}
      onPress={onPress}
      onClose={onClose}
      onEdit={onEdit}
      isUpdated={isUpdated}
    />
  );
}

function CompactPositionCard({
  position,
  onPress,
  onClose,
  onEdit,
  isUpdated,
}: Required<Pick<PositionCardProps, "position" | "isUpdated">> &
  Pick<PositionCardProps, "onPress" | "onClose" | "onEdit">) {
  const themeColors = useThemeColors();
  const sideColor = position.side === "long" ? Colors.status.success : Colors.status.danger;
  const pnlColor = position.unrealizedPnl >= 0 ? Colors.status.success : Colors.status.danger;

  const assetImage = getAssetImage(position.symbol);

  const markPrice = position.markPrice ?? position.currentPrice;
  const size = position.size ?? position.quantity;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.compactWrapper,
        pressed && onPress ? styles.pressed : undefined,
      ]}
      disabled={!onPress}
    >
      <Card loading={false} fullBleed>
        <View style={[styles.compactContainer, isUpdated && styles.updatedBorder]}
        >
          <View style={styles.compactHeader}>
            <View style={styles.compactHeaderLeft}>
              <Avatar uri={assetImage} initials={position.symbol.slice(0, 2)} size={Size.Small} />
              <View style={{ gap: 2 }}>
                <Text size={Size.Medium} weight="semibold">
                  {position.symbol}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                  <View style={[styles.sideBadge, { backgroundColor: sideColor }]}>
                    <Text size={Size.ExtraSmall} style={styles.sideBadgeText}>
                      {position.side.toUpperCase()}
                    </Text>
                  </View>
                  <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                    {formatLeverage(position.leverage)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.compactHeaderRight}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text size={Size.Medium} style={{ color: pnlColor, fontWeight: "700" }}>
                  {position.unrealizedPnl >= 0 ? "+" : "-"}
                </Text>
                <Currency value={Math.abs(position.unrealizedPnl)} decimals={2} size={Size.Medium} style={{ color: pnlColor }} />
              </View>
              <Text size={Size.Small} style={{ color: pnlColor }}>
                ({formatPercent(position.unrealizedPnlPercent ?? position.unrealizedPnlPct ?? 0)})
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: themeColors.border.subtle }]} />

          <View style={styles.compactDetails}>
            <View style={styles.detailRow}>
              <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                Size
              </Text>
              <Text size={Size.Small}>{typeof size === "number" ? formatQuantity(size) : "—"}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                Entry
              </Text>
              <Currency value={position.entryPrice} decimals={2} size={Size.Small} />
            </View>
            <View style={styles.detailRow}>
              <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                Mark
              </Text>
              <Currency value={markPrice ?? 0} decimals={2} size={Size.Small} />
            </View>
            <View style={styles.detailRow}>
              <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                Liq.
              </Text>
              <Currency value={position.liquidationPrice ?? 0} decimals={2} size={Size.Small} />
            </View>
          </View>

          {(onClose || onEdit) && (
            <View style={styles.actionsRow}>
              {onClose && (
                <Button
                  label="Close"
                  iconLeft="close"
                  size={Size.ExtraSmall}
                  appearance={Appearance.Danger}
                  onPress={onClose}
                />
              )}
              {onEdit && (
                <Button
                  label="Edit"
                  iconLeft="edit-2"
                  size={Size.ExtraSmall}
                  appearance={Appearance.Secondary}
                  onPress={onEdit}
                />
              )}
            </View>
          )}
        </View>
      </Card>
    </Pressable>
  );
}

/**
 * Ultra-compact row variant for dense position lists.
 * Shows: Symbol | Side | Size | Entry | Mark | P&L | Actions
 */
function RowPositionCard({
  position,
  onPress,
  onClose,
  onEdit,
  isUpdated,
}: Required<Pick<PositionCardProps, "position" | "isUpdated">> &
  Pick<PositionCardProps, "onPress" | "onClose" | "onEdit">) {
  const themeColors = useThemeColors();
  const sideColor = position.side === "long" ? Colors.status.success : Colors.status.danger;
  const pnlColor = position.unrealizedPnl >= 0 ? Colors.status.success : Colors.status.danger;

  const assetImage = getAssetImage(position.symbol);
  const markPrice = position.markPrice ?? position.currentPrice ?? 0;
  const size = position.size ?? position.quantity ?? 0;
  const pnlPercent = position.unrealizedPnlPercent ?? position.unrealizedPnlPct ?? 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.rowWrapper,
        pressed && onPress ? styles.pressed : undefined,
        isUpdated && styles.rowUpdated,
      ]}
      disabled={!onPress}
    >
      <View style={[styles.rowContainer, { borderBottomColor: themeColors.border.subtle }]}>
        {/* Left: Symbol & Side */}
        <View style={styles.rowLeft}>
          <Avatar uri={assetImage} initials={position.symbol.slice(0, 2)} size={Size.ExtraSmall} />
          <Text size={Size.Small} weight="semibold" style={styles.rowSymbol}>
            {position.symbol}
          </Text>
          <View style={[styles.rowSideBadge, { backgroundColor: sideColor }]}>
            <Text size={Size.ExtraSmall} style={styles.rowSideText}>
              {position.side === "long" ? "L" : "S"}
            </Text>
          </View>
        </View>

        {/* Middle: Size & Prices */}
        <View style={styles.rowMiddle}>
          <View style={styles.rowMetric}>
            <Text size={Size.Small}>{formatQuantity(size)}</Text>
          </View>
          <View style={styles.rowMetric}>
            <Currency value={position.entryPrice} decimals={2} size={Size.Small} />
          </View>
          <View style={styles.rowMetric}>
            <Currency value={markPrice} decimals={2} size={Size.Small} />
          </View>
        </View>

        {/* Right: P&L & Actions */}
        <View style={styles.rowRight}>
          <View style={styles.rowPnl}>
            <Currency
              value={position.unrealizedPnl}
              decimals={2}
              size={Size.Small}
              colored
              style={{ fontWeight: "600" }}
            />
            <Text size={Size.TwoXSmall} style={{ color: pnlColor }}>
              {formatPercent(pnlPercent)}
            </Text>
          </View>
          {(onClose || onEdit) && (
            <View style={styles.rowActions}>
              {onClose && (
                <Pressable onPress={onClose} style={styles.rowActionBtn}>
                  <Icon name="close" size={Size.ExtraSmall} color={Colors.status.danger} />
                </Pressable>
              )}
              {onEdit && (
                <Pressable onPress={onEdit} style={styles.rowActionBtn}>
                  <Icon name="edit-2" size={Size.ExtraSmall} color={Colors.text.muted} />
                </Pressable>
              )}
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

function DetailedPositionCard({
  position,
  onPress,
  onClose,
  onEdit,
  isUpdated,
}: Required<Pick<PositionCardProps, "position" | "isUpdated">> &
  Pick<PositionCardProps, "onPress" | "onClose" | "onEdit">) {
  const { isMobile } = useBreakpoint();
  const themeColors = useThemeColors();

  const markPrice = position.currentPrice ?? position.markPrice ?? 0;
  const quantity = position.quantity ?? position.size ?? 0;

  const isNearLiquidation =
    position.liquidationPrice &&
    markPrice > 0 &&
    Math.abs(markPrice - position.liquidationPrice) / markPrice < 0.1;

  const positionValue = Math.abs(quantity) * markPrice;
  const marginUsed = position.marginUsed ?? position.margin ?? 0;
  const roe =
    position.roe ??
    (marginUsed > 0 ? (position.unrealizedPnl / marginUsed) * 100 : undefined);

  const assetImage = getAssetImage(position.symbol);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.detailedWrapper,
        pressed && onPress ? styles.pressed : undefined,
      ]}
      disabled={!onPress}
    >
      <Card loading={false} fullBleed={isMobile}>
        <View style={[styles.detailedContent, isUpdated && styles.updatedBorder]}
        >
          {/* Header */}
          <View style={styles.detailedHeader}>
            <View style={styles.detailedHeaderLeft}>
              <Avatar uri={assetImage} initials={position.symbol.slice(0, 2)} size={Size.Medium} />
              <View style={{ gap: 4 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                  <Text size={Size.Medium} weight="semibold">
                    {position.symbol}
                  </Text>
                  <Badge
                    label={position.side.toUpperCase()}
                    variant={position.side === "long" ? "success" : "danger"}
                    size={Size.Small}
                  />
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                  <Text size={Size.Small} appearance={TextAppearance.Muted}>
                    {formatLeverage(position.leverage)}
                  </Text>
                  <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                    • {position.marginMode === "isolated" ? "Isolated" : "Cross"}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.detailedHeaderRight}>
              {isNearLiquidation && (
                <View style={styles.warningBadge}>
                  <Icon name="warning" size={Size.ExtraSmall} color={Colors.status.danger} />
                  <Text size={Size.ExtraSmall} style={{ color: Colors.status.danger }}>
                    Near Liq.
                  </Text>
                </View>
              )}
              {(onClose || onEdit) && (
                <View style={styles.headerActions}>
                  {onEdit && (
                    <Button
                      label="Edit"
                      iconLeft="edit-2"
                      size={Size.ExtraSmall}
                      appearance={Appearance.Secondary}
                      onPress={onEdit}
                    />
                  )}
                  {onClose && (
                    <Button
                      label="Close"
                      iconLeft="close"
                      size={Size.ExtraSmall}
                      appearance={Appearance.Danger}
                      onPress={onClose}
                    />
                  )}
                </View>
              )}
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: themeColors.border.subtle }]} />

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                Quantity
              </Text>
              <Text size={Size.Medium} weight="semibold">
                {formatQuantity(Math.abs(quantity))}
              </Text>
            </View>

            <View style={styles.statBox}>
              <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                Entry Price
              </Text>
              <Currency value={position.entryPrice} size={Size.Medium} weight="semibold" decimals={2} />
            </View>

            <View style={styles.statBox}>
              <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                Mark Price
              </Text>
              <Currency value={markPrice} size={Size.Medium} weight="semibold" decimals={2} />
            </View>

            <View style={styles.statBox}>
              <View style={styles.statLabelRow}>
                <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                  Position Value
                </Text>
                <HintIndicator
                  id={`position-value-${position.id}`}
                  title="Position Value"
                  icon="i"
                  color={Colors.accent.primary}
                  priority={200}
                  width={420}
                  inline
                >
                  <TooltipContainer>
                    <TooltipText>
                      Position value (also called notional) helps you understand the scale of the position, independent of leverage.
                    </TooltipText>
                    <TooltipSection title="Formula">
                      <TooltipHighlight icon="bar-chart-2" color={Colors.data.blue}>
                        Position Value = |Quantity| × Mark Price
                      </TooltipHighlight>
                      <TooltipText>
                        This is not the same as margin used. With leverage, margin is typically smaller than notional.
                      </TooltipText>
                    </TooltipSection>
                    <TooltipDivider />
                    <TooltipSection title="This Position">
                      <TooltipMetric label="Quantity" value={formatQuantity(Math.abs(quantity))} />
                      <TooltipMetric
                        label="Mark Price"
                        value={`$${markPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                      />
                      <TooltipMetric
                        label="Position Value"
                        value={`$${positionValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                      />
                    </TooltipSection>
                  </TooltipContainer>
                </HintIndicator>
              </View>
              <Currency value={positionValue} size={Size.Medium} weight="semibold" decimals={2} />
            </View>

            <View style={styles.statBox}>
              <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                Margin Used
              </Text>
              <Currency value={marginUsed} size={Size.Medium} weight="semibold" decimals={2} />
            </View>

            <View style={styles.statBox}>
              <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                Liq. Price
              </Text>
              {position.liquidationPrice ? (
                <Currency
                  value={position.liquidationPrice}
                  size={Size.Medium}
                  weight="semibold"
                  decimals={2}
                  style={isNearLiquidation ? { color: Colors.status.danger } : undefined}
                />
              ) : (
                <Text size={Size.Medium} appearance={TextAppearance.Muted}>
                  —
                </Text>
              )}
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: themeColors.border.subtle }]} />

          {/* P&L */}
          <View style={styles.pnlSection}>
            <View style={styles.statLabelRow}>
              <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                Unrealized P&L
              </Text>
              <HintIndicator
                id={`position-pnl-${position.id}`}
                title="Unrealized P&L"
                icon="i"
                color={Colors.accent.primary}
                priority={210}
                width={460}
                inline
              >
                <TooltipContainer>
                  <TooltipText>
                    Unrealized P&L is your profit/loss if you closed the position at the current mark price.
                  </TooltipText>
                  <TooltipSection title="Key Concepts">
                    <TooltipText>- Entry price is where the position was opened.</TooltipText>
                    <TooltipText>- Mark price is the current reference price used for P&L and liquidation checks.</TooltipText>
                    <TooltipText>- ROE is P&L relative to margin used.</TooltipText>
                  </TooltipSection>
                  <TooltipDivider />
                  <TooltipSection title="This Position">
                    <TooltipMetric
                      label="Unrealized P&L"
                      value={`${position.unrealizedPnl >= 0 ? "+" : "-"}$${Math.abs(position.unrealizedPnl).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                    />
                    <TooltipMetric
                      label="Unrealized P&L %"
                      value={`${(position.unrealizedPnlPct ?? 0) >= 0 ? "+" : ""}${(position.unrealizedPnlPct ?? 0).toFixed(2)}%`}
                    />
                    <TooltipMetric
                      label="Margin Used"
                      value={`$${marginUsed.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                    />
                    {typeof roe === "number" ? (
                      <TooltipMetric
                        label="ROE"
                        value={`${roe >= 0 ? "+" : ""}${roe.toFixed(2)}%`}
                        valueColor={roe >= 0 ? Colors.status.success : Colors.status.danger}
                      />
                    ) : null}
                  </TooltipSection>
                </TooltipContainer>
              </HintIndicator>
            </View>

            <View style={styles.pnlValue}>
              <Currency value={position.unrealizedPnl} size={Size.Large} weight="bold" colored />
              <Text
                size={Size.Medium}
                weight="medium"
                style={{
                  color: position.unrealizedPnl >= 0 ? Colors.status.success : Colors.status.danger,
                }}
              >
                {formatPercent(position.unrealizedPnlPct ?? 0)}
              </Text>
            </View>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.85 },

  compactWrapper: { width: "100%" },
  compactContainer: { gap: spacing.sm },
  compactHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  compactHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  compactHeaderRight: {
    alignItems: "flex-end",
    gap: 2,
  },

  sideBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  sideBadgeText: {
    color: Colors.text.primary,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  divider: {
    height: 1,
    width: "100%",
    opacity: 0.8,
  },

  compactDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  detailRow: {
    width: "47%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },

  detailedWrapper: { width: "100%" },
  detailedContent: { gap: spacing.md },

  detailedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  detailedHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  detailedHeaderRight: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },

  warningBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: Colors.status.danger,
  },

  statLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  statBox: {
    width: "47%",
    gap: 4,
  },

  pnlSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pnlValue: {
    alignItems: "flex-end",
    gap: 2,
  },

  updatedBorder: {
    borderWidth: 1,
    borderColor: Colors.accent.primary,
    borderRadius: radii.md,
    padding: spacing.xs,
  },

  // Row variant styles
  rowWrapper: {
    width: "100%",
  },
  rowContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  rowUpdated: {
    backgroundColor: Colors.accent.secondary,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    width: 90,
  },
  rowSymbol: {
    minWidth: 40,
  },
  rowSideBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  rowSideText: {
    color: Colors.text.primary,
    fontWeight: "700",
    fontSize: 10,
  },
  rowMiddle: {
    flex: 1,
    flexDirection: "row",
    gap: spacing.lg,
  },
  rowMetric: {
    width: 60,
    gap: 2,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: spacing.sm,
    width: 100,
  },
  rowPnl: {
    alignItems: "flex-end",
  },
  rowActions: {
    flexDirection: "row",
    gap: spacing.xxs,
  },
  rowActionBtn: {
    padding: spacing.xs,
    borderRadius: radii.sm,
    backgroundColor: Colors.surface.primary,
  },
});
