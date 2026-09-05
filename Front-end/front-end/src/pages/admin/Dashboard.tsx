import { useQuery } from '@tanstack/react-query';
import { getDashboardData } from '../../api/adminApi';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  DollarSign,
  Package,
  Users,
  ArrowUpRight,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// 🎨 NEW VIBRANT COLOR PALETTE
const COLORS = ['#2563EB', '#DC2626', '#F59E0B', '#10B981', '#8B5CF6'];


const statusColors: Record<string, string> = {
  Completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Preparing: 'bg-blue-100 text-blue-800 border-blue-200',
  'Ready for Pickup': 'bg-purple-100 text-purple-800 border-purple-200',
  'Out for Delivery': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  Pending: 'bg-amber-100 text-amber-800 border-amber-200',
  Unpaid: 'bg-orange-100 text-orange-800 border-orange-200',
  Cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
};

const statusIcons: Record<string, any> = {
  Completed: CheckCircle,
  Preparing: Clock,
  'Ready for Pickup': AlertCircle,
  Pending: Clock,
  Unpaid: AlertCircle,
  Cancelled: XCircle,
};

// ✅ Type-safe tooltip formatter
const formatTooltipValue = (value: any): [string, string] => {
  if (Array.isArray(value)) {
    const num = Number(value[0]);
    if (!isNaN(num)) return [`$${num.toFixed(2)}`, 'Revenue'];
    return ['$0.00', 'Revenue'];
  }
  if (typeof value === 'number') {
    return [`$${value.toFixed(2)}`, 'Revenue'];
  }
  if (typeof value === 'string') {
    const num = Number(value);
    if (!isNaN(num)) return [`$${num.toFixed(2)}`, 'Revenue'];
    return ['$0.00', 'Revenue'];
  }
  return ['$0.00', 'Revenue'];
};

export default function AdminDashboard() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: getDashboardData,
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800">📊 Dashboard</h1>
          <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-gray-200 rounded-xl animate-pulse"></div>
          <div className="h-80 bg-gray-200 rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 text-lg">Failed to load dashboard data</p>
        <button
          onClick={() => refetch()}
          className="mt-4 text-blue-600 hover:underline font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const { summary, topProducts, recentOrders, hourlyBreakdown, comparison } = data;

  // Prepare data for charts
  const revenueData = hourlyBreakdown.map((hour) => ({
    name: hour.hour,
    revenue: hour.revenue,
    orders: hour.ordersCount,
  }));

  // Order status distribution from backend
  const statusDistribution = data.statusDistribution || [];

  // Quick stats - all from backend
  const quickStats = [
    {
      label: 'Total Revenue',
      value: `$${summary.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      change: summary.revenueChangePercentage,
      trend: summary.trend,
      color: 'bg-blue-50 text-blue-600',
      iconBg: 'bg-blue-100',
    },
    {
      label: 'Total Orders',
      value: summary.totalOrders,
      icon: ShoppingBag,
      change: summary.ordersChangePercentage,
      trend: summary.ordersTrend,
      color: 'bg-emerald-50 text-emerald-600',
      iconBg: 'bg-emerald-100',
    },
    {
      label: 'Average Order',
      value: `$${summary.averageOrderValue.toFixed(2)}`,
      icon: Package,
      change: summary.avgChangePercentage,
      trend: summary.avgTrend,
      color: 'bg-amber-50 text-amber-600',
      iconBg: 'bg-amber-100',
    },
    {
      label: 'New Customers',
      value: summary.newCustomers,
      icon: Users,
      change: summary.newCustomersChangePercentage,
      trend: summary.newCustomersTrend,
      color: 'bg-rose-50 text-rose-600',
      iconBg: 'bg-rose-100',
    },
  ];

  return (
    <div className="space-y-6 bg-[#F8FAFC] min-h-screen p-4 md:p-6 rounded-2xl">
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800"> Dashboard</h1>
          <p className="text-sm text-gray-600">
            Welcome back! Here's what's happening with your bakery today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-blue-500 text-blue-600">
            Last updated: {new Date().toLocaleTimeString()}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-2 border-blue-500 text-blue-600 hover:bg-blue-50"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1 text-slate-800">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.iconBg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3">
                {stat.trend === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-rose-500" />
                )}
                <span
                  className={`text-sm font-medium ${
                    stat.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {stat.change > 0 ? '+' : ''}
                  {stat.change}%
                </span>
                <span className="text-xs text-gray-400">vs last week</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Comparison Card */}
      <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">Today vs Yesterday</p>
              <div className="flex items-center gap-4 mt-1">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today</p>
                  <p className="text-xl font-bold text-blue-600">
                    ${comparison.todayRevenue.toFixed(2)}
                  </p>
                </div>
                <div className="text-2xl text-gray-300">|</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Yesterday</p>
                  <p className="text-xl font-bold text-gray-500">
                    ${comparison.yesterdayRevenue.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              comparison.change >= 0 ? 'bg-emerald-50' : 'bg-rose-50'
            }`}>
              {comparison.change >= 0 ? (
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-rose-600" />
              )}
              <span className={`text-lg font-bold ${
                comparison.change >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {comparison.change >= 0 ? '+' : ''}
                {comparison.change.toFixed(1)}%
              </span>
              <span className="text-sm text-gray-500">
                {comparison.change >= 0 ? 'increase' : 'decrease'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Line Chart */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-800">Revenue Trend</CardTitle>
            <CardDescription>Hourly revenue for the last 12 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 sm:h-62.5 lg:h-75">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '8px 12px',
                    }}
                    formatter={formatTooltipValue}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2563EB"
                    strokeWidth={3}
                    dot={{ fill: '#2563EB', r: 4 }}
                    activeDot={{ r: 6, fill: '#1D4ED8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Order Status Distribution */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-800">Order Status</CardTitle>
            <CardDescription>Distribution of all orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 sm:h-62.5">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusDistribution.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [`${value} orders`, 'Count']}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => (
                      <span className="text-xs text-gray-600">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column: Bar Chart + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Revenue Bar Chart */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-800">Daily Revenue</CardTitle>
            <CardDescription>Last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 sm:h-62.5">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.dailyRevenue || []}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                    formatter={formatTooltipValue}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="#10B981"
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-800">🏆 Top Products</CardTitle>
            <CardDescription>Best sellers this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.slice(0, 5).map((product, index) => (
                <div
                  key={product.product_id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50/50 transition-colors"
                >
                  <div
                    className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0
                        ? 'bg-blue-600 text-white'
                        : index === 1
                        ? 'bg-emerald-600 text-white'
                        : index === 2
                        ? 'bg-amber-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-slate-800">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-blue-600">
                      ${product.revenue.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">×{product.total_quantity_sold}</p>
                  </div>
                </div>
              ))}
              {topProducts.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No sales today
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-slate-800">🔄 Recent Orders</CardTitle>
              <CardDescription>Latest orders from customers</CardDescription>
            </div>
            <Link to="/admin/orders">
              <Button variant="outline" size="sm" className="gap-2 border-blue-500 text-blue-600 hover:bg-blue-50">
                View All <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {recentOrders.slice(0, 5).map((order) => {
              const StatusIcon = statusIcons[order.status as keyof typeof statusIcons] || Clock;
              return (
                <div key={order.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-gray-500">#{order.id}</p>
                    <p className="font-medium text-slate-800 text-sm truncate">{order.customerName}</p>
                    <p className="text-xs text-gray-500">{order.items} items</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="font-semibold text-slate-800">${order.total.toFixed(2)}</p>
                    <Badge className={`${statusColors[order.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'} flex items-center gap-1 w-fit px-2 py-0.5 text-[10px] border mt-1`}><StatusIcon className="h-3 w-3" />{order.status}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Desktop table */}
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.slice(0, 5).map((order) => {
                  const StatusIcon = statusIcons[order.status as keyof typeof statusIcons] || Clock;
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 font-mono text-xs text-gray-500">
                        #{order.id}
                      </td>
                      <td className="py-3">
                        <p className="font-medium text-slate-800">
                          {order.customerName}
                        </p>
                        <p className="text-xs text-gray-500">{order.customerEmail}</p>
                      </td>
                      <td className="py-3 text-sm text-gray-600">
                        {order.items}
                      </td>
                      <td className="py-3 font-semibold text-slate-800">
                        ${order.total.toFixed(2)}
                      </td>
                      <td className="py-3">
                        <Badge
                          className={`${
                            statusColors[order.status as keyof typeof statusColors] ||
                            'bg-gray-100 text-gray-800'
                          } flex items-center gap-1.5 w-fit px-3 py-1 border`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {order.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      No orders today
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Footer */}
      <Card className="bg-linear-to-r from-blue-50 to-emerald-50/70 border-blue-200/50">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-slate-800">⚡ Quick Actions</h3>
              <p className="text-sm text-gray-600">Manage your bakery efficiently</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/admin/orders">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <ShoppingBag className="h-4 w-4 mr-2" /> View Orders
                </Button>
              </Link>
              <Link to="/admin/products">
                <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                  <Package className="h-4 w-4 mr-2" /> Manage Products
                </Button>
              </Link>
              <Link to="/">
                <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                  <Users className="h-4 w-4 mr-2" /> View Shop
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}