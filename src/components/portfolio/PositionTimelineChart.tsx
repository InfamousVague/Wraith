/**
 * @file PositionTimelineChart.tsx
 * @description SoundCloud-style waveform timeline showing trading activity density.
 *
 * Time is divided into buckets. Each bucket renders as a slim vertical bar
 * whose height represents the number of transactions in that period.
 * Hovering/clicking a bar reveals the individual events within it.
 */

import React, { useMemo, useState, useRef, useCallback } from "react";
import { View, StyleSheet, Platform, ScrollView } from "react-native";
import { Text, Tag, Badge } from "@wraith/ghost/components";
import { Colors } from "@wraith/ghost/tokens";
import { Size, TextAppearance, Intensity } from "@wraith/ghost/enums";
import { getAssetImage } from "../market/top-movers/utils/assetImages";
import type { Position, Trade } from "../../services/haunt";

interface PositionTimelineChartProps {
  positions: Position[];
  trades?: Trade[];
  height?: number;
  timeRange?: number; // ms, default 7 days
}

type EventType = "position_open" | "trade_buy" | "trade_sell";

interface TimelineEvent {
  id: string;
  type: EventType;
  symbol: string;
  timestamp: number;
  imageUrl: string;
  // Position
  side?: "long" | "short";
  entryPrice?: number;
  quantity?: number;
  leverage?: number;
  unrealizedPnl?: number;
  unrealizedPnlPct?: number;
  // Trade
  tradeSide?: "buy" | "sell";
  price?: number;
  size?: number;
  fee?: number;
  pnl?: number;
}

interface Bucket {
  index: number;
  startTime: number;
  endTime: number;
  events: TimelineEvent[];
  buyCount: number;
  sellCount: number;
}

// ── Layout ──────────────────────────────────────────────
const BAR_WIDTH = 6;
const BAR_GAP = 2;
const BAR_STEP = BAR_WIDTH + BAR_GAP; // 8px per bucket
const MAX_BAR_HEIGHT = 80; // tallest bar in px
const MIN_BAR_HEIGHT = 4; // minimum visible bar
const WAVEFORM_TOP = 18; // space above waveform for date labels
const AXIS_BOTTOM = 20; // space below waveform for time labels

// ── Helpers ─────────────────────────────────────────────
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatAxisDate(timestamp: number, rangeMs: number): string {
  const d = new Date(timestamp);
  if (rangeMs <= 24 * 60 * 60 * 1000) {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  if (rangeMs <= 7 * 24 * 60 * 60 * 1000) {
    return d.toLocaleDateString("en-US", { weekday: "short" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatPrice(price: number): string {
  if (price >= 10000) return `$${(price / 1000).toFixed(1)}K`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  return `$${price.toPrecision(4)}`;
}

export function PositionTimelineChart({
  positions,
  trades = [],
  height = 160,
  timeRange = 7 * 24 * 60 * 60 * 1000,
}: PositionTimelineChartProps) {
  const [hoveredBucket, setHoveredBucket] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Auto-scroll to end on mount / data change
  const handleContentSizeChange = useCallback(() => {
    scrollRef.current?.scrollToEnd({ animated: false });
  }, []);

  // Build events + buckets
  const { buckets, maxCount, totalEvents, rangeStart, effectiveRange } = useMemo(() => {
    const now = Date.now();
    const requestedStart = now - timeRange;

    // Collect all events within the requested range
    const allEvents: TimelineEvent[] = [];

    positions.forEach((p) => {
      if (p.createdAt >= requestedStart) {
        allEvents.push({
          id: `pos-${p.id}`,
          type: "position_open",
          symbol: p.symbol,
          timestamp: p.createdAt,
          imageUrl: getAssetImage(p.symbol),
          side: p.side,
          entryPrice: p.entryPrice,
          quantity: p.quantity ?? p.size,
          leverage: p.leverage,
          unrealizedPnl: p.unrealizedPnl,
          unrealizedPnlPct: p.unrealizedPnlPct ?? p.unrealizedPnlPercent,
        });
      }
    });

    trades.forEach((t) => {
      if (t.executedAt >= requestedStart) {
        allEvents.push({
          id: `trade-${t.id}`,
          type: t.side === "buy" ? "trade_buy" : "trade_sell",
          symbol: t.symbol,
          timestamp: t.executedAt,
          imageUrl: getAssetImage(t.symbol),
          tradeSide: t.side,
          price: t.price,
          size: t.size,
          fee: t.fee,
          pnl: t.pnl,
        });
      }
    });

    allEvents.sort((a, b) => a.timestamp - b.timestamp);

    // Auto-compute effective range from actual data bounds with padding
    // so bars fill the chart instead of being crammed to one side
    let start = requestedStart;
    let actualRange = timeRange;
    if (allEvents.length > 0) {
      const earliestEvent = allEvents[0].timestamp;
      const latestEvent = allEvents[allEvents.length - 1].timestamp;
      const dataSpan = latestEvent - earliestEvent;
      // Pad by 15% on each side so bars don't touch edges
      const padding = Math.max(dataSpan * 0.15, 60000); // at least 1 minute padding
      start = Math.max(requestedStart, earliestEvent - padding);
      actualRange = now - start + padding;
    }

    const bucketCount = 200;
    const bucketDuration = actualRange / bucketCount;

    const bkts: Bucket[] = [];
    for (let i = 0; i < bucketCount; i++) {
      bkts.push({
        index: i,
        startTime: start + i * bucketDuration,
        endTime: start + (i + 1) * bucketDuration,
        events: [],
        buyCount: 0,
        sellCount: 0,
      });
    }

    // Assign events to buckets
    allEvents.forEach((ev) => {
      const idx = Math.min(
        bucketCount - 1,
        Math.max(0, Math.floor((ev.timestamp - start) / bucketDuration))
      );
      bkts[idx].events.push(ev);
      const isBuy = ev.type === "trade_buy" || (ev.type === "position_open" && ev.side === "long");
      if (isBuy) {
        bkts[idx].buyCount++;
      } else {
        bkts[idx].sellCount++;
      }
    });

    const max = Math.max(1, ...bkts.map((b) => b.events.length));

    return { buckets: bkts, maxCount: max, totalEvents: allEvents.length, rangeStart: start, effectiveRange: actualRange };
  }, [positions, trades, timeRange]);

  // Generate axis tick positions using effective (auto-zoomed) range
  const axisTicks = useMemo(() => {
    const tickCount = 7;
    const ticks: { label: string; percent: number }[] = [];
    for (let i = 0; i <= tickCount; i++) {
      const t = rangeStart + (effectiveRange / tickCount) * i;
      ticks.push({
        label: i === tickCount ? "Now" : formatAxisDate(t, effectiveRange),
        percent: (i / tickCount) * 100,
      });
    }
    return ticks;
  }, [rangeStart, effectiveRange]);

  const activeBucketData = hoveredBucket !== null ? buckets[hoveredBucket] : null;

  if (Platform.OS !== "web") {
    return (
      <View style={[styles.placeholder, { height }]}>
        <Text appearance={TextAppearance.Muted} size={Size.Small}>
          Timeline unavailable on this platform
        </Text>
      </View>
    );
  }

  if (totalEvents === 0) {
    return (
      <View style={[styles.placeholder, { height }]}>
        <Text appearance={TextAppearance.Muted} size={Size.Small}>
          No activity in the selected time range
        </Text>
      </View>
    );
  }

  const waveformHeight = MAX_BAR_HEIGHT;
  const totalHeight = WAVEFORM_TOP + waveformHeight + AXIS_BOTTOM;
  const totalWidth = buckets.length * BAR_STEP;

  return (
    <View style={styles.container}>
      {/* Waveform */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator
        style={{ height: totalHeight }}
        contentContainerStyle={{ width: Math.max(totalWidth, 200), minWidth: "100%" }}
        onContentSizeChange={handleContentSizeChange}
      >
        <View style={{ width: Math.max(totalWidth, 200), height: totalHeight }}>
          {/* SVG waveform bars */}
          <svg
            width="100%"
            height={totalHeight}
            viewBox={`0 0 ${totalWidth} ${totalHeight}`}
            preserveAspectRatio="none"
            style={{ position: "absolute", top: 0, left: 0 }}
          >
            {/* Axis line */}
            <line
              x1="0"
              y1={WAVEFORM_TOP + waveformHeight}
              x2={totalWidth}
              y2={WAVEFORM_TOP + waveformHeight}
              stroke="rgba(255, 255, 255, 0.06)"
              strokeWidth="1"
            />

            {/* Axis ticks */}
            {axisTicks.map((tick, i) => {
              const x = (tick.percent / 100) * totalWidth;
              return (
                <g key={`ax-${i}`}>
                  <line
                    x1={x}
                    y1={WAVEFORM_TOP + waveformHeight}
                    x2={x}
                    y2={WAVEFORM_TOP + waveformHeight + 4}
                    stroke="rgba(255, 255, 255, 0.12)"
                    strokeWidth="1"
                  />
                  <text
                    x={x}
                    y={WAVEFORM_TOP + waveformHeight + 15}
                    textAnchor="middle"
                    fontSize="8"
                    fill="rgba(255, 255, 255, 0.3)"
                    fontFamily="Inter, -apple-system, sans-serif"
                  >
                    {tick.label}
                  </text>
                </g>
              );
            })}

            {/* Bars */}
            {buckets.map((bucket) => {
              const count = bucket.events.length;
              if (count === 0) return null;

              const barHeight = Math.max(
                MIN_BAR_HEIGHT,
                (count / maxCount) * MAX_BAR_HEIGHT
              );
              const x = bucket.index * BAR_STEP;
              const y = WAVEFORM_TOP + waveformHeight - barHeight;

              const isActive = hoveredBucket === bucket.index;

              // Color: mix of green (buys) and red (sells) based on ratio
              // Pure buy = green, pure sell = red, mixed = blend toward dominant
              const buyRatio = bucket.buyCount / count;
              let barColor: string;
              if (buyRatio >= 0.7) {
                barColor = Colors.status.success;
              } else if (buyRatio <= 0.3) {
                barColor = Colors.status.danger;
              } else {
                barColor = Colors.accent.primary; // mixed = purple accent
              }

              const opacity = isActive ? 1 : 0.7;

              return (
                <rect
                  key={`bar-${bucket.index}`}
                  x={x}
                  y={y}
                  width={BAR_WIDTH}
                  height={barHeight}
                  rx={2}
                  fill={barColor}
                  opacity={opacity}
                  className="waveform-bar"
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(e: any) => {
                    setHoveredBucket(bucket.index);
                    const rect = e.currentTarget.getBoundingClientRect();
                    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
                  }}
                  onMouseLeave={() => {
                    setHoveredBucket(null);
                    setTooltipPos(null);
                  }}
                />
              );
            })}
          </svg>
        </View>
      </ScrollView>

      {/* Floating tooltip for hovered bucket */}
      {activeBucketData && activeBucketData.events.length > 0 && tooltipPos && (
        <div
          style={{
            position: "fixed",
            left: tooltipPos.x,
            top: tooltipPos.y - 8,
            transform: "translate(-50%, -100%)",
            backgroundColor: "rgba(20, 20, 24, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: 8,
            padding: "8px 12px",
            pointerEvents: "none",
            zIndex: 1000,
            minWidth: 140,
            maxWidth: 220,
            backdropFilter: "blur(8px)",
          }}
        >
          <div style={{ marginBottom: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
              {formatTime(activeBucketData.startTime)}
            </Text>
          </div>
          <div style={{ display: "flex", gap: 12, marginBottom: 4 }}>
            <div>
              <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>Events</Text>
              <Text size={Size.Small} weight="semibold">{activeBucketData.events.length}</Text>
            </div>
            {activeBucketData.buyCount > 0 && (
              <div>
                <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>Buys</Text>
                <Text size={Size.Small} weight="semibold" style={{ color: Colors.status.success }}>{activeBucketData.buyCount}</Text>
              </div>
            )}
            {activeBucketData.sellCount > 0 && (
              <div>
                <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>Sells</Text>
                <Text size={Size.Small} weight="semibold" style={{ color: Colors.status.danger }}>{activeBucketData.sellCount}</Text>
              </div>
            )}
          </div>
          {/* Show total volume and PnL for bucket */}
          {(() => {
            const bucketPnl = activeBucketData.events.reduce((sum, ev) => sum + (ev.pnl || 0), 0);
            const symbols = [...new Set(activeBucketData.events.map((ev) => ev.symbol))];
            return (
              <>
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 4, marginTop: 2 }}>
                  <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                    {symbols.join(", ")}
                  </Text>
                </div>
                {bucketPnl !== 0 && (
                  <div style={{ marginTop: 2 }}>
                    <Text
                      size={Size.TwoXSmall}
                      weight="semibold"
                      style={{ color: bucketPnl > 0 ? Colors.status.success : Colors.status.danger }}
                    >
                      P&L: {bucketPnl > 0 ? "+" : ""}${bucketPnl.toFixed(2)}
                    </Text>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        <Tag direction="up" label="Buy / Long" size={Size.TwoXSmall} intensity={Intensity.Normal} showIcon={false} />
        <Tag direction="down" label="Sell / Short" size={Size.TwoXSmall} intensity={Intensity.Normal} showIcon={false} />
        <Badge label="Mixed" variant="default" size={Size.TwoXSmall} />
        <View style={styles.legendSeparator} />
        <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
          {totalEvents} event{totalEvents !== 1 ? "s" : ""}
        </Text>
      </View>

      <style>
        {`
          .waveform-bar:hover {
            opacity: 1 !important;
            filter: brightness(1.3);
          }
        `}
      </style>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  placeholder: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 8,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    paddingVertical: 4,
  },
  legendSeparator: {
    width: 1,
    height: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
});
