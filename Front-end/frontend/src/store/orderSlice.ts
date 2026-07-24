import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../lib/api';

interface OrderItem {
  product_id: string;
  quantity: number;
  subtotal: number;
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string;
  };
}

interface Order {
  id: string;
  total_price: number;
  order_type: string;
  scheduled_for: string;
  status: {
    id: number;
    status_name: string;
  };
  orderItems: OrderItem[];
  created_at: string;
}

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: OrderState = {
  orders: [],
  currentOrder: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchMyOrders = createAsyncThunk(
  'orders/fetchMyOrders',
  async (params?: { status?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.offset) query.append('offset', String(params.offset));
    
    const response = await apiClient.get(`/api/orders/my-orders?${query.toString()}`);
    return response.data.data;
  }
);

export const fetchOrderById = createAsyncThunk(
  'orders/fetchOrderById',
  async (id: string) => {
    const response = await apiClient.get(`/api/orders/${id}`);
    return response.data.data;
  }
);

export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (data: { order_type: string; scheduled_for?: string; items: { product_id: string; quantity: number }[] }) => {
    const response = await apiClient.post('/api/orders', data);
    return response.data.data;
  }
);

export const createGuestOrder = createAsyncThunk(
  'orders/createGuestOrder',
  async (data: { 
    items: { product_id: string; quantity: number }[];
    order_type: string;
    scheduled_for?: string;
    customer_email: string;
    customer_phone: string;
    customer_name?: string;
  }) => {
    const response = await apiClient.post('/api/orders/guest', data);
    return response.data.data;
  }
);

export const cancelOrder = createAsyncThunk(
  'orders/cancelOrder',
  async ({ id, reason }: { id: string; reason?: string }) => {
    const response = await apiClient.put(`/api/orders/${id}/cancel`, { reason });
    return response.data;
  }
);

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch My Orders
      .addCase(fetchMyOrders.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload;
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch orders';
      })
      // Fetch Order By ID
      .addCase(fetchOrderById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch order';
      })
      // Create Order
      .addCase(createOrder.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentOrder = action.payload;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to create order';
      })
      // Create Guest Order
      .addCase(createGuestOrder.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createGuestOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentOrder = action.payload;
      })
      .addCase(createGuestOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to create guest order';
      })
      // Cancel Order
      .addCase(cancelOrder.fulfilled, (state, action) => {
        // Update order status in the list
        const orderId = action.meta.arg.id;
        const order = state.orders.find(o => o.id === orderId);
        if (order) {
          order.status.status_name = 'Cancelled';
        }
        if (state.currentOrder?.id === orderId) {
          state.currentOrder.status.status_name = 'Cancelled';
        }
      });
  },
});

export const { clearCurrentOrder, clearError } = orderSlice.actions;
export default orderSlice.reducer;