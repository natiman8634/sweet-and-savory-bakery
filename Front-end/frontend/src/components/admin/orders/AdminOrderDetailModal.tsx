// src/components/admin/orders/AdminOrderDetailModal.tsx
import React from 'react';
import type { Order } from '../../../types/order.types';
import { formatDate, formatCurrency } from '../../../utils/orderUtils';
import AdminOrderStatusDropdown from './AdminOrderStatusDropdown';

interface AdminOrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (orderId: string, newStatus: string) => Promise<void>;
}

const AdminOrderDetailModal: React.FC<AdminOrderDetailModalProps> = ({
  order,
  isOpen,
  onClose,
  onStatusChange
}) => {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold">Order #{order.id.slice(0, 8)}</h2>
            <p className="text-sm text-gray-500">Placed on {formatDate(order.created_at)}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Status */}
        <div className="flex items-center gap-4 mb-6">
          <span className="text-sm font-medium text-gray-700">Status:</span>
          <AdminOrderStatusDropdown
            order={order}
            onStatusChange={onStatusChange}
          />
        </div>

        {/* Customer Info */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h3 className="font-semibold mb-2">Customer Information</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500">Name:</span>
              <span className="ml-2 font-medium">{order.customer?.full_name || 'Guest'}</span>
            </div>
            <div>
              <span className="text-gray-500">Email:</span>
              <span className="ml-2">{order.customer?.user?.email || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500">Phone:</span>
              <span className="ml-2">{order.customer?.phone || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500">Order Type:</span>
              <span className="ml-2 capitalize">{order.order_type}</span>
            </div>
            <div>
              <span className="text-gray-500">Scheduled:</span>
              <span className="ml-2">{formatDate(order.scheduled_for)}</span>
            </div>
            <div>
              <span className="text-gray-500">Total:</span>
              <span className="ml-2 font-bold">{formatCurrency(Number(order.total_price))}</span>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Items ({order.orderItems.length})</h3>
          <div className="bg-gray-50 rounded-lg divide-y">
            {order.orderItems.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-3">
                <img
                  src={item.product.image_url || '/placeholder.png'}
                  alt={item.product.name}
                  className="w-12 h-12 object-cover rounded"
                />
                <div className="flex-1">
                  <div className="font-medium">{item.product.name}</div>
                  <div className="text-sm text-gray-500">Qty: {item.quantity}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatCurrency(Number(item.subtotal))}</div>
                  <div className="text-sm text-gray-500">
                    {formatCurrency(Number(item.product.price))} each
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment */}
        {order.payment && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Payment Information</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Method:</span>
                <span className="ml-2 capitalize">{order.payment.payment_method}</span>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <span className="ml-2 capitalize">{order.payment.payment_status}</span>
              </div>
              {order.payment.paid_at && (
                <div className="col-span-2">
                  <span className="text-gray-500">Paid At:</span>
                  <span className="ml-2">{formatDate(order.payment.paid_at)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetailModal;