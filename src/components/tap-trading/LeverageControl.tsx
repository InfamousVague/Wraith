/**
 * @file LeverageControl.tsx
 * @description Main toolbar for Tap Trading page.
 *
 * Contains:
 * - Labeled leverage segmented control
 * - Labeled bet size segmented control (with custom input)
 * - Win/Loss record with PnL
 * - Balance display
 * - Info tooltips (HintIndicator) on labeled sections
 */

import React, { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { View, StyleSheet, Pressable, TextInput } from "react-native";
import { SegmentedControl, Text, Divider, Icon, Currency, type SegmentOption } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { Colors } from "@wraith/ghost/tokens";
import { spacing } from "../../styles/tokens";
import { useBreakpoint } from "../../hooks/useBreakpoint";
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

const CUSTOM_KEY = "__custom__";

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
  const { isMobile, isNarrow } = useBreakpoint();
  const [customMode, setCustomMode] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const leverageOptions: SegmentOption<string>[] = useMemo(
    () => presets.map((p) => ({ value: String(p), label: `${p}x` })),
    [presets]
  );

  // Bet size options: presets + "Custom" pill
  const betSizeOptions: SegmentOption<string>[] = useMemo(
    () => [
      ...betSizePresets.map((s) => ({ value: String(s), label: `$${s}` })),
      { value: CUSTOM_KEY, label: "Custom" },
    ],
    [betSizePresets]
  );

  // Track whether current betSize matches a preset
  const isPreset = betSizePresets.includes(betSize);
  const segmentValue = customMode || !isPreset ? CUSTOM_KEY : String(betSize);

  // Focus the input when custom mode activates
  useEffect(() => {
    if (customMode) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [customMode]);

  const handleSegmentChange = useCallback(
    (v: string) => {
      if (v === CUSTOM_KEY) {
        setCustomMode(true);
        setCustomInput(isPreset ? "" : String(betSize));
        setCustomError(null);
      } else {
        setCustomMode(false);
        setCustomError(null);
        onBetSizeChange(Number(v));
      }
    },
    [onBetSizeChange, betSize, isPreset]
  );

  const validateAndApply = useCallback(
    (raw: string) => {
      const trimmed = raw.replace(/[^0-9.]/g, "");
      const num = parseFloat(trimmed);
      if (!trimmed || isNaN(num) || num <= 0) {
        setCustomError("Enter a valid amount");
        return;
      }
      if (num > balance) {
        setCustomError(`Max $${balance.toFixed(2)}`);
        return;
      }
      setCustomError(null);
      const rounded = Math.round(num * 100) / 100;
      onBetSizeChange(rounded);
    },
    [balance, onBetSizeChange]
  );

  const handleCustomInputChange = useCallback(
    (text: string) => {
      const clean = text.replace(/[^0-9.]/g, "");
      const parts = clean.split(".");
      const sanitized = parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : clean;
      setCustomInput(sanitized);
      setCustomError(null);

      const num = parseFloat(sanitized);
      if (sanitized && !isNaN(num) && num > 0) {
        if (num > balance) {
          setCustomError(`Max $${balance.toFixed(2)}`);
        }
      }
    },
    [balance]
  );

  const handleCustomSubmit = useCallback(() => {
    validateAndApply(customInput);
  }, [customInput, validateAndApply]);

  const handleCustomBlur = useCallback(() => {
    if (customInput) {
      validateAndApply(customInput);
    } else {
      setCustomMode(false);
      onBetSizeChange(betSizePresets[0] ?? 5);
    }
  }, [customInput, validateAndApply, betSizePresets, onBetSizeChange]);

  const pnl = stats?.net_pnl ?? 0;
  const wins = stats?.wins ?? 0;
  const losses = stats?.losses ?? 0;
  const totalTrades = stats?.total_trades ?? 0;
  const winRate = stats?.win_rate ?? 0;
  const wagered = stats?.total_wagered ?? 0;
  const payouts = stats?.total_payouts ?? 0;
  const pnlColor = pnl >= 0 ? Colors.status.success : Colors.status.danger;

  const controlSize = isMobile ? Size.Small : undefined;

  return (
    <View style={[
      styles.toolbar,
      isMobile && styles.toolbarMobile,
      { borderBottomColor: themeColors.border.subtle },
    ]}>
      {/* Left side: Leverage + Size controls */}
      <View style={[styles.controlsGroup, isMobile && styles.controlsGroupMobile]}>
        {/* Leverage section */}
        <View style={styles.labeledControl}>
          <View style={styles.labelRow}>
            <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
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
            size={controlSize}
          />
        </View>

        <Divider orientation="vertical" style={styles.divider} />

        {/* Bet size section */}
        <View style={styles.labeledControl}>
          <View style={styles.labelRow}>
            <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
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
                  The amount wagered per tap. Select a preset or enter a custom
                  amount (up to your available balance).
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
          <View style={styles.betSizeRow}>
            <SegmentedControl
              options={betSizeOptions}
              value={segmentValue}
              onChange={handleSegmentChange}
              size={controlSize}
            />
            {customMode && (
              <View style={styles.customInputWrap}>
                <Icon name="dollar-sign" size={Size.ExtraSmall} color={Colors.text.muted} />
                <TextInput
                  ref={inputRef}
                  value={customInput}
                  onChangeText={handleCustomInputChange}
                  onSubmitEditing={handleCustomSubmit}
                  onBlur={handleCustomBlur}
                  placeholder={`max ${Math.floor(balance)}`}
                  placeholderTextColor={Colors.text.muted}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                  style={[
                    styles.customInput,
                    customError ? styles.customInputError : null,
                  ]}
                  maxLength={10}
                />
                {customError && (
                  <Text size={Size.ExtraSmall} style={{ color: Colors.status.danger }}>
                    {customError}
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Right side: Stats */}
      <View style={[styles.statsGroup, isMobile && styles.statsGroupMobile]}>
        {/* Win / Loss */}
        <View style={styles.statBlock}>
          <View style={styles.labelRow}>
            <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
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
            <Text size={Size.Small} weight="semibold" style={{ color: Colors.status.success }}>
              {wins}
            </Text>
            <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>/</Text>
            <Text size={Size.Small} weight="semibold" style={{ color: Colors.status.danger }}>
              {losses}
            </Text>
          </View>
        </View>

        <Divider orientation="vertical" style={styles.statDivider} />

        {/* PnL */}
        <View style={styles.statBlock}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
            PnL
          </Text>
          <Text size={Size.Small} weight="semibold" style={{ color: pnlColor }}>
            {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}
          </Text>
        </View>

        <Divider orientation="vertical" style={styles.statDivider} />

        {/* Balance */}
        <View style={styles.statBlock}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
            Bal
          </Text>
          <Currency
            value={balance}
            size={Size.Small}
            weight="semibold"
            decimals={2}
          />
        </View>

        {/* Win streak */}
        {stats && stats.win_streak > 0 && (
          <>
            <Divider orientation="vertical" style={styles.statDivider} />
            <View style={styles.streakBadge}>
              <Icon name="zap" size={Size.ExtraSmall} color={Colors.status.warning} />
              <Text size={Size.Small} weight="semibold" style={{ color: Colors.status.warning }}>
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
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  toolbarMobile: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  controlsGroup: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
  },
  controlsGroupMobile: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.xs,
    flex: 1,
  },
  labeledControl: {
    gap: 3,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingLeft: 2,
  },
  divider: {
    height: 40,
  },
  statsGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  statsGroupMobile: {
    justifyContent: "space-around",
    paddingVertical: spacing.xxs,
  },
  statBlock: {
    alignItems: "center",
    gap: 2,
  },
  statDivider: {
    height: 28,
  },
  winLossRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  betSizeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  customInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  customInput: {
    width: 80,
    height: 36,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    borderRadius: 8,
    paddingHorizontal: 8,
    fontSize: 15,
    color: "#FFFFFF",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    // @ts-ignore web-only
    outlineStyle: "none",
    fontFamily: "-apple-system, system-ui, sans-serif",
  },
  customInputError: {
    borderColor: Colors.status.danger,
  },
});
