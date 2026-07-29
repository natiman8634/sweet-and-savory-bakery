// src/components/admin/orders/AdminExportOrders.tsx
import React, { useState } from 'react';

interface AdminExportOrdersProps {
  onExport: (fromDate: string, toDate: string) => Promise<void>;
  loading?: boolean;
}

const AdminExportOrders: React.FC<AdminExportOrdersProps> = ({
  onExport,
  loading = false
}) => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!fromDate || !toDate) {
      alert('Please select both from and to dates');
      return;
    }

    setIsExporting(true);
    try {
      await onExport(fromDate, toDate);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const getDefaultDates = () => {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    setFromDate(sevenDaysAgo.toISOString().split('T')[0]);
    setToDate(now.toISOString().split('T')[0]);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="font-semibold mb-3">Export Orders</h3>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          onClick={handleExport}
          disabled={isExporting || loading}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
        >
          {isExporting ? 'Exporting...' : '📥 Export CSV'}
        </button>
        <button
          onClick={getDefaultDates}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
        >
          Last 7 Days
        </button>
      </div>
    </div>
  );
};

export default AdminExportOrders;