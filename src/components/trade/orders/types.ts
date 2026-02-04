/**
 * Types for Orders components
 */

import type { Order } from "../../../services/haunt";

export type { Order };

export interface OrdersTableProps {
  orders: Order[];
  loading?: boolean;
  onCancelOrder?: (orderId: string) => void;
  onCancelAllOrders?: () => void;
  onModifyOrder?: (orderId: string) => void;
}

export interface OrderRowProps {
  order: Order;
  onCancel?: () => void;
}

export interface CancelOrderButtonProps {
  orderId: string;
  onCancel: () => void;
  loading?: boolean;
}

export interface OrderStatusBadgeProps {
  status: Order["status"];
}
