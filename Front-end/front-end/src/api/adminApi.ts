import { apiClient } from './client';
import type { Order } from '../types';

// ============================================================
// 📊 DASHBOARD
// ============================================================
export interface DashboardData {
  date: string;
  summary: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    revenueChangePercentage: number;
    trend: 'up' | 'down';
    ordersChangePercentage: number;
    ordersTrend: 'up' | 'down';
    avgChangePercentage: number;
    avgTrend: 'up' | 'down';
    newCustomers: number;
    newCustomersChangePercentage: number;
    newCustomersTrend: 'up' | 'down';
  };
  topProducts: Array<{
    product_id: string;
    name: string;
    category: string;
    total_quantity_sold: number;
    price: number;
    revenue: number;
  }>;
  hourlyBreakdown: Array<{
    hour: string;
    revenue: number;
    ordersCount: number;
  }>;
  recentOrders: Array<{
    id: string;
    customerName: string;
    customerEmail: string;
    total: number;
    status: string;
    items: string;
    time: string;
  }>;
  comparison: {
    todayRevenue: number;
    yesterdayRevenue: number;
    change: number;
    changeAmount: number;
  };
  statusDistribution: Array<{
    name: string;
    value: number;
  }>;
  dailyRevenue: Array<{
    day: string;
    date: string;
    revenue: number;
  }>;
}

export const getDashboardData = async (): Promise<DashboardData> => {
  const response = await apiClient.get('/admin/dashboard');
  return response.data.data;
};

// ============================================================
// 📋 ORDERS
// ============================================================
export interface AdminOrderFilters {
  status?: string;
  date?: string;
  fromDate?: string;
  toDate?: string;
  customer_id?: string;
  search?: string;
  limit?: number;
  offset?: number;
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
    filters: any;
    summary: {
      totalOrders: number;
      totalRevenue: number;
      averageOrderValue: number;
    };
  };
}

export const getAdminOrders = async (params: AdminOrderFilters = {}): Promise<AdminOrdersResponse> => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });
  const response = await apiClient.get(`/admin/orders?${queryParams.toString()}`);
  return response.data;
};

export const updateOrderStatus = async (orderId: string, status: string) => {
  const response = await apiClient.patch(`/admin/orders/${orderId}/status`, { status });
  return response.data;
};

// ============================================================
// 📦 PRODUCTS
// ============================================================
export interface CreateProductData {
  name: string;
  description: string;
  price: number;
  image_url: string;
  category_id: number;
  stock_quantity: number;
  is_available?: boolean;
}

export const getAdminProducts = async (params?: { category?: number; search?: string }) => {
  const queryParams = new URLSearchParams();
  if (params?.category) queryParams.append('category', String(params.category));
  if (params?.search) queryParams.append('search', params.search);
  const response = await apiClient.get(`/admin/products?${queryParams.toString()}`);
  return response.data;
};

export const createProduct = async (data: CreateProductData) => {
  const response = await apiClient.post('/admin/products', data);
  return response.data;
};

export const updateProduct = async (id: string, data: Partial<CreateProductData>) => {
  const response = await apiClient.patch(`/admin/products/${id}`, data);
  return response.data;
};

export const deleteProduct = async (id: string) => {
  const response = await apiClient.delete(`/admin/products/${id}`);
  return response.data;
};

export const toggleProductAvailability = async (id: string) => {
  const response = await apiClient.patch(`/admin/products/${id}/toggle-availability`);
  return response.data;
};

// ============================================================
// 👤 USERS
// ============================================================
export const getAdminUsers = async (params?: { role?: string; page?: number; limit?: number }) => {
  const queryParams = new URLSearchParams();
  if (params?.role) queryParams.append('role', params.role);
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));
  const response = await apiClient.get(`/admin/users?${queryParams.toString()}`);
  return response.data;
};

export const updateUserRole = async (userId: string, roleId: number) => {
  const response = await apiClient.patch(`/admin/users/${userId}/role`, { role_id: roleId });
  return response.data;
};

export const deleteUser = async (userId: string) => {
  const response = await apiClient.delete(`/admin/users/${userId}`);
  return response.data;
};