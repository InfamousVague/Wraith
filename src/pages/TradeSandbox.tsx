/**
 * @file TradeSandbox.tsx
 * @description Paper trading terminal inspired by Hyperliquid and Binance.
 *
 * ## Layout:
 * Wide Desktop (>=1200px, 3-column grid):
 * - Left: Order Book (AggregatedOrderBook)
 * - Center: Price Chart (AdvancedChart)
 * - Right: Order Form
 * - Bottom: Positions/Orders/History tabs
 * - Draggable resizers between panels
 *
 * Medium screens (<1200px, 2-column with toggle):
 * - Toggle between Chart and Order Book (center panel)
 * - Right: Order Form
 * - Bottom: Positions tabs
 *
 * Mobile (<=480px, stacked):
 * - Chart
 * - Order Book (below chart)
 * - Order Form
 * - Positions tabs
 *
 * ## Features:
 * - Paper trading with mock/real API integration
 * - Real-time price updates via WebSocket
 * - Order placement with Market/Limit/Stop Loss/Take Profit
 * - Position and order management
 * - P&L tracking
 * - Resizable panels via drag handles
 * - Contextual help tooltips throughout
 *
 * Portfolio overview is at /trade route.
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useParams, useNavigate } from "react-router-dom";
import { Card, SegmentedControl, Text, Icon, ProgressBar } from "@wraith/ghost/components";
import { Colors } from "@wraith/ghost/tokens";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { useCryptoData } from "../hooks/useCryptoData";
import { useTradingSettings } from "../hooks/useTradingSettings";
import { hauntClient, HauntApiError } from "../services/haunt";
import { usePortfolio } from "../hooks/usePortfolio";
import { usePositions } from "../hooks/usePositions";
import { useOrders } from "../hooks/useOrders";
import { useTrades } from "../hooks/useTrades";
import { useAssetSubscription, type PriceUpdate } from "../hooks/useHauntSocket";
import {
  Navbar,
  HintIndicator,
  TooltipContainer,
  TooltipSection,
  TooltipText,
  TooltipListItem,
  TooltipDivider,
  PanelResizer,
} from "../components/ui";
import { AdvancedChart } from "../components/chart";
import { AggregatedOrderBook } from "../components/market/aggregated-order-book";
import {
  OrderForm,
  PositionsTable,
  OrdersTable,
  TradeHistoryTable,
  OrderConfirmModal,
  TradeReceiptModal,
  ClosePositionModal,
  ModifyPositionModal,
  DrawdownWarningModal,
} from "../components/trade";
import type { Position, ModifyPositionRequest, AssetClass, OrderType } from "../services/haunt";
import { spacing, radii } from "../styles/tokens";
import {
  MOCK_PORTFOLIO,
  MOCK_POSITIONS as INITIAL_MOCK_POSITIONS,
  MOCK_ORDERS as INITIAL_MOCK_ORDERS,
  MOCK_TRADES,
} from "../data/mockPortfolio";
import type { Asset } from "../types/asset";
import type { OrderFormState } from "../components/trade/order-form/types";
import type { OrderUpdate } from "../hooks/useHauntSocket";

type TabId = "positions" | "orders" | "history";
type ChartViewId = "chart" | "orderbook";

const TAB_OPTIONS = [
  { value: "positions", label: "Positions", icon: "briefcase" },
  { value: "orders", label: "Orders", icon: "clock" },
  { value: "history", label: "History", icon: "list" },
];

const CHART_VIEW_OPTIONS = [
  { value: "chart", label: "Chart" },
  { value: "orderbook", label: "Order Book" },
];

const themes = {
  dark: {
    background: "#050608",
  },
  light: {
    background: "#f8fafc",
  },
};

// Minimum width needed for 3-column layout (Order Book + Chart + Order Form)
const THREE_COLUMN_MIN_WIDTH = 1200;

// Panel size constraints
const MIN_PANEL_WIDTH = 200;
const MAX_PANEL_WIDTH = 500;
const DEFAULT_ORDER_BOOK_WIDTH = MIN_PANEL_WIDTH;
const DEFAULT_ORDER_FORM_WIDTH = 320;

/**
 * Paper trading sandbox page with full trading interface.
 */
/**
 * Drawdown warning banner shown above order form
 */
function DrawdownWarningBanner({
  currentDrawdown,
  maxDrawdown,
  isAtLimit,
  isApproachingLimit,
  onOpenSettings,
}: {
  currentDrawdown: number;
  maxDrawdown: number;
  isAtLimit: boolean;
  isApproachingLimit: boolean;
  onOpenSettings: () => void;
}) {
  if (!isApproachingLimit && !isAtLimit) return null;

  const progress = maxDrawdown > 0 ? Math.min(1, currentDrawdown / maxDrawdown) : 0;

  const bannerStyle = isAtLimit
    ? { ...styles.drawdownBanner, ...styles.drawdownBannerCritical }
    : { ...styles.drawdownBanner, ...styles.drawdownBannerWarning };

  return (
    <Card style={bannerStyle}>
      <View style={styles.drawdownBannerContent}>
        <View style={styles.drawdownBannerHeader}>
          <Icon
            name={isAtLimit ? "error" : "warning"}
            size={Size.Small}
            color={isAtLimit ? Colors.status.danger : Colors.status.warning}
          />
          <Text
            size={Size.Small}
            weight="semibold"
            style={{ color: isAtLimit ? Colors.status.danger : Colors.status.warning }}
          >
            {isAtLimit ? "Trading Stopped" : "Drawdown Warning"}
          </Text>
        </View>
        <View style={styles.drawdownBannerStats}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
            Current: <Text size={Size.ExtraSmall} weight="bold" style={{ color: Colors.status.danger }}>
              -{currentDrawdown.toFixed(1)}%
            </Text>
          </Text>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
            Limit: -{maxDrawdown}%
          </Text>
        </View>
        <ProgressBar
          value={progress * 100}
          max={100}
          size={Size.Small}
          appearance={isAtLimit ? TextAppearance.Danger : TextAppearance.Warning}
        />
        <Pressable onPress={onOpenSettings} style={styles.drawdownBannerLink}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Link}>
            Adjust Settings
          </Text>
        </Pressable>
      </View>
    </Card>
  );
}

export function TradeSandbox() {
  const { symbol: urlSymbol } = useParams<{ symbol?: string }>();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { isAuthenticated } = useAuth();
  const { showSuccess, showError } = useToast();
  const colors = isDark ? themes.dark : themes.light;
  const { isMobile, width } = useBreakpoint();

  // Trading settings for drawdown protection
  const {
    settings,
    currentDrawdownPercent,
    isApproachingLimit,
    isAtLimit,
    setCurrentDrawdown,
  } = useTradingSettings();

  // Use toggle layout when width is below threshold for 3-column layout
  const showToggleLayout = !isMobile && width < THREE_COLUMN_MIN_WIDTH;

  // Selected asset state
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("positions");
  const [chartView, setChartView] = useState<ChartViewId>("chart");

  // Resizable panel widths
  const [orderBookWidth, setOrderBookWidth] = useState(DEFAULT_ORDER_BOOK_WIDTH);
  const [orderFormWidth, setOrderFormWidth] = useState(DEFAULT_ORDER_FORM_WIDTH);

  // Local mock state for demo mode (when not authenticated or no real data)
  const [mockPositions, setMockPositions] = useState(INITIAL_MOCK_POSITIONS);
  const [mockOrders, setMockOrders] = useState(INITIAL_MOCK_ORDERS);

  // Modal state
  const [pendingOrder, setPendingOrder] = useState<OrderFormState | null>(null);
  const [showOrderConfirm, setShowOrderConfirm] = useState(false);
  const [showTradeReceipt, setShowTradeReceipt] = useState(false);
  const [positionToClose, setPositionToClose] = useState<Position | null>(null);
  const [positionToModify, setPositionToModify] = useState<Position | null>(null);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [positionClosing, setPositionClosing] = useState(false);
  const [positionModifying, setPositionModifying] = useState(false);
  const [portfolioResetting, setPortfolioResetting] = useState(false);
  const [showDrawdownModal, setShowDrawdownModal] = useState(false);
  const [bypassDrawdown, setBypassDrawdown] = useState(false);

  // Debug: track modal state changes
  useEffect(() => {
    console.log("[TradeSandbox] showDrawdownModal changed to:", showDrawdownModal);
  }, [showDrawdownModal]);

  // Fetch real data when authenticated (with polling + WebSocket)
  const { portfolio: apiPortfolio, portfolioId, loading: portfolioLoading, clearAndRefetch: clearPortfolio, resetPortfolio } = usePortfolio();

  // Calculate and update drawdown from portfolio data
  useEffect(() => {
    if (apiPortfolio && apiPortfolio.startingBalance > 0) {
      // Drawdown = (starting - current) / starting * 100
      // Positive value means loss (e.g., started at 100k, now at 90k = 10% drawdown)
      const drawdown = ((apiPortfolio.startingBalance - apiPortfolio.totalValue) / apiPortfolio.startingBalance) * 100;
      // Only count positive drawdown (losses), not gains
      const clampedDrawdown = Math.max(0, drawdown);
      setCurrentDrawdown(clampedDrawdown);
      console.log("[TradeSandbox] Drawdown calculated:", clampedDrawdown.toFixed(2), "% (starting:", apiPortfolio.startingBalance, "current:", apiPortfolio.totalValue, ")");
    }
  }, [apiPortfolio, setCurrentDrawdown]);

  // Check if portfolio is stopped using the backend's actual risk settings (not local settings)
  // This mirrors the backend's is_stopped() check exactly
  const isPortfolioStopped = React.useMemo(() => {
    if (!apiPortfolio || apiPortfolio.startingBalance <= 0) return false;
    const drawdownPct = (apiPortfolio.startingBalance - apiPortfolio.totalValue) / apiPortfolio.startingBalance;
    const stopPct = apiPortfolio.riskSettings?.portfolioStopPct ?? 0.25; // Default 25% if not set
    const stopped = drawdownPct >= stopPct;
    if (stopped) {
      console.log("[TradeSandbox] Portfolio IS STOPPED - drawdown:", (drawdownPct * 100).toFixed(2), "% >= stop:", (stopPct * 100).toFixed(2), "%");
    }
    return stopped;
  }, [apiPortfolio]);
  const {
    positions: apiPositions,
    closePosition,
    modifyPosition,
    loading: positionsLoading,
    refetch: refetchPositions,
    updatedPositionIds,
  } = usePositions(portfolioId);
  const {
    orders: apiOrders,
    cancelOrder,
    placeOrder,
    cancelAllOrders,
    loading: ordersLoading,
    refetch: refetchOrders,
    lastOrderUpdate,
  } = useOrders(portfolioId);
  const { trades: apiTrades, loading: tradesLoading } = useTrades(portfolioId, 20);

  // Track last order update for trade receipt modal
  const [lastFilledOrder, setLastFilledOrder] = useState<OrderUpdate | null>(null);

  // Show trade receipt when order is filled
  React.useEffect(() => {
    if (lastOrderUpdate?.event === "filled" && lastOrderUpdate.status === "filled") {
      setLastFilledOrder(lastOrderUpdate);
      setShowTradeReceipt(true);
    }
  }, [lastOrderUpdate]);

  // Determine data source based on authentication AND having a portfolio
  // Users with a portfolio see real data, others see mock data for demo
  const usingRealData = isAuthenticated && !!portfolioId;

  // Use real data if authenticated, otherwise fall back to mock for demo
  // Note: API returns cashBalance, we also provide balance alias for compatibility
  const portfolio = usingRealData
    ? (apiPortfolio ? { ...apiPortfolio, balance: apiPortfolio.cashBalance } : { balance: 0, cashBalance: 0, marginUsed: 0, marginAvailable: 0, unrealizedPnl: 0, realizedPnl: 0, totalValue: 0 })
    : MOCK_PORTFOLIO;
  const positions = usingRealData ? apiPositions : mockPositions;
  const orders = usingRealData ? apiOrders : mockOrders;
  const trades = usingRealData ? apiTrades : MOCK_TRADES;

  // Fetch top assets for quick selection
  const { assets, loading: assetsLoading } = useCryptoData({
    limit: 20,
    sort: "market_cap",
    sortDir: "desc",
    assetType: "all",
  });

  // Track search state for assets not in the top list
  const searchedSymbolRef = useRef<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Set asset based on URL param or default to first asset
  useEffect(() => {
    // If we have a URL symbol, try to find or fetch it
    if (urlSymbol) {
      const symbolLower = urlSymbol.toLowerCase();

      // Already have this asset selected
      if (selectedAsset?.symbol.toLowerCase() === symbolLower) {
        return;
      }

      // Try to find in loaded assets
      const matchingAsset = assets.find(
        (a) => a.symbol.toLowerCase() === symbolLower
      );

      if (matchingAsset) {
        setSelectedAsset(matchingAsset);
        return;
      }

      // Asset not found in list - search for it (only once per symbol)
      if (assets.length > 0 && searchedSymbolRef.current !== urlSymbol) {
        searchedSymbolRef.current = urlSymbol;
        setSearchLoading(true);

        hauntClient.search(urlSymbol, 5).then((response) => {
          const results = response.data || [];
          const exactMatch = results.find(
            (a) => a.symbol.toLowerCase() === symbolLower
          );
          if (exactMatch) {
            setSelectedAsset(exactMatch);
          } else if (results.length > 0) {
            setSelectedAsset(results[0]);
          } else if (!selectedAsset) {
            // No results, fall back to first loaded asset
            setSelectedAsset(assets[0]);
          }
        }).catch(() => {
          if (!selectedAsset && assets.length > 0) {
            setSelectedAsset(assets[0]);
          }
        }).finally(() => {
          setSearchLoading(false);
        });
      }
    } else if (!selectedAsset && assets.length > 0) {
      // No URL symbol - default to first asset
      setSelectedAsset(assets[0]);
    }
  }, [assets, urlSymbol]);

  // Combined loading state
  const isLoading = assetsLoading || searchLoading;

  // Handle real-time price updates
  const handlePriceUpdate = useCallback((update: PriceUpdate) => {
    setSelectedAsset((prev) => {
      if (!prev || prev.symbol.toLowerCase() !== update.symbol.toLowerCase()) return prev;
      const tradeDirection = update.tradeDirection
        ?? (update.price > prev.price ? "up" as const
          : update.price < prev.price ? "down" as const
          : prev.tradeDirection);
      return { ...prev, price: update.price, tradeDirection };
    });
  }, []);

  // Subscribe to price updates for selected asset
  useAssetSubscription(
    selectedAsset ? [selectedAsset.symbol] : [],
    handlePriceUpdate
  );

  // Handle order submission - shows confirmation modal first
  const handleOrderSubmit = useCallback((order: OrderFormState) => {
    // Add symbol to order state
    const orderWithSymbol = {
      ...order,
      symbol: selectedAsset?.symbol || "BTC",
    };
    setPendingOrder(orderWithSymbol);

    // Proactive drawdown check - show warning modal if portfolio is stopped
    // Use isPortfolioStopped which mirrors the backend's exact check
    if (isAuthenticated && isPortfolioStopped && !bypassDrawdown) {
      console.log("[TradeSandbox] Proactive check: portfolio is stopped, showing drawdown modal");
      setShowDrawdownModal(true);
      return;
    }

    setShowOrderConfirm(true);
  }, [selectedAsset?.symbol, isAuthenticated, isPortfolioStopped, bypassDrawdown]);

  // Map frontend asset type to backend AssetClass (snake_case)
  const getAssetClass = (asset: Asset | null): AssetClass => {
    if (!asset?.assetType || asset.assetType === "crypto") return "crypto_spot";
    if (asset.assetType === "stock") return "stock";
    if (asset.assetType === "etf") return "etf";
    return "crypto_spot";
  };

  // Map frontend order type to backend OrderType (snake_case)
  const getOrderType = (type: string): OrderType => {
    switch (type) {
      case "market": return "market";
      case "limit": return "limit";
      case "stop_loss": return "stop_loss";
      case "take_profit": return "take_profit";
      default: return "market";
    }
  };

  // Confirm and execute order
  const handleOrderConfirm = useCallback(async () => {
    if (!pendingOrder) return;

    setOrderSubmitting(true);

    const quantity = parseFloat(pendingOrder.size) || 0;
    const priceNum = pendingOrder.orderType === "limit" ? parseFloat(pendingOrder.price) : undefined;
    const symbol = pendingOrder.symbol || selectedAsset?.symbol || "BTC";

    if (isAuthenticated && portfolioId) {
      try {
        console.log("[TradeSandbox] Placing order with portfolioId:", portfolioId, "bypassDrawdown:", bypassDrawdown);
        const order = await placeOrder({
          portfolioId,
          symbol,
          assetClass: getAssetClass(selectedAsset),
          side: pendingOrder.side === "buy" ? "buy" : "sell",
          orderType: getOrderType(pendingOrder.orderType),
          quantity,
          price: priceNum,
          leverage: pendingOrder.leverage,
          stopLoss: pendingOrder.stopLoss ? parseFloat(pendingOrder.stopLoss) : undefined,
          takeProfit: pendingOrder.takeProfit ? parseFloat(pendingOrder.takeProfit) : undefined,
          bypassDrawdown,
        });
        // Reset bypass flag after successful order
        setBypassDrawdown(false);
        console.log("Order placed successfully:", order);
        showSuccess("Order Placed", `${pendingOrder.side.toUpperCase()} ${symbol} order submitted`);
        // Refetch data to show updated positions/orders
        refetchPositions();
        refetchOrders();
      } catch (err) {
        console.error("[TradeSandbox] Failed to place order - full error object:", err);

        // Extract error message and code - HauntApiError preserves both
        let errorMessage = "Unknown error occurred";
        let errorCode = "";

        if (err instanceof HauntApiError) {
          // Our custom error class with code and message
          errorMessage = err.message;
          errorCode = err.code;
          console.log("[TradeSandbox] HauntApiError - message:", errorMessage, "code:", errorCode);
        } else if (err instanceof Error) {
          errorMessage = err.message;
          console.log("[TradeSandbox] Standard Error - message:", errorMessage);
        } else if (typeof err === "object" && err !== null) {
          const errObj = err as { message?: string; error?: string; code?: string };
          errorMessage = errObj.message || errObj.error || JSON.stringify(err);
          errorCode = errObj.code || "";
        }

        // Handle drawdown/portfolio stopped errors - check multiple patterns
        const lowerMessage = errorMessage.toLowerCase();
        const lowerCode = errorCode.toLowerCase();

        const isDrawdownError =
          lowerCode === "portfolio_stopped" ||
          lowerCode.includes("drawdown") ||
          lowerMessage.includes("stopped") ||
          lowerMessage.includes("drawdown");

        console.log("[TradeSandbox] isDrawdownError:", isDrawdownError, "(code:", errorCode, ")");

        if (isDrawdownError) {
          console.log("[TradeSandbox] *** DRAWDOWN ERROR DETECTED - SHOWING MODAL ***");
          setOrderSubmitting(false);
          setShowOrderConfirm(false);
          setShowDrawdownModal(true);
          return; // Exit early to preserve pendingOrder
        } else if (lowerMessage.includes("access denied") || lowerMessage.includes("403") || lowerMessage.includes("unauthorized")) {
          console.log("[TradeSandbox] Portfolio access error, clearing and re-fetching...");
          clearPortfolio();
          showError("Order Failed", "Portfolio access error. Please try again.");
        } else {
          showError("Order Failed", errorMessage);
        }
      }
    } else {
      // Demo mode: create mock order or position
      const mockId = `mock-${Date.now()}`;
      const currentPrice = selectedAsset?.price || 0;

      if (pendingOrder.orderType === "market") {
        // Market order: creates a position immediately
        const newPosition: Position = {
          id: mockId,
          symbol: symbol.toUpperCase(),
          side: pendingOrder.side === "buy" ? "long" : "short",
          size: quantity,
          entryPrice: currentPrice,
          markPrice: currentPrice,
          leverage: pendingOrder.leverage,
          marginMode: "isolated",
          liquidationPrice: pendingOrder.side === "buy"
            ? currentPrice * (1 - 1 / pendingOrder.leverage)
            : currentPrice * (1 + 1 / pendingOrder.leverage),
          unrealizedPnl: 0,
          unrealizedPnlPercent: 0,
          margin: (quantity * currentPrice) / pendingOrder.leverage,
          roe: 0,
          stopLoss: pendingOrder.stopLoss ? parseFloat(pendingOrder.stopLoss) : undefined,
          takeProfit: pendingOrder.takeProfit ? parseFloat(pendingOrder.takeProfit) : undefined,
          createdAt: Date.now(),
        };
        setMockPositions(prev => [newPosition, ...prev]);
      } else {
        // Limit/stop order: creates a pending order
        const newOrder = {
          id: mockId,
          symbol: symbol.toUpperCase(),
          type: pendingOrder.orderType,
          side: pendingOrder.side,
          price: priceNum,
          size: quantity,
          filledSize: 0,
          status: "pending" as const,
          createdAt: Date.now(),
        };
        setMockOrders(prev => [newOrder, ...prev]);
      }
      showSuccess("Demo Order", `${pendingOrder.side.toUpperCase()} ${symbol} (demo mode)`);
    }

    setOrderSubmitting(false);
    setShowOrderConfirm(false);
    setPendingOrder(null);
  }, [isAuthenticated, pendingOrder, placeOrder, portfolioId, selectedAsset, showSuccess, showError, bypassDrawdown, clearPortfolio, refetchPositions, refetchOrders]);

  // Cancel order confirmation
  const handleOrderConfirmCancel = useCallback(() => {
    setShowOrderConfirm(false);
    setPendingOrder(null);
  }, []);

  // Handle position close - shows confirmation modal first
  const handleClosePosition = useCallback((positionId: string) => {
    const position = positions.find((p) => p.id === positionId);
    if (position) {
      setPositionToClose(position);
    }
  }, [positions]);

  // Confirm and close position
  const handleClosePositionConfirm = useCallback(async () => {
    if (!positionToClose) return;

    setPositionClosing(true);

    // Check if this is a real position or mock
    const isRealPosition = usingRealData && apiPositions.some(p => p.id === positionToClose.id);

    if (isRealPosition) {
      try {
        await closePosition(positionToClose.id);
        // Hook will auto-refetch
      } catch (err) {
        console.error("Failed to close position:", err);
      }
    } else {
      // Demo mode: remove from local mock state
      setMockPositions(prev => prev.filter(p => p.id !== positionToClose.id));
    }

    setPositionClosing(false);
    setPositionToClose(null);
  }, [usingRealData, apiPositions, closePosition, positionToClose]);

  // Cancel position close
  const handleClosePositionCancel = useCallback(() => {
    setPositionToClose(null);
  }, []);

  // Handle position modify - open modify modal
  const handleModifyPosition = useCallback((positionId: string) => {
    const position = positions.find((p) => p.id === positionId);
    if (position) {
      setPositionToModify(position);
    }
  }, [positions]);

  // Save position modifications
  const handleModifyPositionSave = useCallback(async (changes: ModifyPositionRequest) => {
    if (!positionToModify) return;

    setPositionModifying(true);

    // Check if this is a real position or mock
    const isRealPosition = usingRealData && apiPositions.some(p => p.id === positionToModify.id);

    if (isRealPosition) {
      try {
        await modifyPosition(positionToModify.id, changes);
      } catch (err) {
        console.error("Failed to modify position:", err);
      }
    } else {
      // Demo mode: update local mock state
      setMockPositions(prev => prev.map(p => {
        if (p.id !== positionToModify.id) return p;
        return {
          ...p,
          stopLoss: changes.stopLoss === null ? undefined : (changes.stopLoss ?? p.stopLoss),
          takeProfit: changes.takeProfit === null ? undefined : (changes.takeProfit ?? p.takeProfit),
          trailingStop: changes.trailingStop === null ? undefined : (changes.trailingStop ?? p.trailingStop),
        };
      }));
    }

    setPositionModifying(false);
    setPositionToModify(null);
  }, [usingRealData, apiPositions, modifyPosition, positionToModify]);

  // Cancel position modification
  const handleModifyPositionCancel = useCallback(() => {
    setPositionToModify(null);
  }, []);

  // Handle order cancel
  const handleCancelOrder = useCallback(async (orderId: string) => {
    // Check if this is a real order or mock
    const isRealOrder = usingRealData && apiOrders.some(o => o.id === orderId);

    if (isRealOrder) {
      try {
        await cancelOrder(orderId);
        // Hook will auto-refetch
      } catch (err) {
        console.error("Failed to cancel order:", err);
      }
    } else {
      // Demo mode: remove from local mock state
      setMockOrders(prev => prev.filter(o => o.id !== orderId));
    }
  }, [usingRealData, apiOrders, cancelOrder]);

  // Handle cancel all orders
  const handleCancelAllOrders = useCallback(async () => {
    if (usingRealData) {
      try {
        const cancelled = await cancelAllOrders();
        console.log(`Cancelled ${cancelled} orders`);
      } catch (err) {
        console.error("Failed to cancel all orders:", err);
      }
    } else {
      // Demo mode: clear all mock orders
      setMockOrders([]);
    }
  }, [usingRealData, cancelAllOrders]);

  // Close trade receipt modal
  const handleCloseTradeReceipt = useCallback(() => {
    setShowTradeReceipt(false);
    setLastFilledOrder(null);
  }, []);

  // Reset portfolio (restore balance, clear positions, unstop if stopped)
  const handleResetPortfolio = useCallback(async () => {
    if (!isAuthenticated) return;

    setPortfolioResetting(true);
    try {
      await resetPortfolio();
      showSuccess("Portfolio Reset", "Your portfolio has been reset to starting balance.");
      refetchPositions();
      refetchOrders();
    } catch (err) {
      console.error("Failed to reset portfolio:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to reset portfolio";
      showError("Reset Failed", errorMessage);
    } finally {
      setPortfolioResetting(false);
    }
  }, [isAuthenticated, resetPortfolio, refetchPositions, refetchOrders, showSuccess, showError]);

  // Handle drawdown bypass for single trade
  const handleBypassDrawdownOnce = useCallback(() => {
    setBypassDrawdown(true);
    setShowDrawdownModal(false);
    // Re-submit the pending order with bypass flag
    if (pendingOrder) {
      setShowOrderConfirm(true);
    }
  }, [pendingOrder]);

  // Handle drawdown modal cancel
  const handleDrawdownCancel = useCallback(() => {
    setShowDrawdownModal(false);
    setBypassDrawdown(false);
  }, []);

  // Handle reset from drawdown modal
  const handleDrawdownReset = useCallback(async () => {
    await handleResetPortfolio();
    setShowDrawdownModal(false);
  }, [handleResetPortfolio]);

  // Handle panel resize
  const handleOrderBookResize = useCallback((delta: number) => {
    setOrderBookWidth((prev) => Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, prev + delta)));
  }, []);

  const handleOrderFormResize = useCallback((delta: number) => {
    // Negative delta because dragging left should increase form width
    setOrderFormWidth((prev) => Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, prev - delta)));
  }, []);

  // Layout values
  const contentPadding = isMobile ? spacing.xs : showToggleLayout ? spacing.sm : spacing.md;
  const effectiveOrderFormWidth = isMobile ? "100%" : orderFormWidth;
  const effectiveOrderBookWidth = isMobile ? "100%" : orderBookWidth;
  // Show resizers on desktop (both 2-column and 3-column modes), never on mobile
  const showResizers = !isMobile;
  const showThreeColumnResizers = showResizers && !showToggleLayout;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Navbar />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Main Trading Grid */}
        {/* Toggle between Chart and Order Book when not enough space for 3 columns */}
        {showToggleLayout && (
          <View style={[styles.chartViewToggle, { paddingHorizontal: contentPadding }]}>
            <SegmentedControl
              options={CHART_VIEW_OPTIONS}
              value={chartView}
              onChange={(val) => setChartView(val as ChartViewId)}
              size={Size.Small}
            />
          </View>
        )}

        <View
          style={[
            styles.tradingGrid,
            isMobile && styles.tradingGridMobile,
            { paddingHorizontal: contentPadding },
          ]}
        >
          {/* Order Book (left panel - wide desktop only) */}
          {!isMobile && !showToggleLayout && (
            <View style={[styles.orderBookPanel, { width: effectiveOrderBookWidth }]}>
              <AggregatedOrderBook
                symbol={selectedAsset?.symbol}
                loading={isLoading}
              />
            </View>
          )}

          {/* Resizer between Order Book and Chart (3-column only) */}
          {showThreeColumnResizers && (
            <PanelResizer onResize={handleOrderBookResize} direction="horizontal" />
          )}

          {/* Toggle layout: Show either Chart or Order Book based on toggle */}
          {showToggleLayout && chartView === "orderbook" && (
            <View style={styles.chartPanel}>
              <AggregatedOrderBook
                symbol={selectedAsset?.symbol}
                loading={isLoading}
              />
            </View>
          )}

          {/* Chart (center panel) - always show on wide, conditional on toggle layout */}
          {(!showToggleLayout || isMobile || chartView === "chart") && (
            <View style={styles.chartPanel}>
              <AdvancedChart
                asset={selectedAsset}
                loading={isLoading}
                height={isMobile ? 300 : showToggleLayout ? 400 : 500}
              />
            </View>
          )}

          {/* Mobile: Order Book below chart */}
          {isMobile && (
            <View style={styles.mobileOrderBook}>
              <AggregatedOrderBook
                symbol={selectedAsset?.symbol}
                loading={isLoading}
              />
            </View>
          )}

          {/* Resizer between Chart and Order Form */}
          {showResizers && (
            <PanelResizer onResize={handleOrderFormResize} direction="horizontal" />
          )}

          {/* Order Form (right panel) */}
          <View style={[styles.orderFormPanel, { width: effectiveOrderFormWidth }]}>
            {/* Drawdown Warning Banner - show if approaching limit OR portfolio is stopped */}
            {isAuthenticated && (isApproachingLimit || isPortfolioStopped) && (
              <DrawdownWarningBanner
                currentDrawdown={currentDrawdownPercent}
                maxDrawdown={(apiPortfolio?.riskSettings?.portfolioStopPct ?? 0.25) * 100}
                isAtLimit={isPortfolioStopped}
                isApproachingLimit={isApproachingLimit && !isPortfolioStopped}
                onOpenSettings={() => navigate("/settings")}
              />
            )}
            <OrderForm
              symbol={selectedAsset?.symbol || "BTC"}
              currentPrice={selectedAsset?.price}
              availableMargin={portfolio.marginAvailable}
              onSubmit={handleOrderSubmit}
              loading={isLoading}
              disabled={!isAuthenticated || (isPortfolioStopped && !settings.drawdownProtection.allowBypass)}
              disabledMessage={
                !isAuthenticated
                  ? "Connect wallet to place orders"
                  : isPortfolioStopped && !settings.drawdownProtection.allowBypass
                  ? "Trading stopped - drawdown limit reached"
                  : undefined
              }
            />
          </View>
        </View>

        {/* Positions & Orders Tabs */}
        <View style={[styles.section, { paddingHorizontal: contentPadding }]}>
          <Card style={styles.tabsCard}>
            <View style={styles.tabsHeader}>
              <View style={styles.tabsHeaderRow}>
                <SegmentedControl
                  options={TAB_OPTIONS}
                  value={activeTab}
                  onChange={(val) => setActiveTab(val as TabId)}
                />
                <HintIndicator
                  id="trade-sandbox-positions-hint"
                  title="Positions & Orders"
                  icon="?"
                  color={Colors.accent.primary}
                  priority={52}
                  width={400}
                  inline
                >
                  <TooltipContainer>
                    <TooltipSection title="Positions Tab">
                      <TooltipText>
                        Your active trades showing entry price, current P&L, and liquidation price. Close or modify positions here.
                      </TooltipText>
                      <TooltipListItem icon="target" color={Colors.status.success}>
                        Green P&L means your position is profitable
                      </TooltipListItem>
                      <TooltipListItem icon="alert-triangle" color={Colors.status.danger}>
                        Watch liquidation price to avoid forced closure
                      </TooltipListItem>
                    </TooltipSection>
                    <TooltipDivider />
                    <TooltipSection title="Open Orders Tab">
                      <TooltipText>
                        Pending limit and stop orders waiting to execute. Cancel orders before they fill if needed.
                      </TooltipText>
                    </TooltipSection>
                    <TooltipDivider />
                    <TooltipSection title="Trade History Tab">
                      <TooltipText>
                        Completed trades showing execution price, fees paid, and realized profit or loss.
                      </TooltipText>
                    </TooltipSection>
                  </TooltipContainer>
                </HintIndicator>
              </View>
            </View>
            <View style={styles.tabContent}>
              {activeTab === "positions" && (
                <PositionsTable
                  positions={positions}
                  onClosePosition={handleClosePosition}
                  onModifyPosition={handleModifyPosition}
                  updatedPositionIds={updatedPositionIds}
                />
              )}
              {activeTab === "orders" && (
                <OrdersTable
                  orders={orders}
                  onCancelOrder={handleCancelOrder}
                  onCancelAllOrders={handleCancelAllOrders}
                />
              )}
              {activeTab === "history" && (
                <TradeHistoryTable trades={trades} />
              )}
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* Order Confirmation Modal */}
      <OrderConfirmModal
        visible={showOrderConfirm}
        order={pendingOrder}
        symbol={selectedAsset?.symbol || "BTC"}
        currentPrice={selectedAsset?.price}
        onConfirm={handleOrderConfirm}
        onCancel={handleOrderConfirmCancel}
        loading={orderSubmitting}
      />

      {/* Trade Receipt Modal */}
      <TradeReceiptModal
        visible={showTradeReceipt}
        trade={lastFilledOrder}
        onClose={handleCloseTradeReceipt}
      />

      {/* Close Position Modal */}
      <ClosePositionModal
        visible={positionToClose !== null}
        position={positionToClose}
        onConfirm={handleClosePositionConfirm}
        onCancel={handleClosePositionCancel}
        loading={positionClosing}
      />

      {/* Modify Position Modal */}
      <ModifyPositionModal
        visible={positionToModify !== null}
        position={positionToModify}
        onSave={handleModifyPositionSave}
        onCancel={handleModifyPositionCancel}
        loading={positionModifying}
      />

      {/* Drawdown Warning Modal */}
      <DrawdownWarningModal
        visible={showDrawdownModal}
        currentDrawdown={currentDrawdownPercent}
        maxDrawdown={settings.drawdownProtection.maxDrawdownPercent}
        onBypassOnce={handleBypassDrawdownOnce}
        onResetPortfolio={handleDrawdownReset}
        onCancel={handleDrawdownCancel}
        onOpenSettings={() => {
          setShowDrawdownModal(false);
          navigate("/settings");
        }}
        loading={portfolioResetting}
      />
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
  scrollContent: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.sm,
  },
  chartViewToggle: {
    marginBottom: spacing.sm,
  },
  tradingGrid: {
    flexDirection: "row",
    alignItems: "stretch",
    marginBottom: spacing.sm,
  },
  tradingGridMobile: {
    flexDirection: "column",
    gap: spacing.sm,
  },
  orderFormPanel: {
    flexShrink: 0,
  },
  chartPanel: {
    flex: 1,
    minWidth: 0,
  },
  orderBookPanel: {
    flexShrink: 0,
  },
  mobileOrderBook: {
    width: "100%",
  },
  tabsCard: {
    overflow: "hidden",
  },
  tabsHeader: {
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  tabsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  tabContent: {
    minHeight: 200,
  },
  drawdownBanner: {
    marginBottom: spacing.sm,
    padding: spacing.sm,
  },
  drawdownBannerWarning: {
    borderWidth: 1,
    borderColor: Colors.status.warning,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
  },
  drawdownBannerCritical: {
    borderWidth: 1,
    borderColor: Colors.status.danger,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  drawdownBannerContent: {
    gap: spacing.xs,
  },
  drawdownBannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  drawdownBannerStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  drawdownBannerLink: {
    alignSelf: "flex-end",
    marginTop: spacing.xxs,
  },
});
