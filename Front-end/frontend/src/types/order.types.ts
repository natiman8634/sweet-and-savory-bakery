// src/types/order.types.ts

export interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  description?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  subtotal: number;
  product: Product;
}

export interface OrderStatus {
  id: number;
  status_name: string;
}

export interface Payment {
  id: string;
  amount: number;
  payment_method: string;
  payment_status: string;
  paid_at: string | null;
}

export interface Order {
  customer: any;
  id: string;
  customer_id: string | null;
  total_price: number;
  order_type: string;
  scheduled_for: string;
  created_at: string;
  updated_at?: string;
  status_id: number;
  status: OrderStatus;
  orderItems: OrderItem[];
  payment?: Payment | null;
}

export interface OrdersResponse {
  success: boolean;
  data: Order[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface OrderDetailResponse {
  success: boolean;
  data: Order;
}

export interface CancelOrderResponse {
  success: boolean;
  message: string;
}

export interface CancelOrderRequest {
  reason?: string;
}

export interface GetOrdersParams {
  page?: number;
  limit?: number;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export type OrderStatusType = 
  | 'Pending'
  | 'Processing'
  | 'Preparing'
  | 'Ready for Pickup'
  | 'Out for Delivery'
  | 'Completed'
  | 'Cancelled'
  | 'Unpaid';

export const ORDER_STATUSES: Record<string, OrderStatusType> = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  PREPARING: 'Preparing',
  READY: 'Ready for Pickup',
  DELIVERY: 'Out for Delivery',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  UNPAID: 'Unpaid'
};