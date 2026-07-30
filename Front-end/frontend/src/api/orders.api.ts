// src/api/orders.api.ts
import apiClient from './client.ts';
import type {
  OrdersResponse,
  OrderDetailResponse,
  CancelOrderResponse,
  CancelOrderRequest,
  GetOrdersParams
} from '../types/order.types';

export const ordersApi = {
  // Get my orders with pagination and filters
  getMyOrders: (params?: GetOrdersParams): Promise<OrdersResponse> => {
    console.log('📤 getMyOrders called with params:', params); // ✅ Debug
    console.log('🔑 Token in localStorage:', localStorage.getItem('token') ? 'Present' : 'Missing'); // ✅ Debug
    return apiClient.get<OrdersResponse>('/api/orders/my-orders', params)
      .then(response => {
        console.log('📥 getMyOrders response:', response); // ✅ Debug
        return response;
      })
      .catch(error => {
        console.error('❌ getMyOrders error:', error); // ✅ Debug
        throw error;
      });
  },

  // Get single order by ID
  getOrderById: (id: string): Promise<OrderDetailResponse> => {
    console.log('📤 getOrderById called with id:', id); // ✅ Debug
    return apiClient.get<OrderDetailResponse>(`/api/orders/${id}`)
      .then(response => {
        console.log('📥 getOrderById response:', response); // ✅ Debug
        return response;
      })
      .catch(error => {
        console.error('❌ getOrderById error:', error);
        throw error;
      });
  },

  // Cancel order
  cancelOrder: (id: string, reason?: string): Promise<CancelOrderResponse> => {
    console.log('📤 cancelOrder called with id:', id, 'reason:', reason); // ✅ Debug
    return apiClient.put<CancelOrderResponse>(`/api/orders/${id}/cancel`, { reason } as CancelOrderRequest)
      .then(response => {
        console.log('📥 cancelOrder response:', response); // ✅ Debug
        return response;
      })
      .catch(error => {
        console.error('❌ cancelOrder error:', error);
        throw error;
      });
  }
};

export const getMyOrders = ordersApi.getMyOrders;
export const getOrderById = ordersApi.getOrderById;
export const cancelOrder = ordersApi.cancelOrder;