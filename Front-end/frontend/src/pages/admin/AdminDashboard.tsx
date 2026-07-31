/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAdminOrders } from '../../hooks/useAdminOrders';
import LoadingSpinner from '../../components/admin/common/LoadingSpinner';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  todayOrders: number;
  todayRevenue: number;
}

const AdminDashboard: React.FC = () => {
  const { summary, orders, loading, fetchOrders } = useAdminOrders();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    todayOrders: 0,
    todayRevenue: 0
  });

  useEffect(() => {
    fetchOrders({ page: 1, limit: 100 });
  }, []);

  useEffect(() => {
    if (orders.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayOrders = orders.filter(order =>
        new Date(order.created_at) >= today
      );

      const pending = orders.filter(order =>
        order.status.status_name === 'Pending' ||
        order.status.status_name === 'Processing' ||
        order.status.status_name === 'Preparing'
      );

      const completed = orders.filter(order =>
        order.status.status_name === 'Completed'
      );

      const cancelled = orders.filter(order =>
        order.status.status_name === 'Cancelled'
      );

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStats({
        totalOrders: summary.totalOrders || orders.length,
        totalRevenue: summary.totalRevenue || 0,
        averageOrderValue: summary.averageOrderValue || 0,
        pendingOrders: pending.length,
        completedOrders: completed.length,
        cancelledOrders: cancelled.length,
        todayOrders: todayOrders.length,
        todayRevenue: todayOrders.reduce((sum, order) => sum + Number(order.total_price), 0)
      });
    }
  }, [orders, summary]);

  if (loading && orders.length === 0) {
    return <LoadingSpinner message="Loading dashboard..." fullPage />;
  }

  const statCards = [
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: '📋',
      color: 'blue',
      link: '/admin/orders'
    },
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: '💰',
      color: 'green',
      link: '/admin/orders'
    },
    {
      title: 'Average Order',
      value: `$${stats.averageOrderValue.toFixed(2)}`,
      icon: '📊',
      color: 'purple',
      link: '/admin/orders'
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      icon: '⏳',
      color: 'yellow',
      link: '/admin/orders?status=Pending'
    },
    {
      title: 'Completed Orders',
      value: stats.completedOrders,
      icon: '✅',
      color: 'green',
      link: '/admin/orders?status=Completed'
    },
    {
      title: "Today's Orders",
      value: stats.todayOrders,
      icon: '📅',
      color: 'indigo',
      link: '/admin/orders'
    },
    {
      title: "Today's Revenue",
      value: `$${stats.todayRevenue.toFixed(2)}`,
      icon: '💵',
      color: 'emerald',
      link: '/admin/orders'
    },
    {
      title: 'Cancelled Orders',
      value: stats.cancelledOrders,
      icon: '❌',
      color: 'red',
      link: '/admin/orders?status=Cancelled'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      blue: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-600' },
      green: { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-600' },
      purple: { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-600' },
      yellow: { bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-600' },
      indigo: { bg: 'bg-indigo-50', border: 'border-indigo-500', text: 'text-indigo-600' },
      emerald: { bg: 'bg-emerald-50', border: 'border-emerald-500', text: 'text-emerald-600' },
      red: { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-600' },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-gray-500">Welcome back, Admin</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/admin/orders"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            📋 View All Orders
          </Link>
          <Link
            to="/admin/products"
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            🍞 Manage Products
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat) => {
          const colors = getColorClasses(stat.color);
          return (
            <Link
              key={stat.title}
              to={stat.link}
              className={`block ${colors.bg} rounded-lg shadow-md p-4 border-l-4 ${colors.border} hover:shadow-lg transition-all hover:scale-[1.02]`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-600">{stat.title}</h3>
                  <p className={`text-2xl font-bold ${colors.text}`}>{stat.value}</p>
                </div>
                <span className="text-3xl">{stat.icon}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-lg mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/admin/orders"
              className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-center transition-colors"
            >
              <span className="text-2xl block mb-1">📋</span>
              <span className="text-sm">All Orders</span>
            </Link>
            <Link
              to="/admin/products"
              className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-center transition-colors"
            >
              <span className="text-2xl block mb-1">🍞</span>
              <span className="text-sm">Products</span>
            </Link>
            <Link
              to="/admin/orders?status=Pending"
              className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-center transition-colors"
            >
              <span className="text-2xl block mb-1">⏳</span>
              <span className="text-sm">Pending Orders</span>
            </Link>
            <Link
              to="/admin/users"
              className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-center transition-colors"
            >
              <span className="text-2xl block mb-1">👥</span>
              <span className="text-sm">Users</span>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-lg mb-4">Recent Orders</h3>
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => (
              <Link
                key={order.id}
                to={`/admin/orders`}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div>
                  <span className="font-mono text-sm text-gray-600">
                    #{order.id.slice(0, 8)}
                  </span>
                  <span className="ml-2 text-sm text-gray-500">
                    {order.customer?.full_name || 'Guest'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">
                    ${Number(order.total_price).toFixed(2)}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${order.status.status_name === 'Completed' ? 'bg-green-100 text-green-800' :
                      order.status.status_name === 'Cancelled' ? 'bg-red-100 text-red-800' :
                        order.status.status_name === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                    }`}>
                    {order.status.status_name}
                  </span>
                </div>
              </Link>
            ))}
            {orders.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">No recent orders</p>
            )}
          </div>
        </div>
      </div>

      {/* Order Status Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-lg mb-4">Order Status Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Pending', count: stats.pendingOrders, color: 'bg-yellow-500' },
            { label: 'Completed', count: stats.completedOrders, color: 'bg-green-500' },
            { label: 'Cancelled', count: stats.cancelledOrders, color: 'bg-red-500' },
            { label: 'Total', count: stats.totalOrders, color: 'bg-blue-500' }
          ].map((item) => (
            <div key={item.label} className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`w-full h-2 ${item.color} rounded-full mb-2`} />
              <p className="text-2xl font-bold">{item.count}</p>
              <p className="text-sm text-gray-500">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;