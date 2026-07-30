// src/components/orders/OrderCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import OrderStatusBadge from './OrderStatusBadge';
import { formatDate, formatCurrency } from '../../utils/orderUtils';
import type { Order } from '../../types/order.types';

interface OrderCardProps {
  order: Order;
}

const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  const itemCount = order.orderItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Link to={`/orders/${order.id}`}>
      <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer border border-gray-100 hover:border-blue-300">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2 flex-wrap">
              <span className="text-sm text-gray-500 font-mono">
                #{order.id.slice(0, 8)}
              </span>
              <OrderStatusBadge status={order.status.status_name} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Date:</span>
                <span className="ml-2 text-gray-700">{formatDate(order.created_at)}</span>
              </div>
              <div>
                <span className="text-gray-500">Type:</span>
                <span className="ml-2 text-gray-700 capitalize">{order.order_type}</span>
              </div>
              <div>
                <span className="text-gray-500">Items:</span>
                <span className="ml-2 text-gray-700">{itemCount}</span>
              </div>
              <div>
                <span className="text-gray-500">Total:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  {formatCurrency(Number(order.total_price))}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right ml-4">
            <button
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              onClick={(e) => e.preventDefault()}
            >
              View Details →
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default OrderCard;