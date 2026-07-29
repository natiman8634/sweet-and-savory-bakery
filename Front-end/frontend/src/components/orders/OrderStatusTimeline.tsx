/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/orders/OrderStatusTimeline.tsx
import React from 'react';
import { STATUS_ORDER, STATUS_ICONS, STATUS_MESSAGES } from '../../utils/orderUtils';

interface OrderStatusTimelineProps {
  currentStatus: string;
}

const OrderStatusTimeline: React.FC<OrderStatusTimelineProps> = ({ currentStatus }) => {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus as any);
  const progressPercent = ((currentIndex + 1) / STATUS_ORDER.length) * 100;

  return (
    <div className="relative">
      {/* Progress bar background */}
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200">
        <div
          className="w-0.5 bg-green-500 transition-all duration-500"
          style={{ height: `${progressPercent}%` }}
        />
      </div>

      {/* Status items */}
      <div className="space-y-6">
        {STATUS_ORDER.map((status, index) => {
          const isCompleted = index <= currentIndex;
          const isActive = index === currentIndex;

          return (
            <div key={status} className="flex items-start gap-4">
              <div className="relative z-10">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all duration-300 ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-400'
                  } ${isActive ? 'ring-4 ring-green-200 scale-110' : ''}`}
                >
                  {isCompleted ? '✓' : STATUS_ICONS[status] || '○'}
                </div>
              </div>
              <div className="flex-1 pt-1">
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                    {status}
                  </span>
                  {isActive && (
                    <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
                      Current
                    </span>
                  )}
                </div>
                <p className={`text-sm ${isCompleted ? 'text-gray-600' : 'text-gray-400'}`}>
                  {STATUS_MESSAGES[status]}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderStatusTimeline;