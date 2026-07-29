/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
// src/hooks/useAdminOrders.ts
import { useState, useEffect, useCallback } from 'react';
import { getAllOrders, updateOrderStatus, exportOrders } from '../api/admin.api';
import type { Order } from '../types/order.types';
import type { AdminOrderFilters } from '../types/admin.types';
import { useAuth } from './useAuth.ts';

interface UseAdminOrdersResult {
  orders: Order[];
  loading: boolean;
  error: string | null;
  total: number;
  filters: AdminOrderFilters;
  hasMore: boolean;
  summary: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    minOrderValue: number;
    maxOrderValue: number;
  };
  fetchOrders: (filters?: AdminOrderFilters) => Promise<void>;
  updateStatus: (id: string, status: string) => Promise<void>; // ✅ Changed to Promise<void>
  exportOrdersToCSV: (fromDate?: string, toDate?: string) => Promise<void>;
  setFilters: (filters: AdminOrderFilters) => void;
  resetFilters: () => void;
  changePage: (page: number) => void;
}

const defaultFilters: AdminOrderFilters = {
  page: 1,
  limit: 10,
  sortBy: 'created_at',
  sortOrder: 'desc'
};

export const useAdminOrders = (): UseAdminOrdersResult => {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [filters, setFilters] = useState<AdminOrderFilters>(defaultFilters);
  const [summary, setSummary] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    minOrderValue: 0,
    maxOrderValue: 0
  });

  const fetchOrders = useCallback(async (newFilters?: AdminOrderFilters) => {
    if (!token) {
      setError('Please login to view orders');
      return;
    }

    const currentFilters = newFilters || filters;
    setLoading(true);
    setError(null);

    try {
      const response = await getAllOrders({
        ...currentFilters,
        page: currentFilters.page || 1,
        limit: currentFilters.limit || 10
      });

      setOrders(response.data);
      setTotal(response.meta.total);
      setHasMore(response.meta.hasMore);
      setFilters(currentFilters);
      setSummary(response.meta.summary);
    } catch (err: any) {
      console.error('❌ [Admin] Failed to fetch orders:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [token, filters]);

  // ✅ Changed to Promise<void> - components expect void, not boolean
  const updateStatus = useCallback(async (id: string, status: string): Promise<void> => {
    try {
      await updateOrderStatus(id, status);
      // Refresh orders after update
      await fetchOrders();
    } catch (err: any) {
      console.error('❌ [Admin] Failed to update order status:', err);
      setError(err.response?.data?.message || 'Failed to update order status');
      throw err; // ✅ Throw error so components can handle it
    }
  }, [fetchOrders]);

  const exportOrdersToCSV = useCallback(async (fromDate?: string, toDate?: string) => {
    try {
      const blob = await exportOrders({ fromDate, toDate });
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `orders_${fromDate || 'all'}_to_${toDate || 'all'}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('❌ [Admin] Failed to export orders:', err);
      setError(err.response?.data?.message || 'Failed to export orders');
      throw err;
    }
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
    fetchOrders(defaultFilters);
  }, [fetchOrders]);

  const changePage = useCallback((page: number) => {
    if (page < 1) return;
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    fetchOrders(newFilters);
  }, [filters, fetchOrders]);

  // Initial fetch - re-run when token becomes available (e.g. after auth loads from localStorage)
  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token, fetchOrders]);

  return {
    orders,
    loading,
    error,
    total,
    filters,
    hasMore,
    summary,
    fetchOrders,
    updateStatus,
    exportOrdersToCSV,
    setFilters,
    resetFilters,
    changePage
  };
};