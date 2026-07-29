/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/admin/orders/AdminOrderFilters.tsx
import React, { useState } from 'react';
import type { AdminOrderFilters as Filters } from '../../../types/admin.types';

interface AdminOrderFiltersProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  onReset: () => void;
}

const AdminOrderFilters: React.FC<AdminOrderFiltersProps> = ({
  filters,
  onFilterChange,
  onReset
}) => {
  const [localFilters, setLocalFilters] = useState<Filters>(filters);

  const handleChange = (key: keyof Filters, value: any) => {
    const newFilters = { ...localFilters, [key]: value, page: 1 };
    setLocalFilters(newFilters);
  };

  const handleApply = () => {
    onFilterChange(localFilters);
  };

  // ✅ Fixed: All options have the same structure
  const statusOptions: Array<{ label: string; value: string }> = [
    { label: 'All Orders', value: '' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Processing', value: 'Processing' },
    { label: 'Preparing', value: 'Preparing' },
    { label: 'Ready for Pickup', value: 'Ready for Pickup' },
    { label: 'Out for Delivery', value: 'Out for Delivery' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Unpaid', value: 'Unpaid' },
    { label: 'Cancelled', value: 'Cancelled' }
  ];

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <input
            type="text"
            placeholder="Order ID or Customer Email"
            value={localFilters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={localFilters.status || ''}
            onChange={(e) => handleChange('status', e.target.value || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* From Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
          <input
            type="date"
            value={localFilters.fromDate || ''}
            onChange={(e) => handleChange('fromDate', e.target.value || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* To Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
          <input
            type="date"
            value={localFilters.toDate || ''}
            onChange={(e) => handleChange('toDate', e.target.value || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mt-4">
        <button
          onClick={handleApply}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Apply Filters
        </button>
        <button
          onClick={onReset}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default AdminOrderFilters;