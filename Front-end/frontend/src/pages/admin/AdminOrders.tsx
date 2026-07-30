import React, { useState } from 'react';
import { useAdminOrders } from '../../hooks/useAdminOrders';
import AdminOrdersTable from '../../components/admin/orders/AdminOrdersTable';
import AdminOrderFilters from '../../components/admin/orders/AdminOrderFilters';
import AdminOrderDetailModal from '../../components/admin/orders/AdminOrderDetailModal';
import AdminExportOrders from '../../components/admin/orders/AdminExportOrders';
import LoadingSpinner from '../../components/admin/common/LoadingSpinner';
import type { Order } from '../../types/order.types';

const AdminOrders: React.FC = () => {
  const {
    orders,
    loading,
    error,
    total,
    filters,
    hasMore,
    summary,
    fetchOrders,
    updateStatus,
    exportOrdersToCSV,
    setFilters,
    resetFilters,
    changePage
  } = useAdminOrders();

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);

  const totalPages = Math.ceil(total / (filters.limit || 10));

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  if (loading && orders.length === 0) {
    return <LoadingSpinner message="Loading orders..." fullPage />;
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Order Management</h1>
          <p className="text-sm text-gray-500">
            Manage all orders, update statuses, and export data
          </p>
        </div>
        <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg shadow">
          {total} order{total !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <h3 className="text-sm text-gray-500">Total Orders</h3>
          <p className="text-2xl font-bold">{summary.totalOrders}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <h3 className="text-sm text-gray-500">Revenue</h3>
          <p className="text-2xl font-bold text-green-600">
            ${summary.totalRevenue.toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <h3 className="text-sm text-gray-500">Average Order</h3>
          <p className="text-2xl font-bold text-purple-600">
            ${summary.averageOrderValue.toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <h3 className="text-sm text-gray-500">Order Range</h3>
          <p className="text-sm">
            <span className="text-green-600 font-medium">${summary.minOrderValue.toFixed(2)}</span>
            {' - '}
            <span className="text-red-600 font-medium">${summary.maxOrderValue.toFixed(2)}</span>
          </p>
        </div>
      </div>

      {/* Filters */}
      <AdminOrderFilters
        filters={filters}
        onFilterChange={setFilters}
        onReset={resetFilters}
      />

      {/* Export */}
      <AdminExportOrders onExport={exportOrdersToCSV} loading={loading} />

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">
          <p className="font-medium">⚠️ Error</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={() => fetchOrders()}
            className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Orders Table */}
      <AdminOrdersTable
        orders={orders}
        onStatusChange={updateStatus}
        onViewDetails={handleViewDetails}
        loading={loading}
      />

      {/* Pagination */}
      {total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
          <div className="text-sm text-gray-500">
            Showing {orders.length} of {total} orders
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => changePage((filters.page || 1) - 1)}
              disabled={(filters.page || 1) === 1}
              className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-700">
              Page {filters.page || 1} of {totalPages || 1}
            </span>
            <button
              onClick={() => changePage((filters.page || 1) + 1)}
              disabled={!hasMore}
              className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      <AdminOrderDetailModal
        order={selectedOrder}
        isOpen={showModal}
        onClose={handleCloseModal}
        onStatusChange={updateStatus}
      />
    </div>
  );
};

export default AdminOrders;