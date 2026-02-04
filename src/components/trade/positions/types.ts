/**
 * Types for Positions components
 */

import type { Position } from "../../../services/haunt";

export type { Position };

export interface PositionsTableProps {
  positions: Position[];
  loading?: boolean;
  onClosePosition?: (positionId: string) => void;
  onModifyPosition?: (positionId: string) => void;
  updatedPositionIds?: Set<string>; // Positions with recent updates (for flash effect)
}

export interface PositionRowProps {
  position: Position;
  onClose?: () => void;
  onModify?: () => void;
}

export interface PnLDisplayProps {
  value: number;
  percentage?: number;
  size?: "small" | "medium" | "large";
}

export interface ClosePositionButtonProps {
  positionId: string;
  onClose: () => void;
  loading?: boolean;
}

export interface ModifyPositionModalProps {
  position: Position;
  isOpen: boolean;
  onClose: () => void;
  onSave: (stopLoss?: number, takeProfit?: number) => void;
}
