import React from 'react';
import type { Order } from '../../../types/order.types';
import { formatDate, formatCurrency } from '../../../utils/orderUtils';
import AdminOrderStatusDropdown from './AdminOrderStatusDropdown';

interface AdminOrdersTableProps {
  orders: Order[];
  onStatusChange: (orderId: string, newStatus: string) => Promise<void>;
  onViewDetails: (order: Order) => void;
  loading?: boolean;
}

const AdminOrdersTable: React.FC<AdminOrdersTableProps> = ({
  orders,
  onStatusChange,
  onViewDetails,
  loading = false
}) => {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <p className="text-gray-500">No orders found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Order ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Customer
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                {order.id.slice(0, 8)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {order.customer?.full_name || 'Guest'}
                </div>
                <div className="text-sm text-gray-500">
                  {order.customer?.user?.email || 'N/A'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(order.created_at)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                {formatCurrency(Number(order.total_price))}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <AdminOrderStatusDropdown
                  order={order}
                  onStatusChange={onStatusChange}
                  loading={loading}
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full capitalize">
                  {order.order_type}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <button
                  onClick={() => onViewDetails(order)}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminOrdersTable;