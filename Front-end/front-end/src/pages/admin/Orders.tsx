import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminOrders, updateOrderStatus } from '../../api/adminApi';
import type { AdminOrderFilters } from '../../api/adminApi';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Input } from '../../components/ui/input';
import {
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  ShoppingBag,
  Search,
  Calendar,
  Package,
  Clock,
  AlertCircle,
  XCircle,
} from 'lucide-react';

// Status Options for Filter
const STATUS_ALL = '__all__';
const statusOptions = [
  { value: STATUS_ALL, label: 'All Statuses' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Unpaid', label: 'Unpaid' },
  { value: 'Preparing', label: 'Preparing' },
  { value: 'Ready for Pickup', label: 'Ready for Pickup' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
];

// Status Badge Styles
const statusBadgeStyles: Record<string, string> = {
  Completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Preparing: 'bg-blue-100 text-blue-800 border-blue-200',
  'Ready for Pickup': 'bg-purple-100 text-purple-800 border-purple-200',
  'Out for Delivery': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  Pending: 'bg-amber-100 text-amber-800 border-amber-200',
  Unpaid: 'bg-orange-100 text-orange-800 border-orange-200',
  Cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
};

// Stats Data (mock)
const orderStats = [
  { label: 'All Orders', value: 80, icon: ShoppingBag, color: 'bg-blue-50 text-blue-600' },
  { label: 'Active Orders', value: 50, icon: Package, color: 'bg-emerald-50 text-emerald-600' },
  { label: 'Pending Orders', value: 15, icon: Clock, color: 'bg-amber-50 text-amber-600' },
  { label: 'Fraud Orders', value: 5, icon: AlertCircle, color: 'bg-rose-50 text-rose-600' },
  { label: 'Cancelled Orders', value: 10, icon: XCircle, color: 'bg-gray-100 text-gray-600' },
];

// Mobile Order Card Component
function OrderCard({
  order,
  onStatusChange,
}: {
  order: any;
  onStatusChange: (orderId: string, status: string) => void;
}) {
  const statusName = order.status?.status_name || 'Unknown';
  const badgeClass = statusBadgeStyles[statusName] || 'bg-gray-100 text-gray-800 border-gray-200';
  const paymentStatus = order.payment?.payment_status || 'Unpaid';
  const paymentMethod = order.payment?.payment_method || 'N/A';

  return (
    <Card className="border border-slate-200 shadow-sm">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-blue-600 font-medium">
            #{order.id.slice(0, 8)}
          </span>
          <Badge className={`${badgeClass} px-2 py-0.5 text-[10px] border`}>
            {statusName}
          </Badge>
        </div>
        <div>
          <p className="font-medium text-slate-800 text-sm">
            {order.customer?.full_name || 'Guest'}
          </p>
          <p className="text-xs text-gray-500">{order.customer_email || 'guest'}</p>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>{order.order_type}</span>
          <span>
            {new Date(order.created_at).toLocaleDateString('en-US', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-800">
            ${Number(order.total_price).toFixed(2)}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600">{paymentMethod}</span>
            <Badge
              className={`text-[10px] px-1.5 py-0 ${
                paymentStatus === 'Completed'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {paymentStatus}
            </Badge>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-100">
          <Select
            value={statusName}
            onValueChange={(value) => {
              if (value && value !== statusName) {
                onStatusChange(order.id, value);
              }
            }}
          >
            <SelectTrigger className="w-full h-9 text-xs border-slate-200 focus:ring-blue-500">
              <SelectValue placeholder="Update Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Unpaid">Unpaid</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Preparing">Preparing</SelectItem>
              <SelectItem value="Ready for Pickup">Ready for Pickup</SelectItem>
              <SelectItem value="Out for Delivery">Out for Delivery</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<AdminOrderFilters>({
    limit: 20,
    offset: 0,
  });
  const [statusError, setStatusError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dateDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pendingFromDate, setPendingFromDate] = useState('');
  const [pendingToDate, setPendingToDate] = useState('');

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setFilters((prev) => {
        const newSearch = searchInput.trim() || undefined;
        if (prev.search === newSearch) return prev;
        return { ...prev, search: newSearch, offset: 0 };
      });
    }, 300);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [searchInput]);

  useEffect(() => {
    if (dateDebounceTimerRef.current) clearTimeout(dateDebounceTimerRef.current);
    dateDebounceTimerRef.current = setTimeout(() => {
      setFilters((prev) => {
        const newFromDate = pendingFromDate || undefined;
        const newToDate = pendingToDate || undefined;
        if (prev.fromDate === newFromDate && prev.toDate === newToDate) return prev;
        return { ...prev, fromDate: newFromDate, toDate: newToDate, offset: 0 };
      });
    }, 500);
    return () => {
      if (dateDebounceTimerRef.current) clearTimeout(dateDebounceTimerRef.current);
    };
  }, [pendingFromDate, pendingToDate]);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-orders', filters],
    queryFn: () => getAdminOrders(filters),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      updateOrderStatus(orderId, status),
    onSuccess: () => {
      setStatusError(null);
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
    onError: (err: any) => {
      setStatusError(err?.response?.data?.message || 'Failed to update order status');
    },
  });

  const handleStatusChange = (orderId: string, status: string) => {
    updateStatusMutation.mutate({ orderId, status });
  };

  const handleFilterChange = (key: keyof AdminOrderFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, offset: 0 }));
  };

  const handlePageChange = (newOffset: number) => {
    setFilters((prev) => ({ ...prev, offset: newOffset }));
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setPendingFromDate('');
    setPendingToDate('');
    setFilters({ limit: 20, offset: 0 });
  };

  const orders = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-4 md:space-y-6 bg-[#F8FAFC] min-h-screen p-3 sm:p-4 md:p-6 rounded-2xl">
      {/* ========== HEADER ========== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg shrink-0">
            <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800"> Manage Orders</h1>
            <p className="text-xs sm:text-sm text-gray-500">View and manage all your customer orders</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isFetching && (
            <span className="flex items-center text-xs text-gray-500">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Loading...
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="border-blue-500 text-blue-600 hover:bg-blue-50"
          >
            <RefreshCw className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* ========== STATS CARDS ========== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
        {orderStats.map((stat, index) => (
          <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs font-medium text-gray-500">{stat.label}</p>
                  <p className="text-lg sm:text-xl font-bold text-slate-800">{stat.value}</p>
                </div>
                <div className={`p-1.5 sm:p-2 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ========== SEARCH & FILTERS ========== */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-3">
            <div className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by order ID, customer name, or email..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9 h-9 border-slate-200 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                  <Input
                    type="date"
                    className="flex-1 sm:w-36 h-9 border-slate-200 focus:ring-blue-500"
                    value={pendingFromDate}
                    onChange={(e) => setPendingFromDate(e.target.value)}
                  />
                  <span className="text-xs text-gray-400 shrink-0">to</span>
                  <Input
                    type="date"
                    className="flex-1 sm:w-36 h-9 border-slate-200 focus:ring-blue-500"
                    value={pendingToDate}
                    onChange={(e) => setPendingToDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Select
                  value={filters.status || STATUS_ALL}
                  onValueChange={(value) => handleFilterChange('status', value === STATUS_ALL ? '' : (value ?? ''))}
                >
                  <SelectTrigger className="flex-1 sm:flex-initial sm:w-36 h-9 border-slate-200 focus:ring-blue-500">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="border-blue-500 text-blue-600 hover:bg-blue-50 h-9 shrink-0"
                >
                  <Filter className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Clear</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========== ERROR MESSAGE ========== */}
      {statusError && (
        <div className="flex items-center gap-2 text-rose-700 bg-rose-50 p-3 rounded-lg border border-rose-200 text-sm">
          <span>❌</span> {statusError}
        </div>
      )}

      {/* ========== LOADING SKELETON ========== */}
      {isLoading && !data && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="h-8 bg-slate-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ========== MOBILE: ORDER CARDS ========== */}
      {!isLoading && orders.length > 0 && (
        <div className="md:hidden space-y-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}

      {/* ========== EMPTY STATE (mobile) ========== */}
      {!isLoading && orders.length === 0 && (
        <div className="md:hidden flex flex-col items-center gap-2 py-8 text-gray-500">
          <ShoppingBag className="h-8 w-8 text-gray-300" />
          <p className="text-sm">No orders found</p>
          <p className="text-xs text-gray-400">Try adjusting your filters</p>
        </div>
      )}

      {/* ========== DESKTOP: ORDERS TABLE ========== */}
      <Card className="border-0 shadow-sm overflow-hidden hidden md:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Order ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Payment</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => {
                  const statusName = order.status?.status_name || 'Unknown';
                  const badgeClass = statusBadgeStyles[statusName] || 'bg-gray-100 text-gray-800 border-gray-200';
                  const paymentStatus = order.payment?.payment_status || 'Unpaid';
                  const paymentMethod = order.payment?.payment_method || 'N/A';

                  return (
                    <tr key={order.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-blue-600 font-medium">
                        #{order.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">
                          {order.customer?.full_name || 'Guest'}
                        </p>
                        <p className="text-xs text-gray-500">{order.customer_email || 'guest'}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{order.order_type}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {new Date(order.created_at).toLocaleDateString('en-US', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        ${Number(order.total_price).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-slate-700">{paymentMethod}</span>
                          <Badge
                            className={`text-[10px] w-fit ${
                              paymentStatus === 'Completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {paymentStatus}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`${badgeClass} flex items-center gap-1.5 w-fit px-3 py-1 border`}>
                          {statusName}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={statusName}
                          onValueChange={(value) => {
                            if (value && value !== statusName) {
                              handleStatusChange(order.id, value);
                            }
                          }}
                        >
                          <SelectTrigger className="w-28 h-8 text-xs border-slate-200 focus:ring-blue-500">
                            <SelectValue placeholder="Update" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Unpaid">Unpaid</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Preparing">Preparing</SelectItem>
                            <SelectItem value="Ready for Pickup">Ready for Pickup</SelectItem>
                            <SelectItem value="Out for Delivery">Out for Delivery</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ========== PAGINATION ========== */}
      {meta && meta.total > 0 && (() => {
        const currentPage = Math.floor(meta.offset / meta.limit) + 1;
        const totalPages = Math.ceil(meta.total / meta.limit);

        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        if (endPage - startPage < maxVisiblePages - 1) {
          startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        const pageNumbers = [];
        for (let i = startPage; i <= endPage; i++) {
          pageNumbers.push(i);
        }

        return (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <p className="text-xs sm:text-sm text-gray-500">
              Showing <span className="font-medium">{meta.offset + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(meta.offset + meta.limit, meta.total)}
              </span>{' '}
              of <span className="font-medium">{meta.total}</span> orders
              <span className="hidden sm:inline">
                <span className="ml-2 text-gray-400">·</span>
                <span className="ml-2">Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span></span>
              </span>
            </p>
            <div className="flex items-center justify-center sm:justify-end gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={meta.offset === 0}
                onClick={() => handlePageChange(0)}
                className="hidden sm:inline-flex border-blue-500 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> First
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={meta.offset === 0}
                onClick={() => handlePageChange(Math.max(0, meta.offset - meta.limit))}
                className="border-blue-500 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline ml-1">Prev</span>
              </Button>
              {pageNumbers.map((pageNum) => (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange((pageNum - 1) * meta.limit)}
                  className={
                    pageNum === currentPage
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'border-blue-500 text-blue-600 hover:bg-blue-50'
                  }
                >
                  {pageNum}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasMore}
                onClick={() => handlePageChange(meta.offset + meta.limit)}
                className="border-blue-500 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
              >
                <span className="hidden sm:inline mr-1">Next</span> <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasMore}
                onClick={() => handlePageChange((totalPages - 1) * meta.limit)}
                className="hidden sm:inline-flex border-blue-500 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
              >
                Last <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
