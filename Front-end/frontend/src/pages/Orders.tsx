// src/pages/Orders.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../hooks/useOrders';
import OrderCard from '../components/orders/OrderCard';
import OrderFilter from '../components/orders/OrderFilter';
import OrderPagination from '../components/orders/OrderPagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const {
    orders,
    loading,
    error,
    total,
    page,
    limit,
    status,
    hasMore,
    changePage,
    changeStatus
  } = useOrders();

  const totalPages = Math.ceil(total / limit);

  if (loading && orders.length === 0) {
    return <LoadingSpinner message="Loading your orders..." />;
  }

  if (error && orders.length === 0) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="text-center text-red-600 py-12 bg-red-50 rounded-lg">
          <p className="text-lg">⚠️ {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Orders</h1>
        <span className="text-sm text-gray-500">
          {total} order{total !== 1 ? 's' : ''}
        </span>
      </div>

      <OrderFilter currentStatus={status} onStatusChange={changeStatus} />

      {orders.length === 0 ? (
        <EmptyState
          title="No orders found"
          description={status ? `No ${status} orders found.` : 'You haven\'t placed any orders yet.'}
          icon="📦"
          actionText="Start Shopping"
          onAction={() => navigate('/products')}
        />
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>

          <OrderPagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={changePage}
            hasMore={hasMore}
          />

          <p className="text-center text-sm text-gray-500 mt-4">
            Showing {orders.length} of {total} orders
          </p>
        </>
      )}
    </div>
  );
};

export default Orders;