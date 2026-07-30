// src/components/admin/orders/AdminOrderStatusDropdown.tsx
import React, { useState, useMemo } from 'react';
import { STATUS_COLORS } from '../../../utils/orderUtils';
import type { Order } from '../../../types/order.types';

interface AdminOrderStatusDropdownProps {
  order: Order;
  onStatusChange: (orderId: string, newStatus: string) => Promise<void>;
  loading?: boolean;
}

// Valid workflow: each status maps to its possible next statuses
// Terminal statuses (Completed, Cancelled) have no transitions
const STATUS_TRANSITIONS: Record<string, string[]> = {
  'Unpaid': ['Pending', 'Cancelled'],
  'Pending': ['Preparing', 'Cancelled'],
  'Preparing': ['Ready for Pickup', 'Cancelled'],
  'Ready for Pickup': ['Completed'],
  'Out for Delivery': ['Completed'],
  'Completed': [],          // Terminal - no further transitions
  'Cancelled': []           // Terminal - no further transitions
};

const AdminOrderStatusDropdown: React.FC<AdminOrderStatusDropdownProps> = ({
  order,
  onStatusChange,
  loading = false
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(order.status.status_name);

  // Get valid next statuses based on current order status
  const availableStatuses = useMemo(() => {
    const transitions = STATUS_TRANSITIONS[order.status.status_name];
    return transitions || [];
  }, [order.status.status_name]);

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === order.status.status_name) return;
    setSelectedStatus(newStatus);
    setShowConfirm(true);
  };

  const confirmStatusChange = async () => {
    setIsUpdating(true);
    try {
      await onStatusChange(order.id, selectedStatus);
      setShowConfirm(false);
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800';
  };

  const isDisabled = loading || isUpdating || availableStatuses.length === 0;

  return (
    <>
      <div className="relative">
        {availableStatuses.length === 0 ? (
          <span className={`px-3 py-1 text-sm rounded-md inline-block ${getStatusColor(order.status.status_name)}`}>
            {order.status.status_name}
          </span>
        ) : (
          <select
            value={selectedStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={isDisabled}
            className={`px-3 py-1 text-sm rounded-md border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${getStatusColor(selectedStatus)}`}
          >
            <option value={order.status.status_name}>
              {order.status.status_name} (current)
            </option>
            {availableStatuses.map((status) => (
              <option key={status} value={status}>
                {status} ➜
              </option>
            ))}
          </select>
        )}
        {isUpdating && (
          <span className="ml-2 text-xs text-gray-500">Updating...</span>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-4">Confirm Status Change</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to change order #{order.id.slice(0, 8)} status from
              <span className="font-bold mx-1">{order.status.status_name}</span> to
              <span className="font-bold mx-1 text-blue-600">{selectedStatus}</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={isUpdating}
              >
                {isUpdating ? 'Updating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminOrderStatusDropdown;