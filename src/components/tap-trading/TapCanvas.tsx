/**
 * @file TapCanvas.tsx
 * @description Main canvas component for Tap Trading.
 *
 * Renders the sparkline (left ~37%) and multiplier grid (right ~63%)
 * on a single Canvas2D element. Uses requestAnimationFrame for smooth
 * animation with adaptive frame rate (60fps active, ~15fps idle).
 *
 * Coordinate system:
 * - sparklineBoundaryX = width × 0.37 (where sparkline ends, grid begins)
 * - Vertical anchoring: current price is locked at center (50% Y)
 * - Horizontal: grid scrolls continuously left as time passes
 *
 * The grid is overlaid with DOM elements for active trade tiles and
 * the current price badge.
 */

import React, { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import type { GridConfig, TapPosition, TapSettings, TileVisualState } from "../../types/tap-trading";
import { DEFAULT_TAP_SETTINGS } from "../../types/tap-trading";

// ─── Constants ──────────────────────────────────────────────────

const SPARKLINE_RATIO = 0.37; // Left 37% for sparkline
const PRICE_LABEL_WIDTH = 75; // Width reserved for price labels on right
const TIME_LABEL_HEIGHT = 28; // Height reserved for time labels on bottom
const SPARKLINE_Y_AMPLIFY = 3.0; // Amplify sparkline Y-movement for visual drama
const VISIBLE_ROWS_PER_SCREEN = 12; // How many rows fit on screen at zoom 1.0 (cell sizing)
const GRID_LINE_COLOR = "rgba(255, 255, 255, 0.08)";
const SPARKLINE_COLOR = "#A78BFA"; // Primary accent (pastel purple)
const SPARKLINE_GLOW_COLOR = "rgba(167, 139, 250, 0.15)";
const MULTIPLIER_COLOR = "rgba(255, 255, 255, 0.45)";
const PRICE_BADGE_COLOR = "#E91E8C"; // Pink/magenta
const DIMMED_OVERLAY_COLOR = "rgba(0, 0, 0, 0.45)";
const TILE_ACTIVE_COLOR = "rgba(167, 139, 250, 0.25)";
const TILE_ACTIVE_BORDER = "#A78BFA";
const TILE_WON_COLOR = "rgba(47, 213, 117, 0.5)";
const TILE_LOST_COLOR = "rgba(239, 68, 68, 0.35)";
const RIPPLE_DURATION_MS = 1400; // How long the grid-cell ripple lasts
const RIPPLE_MAX_DIST = 6; // Max cell distance the ripple reaches
const RIPPLE_COLOR = "167, 139, 250"; // Purple RGB for cell tint
const BG_COLOR = "#050608";

// ─── Types ──────────────────────────────────────────────────────

type TapCanvasProps = {
  gridConfig: GridConfig | null;
  multipliers: number[][];
  activePositions: TapPosition[];
  currentPrice: number;
  priceHistory: Array<{ time: number; price: number }>;
  settings: TapSettings;
  zoomLevel?: number;
  isMobile?: boolean;
  onCellTap?: (row: number, col: number, timeStart: number, timeEnd: number) => void;
};

// ─── Helper: format price ───────────────────────────────────────

function formatPrice(price: number): string {
  if (price >= 10000) return price.toFixed(0);
  if (price >= 1000) return price.toFixed(1);
  if (price >= 1) return price.toFixed(2);
  if (price >= 0.01) return price.toFixed(4);
  return price.toFixed(6);
}

function formatPriceAbbreviated(price: number): string {
  if (price >= 100000) return `${(price / 1000).toFixed(1)}K`;
  if (price >= 10000) return `${(price / 1000).toFixed(2)}K`;
  if (price >= 1000) return price.toFixed(0);
  if (price >= 1) return price.toFixed(2);
  if (price >= 0.01) return price.toFixed(4);
  return price.toFixed(6);
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  const s = d.getSeconds().toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

// ─── Helper: get multiplier color ───────────────────────────────

function getMultiplierAlpha(mult: number, min: number, max: number): number {
  const t = Math.min(1, (mult - min) / (max - min));
  return 0.3 + t * 0.5; // 0.3 to 0.8
}

function getHeatmapColor(mult: number, min: number, max: number): string {
  const t = Math.min(1, (mult - min) / (max - min));
  // Green → Yellow → Red
  const r = Math.round(t < 0.5 ? t * 2 * 255 : 255);
  const g = Math.round(t < 0.5 ? 255 : (1 - (t - 0.5) * 2) * 255);
  return `rgba(${r}, ${g}, 50, 0.6)`;
}

// ─── Component ──────────────────────────────────────────────────

export function TapCanvas({
  gridConfig,
  multipliers,
  activePositions,
  currentPrice,
  priceHistory,
  settings,
  zoomLevel: zoomLevelProp = 1.0,
  isMobile = false,
  onCellTap,
}: TapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const lastRenderTimeRef = useRef<number>(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const gridStartTimeRef = useRef<number>(Date.now());
  const zoomLevel = zoomLevelProp;

  // Hover state for showing price labels
  const hoveredCellRef = useRef<{ row: number; col: number } | null>(null);

  // Smooth viewport tracking: the viewport Y-offset lerps to keep current price centered
  const viewportOffsetRef = useRef<number>(0);
  const viewportInitializedRef = useRef<boolean>(false);
  const LERP_SPEED = 0.06; // Smooth tracking (6% per frame — gives eye time to see grid slide)

  // ─── Smooth grid config transitions ─────────────────────────
  // When gridConfig.price_high/price_low change (grid re-centering), the sparkline
  // Y-scale would snap instantly causing visible warping. Instead, we lerp between
  // old and new config values over ~500ms for a smooth visual transition.
  const prevConfigRef = useRef<{ price_high: number; price_low: number } | null>(null);
  const configTransitionStartRef = useRef<number>(0);
  const CONFIG_TRANSITION_MS = 500;

  useEffect(() => {
    if (!gridConfig) return;
    const prev = prevConfigRef.current;
    if (prev && (prev.price_high !== gridConfig.price_high || prev.price_low !== gridConfig.price_low)) {
      // Config changed — start a transition from the old values
      configTransitionStartRef.current = Date.now();
    }
    prevConfigRef.current = { price_high: gridConfig.price_high, price_low: gridConfig.price_low };
  }, [gridConfig?.price_high, gridConfig?.price_low]);

  // ─── Resize observer ────────────────────────────────────────

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width: Math.floor(width), height: Math.floor(height) });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // ─── Compute grid geometry ──────────────────────────────────

  const geometry = useMemo(() => {
    if (!gridConfig || dimensions.width === 0) return null;

    const { width, height } = dimensions;
    const dpr = window.devicePixelRatio || 1;

    // Responsive constants: mobile gets more grid space, fewer rows for bigger cells
    const sparkRatio = isMobile ? 0.28 : SPARKLINE_RATIO;
    const priceLabelW = isMobile ? 55 : PRICE_LABEL_WIDTH;
    const baseVisibleRows = isMobile ? 8 : VISIBLE_ROWS_PER_SCREEN;

    const sparklineBoundaryX = Math.floor(width * sparkRatio);
    const gridAreaWidth = width - sparklineBoundaryX - priceLabelW;
    const gridAreaHeight = height - TIME_LABEL_HEIGHT;

    // Zoom: zoomLevel is magnification (1.0 = 12 rows visible, 3.0 = ~4 rows zoomed in)
    // Cell size is based on VISIBLE_ROWS_PER_SCREEN, NOT total data rows.
    // The grid may have 36+ data rows for buffer, but only ~12 fit on screen at once.
    const visibleRows = Math.round(Math.max(4, baseVisibleRows / zoomLevel));
    const visibleCols = Math.round(Math.max(4, Math.min(gridConfig.col_count, gridConfig.col_count / zoomLevel)));
    const cellWidth = gridAreaWidth / visibleCols;
    const cellHeight = gridAreaHeight / visibleRows;

    return {
      width,
      height,
      dpr,
      sparklineBoundaryX,
      gridAreaWidth,
      gridAreaHeight,
      cellWidth,
      cellHeight,
      rowCount: visibleRows,
      colCount: visibleCols,
    };
  }, [gridConfig, dimensions, zoomLevel]);

  // ─── Price → World Y mapping ────────────────────────────────
  // World Y = row 0 top is Y=0, increasing downward.
  // priceToWorldY: maps a price to its Y position in world space.
  // priceToScreenY: maps a price to its Y on screen (world Y - viewport offset).

  const priceToWorldY = useCallback(
    (price: number): number => {
      if (!gridConfig || !geometry) return 0;
      // Price decreases downward: price_high is at Y=0, price_low at bottom
      return ((gridConfig.price_high - price) / gridConfig.row_height) * geometry.cellHeight;
    },
    [gridConfig, geometry]
  );

  const priceToScreenY = useCallback(
    (price: number): number => {
      return priceToWorldY(price) - viewportOffsetRef.current;
    },
    [priceToWorldY]
  );

  // ─── Column X position (with sub-column scroll offset) ──────

  const getColX = useCallback(
    (colIndex: number): number => {
      if (!gridConfig || !geometry) return 0;
      const now = Date.now();
      const gridStartTime = gridStartTimeRef.current;
      const elapsed = now - gridStartTime;
      const subColProgress = (elapsed % gridConfig.interval_ms) / gridConfig.interval_ms;
      const scrollOffsetX = subColProgress * geometry.cellWidth;
      return geometry.sparklineBoundaryX + colIndex * geometry.cellWidth - scrollOffsetX;
    },
    [gridConfig, geometry]
  );

  // ─── screenToCell: inverse mapping for tap detection ────────

  const screenToCell = useCallback(
    (screenX: number, screenY: number): { row: number; col: number } | null => {
      if (!gridConfig || !geometry) return null;

      // Must be in grid area
      if (screenX < geometry.sparklineBoundaryX || screenX > geometry.sparklineBoundaryX + geometry.gridAreaWidth) {
        return null;
      }
      if (screenY > geometry.gridAreaHeight) return null;

      const now = Date.now();
      const gridStartTime = gridStartTimeRef.current;
      const elapsed = now - gridStartTime;
      const subColProgress = (elapsed % gridConfig.interval_ms) / gridConfig.interval_ms;
      const scrollOffsetX = subColProgress * geometry.cellWidth;

      const gridX = screenX - geometry.sparklineBoundaryX + scrollOffsetX;
      const col = Math.floor(gridX / geometry.cellWidth);
      if (col < 0 || col >= gridConfig.col_count) return null;

      // Convert screen Y back to world Y, then find the row
      const worldY = screenY + viewportOffsetRef.current;
      const row = Math.floor(worldY / geometry.cellHeight);
      if (row < 0 || row >= gridConfig.row_count) return null;

      return { row, col };
    },
    [gridConfig, geometry, currentPrice]
  );

  // ─── Canvas render loop ─────────────────────────────────────

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !geometry || !gridConfig) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height, dpr, sparklineBoundaryX, gridAreaWidth, gridAreaHeight, cellWidth, cellHeight, rowCount, colCount } = geometry;

    // Set canvas size accounting for DPR
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, width, height);

    // ─── Viewport tracking ─────────────────────────────────
    // The viewport Y-offset smoothly follows the current price so the
    // sparkline dot stays near the center of the screen, while the
    // grid rows (with fixed multipliers) scroll vertically behind it.

    const now = Date.now();
    const gridStartTime = gridStartTimeRef.current;
    const elapsed = now - gridStartTime;
    const subColProgress = (elapsed % gridConfig.interval_ms) / gridConfig.interval_ms;
    const scrollOffsetX = subColProgress * cellWidth;

    // Target viewport offset: place current price at screen center
    const currentPriceWorldY = ((gridConfig.price_high - currentPrice) / gridConfig.row_height) * cellHeight;
    const rawTarget = currentPriceWorldY - gridAreaHeight * 0.5;

    // Clamp viewport so it never flies to extreme positions when price escapes grid range.
    // This prevents the "prices cycle to top" bug when price spikes far outside bounds.
    const maxWorldHeight = gridConfig.row_count * cellHeight;
    const targetViewportOffset = Math.max(
      -gridAreaHeight * 0.5,
      Math.min(maxWorldHeight - gridAreaHeight * 0.5, rawTarget)
    );

    if (!viewportInitializedRef.current) {
      viewportOffsetRef.current = targetViewportOffset;
      viewportInitializedRef.current = true;
    } else {
      // Smooth lerp toward target
      viewportOffsetRef.current += (targetViewportOffset - viewportOffsetRef.current) * LERP_SPEED;
    }

    const vpOffset = viewportOffsetRef.current;

    // ─── Draw grid lines ───────────────────────────────────

    const opacity = (settings.gridLineOpacity ?? 20) / 100;
    ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.4})`;
    ctx.lineWidth = 0.5;

    if (settings.gridLineStyle === "dashed") {
      ctx.setLineDash([4, 4]);
    } else if (settings.gridLineStyle === "dotted") {
      ctx.setLineDash([1, 3]);
    } else {
      ctx.setLineDash([]);
    }

    // Horizontal grid lines (one per row boundary)
    // Draw enough rows to cover the screen even when scrolled
    const totalRows = gridConfig.row_count;
    for (let r = 0; r <= totalRows; r++) {
      const worldY = r * cellHeight;
      const screenY = worldY - vpOffset;
      if (screenY < -cellHeight || screenY > gridAreaHeight + cellHeight) continue;
      ctx.beginPath();
      ctx.moveTo(sparklineBoundaryX, screenY);
      ctx.lineTo(sparklineBoundaryX + gridAreaWidth + cellWidth, screenY);
      ctx.stroke();
    }

    // Vertical grid lines (one per column boundary)
    // Scrolling column lines — fade near dot (left) and at right edge
    const gridBaseAlpha = opacity * 0.4;
    for (let c = 0; c <= colCount + 2; c++) {
      const colX = sparklineBoundaryX + c * cellWidth - scrollOffsetX;
      if (colX < sparklineBoundaryX || colX > sparklineBoundaryX + gridAreaWidth + cellWidth * 2) continue;

      // Fade near left (dot) and right edges
      let lineAlpha = 1.0;
      const distFromDot = colX - sparklineBoundaryX;
      if (distFromDot < cellWidth) {
        lineAlpha = distFromDot / cellWidth;
      }
      const distFromRight = (sparklineBoundaryX + gridAreaWidth) - colX;
      if (distFromRight < cellWidth * 2) {
        lineAlpha = Math.min(lineAlpha, Math.max(0, distFromRight / (cellWidth * 2)));
      }

      ctx.strokeStyle = `rgba(255, 255, 255, ${gridBaseAlpha * lineAlpha})`;
      ctx.beginPath();
      ctx.moveTo(colX, 0);
      ctx.lineTo(colX, gridAreaHeight);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // ─── Grid-cell ripple effect ─────────────────────────
    // When a trade is placed, nearby grid cells temporarily get a purple
    // tint that radiates outward from the trade cell. The "wave front"
    // moves outward at a fixed speed, and cells behind the front get a
    // fading purple overlay.

    const fullColumnsForRipple = Math.floor(elapsed / gridConfig.interval_ms);
    for (const pos of activePositions) {
      if (!pos.created_at) continue;
      const rippleAge = now - pos.created_at;
      if (rippleAge >= RIPPLE_DURATION_MS) continue;

      const progress = rippleAge / RIPPLE_DURATION_MS; // 0→1
      // The wave front expands over time
      const waveFront = progress * RIPPLE_MAX_DIST;

      // Position's visual column
      const posAbsCol = (pos.time_start - gridStartTime) / gridConfig.interval_ms;
      const posVisCol = posAbsCol - fullColumnsForRipple;

      // Iterate over nearby cells and tint them
      for (let dr = -RIPPLE_MAX_DIST; dr <= RIPPLE_MAX_DIST; dr++) {
        for (let dc = -RIPPLE_MAX_DIST; dc <= RIPPLE_MAX_DIST; dc++) {
          if (dr === 0 && dc === 0) continue; // Skip the trade cell itself

          const dist = Math.sqrt(dr * dr + dc * dc);
          if (dist > waveFront || dist > RIPPLE_MAX_DIST) continue;

          // Compute how far behind the wave front this cell is
          const behindWave = waveFront - dist;
          // Cells right at the wave front are brightest, cells behind fade
          const waveFade = Math.max(0, 1 - behindWave / (RIPPLE_MAX_DIST * 0.6));
          // Overall fade as the ripple progresses
          const timeFade = 1 - progress;
          const alpha = waveFade * timeFade * 0.35;
          if (alpha < 0.01) continue;

          const targetRow = pos.row_index + dr;
          const targetVisCol = posVisCol + dc;

          // Compute screen position of this cell
          const cellX = sparklineBoundaryX + targetVisCol * cellWidth - scrollOffsetX;
          const cellY = targetRow * cellHeight - vpOffset;

          // Skip if off-screen
          if (cellX + cellWidth < sparklineBoundaryX || cellX > sparklineBoundaryX + gridAreaWidth) continue;
          if (cellY + cellHeight < 0 || cellY > gridAreaHeight) continue;

          ctx.fillStyle = `rgba(${RIPPLE_COLOR}, ${alpha})`;
          ctx.fillRect(cellX, cellY, cellWidth, cellHeight);
        }
      }
    }

    // ─── Draw multiplier text + hover price labels in cells ──

    const hovered = hoveredCellRef.current;

    if (multipliers.length > 0) {
      const fontSize = Math.max(9, Math.min(14, cellWidth * 0.18));
      const priceFontSize = Math.max(7, fontSize * 0.7);
      ctx.font = `600 ${fontSize}px -apple-system, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Right edge: cells fade in over ~2 cell widths for a gradual entrance
      const fadeInWidth = cellWidth * 2;
      // Left edge: cells fade out over ~1 cell width as they approach the dot
      const fadeOutWidth = cellWidth;

      for (let r = 0; r < totalRows && r < multipliers.length; r++) {
        const worldY = r * cellHeight;
        const screenY = worldY - vpOffset;

        // Skip if row is off-screen vertically
        if (screenY + cellHeight < 0 || screenY > gridAreaHeight) continue;

        // Compute full columns elapsed once for the row loop
        const fullColsNow = Math.floor((now - gridStartTime) / gridConfig.interval_ms);
        const MIN_TIME_BUFFER = gridConfig.min_time_buffer_ms || 2000;

        for (let c = 0; c < colCount + 2 && c < (multipliers[r]?.length ?? 0); c++) {
          const mult = multipliers[r][c];
          if (!mult || mult <= 0) continue;

          // Check if this cell has an active trade (skip multiplier text if so).
          const hasActiveTrade = activePositions.some((p) => {
            if (p.row_index !== r || (p.status !== "active" && p.status !== "pending")) return false;
            const posAbsCol = Math.floor((p.time_start - gridStartTime) / gridConfig.interval_ms);
            return (posAbsCol - fullColsNow) === c;
          });
          if (hasActiveTrade) continue;

          const cellX = sparklineBoundaryX + c * cellWidth - scrollOffsetX;
          const cellCenterX = cellX + cellWidth / 2;

          // Hide column once its left edge passes the dot
          if (cellX < sparklineBoundaryX) continue;

          // Skip if completely off-screen to the right
          if (cellX > sparklineBoundaryX + gridAreaWidth + fadeInWidth) continue;

          // ─── Bubble zone: gradient of 0.0x multipliers near the dot ─────
          const BUBBLE_HARD_LOCK = 2;
          const BUBBLE_TRANSITION = 3;
          const colAbsoluteTime = gridStartTime + (fullColsNow + c) * gridConfig.interval_ms;
          const colTimeEnd = colAbsoluteTime + gridConfig.interval_ms;
          const colTimeRemaining = colTimeEnd - now;
          const isTimeLocked = colTimeRemaining < MIN_TIME_BUFFER;
          const isBubbleLocked = c < BUBBLE_HARD_LOCK;
          const isBubbleTransition = c === BUBBLE_HARD_LOCK;
          const isLocked = isTimeLocked || isBubbleLocked;

          // Left edge fade-out
          let edgeAlpha = 1.0;
          const distFromDot = cellX - sparklineBoundaryX;
          if (distFromDot < fadeOutWidth) {
            edgeAlpha = distFromDot / fadeOutWidth;
          }

          // Right edge fade-in
          const distPastRight = cellX - (sparklineBoundaryX + gridAreaWidth - cellWidth);
          if (distPastRight > 0) {
            edgeAlpha = Math.min(edgeAlpha, Math.max(0, 1 - distPastRight / fadeInWidth));
          }
          if (edgeAlpha <= 0.01) continue;

          // Check if this cell is hovered
          const isHovered = hovered && hovered.row === r && hovered.col === c;

          // Draw hover highlight
          if (isHovered) {
            ctx.fillStyle = `rgba(255, 255, 255, 0.04)`;
            ctx.fillRect(cellX, screenY, cellWidth, cellHeight);
          }

          // Draw multiplier text
          ctx.font = `600 ${fontSize}px -apple-system, system-ui, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          if (isLocked) {
            ctx.fillStyle = `rgba(255, 255, 255, ${0.15 * edgeAlpha})`;
            ctx.fillText("0.0x", cellCenterX, screenY + cellHeight / 2 - (isHovered ? priceFontSize * 0.4 : 0));
          } else if (isBubbleTransition) {
            const decayedMult = mult * 0.15;
            const text = decayedMult >= 1 ? `${decayedMult.toFixed(1)}x` : `${decayedMult.toFixed(2)}x`;
            ctx.fillStyle = `rgba(255, 255, 255, ${0.25 * edgeAlpha})`;
            ctx.fillText(text, cellCenterX, screenY + cellHeight / 2 - (isHovered ? priceFontSize * 0.4 : 0));
          } else {
            ctx.fillStyle = `rgba(255, 255, 255, ${0.45 * edgeAlpha})`;
            const text = mult >= 10 ? `${mult.toFixed(1)}x` : `${mult.toFixed(2)}x`;
            ctx.fillText(text, cellCenterX, screenY + cellHeight / 2 - (isHovered ? priceFontSize * 0.4 : 0));
          }

          // Draw abbreviated price below multiplier on hover
          if (isHovered) {
            const rowCenterPrice = gridConfig.price_high - (r + 0.5) * gridConfig.row_height;
            const priceLabel = formatPriceAbbreviated(rowCenterPrice);
            ctx.font = `500 ${priceFontSize}px -apple-system, system-ui, sans-serif`;
            ctx.fillStyle = `rgba(167, 139, 250, ${0.6 * edgeAlpha})`;
            ctx.fillText(priceLabel, cellCenterX, screenY + cellHeight / 2 + priceFontSize * 0.8);
          }
        }
      }
    }

    // ─── Left edge: black out columns + bubble zone overlay ────
    // Column disappears the instant it touches the dot — period closed.
    // Bubble zone columns (0-2) get graduated dark overlays.
    {
      const fullColsNowBlackout = Math.floor(elapsed / gridConfig.interval_ms);
      const MIN_TIME_BUFFER_BLACKOUT = gridConfig.min_time_buffer_ms || 2000;
      const BUBBLE_HARD_LOCK_BO = 2;  // Cols 0-1: hard locked
      const BUBBLE_TRANSITION_BO = 3; // Col 2: transition

      for (let c = 0; c <= gridConfig.col_count; c++) {
        const colX = sparklineBoundaryX + c * cellWidth - scrollOffsetX;
        if (colX < sparklineBoundaryX) {
          // Fully expired — black out
          ctx.fillStyle = BG_COLOR;
          ctx.fillRect(colX, 0, cellWidth + 1, gridAreaHeight);
        } else if (colX < sparklineBoundaryX + gridAreaWidth) {
          const colAbsTime = gridStartTime + (fullColsNowBlackout + c) * gridConfig.interval_ms;
          const colTimeEnd = colAbsTime + gridConfig.interval_ms;
          const colTimeRemaining = colTimeEnd - now;

          if (c < BUBBLE_HARD_LOCK_BO) {
            // Bubble hard lock: dark overlay (strongest nearest to dot)
            const overlayAlpha = c === 0 ? 0.45 : 0.35;
            ctx.fillStyle = `rgba(0, 0, 0, ${overlayAlpha})`;
            ctx.fillRect(colX, 0, cellWidth, gridAreaHeight);
          } else if (c < BUBBLE_TRANSITION_BO) {
            // Bubble transition: lighter overlay
            ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
            ctx.fillRect(colX, 0, cellWidth, gridAreaHeight);
          } else if (colTimeRemaining < MIN_TIME_BUFFER_BLACKOUT && colTimeRemaining > 0) {
            // Time-based near-expiry overlay (for columns not in bubble but about to expire)
            ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
            ctx.fillRect(colX, 0, cellWidth, gridAreaHeight);
          }
        }
      }
    }

    // Redraw the first visible column's left border (blackout may have covered it)
    {
      ctx.lineWidth = 0.5;
      if (settings.gridLineStyle === "dashed") {
        ctx.setLineDash([4, 4]);
      } else if (settings.gridLineStyle === "dotted") {
        ctx.setLineDash([1, 3]);
      } else {
        ctx.setLineDash([]);
      }
      for (let c = 0; c <= colCount; c++) {
        const colX = sparklineBoundaryX + c * cellWidth - scrollOffsetX;
        if (colX >= sparklineBoundaryX && colX <= sparklineBoundaryX + cellWidth) {
          const distFromDot = colX - sparklineBoundaryX;
          const lineAlpha = Math.min(1.0, distFromDot / cellWidth);
          ctx.strokeStyle = `rgba(255, 255, 255, ${gridBaseAlpha * lineAlpha})`;
          ctx.beginPath();
          ctx.moveTo(colX, 0);
          ctx.lineTo(colX, gridAreaHeight);
          ctx.stroke();
          break;
        }
      }
      ctx.setLineDash([]);
    }

    // ─── Draw sparkline (ALWAYS on top of grid) ────────────

    if (priceHistory.length > 1) {
      const historyDuration = gridConfig.col_count * gridConfig.interval_ms;
      const historyStartTime = now - historyDuration;
      const recentHistory = priceHistory.filter((p) => p.time >= historyStartTime);

      if (recentHistory.length > 1) {
        // Sparkline uses an amplified Y-scale for visual drama in its zone,
        // then blends to the grid's Y at the boundary so the dot aligns
        // with the correct grid row.

        // Clip sparkline to its zone
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, sparklineBoundaryX, gridAreaHeight);
        ctx.clip();

        // Map time to X in sparkline zone (no gap — clip region prevents overdraw)
        const sparkXLeft = 16;
        const sparkXRight = sparklineBoundaryX;
        const timeToX = (t: number) => {
          const progress = (t - historyStartTime) / historyDuration;
          return sparkXLeft + progress * (sparkXRight - sparkXLeft);
        };

        // Smooth Y-scale: lerp between previous and current grid config
        // to prevent instant snapping when the grid re-centers.
        const prev = prevConfigRef.current;
        const transitionElapsed = now - configTransitionStartRef.current;
        const configT = configTransitionStartRef.current > 0
          ? Math.min(1, transitionElapsed / CONFIG_TRANSITION_MS)
          : 1; // No transition in progress → use current values directly
        const smoothHigh = prev && configT < 1
          ? prev.price_high + (gridConfig.price_high - prev.price_high) * configT
          : gridConfig.price_high;
        const smoothLow = prev && configT < 1
          ? prev.price_low + (gridConfig.price_low - prev.price_low) * configT
          : gridConfig.price_low;

        const sparkMean = (smoothHigh + smoothLow) / 2;
        const sparkRange = Math.max(smoothHigh - smoothLow, 0.01);
        const sparkYTop = gridAreaHeight * 0.1;
        const sparkYBottom = gridAreaHeight * 0.9;
        const sparkYRange = sparkYBottom - sparkYTop;

        // Amplified Y: maps grid's price range to the full sparkline zone
        const amplifiedY = (price: number) => {
          const normalized = (price - sparkMean) / sparkRange;
          return (sparkYTop + sparkYRange / 2) - normalized * sparkYRange;
        };

        // Append a synthetic "now" point so the sparkline path always reaches the dot
        const historyWithNow = [...recentHistory, { time: now, price: currentPrice }];

        // Grid-aligned Y (using viewport offset)
        const gridY = (price: number) => priceToScreenY(price);

        // The dot position (grid-aligned)
        const dotScreenY = gridY(currentPrice);
        // Center of screen
        const screenCenter = gridAreaHeight * 0.5;

        // Build path points — blend from amplified Y (left) to grid Y (right)
        // The blend completes at 85% of sparkline width so the rightmost 15%
        // is purely grid-aligned, preventing visual misalignment at the boundary.
        // Uses smoothstep(t) = t² × (3 - 2t) which has zero derivative at both ends.
        const blendZoneWidth = (sparkXRight - sparkXLeft) * 0.85;
        const points: Array<{ x: number; y: number }> = [];
        for (let i = 0; i < historyWithNow.length; i++) {
          // Force the last point (synthetic "now") to exactly the boundary X
          // so the sparkline connects perfectly to the dot.
          let x: number;
          const isLastPoint = i === historyWithNow.length - 1;
          if (isLastPoint) {
            x = sparklineBoundaryX; // Exact boundary alignment
          } else {
            x = timeToX(historyWithNow[i].time);
          }
          const price = historyWithNow[i].price;

          // For the last point and any point past the blend zone, use pure grid Y
          // This ensures the sparkline visually connects to the correct grid row
          if (isLastPoint) {
            points.push({ x, y: gridY(price) });
            continue;
          }

          // Smoothstep blend: completes at 85% through the sparkline zone
          const t = Math.max(0, Math.min(1, (x - sparkXLeft) / blendZoneWidth));
          const blend = t * t * (3 - 2 * t); // smoothstep
          const yAmplified = amplifiedY(price);
          const yGrid = gridY(price);
          // During config transitions, force grid-Y for rightmost portion
          const forceGridT = 0.7; // Past 70% of blend zone, bias toward grid Y
          let y: number;
          if (configT < 1 && t > forceGridT) {
            // Transition in progress — use a stronger grid bias to prevent misalignment
            const extraBias = (t - forceGridT) / (1 - forceGridT);
            const adjustedBlend = Math.min(1, blend + extraBias * (1 - blend));
            y = yAmplified * (1 - adjustedBlend) + yGrid * adjustedBlend;
          } else {
            y = yAmplified * (1 - blend) + yGrid * blend;
          }
          points.push({ x, y });
        }

        // Fill gradient under sparkline
        if (points.length > 1) {
          const gradientBottom = Math.min(gridAreaHeight, screenCenter + gridAreaHeight * 0.4);
          const gradient = ctx.createLinearGradient(0, screenCenter - gridAreaHeight * 0.3, 0, gradientBottom);
          gradient.addColorStop(0, "rgba(167, 139, 250, 0.10)");
          gradient.addColorStop(0.5, "rgba(167, 139, 250, 0.03)");
          gradient.addColorStop(1, "rgba(167, 139, 250, 0)");

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.moveTo(points[0].x, gradientBottom);
          for (const pt of points) {
            ctx.lineTo(pt.x, pt.y);
          }
          ctx.lineTo(points[points.length - 1].x, gradientBottom);
          ctx.closePath();
          ctx.fill();
        }

        // Subtle glow
        if (settings.glowIntensity !== "off") {
          ctx.strokeStyle = "rgba(167, 139, 250, 0.10)";
          ctx.lineWidth = 7;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.beginPath();
          for (let i = 0; i < points.length; i++) {
            if (i === 0) ctx.moveTo(points[i].x, points[i].y);
            else ctx.lineTo(points[i].x, points[i].y);
          }
          ctx.stroke();
        }

        // Main sparkline
        ctx.strokeStyle = SPARKLINE_COLOR;
        ctx.lineWidth = settings.sparklineThickness || 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        for (let i = 0; i < points.length; i++) {
          if (i === 0) ctx.moveTo(points[i].x, points[i].y);
          else ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();

        ctx.restore(); // Remove sparkline clip

        // Dot at sparkline boundary — positioned at grid's Y for current price
        const dotX = sparklineBoundaryX;
        const dotY = dotScreenY; // Directly use grid-aligned Y, not blended sparkline Y
        const dotRadius = 7;

        // Dot glow
        ctx.fillStyle = "rgba(167, 139, 250, 0.18)";
        ctx.beginPath();
        ctx.arc(dotX, dotY, dotRadius + 4, 0, Math.PI * 2);
        ctx.fill();

        // Dot
        ctx.fillStyle = SPARKLINE_COLOR;
        ctx.beginPath();
        ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
        ctx.fill();

        // Dot center (white)
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(dotX, dotY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ─── Price labels on right edge ────────────────────────

    if (settings.showPriceLabels !== false) {
      const labelX = sparklineBoundaryX + gridAreaWidth + 8;
      ctx.font = "11px -apple-system, system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";

      for (let r = 0; r <= totalRows; r++) {
        const price = gridConfig.price_high - r * gridConfig.row_height;
        const y = (r * cellHeight) - vpOffset;
        if (y < 0 || y > gridAreaHeight) continue;
        ctx.fillText(formatPrice(price), labelX, y);
      }

      // Current price badge — positioned at current price's Y in the grid
      const badgeY = priceToScreenY(currentPrice);
      const badgeText = formatPrice(currentPrice);
      const badgeWidth = ctx.measureText(badgeText).width + 12;
      ctx.fillStyle = PRICE_BADGE_COLOR;
      const badgeRadius = 4;
      const bx = labelX - 4;
      const by = badgeY - 10;
      const bw = badgeWidth;
      const bh = 20;
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, badgeRadius);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 11px -apple-system, system-ui, sans-serif";
      ctx.fillText(badgeText, bx + 6, badgeY);
    }

    // ─── Time labels on bottom edge ────────────────────────

    if (settings.showTimeLabels !== false) {
      ctx.font = "10px -apple-system, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";

      for (let c = 0; c <= colCount + 2; c++) {
        const colX = sparklineBoundaryX + c * cellWidth - scrollOffsetX;
        if (colX < sparklineBoundaryX || colX > sparklineBoundaryX + gridAreaWidth + cellWidth) continue;
        const colTime = now + (c - subColProgress) * gridConfig.interval_ms;
        ctx.fillText(formatTime(colTime), colX, gridAreaHeight + 6);
      }
    }

    // ─── Active trade tile backgrounds on canvas ──────────

    // How many full columns have scrolled past since gridStartTime
    const fullColumnsElapsed = Math.floor(elapsed / gridConfig.interval_ms);

    for (const pos of activePositions) {
      // Map position's absolute time to current visual column.
      // The grid resets col 0 each interval, so we subtract fullColumnsElapsed
      // to get the visual column index that aligns with the grid cells.
      const posAbsoluteCol = (pos.time_start - gridStartTime) / gridConfig.interval_ms;
      const posVisualCol = posAbsoluteCol - fullColumnsElapsed;
      const cellX = sparklineBoundaryX + posVisualCol * cellWidth - scrollOffsetX;
      const cellY = (pos.row_index * cellHeight) - vpOffset;

      if (cellX + cellWidth < sparklineBoundaryX || cellX > sparklineBoundaryX + gridAreaWidth) continue;
      if (cellY + cellHeight < 0 || cellY > gridAreaHeight) continue;

      let bgColor = TILE_ACTIVE_COLOR;
      let borderColor = TILE_ACTIVE_BORDER;
      if (pos.status === "won") {
        bgColor = TILE_WON_COLOR;
        borderColor = "#2FD575";
      } else if (pos.status === "lost") {
        bgColor = TILE_LOST_COLOR;
        borderColor = "#EF4444";
      }

      // Fill
      ctx.fillStyle = bgColor;
      ctx.fillRect(cellX, cellY, cellWidth, cellHeight);

      // Border
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cellX, cellY, cellWidth, cellHeight);

      // Text inside tile
      if (pos.status === "active" || pos.status === "pending") {
        const tileText = `$${pos.amount} / ${pos.multiplier.toFixed(2)}x`;
        const tileFontSize = Math.max(8, Math.min(12, cellWidth * 0.14));
        ctx.font = `bold ${tileFontSize}px -apple-system, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(tileText, cellX + cellWidth / 2, cellY + cellHeight / 2);
      } else if (pos.status === "won" && pos.payout) {
        const winText = `+$${pos.payout.toFixed(2)}`;
        const tileFontSize = Math.max(8, Math.min(13, cellWidth * 0.15));
        ctx.font = `bold ${tileFontSize}px -apple-system, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#2FD575";
        ctx.fillText(winText, cellX + cellWidth / 2, cellY + cellHeight / 2);
      } else if (pos.status === "lost") {
        const lostText = `-$${pos.amount.toFixed(2)}`;
        const tileFontSize = Math.max(8, Math.min(11, cellWidth * 0.13));
        ctx.font = `bold ${tileFontSize}px -apple-system, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "rgba(239, 68, 68, 0.7)";
        ctx.fillText(lostText, cellX + cellWidth / 2, cellY + cellHeight / 2);
      }

    }
  }, [geometry, gridConfig, multipliers, activePositions, currentPrice, priceHistory, settings, priceToScreenY]);

  // ─── Animation loop ─────────────────────────────────────────

  useEffect(() => {
    let running = true;

    const loop = () => {
      if (!running) return;

      const now = performance.now();
      const delta = now - lastRenderTimeRef.current;

      // Adaptive frame rate: always render (scrolling is continuous)
      // But throttle to ~60fps max
      if (delta >= 16) {
        lastRenderTimeRef.current = now;
        render();
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      running = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [render]);

  // ─── Handle click/tap on canvas ─────────────────────────────

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!onCellTap) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const cell = screenToCell(x, y);
      if (cell && gridConfig) {
        const gridStartTime = gridStartTimeRef.current;
        const elapsedNow = Date.now() - gridStartTime;
        const fullCols = Math.floor(elapsedNow / gridConfig.interval_ms);
        // cell.col is visual (0 = leftmost visible), convert to absolute time
        const absoluteCol = fullCols + cell.col;
        const timeStart = gridStartTime + absoluteCol * gridConfig.interval_ms;
        const timeEnd = timeStart + gridConfig.interval_ms;

        // Block trades on columns in the bubble zone (too close to dot)
        // Cols 0-2 are locked: 0-1 hard lock, col 2 transition (decayed display)
        const BUBBLE_LOCK_TAP = 3;
        if (cell.col < BUBBLE_LOCK_TAP) {
          return; // Column is in the bubble zone — too close to dot
        }

        // Block trades on columns too close to expiry
        const timeRemaining = timeEnd - Date.now();
        const MIN_TIME_BUFFER = gridConfig.min_time_buffer_ms || 2000;
        if (timeRemaining < MIN_TIME_BUFFER) {
          return; // Column is locked — too close to expiry
        }

        onCellTap(cell.row, cell.col, timeStart, timeEnd);
      }
    },
    [onCellTap, screenToCell, gridConfig]
  );

  // ─── Handle mouse hover for price labels ────────────────────

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const cell = screenToCell(x, y);
      const prev = hoveredCellRef.current;

      if (cell) {
        if (!prev || prev.row !== cell.row || prev.col !== cell.col) {
          hoveredCellRef.current = cell;
        }
      } else if (prev) {
        hoveredCellRef.current = null;
      }
    },
    [screenToCell]
  );

  const handleMouseLeave = useCallback(() => {
    hoveredCellRef.current = null;
  }, []);

  // Zoom is now controlled via the zoomLevel prop (set by parent page buttons)

  return (
    <div ref={containerRef} style={containerStyle}>
      <canvas
        ref={canvasRef}
        style={canvasStyle}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      {/* Loading overlay when no grid config */}
      {!gridConfig && (
        <div style={loadingOverlayStyle}>
          <div style={loadingSpinnerStyle} />
          <span style={loadingTextStyle}>Loading grid…</span>
        </div>
      )}
    </div>
  );
}

// ─── Inline styles (not React Native StyleSheet since we need DOM) ─

const containerStyle: React.CSSProperties = {
  flex: 1,
  position: "relative",
  overflow: "hidden",
  backgroundColor: BG_COLOR,
};

const canvasStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  cursor: "crosshair",
};

const loadingOverlayStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 12,
  background: BG_COLOR,
};

const loadingSpinnerStyle: React.CSSProperties = {
  width: 24,
  height: 24,
  border: "2px solid rgba(255, 255, 255, 0.1)",
  borderTopColor: SPARKLINE_COLOR,
  borderRadius: "50%",
  animation: "spin 0.8s linear infinite",
};

const loadingTextStyle: React.CSSProperties = {
  color: "rgba(255, 255, 255, 0.4)",
  fontSize: 13,
  fontFamily: "-apple-system, system-ui, sans-serif",
};
