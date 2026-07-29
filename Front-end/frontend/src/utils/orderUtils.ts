// src/utils/orderUtils.ts
// src/utils/orderUtils.ts
import type { Order } from '../types/order.types';

export const ORDER_STATUSES = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  PREPARING: 'Preparing',
  READY: 'Ready for Pickup',
  DELIVERY: 'Out for Delivery',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  UNPAID: 'Unpaid'
} as const;

export type OrderStatus = typeof ORDER_STATUSES[keyof typeof ORDER_STATUSES];

export const STATUS_ORDER: OrderStatus[] = [
  ORDER_STATUSES.PENDING,
  ORDER_STATUSES.PROCESSING,
  ORDER_STATUSES.PREPARING,
  ORDER_STATUSES.READY,
  ORDER_STATUSES.DELIVERY,
  ORDER_STATUSES.COMPLETED
];

export const STATUS_COLORS: Record<OrderStatus, string> = {
  [ORDER_STATUSES.PENDING]: 'bg-yellow-100 text-yellow-800',
  [ORDER_STATUSES.PROCESSING]: 'bg-blue-100 text-blue-800',
  [ORDER_STATUSES.PREPARING]: 'bg-purple-100 text-purple-800',
  [ORDER_STATUSES.READY]: 'bg-green-100 text-green-800',
  [ORDER_STATUSES.DELIVERY]: 'bg-indigo-100 text-indigo-800',
  [ORDER_STATUSES.COMPLETED]: 'bg-emerald-100 text-emerald-800',
  [ORDER_STATUSES.CANCELLED]: 'bg-red-100 text-red-800',
  [ORDER_STATUSES.UNPAID]: 'bg-gray-100 text-gray-800'
};

export const STATUS_ICONS: Record<OrderStatus, string> = {
  [ORDER_STATUSES.PENDING]: '⏳',
  [ORDER_STATUSES.PROCESSING]: '🔄',
  [ORDER_STATUSES.PREPARING]: '👨‍🍳',
  [ORDER_STATUSES.READY]: '✅',
  [ORDER_STATUSES.DELIVERY]: '🚚',
  [ORDER_STATUSES.COMPLETED]: '🎉',
  [ORDER_STATUSES.CANCELLED]: '❌',
  [ORDER_STATUSES.UNPAID]: '💰'
};

export const STATUS_MESSAGES: Record<OrderStatus, string> = {
  [ORDER_STATUSES.PENDING]: 'Order received, waiting for confirmation',
  [ORDER_STATUSES.PROCESSING]: 'Processing your order',
  [ORDER_STATUSES.PREPARING]: 'Our bakers are preparing your order',
  [ORDER_STATUSES.READY]: 'Your order is ready for pickup',
  [ORDER_STATUSES.DELIVERY]: 'Your order is out for delivery',
  [ORDER_STATUSES.COMPLETED]: 'Order completed',
  [ORDER_STATUSES.CANCELLED]: 'Order cancelled',
  [ORDER_STATUSES.UNPAID]: 'Payment pending'
};

export const getStatusIndex = (status: string): number => {
  return STATUS_ORDER.indexOf(status as OrderStatus);
};

export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Invalid Date';
  }
};

export const formatCurrency = (amount: number): string => {
  return `$${Number(amount).toFixed(2)}`;
};

export const isOrderCancelable = (status: string): boolean => {
  return ['Pending', 'Unpaid', 'Preparing'].includes(status);
};

export const filterOrdersByStatus = (orders: Order[], status: string | null): Order[] => {
  if (!status) return orders;
  return orders.filter(order => order.status.status_name === status);
};