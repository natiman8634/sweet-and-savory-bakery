/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/immutability */
// src/pages/OrderDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrders } from '../hooks/useOrders';
import OrderStatusBadge from '../components/orders/OrderStatusBadge';
import OrderStatusTimeline from '../components/orders/OrderStatusTimeline';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatDate, formatCurrency, isOrderCancelable } from '../utils/orderUtils';
import type { Order } from '../types/order.types';

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getOrder, cancelOrder } = useOrders();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');

  useEffect(() => {
    if (id) {
      loadOrder(id);
    }
  }, [id]);

  const loadOrder = async (orderId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOrder(orderId);
      if (data) {
        setOrder(data);
      } else {
        setError('Order not found');
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    
    setCancelling(true);
    const success = await cancelOrder(id, cancelReason || 'Customer requested cancellation');
    setCancelling(false);
    setShowCancelModal(false);
    
    if (success && id) {
      await loadOrder(id);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading order details..." />;
  }

  if (error || !order) {
    return (
      <div className="container mx-auto p-4 max-w-3xl">
        <div className="text-center text-red-600 py-12 bg-red-50 rounded-lg">
          <p className="text-lg">⚠️ {error || 'Order not found'}</p>
          <button
            onClick={() => navigate('/orders')}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            ← Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const canCancel = isOrderCancelable(order.status.status_name);

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      {/* Back button */}
      <button
        onClick={() => navigate('/orders')}
        className="text-blue-600 hover:text-blue-800 mb-6 flex items-center gap-2 transition-colors"
      >
        ← Back to Orders
      </button>

      {/* Order Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              Order #{order.id.slice(0, 8)}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Placed on {formatDate(order.created_at)}
            </p>
          </div>
          <OrderStatusBadge status={order.status.status_name} size="lg" />
        </div>
      </div>

      {/* Order Info Grid */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="font-semibold mb-3">Order Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Order Type:</span>
              <span className="capitalize font-medium">{order.order_type}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Scheduled:</span>
              <span>{formatDate(order.scheduled_for)}</span>
            </div>
            {order.payment && (
              <>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Payment:</span>
                  <span className="capitalize">{order.payment.payment_method}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Payment Status:</span>
                  <span className="capitalize font-medium">{order.payment.payment_status}</span>
                </div>
                {order.payment.paid_at && (
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-500">Paid At:</span>
                    <span>{formatDate(order.payment.paid_at)}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="font-semibold mb-3">Actions</h3>
          <div className="space-y-3">
            {canCancel ? (
              <button
                onClick={() => setShowCancelModal(true)}
                className="w-full bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors disabled:opacity-50"
                disabled={cancelling}
              >
                {cancelling ? 'Processing...' : 'Cancel Order'}
              </button>
            ) : (
              <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
                {order.status.status_name === 'Cancelled' 
                  ? 'This order has been cancelled' 
                  : 'This order cannot be cancelled'}
              </p>
            )}
            <button
              onClick={() => window.print()}
              className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
            >
              Print Order
            </button>
          </div>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="font-semibold mb-4">Order Progress</h3>
        <OrderStatusTimeline currentStatus={order.status.status_name} />
      </div>

      {/* Items List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Items</h3>
          <span className="text-sm text-gray-500">
            {order.orderItems.length} item{order.orderItems.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="divide-y">
          {order.orderItems.map((item) => (
            <div key={item.id} className="py-4 flex items-center gap-4 first:pt-0 last:pb-0">
              <img
                src={item.product.image_url || '/placeholder.png'}
                alt={item.product.name}
                className="w-16 h-16 object-cover rounded-lg bg-gray-100"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.png';
                }}
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">{item.product.name}</h4>
                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-semibold">{formatCurrency(Number(item.subtotal))}</p>
                <p className="text-sm text-gray-500">
                  {formatCurrency(Number(item.product.price))} each
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>{formatCurrency(Number(order.total_price))}</span>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Cancel Order</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to cancel order #{order.id.slice(0, 8)}?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason (optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Why are you cancelling?"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                disabled={cancelling}
              >
                Keep Order
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors disabled:opacity-50"
                disabled={cancelling}
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;