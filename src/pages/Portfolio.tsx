/**
 * @file Portfolio.tsx
 * @description Portfolio overview page showing holdings, performance, and P&L.
 *
 * ## Features:
 * - Portfolio value summary with balance, P&L, and margin stats
 * - Holdings breakdown with donut chart visualization
 * - Equity curve showing portfolio value over time
 * - Holdings list with individual asset details
 * - Recent trades history
 * - Performance metrics (24h, 7d, 30d, all-time returns)
 *
 * ## Layout:
 * - Desktop: 2-column grid with charts and tables
 * - Mobile: Single column stacked layout
 */

import React, { useMemo } from "react";
import { View, StyleSheet, ScrollView, Platform } from "react-native";
import { useNavigate } from "react-router-dom";
import { Card, Text, Icon, Skeleton, Currency, PercentChange, Avatar, Button } from "@wraith/ghost/components";
import { Colors } from "@wraith/ghost/tokens";
import { Size, TextAppearance, Appearance } from "@wraith/ghost/enums";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { usePortfolio } from "../hooks/usePortfolio";
import { useHoldings } from "../hooks/useHoldings";
import { usePerformance } from "../hooks/usePerformance";
import { usePositions } from "../hooks/usePositions";
import { useTrades } from "../hooks/useTrades";
import { Navbar, HintIndicator } from "../components/ui";
import { PortfolioSummary, TradeHistoryTable } from "../components/trade";
import { spacing, radii } from "../styles/tokens";
import {
  MOCK_PORTFOLIO,
  MOCK_POSITIONS,
  MOCK_TRADES,
} from "../data/mockPortfolio";
import type { Holding as ApiHolding, Position, Trade } from "../services/haunt";

const themes = {
  dark: {
    background: "#050608",
  },
  light: {
    background: "#f8fafc",
  },
};

// Mock holdings data for portfolio visualization
interface Holding {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  value: number;
  allocation: number;
  pnl: number;
  pnlPercent: number;
  color: string;
}

// Vibrant chart colors
const CHART_COLORS = {
  amber: "#F59E0B",
  blue: "#3B82F6",
  violet: "#8B5CF6",
  red: "#EF4444",
  cyan: "#06B6D4",
  green: "#10B981",
  pink: "#EC4899",
  orange: "#F97316",
};

const MOCK_HOLDINGS: Holding[] = [
  {
    id: "1",
    symbol: "BTC",
    name: "Bitcoin",
    quantity: 1.5,
    avgPrice: 62000,
    currentPrice: 67500,
    value: 101250,
    allocation: 45.2,
    pnl: 8250,
    pnlPercent: 8.87,
    color: CHART_COLORS.amber,
  },
  {
    id: "2",
    symbol: "ETH",
    name: "Ethereum",
    quantity: 15,
    avgPrice: 3200,
    currentPrice: 3450,
    value: 51750,
    allocation: 23.1,
    pnl: 3750,
    pnlPercent: 7.81,
    color: CHART_COLORS.blue,
  },
  {
    id: "3",
    symbol: "SOL",
    name: "Solana",
    quantity: 200,
    avgPrice: 95,
    currentPrice: 125,
    value: 25000,
    allocation: 11.2,
    pnl: 6000,
    pnlPercent: 31.58,
    color: CHART_COLORS.violet,
  },
  {
    id: "4",
    symbol: "AVAX",
    name: "Avalanche",
    quantity: 300,
    avgPrice: 32,
    currentPrice: 38,
    value: 11400,
    allocation: 5.1,
    pnl: 1800,
    pnlPercent: 18.75,
    color: CHART_COLORS.red,
  },
  {
    id: "5",
    symbol: "LINK",
    name: "Chainlink",
    quantity: 500,
    avgPrice: 14,
    currentPrice: 16.5,
    value: 8250,
    allocation: 3.7,
    pnl: 1250,
    pnlPercent: 17.86,
    color: CHART_COLORS.cyan,
  },
  {
    id: "6",
    symbol: "USDC",
    name: "USD Coin",
    quantity: 25000,
    avgPrice: 1,
    currentPrice: 1,
    value: 25000,
    allocation: 11.7,
    pnl: 0,
    pnlPercent: 0,
    color: CHART_COLORS.green,
  },
];

// Mock equity curve data (portfolio value over time)
const generateEquityCurve = () => {
  const now = Date.now();
  const data = [];
  let value = 180000;

  for (let i = 30; i >= 0; i--) {
    const timestamp = now - i * 24 * 60 * 60 * 1000;
    // Simulate some volatility
    value = value * (1 + (Math.random() - 0.48) * 0.03);
    data.push({
      timestamp,
      value: Math.round(value * 100) / 100,
    });
  }

  return data;
};

const EQUITY_CURVE = generateEquityCurve();

// Mock performance metrics for demo mode only
const MOCK_PERFORMANCE_METRICS = {
  day: { change: 2.34, value: 5234.56 },
  week: { change: 8.12, value: 18234.12 },
  month: { change: 15.67, value: 35012.45 },
  allTime: { change: 42.3, value: 67234.89 },
};

// Treemap layout algorithm (squarified)
function calculateTreemap(
  holdings: Holding[],
  width: number,
  height: number
): Array<{ holding: Holding; x: number; y: number; w: number; h: number }> {
  const total = holdings.reduce((sum, h) => sum + h.value, 0);
  const sorted = [...holdings].sort((a, b) => b.value - a.value);

  const result: Array<{ holding: Holding; x: number; y: number; w: number; h: number }> = [];

  let remainingItems = sorted.map(h => ({ ...h, normalizedValue: (h.value / total) * width * height }));
  let currentX = 0;
  let currentY = 0;
  let remainingWidth = width;
  let remainingHeight = height;

  while (remainingItems.length > 0) {
    // Decide split direction based on aspect ratio
    const isHorizontalSplit = remainingWidth >= remainingHeight;
    const mainDimension = isHorizontalSplit ? remainingHeight : remainingWidth;

    // Find optimal row
    let row: typeof remainingItems = [];
    let rowArea = 0;
    let bestAspectRatio = Infinity;

    for (let i = 0; i < remainingItems.length; i++) {
      const testRow = remainingItems.slice(0, i + 1);
      const testArea = testRow.reduce((sum, item) => sum + item.normalizedValue, 0);
      const rowLength = testArea / mainDimension;

      // Calculate worst aspect ratio in this row
      let worstRatio = 0;
      for (const item of testRow) {
        const itemLength = item.normalizedValue / rowLength;
        const ratio = Math.max(rowLength / itemLength, itemLength / rowLength);
        worstRatio = Math.max(worstRatio, ratio);
      }

      if (worstRatio <= bestAspectRatio) {
        bestAspectRatio = worstRatio;
        row = testRow;
        rowArea = testArea;
      } else {
        break;
      }
    }

    // Layout the row
    const rowLength = rowArea / mainDimension;
    let offset = 0;

    for (const item of row) {
      const itemLength = item.normalizedValue / rowLength;

      if (isHorizontalSplit) {
        result.push({
          holding: item as Holding,
          x: currentX,
          y: currentY + offset,
          w: rowLength,
          h: itemLength,
        });
      } else {
        result.push({
          holding: item as Holding,
          x: currentX + offset,
          y: currentY,
          w: itemLength,
          h: rowLength,
        });
      }
      offset += itemLength;
    }

    // Update remaining space
    if (isHorizontalSplit) {
      currentX += rowLength;
      remainingWidth -= rowLength;
    } else {
      currentY += rowLength;
      remainingHeight -= rowLength;
    }

    remainingItems = remainingItems.slice(row.length);
  }

  return result;
}

// Crypto icon mapping (using first letter as fallback)
const CRYPTO_ICONS: Record<string, string> = {
  BTC: "₿",
  ETH: "Ξ",
  SOL: "◎",
  AVAX: "🔺",
  LINK: "⬡",
  USDC: "$",
  USDT: "$",
  BNB: "◆",
  XRP: "✕",
  ADA: "₳",
  DOT: "●",
  MATIC: "⬡",
  DOGE: "Ð",
};

function TreemapChart({ holdings, width = 280, height = 180 }: { holdings: Holding[]; width?: number; height?: number }) {
  const total = holdings.reduce((sum, h) => sum + h.value, 0);
  const gap = 3;
  const blocks = calculateTreemap(holdings, width, height);

  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  return (
    <View style={{ width: "100%", height, position: "relative" }}>
      {Platform.OS === "web" && (
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            {blocks.map(({ holding }) => (
              <linearGradient
                key={`grad-${holding.id}`}
                id={`grad-${holding.id}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor={holding.color} stopOpacity="1" />
                <stop offset="100%" stopColor={holding.color} stopOpacity="0.7" />
              </linearGradient>
            ))}
          </defs>
          {blocks.map(({ holding, x, y, w, h }) => {
            const blockW = Math.max(0, w - gap);
            const blockH = Math.max(0, h - gap);
            const isLarge = blockW > 80 && blockH > 60;
            const isMedium = blockW > 50 && blockH > 40;
            const isSmall = blockW > 30 && blockH > 25;
            const icon = CRYPTO_ICONS[holding.symbol] || holding.symbol.charAt(0);
            const pnlPositive = holding.pnl >= 0;

            return (
              <g key={holding.id} style={{ cursor: "pointer" }}>
                {/* Background with gradient */}
                <rect
                  x={x + gap / 2}
                  y={y + gap / 2}
                  width={blockW}
                  height={blockH}
                  fill={`url(#grad-${holding.id})`}
                  rx={6}
                  style={{ transition: "opacity 0.2s" }}
                />
                {/* Subtle inner glow */}
                <rect
                  x={x + gap / 2 + 1}
                  y={y + gap / 2 + 1}
                  width={Math.max(0, blockW - 2)}
                  height={Math.max(0, blockH - 2)}
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="1"
                  rx={5}
                />

                {isLarge && (
                  <>
                    {/* Icon */}
                    <text
                      x={x + w / 2}
                      y={y + h / 2 - 18}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#FFFFFF"
                      fontSize={20}
                      opacity={0.9}
                    >
                      {icon}
                    </text>
                    {/* Symbol */}
                    <text
                      x={x + w / 2}
                      y={y + h / 2 + 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#FFFFFF"
                      fontSize={13}
                      fontWeight="700"
                    >
                      {holding.symbol}
                    </text>
                    {/* Value */}
                    <text
                      x={x + w / 2}
                      y={y + h / 2 + 18}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="rgba(255,255,255,0.85)"
                      fontSize={10}
                    >
                      {formatValue(holding.value)}
                    </text>
                    {/* P&L indicator */}
                    <text
                      x={x + w / 2}
                      y={y + h / 2 + 32}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={pnlPositive ? "#4ADE80" : "#F87171"}
                      fontSize={9}
                      fontWeight="600"
                    >
                      {pnlPositive ? "▲" : "▼"} {Math.abs(holding.pnlPercent).toFixed(1)}%
                    </text>
                  </>
                )}

                {!isLarge && isMedium && (
                  <>
                    {/* Icon + Symbol combined */}
                    <text
                      x={x + w / 2}
                      y={y + h / 2 - 6}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#FFFFFF"
                      fontSize={14}
                      opacity={0.9}
                    >
                      {icon}
                    </text>
                    <text
                      x={x + w / 2}
                      y={y + h / 2 + 10}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#FFFFFF"
                      fontSize={10}
                      fontWeight="600"
                    >
                      {holding.symbol}
                    </text>
                  </>
                )}

                {!isLarge && !isMedium && isSmall && (
                  <text
                    x={x + w / 2}
                    y={y + h / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#FFFFFF"
                    fontSize={12}
                    fontWeight="600"
                  >
                    {icon}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}
    </View>
  );
}

function EquityChart({ data, height = 200 }: { data: typeof EQUITY_CURVE; height?: number }) {
  if (Platform.OS !== "web" || data.length < 2) {
    return (
      <View style={[styles.equityChartPlaceholder, { height }]}>
        <Text appearance={TextAppearance.Muted}>Chart unavailable</Text>
      </View>
    );
  }

  const values = data.map((d) => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1;

  const width = "100%";
  const padding = 20;

  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = ((maxValue - d.value) / valueRange) * (height - padding * 2) + padding;
      return `${x},${y}`;
    })
    .join(" ");

  const isPositive = data[data.length - 1].value >= data[0].value;
  const lineColor = isPositive ? Colors.status.success : Colors.status.danger;

  // Create gradient area path
  const areaPoints = `0,${height} ${points} 100,${height}`;

  return (
    <View style={{ width, height }}>
      <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="equityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#equityGradient)" />
        <polyline
          points={points}
          fill="none"
          stroke={lineColor}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </View>
  );
}

function HoldingRow({ holding, onPress }: { holding: Holding; onPress?: () => void }) {
  const isPositive = holding.pnl >= 0;

  return (
    <View style={styles.holdingRow}>
      <View style={styles.holdingLeft}>
        <View style={[styles.holdingColorDot, { backgroundColor: holding.color }]} />
        <Avatar
          initials={holding.symbol.slice(0, 2)}
          size={Size.Small}
          uri={holding.image}
        />
        <View style={styles.holdingInfo}>
          <Text size={Size.Small} weight="semibold">
            {holding.symbol}
          </Text>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
            {holding.quantity.toLocaleString()} @ ${holding.avgPrice.toLocaleString()}
          </Text>
        </View>
      </View>
      <View style={styles.holdingRight}>
        <Currency value={holding.value} size={Size.Small} weight="semibold" decimals={2} />
        <View style={styles.holdingPnl}>
          <Text
            size={Size.ExtraSmall}
            style={{ color: isPositive ? Colors.status.success : Colors.status.danger }}
          >
            {isPositive ? "+" : "-"}${Math.abs(holding.pnl).toLocaleString()}
          </Text>
          <PercentChange value={holding.pnlPercent} size={Size.ExtraSmall} />
        </View>
      </View>
      <View style={styles.holdingAllocation}>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
          {holding.allocation.toFixed(1)}%
        </Text>
      </View>
    </View>
  );
}

function PerformanceCard({
  label,
  change,
  value,
}: {
  label: string;
  change: number;
  value: number;
}) {
  const isPositive = change >= 0;

  return (
    <Card style={styles.performanceCard}>
      <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
        {label}
      </Text>
      <View style={styles.performanceValue}>
        <Currency
          value={value}
          size={Size.Medium}
          weight="semibold"
          decimals={2}
          color={isPositive ? Colors.status.success : Colors.status.danger}
        />
      </View>
      <PercentChange value={change} size={Size.Small} />
    </Card>
  );
}

export function Portfolio() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { isAuthenticated } = useAuth();
  const colors = isDark ? themes.dark : themes.light;
  const { isMobile, isNarrow } = useBreakpoint();

  // Fetch real data when authenticated
  const { portfolio, portfolioId, loading: portfolioLoading } = usePortfolio();
  const { holdings: holdingsData, loading: holdingsLoading } = useHoldings(portfolioId);
  const { performance, loading: performanceLoading } = usePerformance(portfolioId, "1m");
  const { positions, loading: positionsLoading } = usePositions(portfolioId);
  const { trades, loading: tradesLoading } = useTrades(portfolioId, 10);

  const sectionPadding = isMobile ? 12 : isNarrow ? 16 : 24;

  // Authenticated users ALWAYS see real data (even if empty) - no mock fallback
  // Unauthenticated users see mock data for demo purposes
  const usingRealData = isAuthenticated;

  // Use real data if authenticated, otherwise fall back to mock for demo
  // Note: API returns cashBalance, we map it to balance for display components
  const portfolioData = usingRealData
    ? (portfolio ? { ...portfolio, balance: portfolio.cashBalance } : { balance: 0, cashBalance: 0, marginUsed: 0, marginAvailable: 0, unrealizedPnl: 0, realizedPnl: 0, totalValue: 0 })
    : MOCK_PORTFOLIO;
  const loading = portfolioLoading || holdingsLoading;

  // Transform holdings to display format with colors
  const displayHoldings = useMemo(() => {
    // Authenticated users see real holdings (even if empty)
    // Unauthenticated users see mock data for demo
    if (usingRealData) {
      if (!holdingsData?.holdings || holdingsData.holdings.length === 0) {
        return []; // Empty state for authenticated users with no holdings
      }
      const holdingColors = [
        CHART_COLORS.amber,
        CHART_COLORS.blue,
        CHART_COLORS.violet,
        CHART_COLORS.red,
        CHART_COLORS.cyan,
        CHART_COLORS.green,
        CHART_COLORS.pink,
        CHART_COLORS.orange,
      ];
      return holdingsData.holdings.map((h, i) => ({
        ...h,
        color: holdingColors[i % holdingColors.length],
      }));
    }
    return MOCK_HOLDINGS;
  }, [holdingsData, usingRealData]);

  // Transform performance data for equity chart
  const equityCurveData = useMemo(() => {
    // Authenticated users see real performance data (even if empty)
    if (usingRealData) {
      if (!performance?.data || performance.data.length === 0) {
        return []; // Empty state for authenticated users with no performance data
      }
      return performance.data.map((p) => ({
        timestamp: p.timestamp,
        value: p.value,
      }));
    }
    return EQUITY_CURVE;
  }, [performance, usingRealData]);

  // Authenticated users see real positions (even if empty)
  // Unauthenticated users see mock data for demo
  const displayPositions = usingRealData ? positions : MOCK_POSITIONS;

  // Authenticated users see real trades (even if empty)
  // Unauthenticated users see mock data for demo
  const displayTrades = usingRealData ? trades : MOCK_TRADES;

  const totalValue = useMemo(() => {
    return displayHoldings.reduce((sum, h) => sum + h.value, 0);
  }, [displayHoldings]);

  const totalPnl = useMemo(() => {
    return displayHoldings.reduce((sum, h) => sum + h.pnl, 0);
  }, [displayHoldings]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Navbar />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Page Header */}
        <View style={[styles.header, { paddingHorizontal: sectionPadding }]}>
          <View style={styles.headerLeft}>
            <Text size={Size.ExtraLarge} weight="bold">
              Portfolio
            </Text>
            <Text size={Size.Small} appearance={TextAppearance.Muted}>
              Your holdings and performance
            </Text>
          </View>
          <Button
            label="Trade"
            icon="trending-up"
            appearance={Appearance.Primary}
            onPress={() => navigate("/trade")}
          />
        </View>

        {/* Portfolio Summary Bar */}
        <View style={[styles.section, { paddingHorizontal: sectionPadding }]}>
          <PortfolioSummary
            balance={portfolioData.balance}
            marginUsed={portfolioData.marginUsed}
            marginAvailable={portfolioData.marginAvailable}
            unrealizedPnl={portfolioData.unrealizedPnl}
            realizedPnl={portfolioData.realizedPnl}
            loading={loading}
          />
        </View>

        {/* Performance Period Cards - Only show for demo mode or with real data */}
        {!usingRealData ? (
          // Demo mode: show mock performance metrics
          <View style={[styles.section, { paddingHorizontal: sectionPadding }]}>
            <View style={styles.performanceGrid}>
              <PerformanceCard
                label="24h"
                change={MOCK_PERFORMANCE_METRICS.day.change}
                value={MOCK_PERFORMANCE_METRICS.day.value}
              />
              <PerformanceCard
                label="7d"
                change={MOCK_PERFORMANCE_METRICS.week.change}
                value={MOCK_PERFORMANCE_METRICS.week.value}
              />
              <PerformanceCard
                label="30d"
                change={MOCK_PERFORMANCE_METRICS.month.change}
                value={MOCK_PERFORMANCE_METRICS.month.value}
              />
              <PerformanceCard
                label="All Time"
                change={MOCK_PERFORMANCE_METRICS.allTime.change}
                value={MOCK_PERFORMANCE_METRICS.allTime.value}
              />
            </View>
          </View>
        ) : portfolio ? (
          // Authenticated: show real total return from portfolio
          <View style={[styles.section, { paddingHorizontal: sectionPadding }]}>
            <View style={styles.performanceGrid}>
              <PerformanceCard
                label="Total P&L"
                change={portfolio.totalValue > 0 ? ((portfolio.realizedPnl + portfolio.unrealizedPnl) / portfolio.totalValue) * 100 : 0}
                value={portfolio.realizedPnl + portfolio.unrealizedPnl}
              />
              <PerformanceCard
                label="Realized"
                change={portfolio.totalValue > 0 ? (portfolio.realizedPnl / portfolio.totalValue) * 100 : 0}
                value={portfolio.realizedPnl}
              />
              <PerformanceCard
                label="Unrealized"
                change={portfolio.totalValue > 0 ? (portfolio.unrealizedPnl / portfolio.totalValue) * 100 : 0}
                value={portfolio.unrealizedPnl}
              />
              <PerformanceCard
                label="Portfolio Value"
                change={0}
                value={portfolio.totalValue}
              />
            </View>
          </View>
        ) : null}

        {/* Main Content Grid */}
        <View
          style={[
            styles.section,
            styles.mainGrid,
            isNarrow ? styles.mainGridStacked : undefined,
            { paddingHorizontal: sectionPadding },
          ]}
        >
          {/* Equity Curve */}
          <Card style={isNarrow ? [styles.chartCard, styles.chartCardFull] : styles.chartCard}>
            <View style={styles.cardHeader}>
              <Text size={Size.Small} weight="semibold">
                Portfolio Value
              </Text>
              <HintIndicator
                id="portfolio-equity-curve"
                title="Equity Curve"
                content="Shows your portfolio value over time. Green indicates gains, red indicates losses compared to the starting value."
                inline
                priority={40}
              />
            </View>
            <View style={styles.equityHeader}>
              <Currency
                value={usingRealData ? (portfolio?.totalValue || 0) : totalValue}
                size={Size.ExtraLarge}
                weight="bold"
                decimals={2}
              />
              {usingRealData && portfolio ? (
                <View style={styles.equityChange}>
                  <Text
                    size={Size.Small}
                    style={{
                      color: (portfolio.realizedPnl + portfolio.unrealizedPnl) >= 0 ? Colors.status.success : Colors.status.danger,
                    }}
                  >
                    {(portfolio.realizedPnl + portfolio.unrealizedPnl) >= 0 ? "+" : "-"}$
                    {Math.abs(portfolio.realizedPnl + portfolio.unrealizedPnl).toLocaleString()}
                  </Text>
                  <PercentChange
                    value={portfolio.totalValue > 0 ? ((portfolio.realizedPnl + portfolio.unrealizedPnl) / portfolio.totalValue) * 100 : 0}
                    size={Size.Small}
                  />
                </View>
              ) : !usingRealData ? (
                <View style={styles.equityChange}>
                  <Text
                    size={Size.Small}
                    style={{
                      color: totalPnl >= 0 ? Colors.status.success : Colors.status.danger,
                    }}
                  >
                    {totalPnl >= 0 ? "+" : "-"}${Math.abs(totalPnl).toLocaleString()}
                  </Text>
                  <PercentChange
                    value={(totalPnl / (totalValue - totalPnl || 1)) * 100}
                    size={Size.Small}
                  />
                </View>
              ) : null}
            </View>
            {equityCurveData.length > 0 ? (
              <EquityChart data={equityCurveData} height={isMobile ? 150 : 180} />
            ) : (
              <View style={[styles.equityChartPlaceholder, { height: isMobile ? 150 : 180 }]}>
                <Text appearance={TextAppearance.Muted} size={Size.Small}>
                  No historical data yet. Start trading to see your equity curve.
                </Text>
              </View>
            )}
          </Card>
        </View>

        {/* Holdings List */}
        <View style={[styles.section, { paddingHorizontal: sectionPadding }]}>
          <Card style={styles.holdingsCard}>
            <View style={styles.cardHeader}>
              <Text size={Size.Small} weight="semibold">
                Holdings
              </Text>
              <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                {displayHoldings.length} assets
              </Text>
            </View>
            {displayHoldings.length === 0 ? (
              <View style={styles.emptyState}>
                <Text appearance={TextAppearance.Muted} size={Size.Small}>
                  No holdings yet. Start trading to build your portfolio.
                </Text>
              </View>
            ) : (
              <View style={styles.holdingsList}>
                {displayHoldings.map((holding) => (
                  <HoldingRow key={holding.id} holding={holding} />
                ))}
              </View>
            )}
          </Card>
        </View>

        {/* Open Positions */}
        {displayPositions.length > 0 && (
          <View style={[styles.section, { paddingHorizontal: sectionPadding }]}>
            <Card style={styles.positionsCard}>
              <View style={styles.cardHeader}>
                <Text size={Size.Small} weight="semibold">
                  Open Positions
                </Text>
                <View style={styles.positionCount}>
                  <Text size={Size.ExtraSmall} style={{ color: Colors.accent.primary }}>
                    {displayPositions.length} active
                  </Text>
                </View>
              </View>
              <View style={styles.positionsList}>
                {displayPositions.map((position) => (
                  <View key={position.id} style={styles.positionRow}>
                    <View style={styles.positionLeft}>
                      <View
                        style={[
                          styles.positionSideBadge,
                          {
                            backgroundColor:
                              position.side === "long"
                                ? "rgba(47, 213, 117, 0.15)"
                                : "rgba(255, 92, 122, 0.15)",
                          },
                        ]}
                      >
                        <Text
                          size={Size.TwoXSmall}
                          weight="semibold"
                          style={{
                            color:
                              position.side === "long"
                                ? Colors.status.success
                                : Colors.status.danger,
                          }}
                        >
                          {position.side.toUpperCase()}
                        </Text>
                      </View>
                      <Text size={Size.Small} weight="semibold">
                        {position.symbol}
                      </Text>
                      <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                        {position.leverage}x
                      </Text>
                    </View>
                    <View style={styles.positionRight}>
                      <Text size={Size.Small}>
                        {position.size} @ ${position.entryPrice.toLocaleString()}
                      </Text>
                      <View style={styles.positionPnl}>
                        <Text
                          size={Size.Small}
                          weight="semibold"
                          style={{
                            color:
                              position.unrealizedPnl >= 0
                                ? Colors.status.success
                                : Colors.status.danger,
                          }}
                        >
                          {position.unrealizedPnl >= 0 ? "+" : ""}$
                          {position.unrealizedPnl.toLocaleString()}
                        </Text>
                        <PercentChange value={position.unrealizedPnlPercent} size={Size.ExtraSmall} />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </Card>
          </View>
        )}

        {/* Recent Trades */}
        <View style={[styles.section, { paddingHorizontal: sectionPadding }]}>
          <Card style={styles.tradesCard}>
            <View style={styles.cardHeader}>
              <Text size={Size.Small} weight="semibold">
                Recent Trades
              </Text>
              <Button
                label="View All"
                appearance={Appearance.Tertiary}
                size={Size.Small}
                onPress={() => navigate("/trade")}
              />
            </View>
            <TradeHistoryTable trades={displayTrades} loading={loading} />
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.lg,
  },
  headerLeft: {
    gap: spacing.xxs,
  },
  section: {
    marginBottom: spacing.lg,
  },
  performanceGrid: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  performanceCard: {
    flex: 1,
    minWidth: 140,
    padding: spacing.md,
    gap: spacing.xxs,
  },
  performanceValue: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  mainGrid: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  mainGridStacked: {
    flexDirection: "column",
  },
  chartCard: {
    flex: 1,
    padding: spacing.md,
  },
  chartCardFull: {
    flex: undefined,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  treemapContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
  equityHeader: {
    marginBottom: spacing.md,
  },
  equityChange: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xxs,
  },
  equityChartPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: radii.md,
  },
  holdingsCard: {
    padding: spacing.md,
  },
  holdingsList: {
    gap: spacing.xs,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  holdingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.04)",
  },
  holdingLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  holdingColorDot: {
    width: 4,
    height: 24,
    borderRadius: 2,
  },
  holdingInfo: {
    gap: 2,
  },
  holdingRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  holdingPnl: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  holdingAllocation: {
    width: 50,
    alignItems: "flex-end",
  },
  positionsCard: {
    padding: spacing.md,
  },
  positionCount: {
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  positionsList: {
    gap: spacing.xs,
  },
  positionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.04)",
  },
  positionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  positionSideBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  positionRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  positionPnl: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  tradesCard: {
    padding: spacing.md,
  },
});
