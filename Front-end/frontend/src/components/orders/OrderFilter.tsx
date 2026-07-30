// src/components/orders/OrderFilter.tsx
import React from 'react';
import { ORDER_STATUSES } from '../../utils/orderUtils';

interface OrderFilterProps {
  currentStatus: string | null;
  onStatusChange: (status: string | null) => void;
}

const OrderFilter: React.FC<OrderFilterProps> = ({ currentStatus, onStatusChange }) => {
  const statuses: Array<{ label: string; value: string | null }> = [
    { label: 'All Orders', value: null },
    ...Object.values(ORDER_STATUSES).map(status => ({
      label: status,
      value: status
    }))
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {statuses.map(({ label, value }) => (
        <button
          key={label}
          onClick={() => onStatusChange(value)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            currentStatus === value
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export default OrderFilter;