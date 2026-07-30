// src/components/orders/OrderStatusBadge.tsx
import React from 'react';
import { STATUS_COLORS, STATUS_ICONS } from '../../utils/orderUtils';

interface OrderStatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ 
  status, 
  className = '',
  size = 'md'
}) => {
  const colorClass = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800';
  const icon = STATUS_ICONS[status as keyof typeof STATUS_ICONS] || '📦';
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${colorClass} ${sizeClasses[size]} ${className}`}>
      {icon} {status}
    </span>
  );
};

export default OrderStatusBadge;