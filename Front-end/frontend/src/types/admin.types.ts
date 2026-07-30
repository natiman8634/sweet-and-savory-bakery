// src/types/admin.types.ts
import type { Order } from './order.types';

export interface AdminOrderFilters {
  status?: string | null;
  date?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  search?: string | null;
  customer_id?: string | null;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AdminOrdersResponse {
  success: boolean;
  data: Order[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
    filters: {
      status: string | null;
      date: string | null;
      fromDate: string | null;
      toDate: string | null;
      customer_id: string | null;
      search: string | null;
    };
    sorting: {
      sortBy: string;
      sortOrder: string;
    };
    summary: {
      totalOrders: number;
      totalRevenue: number;
      averageOrderValue: number;
      minOrderValue: number;
      maxOrderValue: number;
    };
  };
}

export interface UpdateOrderStatusRequest {
  status_name: string;
}

export interface UpdateOrderStatusResponse {
  success: boolean;
  message: string;
  data: Order;
}

// ──────────────────────────────────────────────
// Dashboard types (from GET /api/admin/dashboard)
// ──────────────────────────────────────────────

export interface DashboardTopProduct {
  product_id: string;
  name: string;
  category: string;
  total_quantity_sold: number;
  price: number;
  revenue: number;
}

export interface DashboardHourlyBreakdown {
  hour: string;
  revenue: number;
  ordersCount: number;
}

export interface DashboardRecentOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: string;
  items: string;
  time: string;
}

export interface DashboardComparison {
  todayRevenue: number;
  yesterdayRevenue: number;
  change: number;
  changeAmount: number;
}

export interface DashboardSummary {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  revenueChangePercentage: number;
  trend: 'up' | 'down';
}

export interface DashboardData {
  date: string;
  summary: DashboardSummary;
  topProducts: DashboardTopProduct[];
  hourlyBreakdown: DashboardHourlyBreakdown[];
  recentOrders: DashboardRecentOrder[];
  comparison: DashboardComparison;
}

export interface DashboardResponse {
  success: boolean;
  data: DashboardData;
}