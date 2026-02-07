/**
 * @file TapStatsCard.tsx
 * @description Floating top-left stats overlay for Tap Trading.
 *
 * Shows session PnL, win/loss record, current trade size, and active trades.
 * Includes an "i" HintIndicator that opens a detailed tooltip explaining
 * how Tap Trading works, the mathematics behind multiplier pricing, and
 * how to read the grid.
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Icon, Currency, Card, CardBorder, CardVariant } from "@wraith/ghost/components";
import { Size, TextAppearance, Shape } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { spacing } from "../../styles/tokens";
import {
  HintIndicator,
  TooltipContainer,
  TooltipSection,
  TooltipText,
  TooltipHighlight,
  TooltipMetric,
  TooltipListItem,
  TooltipDivider,
} from "../ui/hint-indicator";
import type { TapStats } from "../../types/tap-trading";

type TapStatsCardProps = {
  stats: TapStats | null;
  betSize: number;
  leverage: number;
  activeCount: number;
  maxTrades: number;
  balance: number;
};

export function TapStatsCard({
  stats,
  betSize,
  leverage,
  activeCount,
  maxTrades,
  balance,
}: TapStatsCardProps) {
  const pnl = stats?.net_pnl ?? 0;
  const wins = stats?.wins ?? 0;
  const losses = stats?.losses ?? 0;
  const totalTrades = stats?.total_trades ?? 0;
  const winRate = stats?.win_rate ?? 0;
  const wagered = stats?.total_wagered ?? 0;
  const payouts = stats?.total_payouts ?? 0;
  const pnlColor = pnl >= 0 ? Colors.status.success : Colors.status.danger;

  return (
    <Card
      variant={CardVariant.Surface}
      border={CardBorder.Solid}
      shape={Shape.Rounded}
      padding={spacing.xs}
      style={styles.card}
    >
      {/* Header row: PnL + info hint */}
      <View style={styles.headerRow}>
        <View style={styles.pnlRow}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
            PnL
          </Text>
          <Text size={Size.Medium} weight="bold" style={{ color: pnlColor }}>
            {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}
          </Text>
        </View>
        <HintIndicator
          id="tap-trading-info"
          title="How Tap Trading Works"
          icon="i"
          color={Colors.accent.primary}
          priority={10}
          width={480}
          inline
        >
          <TooltipContainer>
            <TooltipText>
              Tap Trading is a real-time prediction game on a 2D price-time
              grid. Each cell represents a price range and time window. Tap a
              cell to bet that the asset price will touch that range during its
              time window.
            </TooltipText>

            <TooltipSection title="How Multipliers Work">
              <TooltipText>
                Each cell displays a multiplier (e.g. 3.5x) derived from
                one-touch barrier option pricing using the reflection
                principle. Multipliers are computed by the server every second
                based on real-time volatility, distance from current price,
                and time remaining.
              </TooltipText>
              <TooltipListItem icon="trending-up" color={Colors.status.success}>
                Higher multipliers = less likely to hit (further from price or
                less time remaining)
              </TooltipListItem>
              <TooltipListItem icon="trending-down" color={Colors.status.warning}>
                Lower multipliers = more likely to hit (closer to price or
                more time remaining)
              </TooltipListItem>
            </TooltipSection>

            <TooltipDivider />

            <TooltipSection title="The Mathematics">
              <TooltipText>
                The multiplier for each cell is calculated as:
              </TooltipText>
              <TooltipHighlight icon="calculator" color={Colors.data.violet}>
                M = (1 / P_touch) x (1 - house_edge)
              </TooltipHighlight>
              <TooltipText>
                Where P_touch is the probability of price touching the cell's
                range during its time window, estimated using geometric
                Brownian motion with current implied volatility. A 5% house
                edge is applied.
              </TooltipText>
              <TooltipListItem icon="activity" color={Colors.data.blue}>
                Volatility is measured from real-time price feed variance
                over a rolling window
              </TooltipListItem>
              <TooltipListItem icon="clock" color={Colors.data.emerald}>
                Time decay: as a column nears expiry, P_touch decreases,
                pushing multipliers higher
              </TooltipListItem>
              <TooltipListItem icon="git-branch" color={Colors.data.amber}>
                Distance decay: cells further from current price have lower
                P_touch and higher multipliers
              </TooltipListItem>
            </TooltipSection>

            <TooltipDivider />

            <TooltipSection title="Reading the Grid">
              <TooltipListItem icon="grid" color={Colors.text.secondary}>
                Rows = price levels, Columns = time windows
              </TooltipListItem>
              <TooltipListItem icon="move" color={Colors.accent.primary}>
                The purple sparkline shows live price history; the dot is the
                current price
              </TooltipListItem>
              <TooltipListItem icon="lock" color={Colors.text.muted}>
                Dim columns near the dot are locked — too close to guarantee
                easy wins
              </TooltipListItem>
              <TooltipListItem icon="zap" color={Colors.status.success}>
                Green tiles = your active bets. If price enters that cell
                during its window, you win bet x multiplier
              </TooltipListItem>
            </TooltipSection>

            <TooltipDivider />

            <TooltipSection title="Leverage">
              <TooltipText>
                Leverage amplifies both your payout and risk. At 5x leverage,
                a $10 bet with a 3.0x multiplier pays $150 on win but risks
                the full $10 on loss. Leverage does not change the
                multiplier — it scales the bet amount internally.
              </TooltipText>
            </TooltipSection>

            <TooltipDivider />

            <TooltipSection title="Session Stats">
              <TooltipMetric
                label="Win Rate"
                value={totalTrades > 0 ? `${(winRate * 100).toFixed(1)}%` : "—"}
                valueColor={winRate >= 0.5 ? Colors.status.success : Colors.status.danger}
              />
              <TooltipMetric
                label="Total Wagered"
                value={`$${wagered.toFixed(2)}`}
              />
              <TooltipMetric
                label="Total Payouts"
                value={`$${payouts.toFixed(2)}`}
                valueColor={Colors.status.success}
              />
              <TooltipMetric
                label="Net PnL"
                value={`${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}`}
                valueColor={pnlColor}
              />
            </TooltipSection>
          </TooltipContainer>
        </HintIndicator>
      </View>

      {/* Stats rows */}
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
            W / L
          </Text>
          <View style={styles.winLossRow}>
            <Text size={Size.ExtraSmall} weight="semibold" style={{ color: Colors.status.success }}>
              {wins}
            </Text>
            <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>/</Text>
            <Text size={Size.ExtraSmall} weight="semibold" style={{ color: Colors.status.danger }}>
              {losses}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.statItem}>
          <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
            Bet
          </Text>
          <Text size={Size.ExtraSmall} weight="semibold">
            ${betSize}{leverage > 1 ? ` x${leverage}` : ""}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statItem}>
          <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
            Bal
          </Text>
          <Currency
            value={balance}
            size={Size.ExtraSmall}
            weight="semibold"
            decimals={2}
          />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    // @ts-ignore - web-only property
    pointerEvents: "auto",
    minWidth: 170,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xs,
  },
  pnlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
  },
  statsGrid: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: 4,
  },
  statItem: {
    alignItems: "center",
    gap: 1,
  },
  winLossRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.border.subtle,
  },
});
