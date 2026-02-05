/**
 * @file AssetPositions.tsx
 * @description Displays open positions for a specific asset on the asset detail page.
 *
 * ## Features:
 * - Shows all open positions (long/short) for the current asset
 * - Card-based layout matching existing component styles
 * - Entry price, mark price, and liquidation price
 * - Unrealized P&L in both dollars and percentage
 * - Real-time updates via WebSocket
 * - Click to navigate to portfolio page
 *
 * ## Layout:
 * - Individual cards for each position
 * - Full-width layout filling available space
 * - Responsive: detailed on desktop, compact on mobile
 */

import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useNavigate } from "react-router-dom";
import { Card, Text, Badge, Skeleton, Icon } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { useAuth } from "../../../context/AuthContext";
import { usePortfolio } from "../../../hooks/usePortfolio";
import { usePositions } from "../../../hooks/usePositions";
import { useBreakpoint } from "../../../hooks/useBreakpoint";
import { spacing, radii } from "../../../styles/tokens";
import type { Position } from "../../../services/haunt";
import { PositionCard } from "../../positions/PositionCard";
import {
  HintIndicator,
  TooltipContainer,
  TooltipSection,
  TooltipText,
  TooltipHighlight,
  TooltipMetric,
  TooltipDivider,
} from "../../ui/hint-indicator";
import { ClosePositionModal } from "../../trade/modals/ClosePositionModal";
import { ModifyPositionModal } from "../../trade/modals/ModifyPositionModal";

export type AssetPositionsProps = {
  /** Asset symbol to filter positions */
  symbol: string;
  /** Whether parent is loading */
  loading?: boolean;
};

/**
 * Main component showing all positions for an asset
 */
export function AssetPositions({ symbol, loading: parentLoading }: AssetPositionsProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { portfolio } = usePortfolio();
  const { positions, loading, error, closePosition, modifyPosition, updatedPositionIds } = usePositions(portfolio?.id ?? null);
  const { isMobile } = useBreakpoint();
  const [positionToClose, setPositionToClose] = useState<Position | null>(null);
  const [positionToModify, setPositionToModify] = useState<Position | null>(null);
  const [positionClosing, setPositionClosing] = useState(false);
  const [positionModifying, setPositionModifying] = useState(false);

  // Filter positions for this specific asset
  const assetPositions = positions.filter(
    (p) => p.symbol.toLowerCase() === symbol.toLowerCase()
  );

  const showLoading = parentLoading || loading;

  // Don't show if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Don't show if no positions for this asset
  if (!showLoading && assetPositions.length === 0) {
    return null;
  }

  const handlePositionPress = (position: Position) => {
    navigate(`/portfolio?position=${position.id}`);
  };

  const handleConfirmClose = async () => {
    if (!positionToClose) return;
    setPositionClosing(true);
    try {
      await closePosition(positionToClose.id);
      setPositionToClose(null);
    } catch (err) {
      console.error("[AssetPositions] Failed to close position:", err);
    } finally {
      setPositionClosing(false);
    }
  };

  const handleSaveModify = async (changes: { stopLoss?: number | null; takeProfit?: number | null; trailingStop?: number | null }) => {
    if (!positionToModify) return;
    setPositionModifying(true);
    try {
      await modifyPosition(positionToModify.id, changes);
      setPositionToModify(null);
    } catch (err) {
      console.error("[AssetPositions] Failed to modify position:", err);
    } finally {
      setPositionModifying(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={[styles.sectionHeader, isMobile && styles.sectionHeaderMobile]}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeftRow}>
            <Text size={Size.Small} weight="semibold">
              Your Positions
            </Text>
            <HintIndicator
              id="asset-positions-overview"
              title="Your Positions"
              icon="i"
              color={Colors.accent.primary}
              priority={36}
              width={520}
              inline
            >
              <TooltipContainer>
                <TooltipText>
                  This section summarizes your open position(s) for the current asset. It’s designed to answer: “how big is my position, what’s my P&L, and how close am I to liquidation?”
                </TooltipText>
                <TooltipSection title="Field Meanings">
                  <TooltipMetric label="Quantity" value="Position size in base units (e.g. BTC)." />
                  <TooltipMetric label="Entry" value="Average price where the position was opened." />
                  <TooltipMetric label="Mark" value="Reference price used for P&L + liquidation checks." />
                  <TooltipMetric label="Position Value" value="Notional size: |Quantity| × Mark Price." />
                  <TooltipMetric label="Margin Used" value="Collateral allocated to maintain the position." />
                </TooltipSection>
                <TooltipDivider />
                <TooltipSection title="How To Read P&L">
                  <TooltipHighlight icon="trending-up" color={Colors.data.emerald}>
                    Unrealized P&L updates with mark price (not realized until you close).
                  </TooltipHighlight>
                  <TooltipText>
                    If the Position Value is large but Margin Used is small, leverage is doing most of the work.
                  </TooltipText>
                </TooltipSection>
              </TooltipContainer>
            </HintIndicator>
          </View>

          <View style={styles.headerActions}>
            {!showLoading && assetPositions.length > 0 && (
              <Badge
                label={assetPositions.length.toString()}
                variant="info"
                size={Size.ExtraSmall}
              />
            )}
          </View>
        </View>
      </View>

      {/* Loading State */}
      {showLoading && (
        <View style={styles.positionsContainer}>
          <Skeleton width="100%" height={180} borderRadius={radii.md} />
        </View>
      )}

      {/* Error State */}
      {error && !showLoading && (
        <Card loading={false} fullBleed={isMobile}>
          <View style={styles.errorState}>
            <Icon name="error" size={Size.Medium} color={Colors.status.danger} />
            <Text appearance={TextAppearance.Muted} size={Size.Small}>
              {error}
            </Text>
          </View>
        </Card>
      )}

      {/* Position Cards */}
      {!error && !showLoading && assetPositions.length > 0 && (
        <View style={styles.positionsContainer}>
          {assetPositions.map((position) => (
            <PositionCard
              key={position.id}
              position={position}
              variant="detailed"
              isUpdated={updatedPositionIds.has(position.id)}
              onPress={() => handlePositionPress(position)}
              onClose={() => setPositionToClose(position)}
              onEdit={() => setPositionToModify(position)}
            />
          ))}
        </View>
      )}

      <ClosePositionModal
        visible={!!positionToClose}
        position={positionToClose}
        onConfirm={handleConfirmClose}
        onCancel={() => setPositionToClose(null)}
        loading={positionClosing}
      />

      <ModifyPositionModal
        visible={!!positionToModify}
        position={positionToModify}
        onSave={handleSaveModify}
        onCancel={() => setPositionToModify(null)}
        loading={positionModifying}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  sectionHeader: {
    paddingHorizontal: spacing.lg,
  },
  sectionHeaderMobile: {
    paddingHorizontal: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeftRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  positionsContainer: {
    gap: spacing.md,
  },
  positionCardWrapper: {
    flex: 1,
  },
  positionContent: {
    padding: spacing.lg,
  },
  positionContentMobile: {
    padding: spacing.md,
  },
  positionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  statLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  warningBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  divider: {
    height: 1,
    marginVertical: spacing.md,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg,
  },
  statBox: {
    flex: 1,
    minWidth: 140,
    gap: spacing.xs,
  },
  pnlSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pnlLabel: {
    flex: 1,
  },
  pnlValue: {
    alignItems: "flex-end",
    gap: 4,
  },
  errorState: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
});