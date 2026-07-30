// src/api/admin.api.ts
import apiClient from './client';
import type {
  AdminOrdersResponse,
  AdminOrderFilters,
  UpdateOrderStatusResponse,
  DashboardResponse
} from '../types/admin.types';

export const adminApi = {
  // Get all orders with filters
  getAllOrders: (params?: AdminOrderFilters): Promise<AdminOrdersResponse> => {
    console.log('📤 [Admin] Fetching all orders with params:', params);
    return apiClient.get<AdminOrdersResponse>('/api/admin/orders', params);
  },

  // Update order status
  updateOrderStatus: (id: string, status_name: string): Promise<UpdateOrderStatusResponse> => {
    console.log(`📤 [Admin] Updating order ${id} to status: ${status_name}`);
    return apiClient.patch<UpdateOrderStatusResponse>(`/api/admin/orders/${id}/status`, { status_name });
  },

  // Export orders to CSV
  exportOrders: (params?: { fromDate?: string; toDate?: string }): Promise<Blob> => {
    console.log('📤 [Admin] Exporting orders with params:', params);
    return apiClient.get<Blob>('/api/admin/orders/export', {
      ...params,
      responseType: 'blob'
    });
  },

  // Get dashboard data (uses dedicated endpoint instead of fetching all orders)
  getDashboardData: (): Promise<DashboardResponse> => {
    console.log('📤 [Admin] Fetching dashboard data');
    return apiClient.get<DashboardResponse>('/api/admin/dashboard');
  }
};

export const getAllOrders = adminApi.getAllOrders;
export const updateOrderStatus = adminApi.updateOrderStatus;
export const exportOrders = adminApi.exportOrders;
export const getDashboardData = adminApi.getDashboardData;