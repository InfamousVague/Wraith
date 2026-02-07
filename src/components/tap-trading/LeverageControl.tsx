/**
 * @file LeverageControl.tsx
 * @description Main toolbar for Tap Trading page.
 *
 * Contains:
 * - Labeled leverage segmented control
 * - Labeled bet size segmented control
 * - Win/Loss record with PnL
 * - Balance display
 * - Info tooltips (HintIndicator) on labeled sections
 */

import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { SegmentedControl, Text, Divider, Icon, Currency, type SegmentOption } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
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

type LeverageControlProps = {
  value: number;
  presets: number[];
  onChange: (leverage: number) => void;
  betSize: number;
  betSizePresets: number[];
  onBetSizeChange: (size: number) => void;
  stats: TapStats | null;
  balance: number;
  symbol: string;
};

export function LeverageControl({
  value,
  presets,
  onChange,
  betSize,
  betSizePresets,
  onBetSizeChange,
  stats,
  balance,
  symbol,
}: LeverageControlProps) {
  const themeColors = useThemeColors();

  const leverageOptions: SegmentOption<string>[] = useMemo(
    () => presets.map((p) => ({ value: String(p), label: `${p}x` })),
    [presets]
  );

  const betSizeOptions: SegmentOption<string>[] = useMemo(
    () => betSizePresets.map((s) => ({ value: String(s), label: `$${s}` })),
    [betSizePresets]
  );

  const pnl = stats?.net_pnl ?? 0;
  const wins = stats?.wins ?? 0;
  const losses = stats?.losses ?? 0;
  const totalTrades = stats?.total_trades ?? 0;
  const winRate = stats?.win_rate ?? 0;
  const wagered = stats?.total_wagered ?? 0;
  const payouts = stats?.total_payouts ?? 0;
  const pnlColor = pnl >= 0 ? Colors.status.success : Colors.status.danger;

  return (
    <View style={[styles.toolbar, { borderBottomColor: themeColors.border.subtle }]}>
      {/* Left side: Leverage + Size controls */}
      <View style={styles.controlsGroup}>
        {/* Leverage section */}
        <View style={styles.labeledControl}>
          <View style={styles.labelRow}>
            <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
              Leverage
            </Text>
            <HintIndicator
              id="leverage-info"
              title="Leverage"
              icon="i"
              color={Colors.accent.primary}
              priority={10}
              width={360}
              inline
            >
              <TooltipContainer>
                <TooltipText>
                  Leverage amplifies both your payout and risk. At 5x leverage,
                  a $10 bet with a 3.0x multiplier pays $150 on win but risks
                  the full $10 on loss.
                </TooltipText>
                <TooltipHighlight icon="trending-up" color={Colors.data.violet}>
                  Payout = Bet x Multiplier x Leverage
                </TooltipHighlight>
                <TooltipText>
                  Leverage does not change the multiplier — it scales the
                  effective bet amount internally. Higher leverage means higher
                  potential returns but the same fixed risk (your bet amount).
                </TooltipText>
              </TooltipContainer>
            </HintIndicator>
          </View>
          <SegmentedControl
            options={leverageOptions}
            value={String(value)}
            onChange={(v) => onChange(Number(v))}
            size={Size.Small}
          />
        </View>

        <Divider orientation="vertical" style={styles.divider} />

        {/* Bet size section */}
        <View style={styles.labeledControl}>
          <View style={styles.labelRow}>
            <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
              Size
            </Text>
            <HintIndicator
              id="bet-size-info"
              title="Bet Size"
              icon="i"
              color={Colors.accent.primary}
              priority={10}
              width={320}
              inline
            >
              <TooltipContainer>
                <TooltipText>
                  The amount wagered per tap. Select a preset to change your bet
                  size for the next trade.
                </TooltipText>
                <TooltipListItem icon="dollar-sign" color={Colors.status.success}>
                  Your risk per trade is fixed at the bet amount
                </TooltipListItem>
                <TooltipListItem icon="trending-up" color={Colors.data.violet}>
                  Potential payout = Size x Multiplier x Leverage
                </TooltipListItem>
              </TooltipContainer>
            </HintIndicator>
          </View>
          <SegmentedControl
            options={betSizeOptions}
            value={String(betSize)}
            onChange={(v) => onBetSizeChange(Number(v))}
            size={Size.Small}
          />
        </View>
      </View>

      {/* Right side: Stats */}
      <View style={styles.statsGroup}>
        {/* Win / Loss */}
        <View style={styles.statBlock}>
          <View style={styles.labelRow}>
            <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
              W / L
            </Text>
            <HintIndicator
              id="win-loss-info"
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
                    Purple tiles = your active bets. If price enters that cell
                    during its window, you win bet x multiplier
                  </TooltipListItem>
                </TooltipSection>

                <TooltipDivider />

                <TooltipSection title="Session Stats">
                  <TooltipMetric
                    label="Win Rate"
                    value={totalTrades > 0 ? `${(winRate * 100).toFixed(1)}%` : "\u2014"}
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

        <Divider orientation="vertical" style={styles.statDivider} />

        {/* PnL */}
        <View style={styles.statBlock}>
          <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
            PnL
          </Text>
          <Text size={Size.ExtraSmall} weight="semibold" style={{ color: pnlColor }}>
            {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}
          </Text>
        </View>

        <Divider orientation="vertical" style={styles.statDivider} />

        {/* Balance */}
        <View style={styles.statBlock}>
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

        {/* Win streak */}
        {stats && stats.win_streak > 0 && (
          <>
            <Divider orientation="vertical" style={styles.statDivider} />
            <View style={styles.streakBadge}>
              <Icon name="zap" size={Size.TwoXSmall} color={Colors.status.warning} />
              <Text size={Size.ExtraSmall} weight="semibold" style={{ color: Colors.status.warning }}>
                {stats.win_streak}
              </Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  controlsGroup: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  labeledControl: {
    gap: 2,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingLeft: 2,
  },
  divider: {
    height: 32,
  },
  statsGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  statBlock: {
    alignItems: "center",
    gap: 1,
  },
  statDivider: {
    height: 20,
  },
  winLossRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
});
