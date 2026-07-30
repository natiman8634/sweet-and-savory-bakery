/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/hooks/useOrders.ts
import { useState, useEffect, useCallback } from 'react';
import type { Order, GetOrdersParams } from '../types/order.types';
import { getMyOrders, getOrderById, cancelOrder } from '../api/orders.api';

interface UseOrdersResult {
  orders: Order[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
  status: string | null;
  hasMore: boolean;
  fetchOrders: (params?: GetOrdersParams) => Promise<void>;
  changePage: (page: number) => void;
  changeStatus: (status: string | null) => void;
  getOrder: (id: string) => Promise<Order | null>;
  cancelOrder: (id: string, reason?: string) => Promise<boolean>;
  resetFilters: () => void;
}

export const useOrders = (initialStatus: string | null = null): UseOrdersResult => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [status, setStatus] = useState<string | null>(initialStatus);
  const [hasMore, setHasMore] = useState<boolean>(false);

  const fetchOrders = useCallback(async (params?: GetOrdersParams) => {
    console.log('🔄 fetchOrders called with params:', params);
    
    const token = localStorage.getItem('token');
    console.log('🔑 Token in hook:', token ? `Present (${token.slice(0, 20)}...)` : 'Missing');
    
    setLoading(true);
    setError(null);

    try {
      const response = await getMyOrders({
        page: params?.page || page,
        limit: params?.limit || limit,
        status: params?.status !== undefined ? params.status : status || undefined,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });

      console.log('📦 Orders response in hook:', response);
      console.log('📊 Meta:', response.meta);
      console.log('📋 Data length:', response.data?.length);

      setOrders(response.data || []);
      setTotal(response.meta.total);
      setHasMore(response.meta.hasMore);
      setPage(response.meta.offset / response.meta.limit + 1);
    } catch (err: any) {
      console.error('❌ Hook error:', err);
      console.error('❌ Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(err.response?.data?.message || err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [page, limit, status]);

  const changePage = useCallback((newPage: number) => {
    console.log('📄 changePage called:', newPage);
    if (newPage < 1) return;
    setPage(newPage);
    fetchOrders({ page: newPage });
  }, [fetchOrders]);

  const changeStatus = useCallback((newStatus: string | null) => {
    console.log('🏷️ changeStatus called:', newStatus);
    setStatus(newStatus);
    setPage(1);
    fetchOrders({ page: 1, status: newStatus || undefined });
  }, [fetchOrders]);

  const getOrder = useCallback(async (id: string): Promise<Order | null> => {
    console.log('📋 getOrder called with id:', id);
    try {
      const response = await getOrderById(id);
      console.log('📋 getOrder response:', response);
      return response.data;
    } catch (err: any) {
      console.error('❌ getOrder error:', err);
      setError(err.response?.data?.message || 'Failed to fetch order details');
      return null;
    }
  }, []);

  const cancelOrderById = useCallback(async (id: string, reason?: string): Promise<boolean> => {
    console.log('❌ cancelOrder called with id:', id, 'reason:', reason);
    try {
      await cancelOrder(id, reason);
      console.log('✅ Order cancelled successfully');
      await fetchOrders();
      return true;
    } catch (err: any) {
      console.error('❌ cancelOrder error:', err);
      setError(err.response?.data?.message || 'Failed to cancel order');
      return false;
    }
  }, [fetchOrders]);

  const resetFilters = useCallback(() => {
    console.log('🔄 resetFilters called');
    setStatus(null);
    setPage(1);
    fetchOrders({ page: 1, status: undefined });
  }, [fetchOrders]);

  // Initial fetch
  useEffect(() => {
    console.log('🔄 useOrders effect - initial fetch');
    const token = localStorage.getItem('token');
    if (token) {
      fetchOrders();
    } else {
      console.warn('⚠️ No token found in localStorage');
    }
  }, [fetchOrders]);

  return {
    orders,
    loading,
    error,
    total,
    page,
    limit,
    status,
    hasMore,
    fetchOrders,
    changePage,
    changeStatus,
    getOrder,
    cancelOrder: cancelOrderById,
    resetFilters
  };
};