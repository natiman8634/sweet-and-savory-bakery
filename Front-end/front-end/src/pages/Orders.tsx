import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { getAdminOrders, updateOrderStatus } from '../api/adminApi';
import type { AdminOrderFilters } from '../api/adminApi';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Input } from '../components/ui/input';import { Link } from 'react-router-dom';
import { Clock, Package, CheckCircle, XCircle, RefreshCw,
  ChevronLeft, ChevronRight, Filter, ShoppingBag, Search, Calendar, AlertCircle, Eye,
} from 'lucide-react';

// ============================================================
// SHARED TYPES & HELPERS
// ============================================================
interface Order {
  id: string;
  total_price: number;
  order_type: string;
  scheduled_for: string;
  status: { id: number; status_name: string };
  created_at: string;
  customer?: { full_name: string };
  customer_email?: string;
  payment?: { payment_status: string; payment_method: string };
}

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending': case 'unpaid': return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'preparing': return <Package className="h-4 w-4 text-blue-500" />;
    case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'cancelled': return <XCircle className="h-4 w-4 text-red-500" />;
    default: return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending': case 'unpaid': return 'bg-yellow-100 text-yellow-800';
    case 'preparing': return 'bg-blue-100 text-blue-800';
    case 'completed': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// ============================================================
// ADMIN-ONLY CONSTANTS
// ============================================================
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

const statusBadgeStyles: Record<string, string> = {
  Completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Preparing: 'bg-blue-100 text-blue-800 border-blue-200',
  'Ready for Pickup': 'bg-purple-100 text-purple-800 border-purple-200',
  'Out for Delivery': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  Pending: 'bg-amber-100 text-amber-800 border-amber-200',
  Unpaid: 'bg-orange-100 text-orange-800 border-orange-200',
  Cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
};

const orderStats = [
  { label: 'All Orders', value: 80, icon: ShoppingBag, color: 'bg-blue-50 text-blue-600' },
  { label: 'Active Orders', value: 50, icon: Package, color: 'bg-emerald-50 text-emerald-600' },
  { label: 'Pending Orders', value: 15, icon: Clock, color: 'bg-amber-50 text-amber-600' },
  { label: 'Fraud Orders', value: 5, icon: AlertCircle, color: 'bg-rose-50 text-rose-600' },
  { label: 'Cancelled Orders', value: 10, icon: XCircle, color: 'bg-gray-100 text-gray-600' },
];

// ============================================================
// ADMIN ORDER CARD (Mobile)
// ============================================================
function AdminOrderCard({ order, onStatusChange }: { order: any; onStatusChange: (orderId: string, status: string) => void; }) {
  const statusName = order.status?.status_name || 'Unknown';
  const badgeClass = statusBadgeStyles[statusName] || 'bg-gray-100 text-gray-800 border-gray-200';
  const paymentStatus = order.payment?.payment_status || 'Unpaid';
  const paymentMethod = order.payment?.payment_method || 'N/A';
  return (
    <Card className="border border-slate-200 shadow-sm">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-blue-600 font-medium">#{order.id.slice(0, 8)}</span>
          <Badge className={`${badgeClass} px-2 py-0.5 text-[10px] border`}>{statusName}</Badge>
        </div>
        <div>
          <p className="font-medium text-slate-800 text-sm">{order.customer?.full_name || 'Guest'}</p>
          <p className="text-xs text-gray-500">{order.customer_email || 'guest'}</p>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>{order.order_type}</span>
          <span>{new Date(order.created_at).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-800">${Number(order.total_price).toFixed(2)}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600">{paymentMethod}</span>
            <Badge className={`text-[10px] px-1.5 py-0 ${paymentStatus === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{paymentStatus}</Badge>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-100">
          <Select value={statusName} onValueChange={(value) => { if (value && value !== statusName) onStatusChange(order.id, value); }}>
            <SelectTrigger className="w-full h-9 text-xs border-slate-200 focus:ring-blue-500"><SelectValue placeholder="Update Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Unpaid">Unpaid</SelectItem><SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Preparing">Preparing</SelectItem><SelectItem value="Ready for Pickup">Ready for Pickup</SelectItem>
              <SelectItem value="Out for Delivery">Out for Delivery</SelectItem><SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// ADMIN ORDERS VIEW
// ============================================================
function AdminOrdersView() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<AdminOrderFilters>({ limit: 20, offset: 0 });
  const [statusError, setStatusError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dateDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pendingFromDate, setPendingFromDate] = useState('');
  const [pendingToDate, setPendingToDate] = useState('');

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setFilters((prev) => { const s = searchInput.trim() || undefined; if (prev.search === s) return prev; return { ...prev, search: s, offset: 0 }; });
    }, 300);
    return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current); };
  }, [searchInput]);

  useEffect(() => {
    if (dateDebounceTimerRef.current) clearTimeout(dateDebounceTimerRef.current);
    dateDebounceTimerRef.current = setTimeout(() => {
      setFilters((prev) => { const f = pendingFromDate || undefined; const t = pendingToDate || undefined; if (prev.fromDate === f && prev.toDate === t) return prev; return { ...prev, fromDate: f, toDate: t, offset: 0 }; });
    }, 500);
    return () => { if (dateDebounceTimerRef.current) clearTimeout(dateDebounceTimerRef.current); };
  }, [pendingFromDate, pendingToDate]);

  const { data, isLoading, isFetching, refetch } = useQuery({ queryKey: ['admin-orders', filters], queryFn: () => getAdminOrders(filters) });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) => updateOrderStatus(orderId, status),
    onSuccess: () => { setStatusError(null); queryClient.invalidateQueries({ queryKey: ['admin-orders'] }); queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] }); },
    onError: (err: any) => { setStatusError(err?.response?.data?.message || 'Failed to update order status'); },
  });

  const handleStatusChange = (orderId: string, status: string) => { updateStatusMutation.mutate({ orderId, status }); };
  const handleFilterChange = (key: keyof AdminOrderFilters, value: string) => { setFilters((prev) => ({ ...prev, [key]: value, offset: 0 })); };
  const handlePageChange = (newOffset: number) => { setFilters((prev) => ({ ...prev, offset: newOffset })); };
  const handleClearFilters = () => { setSearchInput(''); setPendingFromDate(''); setPendingToDate(''); setFilters({ limit: 20, offset: 0 }); };

  const orders = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-4 md:space-y-6 bg-[#F8FAFC] min-h-screen p-3 sm:p-4 md:p-6 rounded-2xl">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg shrink-0"><ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" /></div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Manage Orders</h1>
            <p className="text-xs sm:text-sm text-gray-500">View and manage all your customer orders</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isFetching && <span className="flex items-center text-xs text-gray-500"><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Loading...</span>}
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="border-blue-500 text-blue-600 hover:bg-blue-50">
            <RefreshCw className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
        {orderStats.map((stat, index) => (
          <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div><p className="text-[10px] sm:text-xs font-medium text-gray-500">{stat.label}</p><p className="text-lg sm:text-xl font-bold text-slate-800">{stat.value}</p></div>
                <div className={`p-1.5 sm:p-2 rounded-lg ${stat.color}`}><stat.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* SEARCH & FILTERS */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-3">
            <div className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input type="text" placeholder="Search by order ID, customer name, or email..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pl-9 h-9 border-slate-200 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                  <Input type="date" className="flex-1 sm:w-36 h-9 border-slate-200 focus:ring-blue-500" value={pendingFromDate} onChange={(e) => setPendingFromDate(e.target.value)} />
                  <span className="text-xs text-gray-400 shrink-0">to</span>
                  <Input type="date" className="flex-1 sm:w-36 h-9 border-slate-200 focus:ring-blue-500" value={pendingToDate} onChange={(e) => setPendingToDate(e.target.value)} />
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Select value={filters.status || STATUS_ALL} onValueChange={(value) => handleFilterChange('status', value === STATUS_ALL ? '' : (value ?? ''))}>
                  <SelectTrigger className="flex-1 sm:flex-initial sm:w-36 h-9 border-slate-200 focus:ring-blue-500"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>{statusOptions.map((opt) => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={handleClearFilters} className="border-blue-500 text-blue-600 hover:bg-blue-50 h-9 shrink-0">
                  <Filter className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Clear</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {statusError && <div className="flex items-center gap-2 text-rose-700 bg-rose-50 p-3 rounded-lg border border-rose-200 text-sm"><span>❌</span> {statusError}</div>}

      {isLoading && !data && (
        <div className="space-y-3">{[...Array(5)].map((_, i) => (<Card key={i} className="border-0 shadow-sm"><CardContent className="p-4"><div className="h-8 bg-slate-200 rounded animate-pulse"></div></CardContent></Card>))}</div>
      )}

      {!isLoading && orders.length > 0 && (
        <div className="md:hidden space-y-3">{orders.map((order) => (<AdminOrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />))}</div>
      )}

      {!isLoading && orders.length === 0 && (
        <div className="md:hidden flex flex-col items-center gap-2 py-8 text-gray-500"><ShoppingBag className="h-8 w-8 text-gray-300" /><p className="text-sm">No orders found</p><p className="text-xs text-gray-400">Try adjusting your filters</p></div>
      )}

      {/* DESKTOP TABLE */}
      <Card className="border-0 shadow-sm overflow-hidden hidden md:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50/80 border-b border-slate-200">
                {['Order ID','Customer','Type','Date','Amount','Payment','Status','Action'].map((h) => (<th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">{h}</th>))}
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => {
                  const statusName = order.status?.status_name || 'Unknown';
                  const badgeClass = statusBadgeStyles[statusName] || 'bg-gray-100 text-gray-800 border-gray-200';
                  const paymentStatus = order.payment?.payment_status || 'Unpaid';
                  const paymentMethod = order.payment?.payment_method || 'N/A';
                  return (
                    <tr key={order.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-blue-600 font-medium">#{order.id.slice(0, 8)}</td>
                      <td className="px-4 py-3"><p className="font-medium text-slate-800">{order.customer?.full_name || 'Guest'}</p><p className="text-xs text-gray-500">{order.customer_email || 'guest'}</p></td>
                      <td className="px-4 py-3 text-xs text-slate-600">{order.order_type}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{new Date(order.created_at).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">${Number(order.total_price).toFixed(2)}</td>
                      <td className="px-4 py-3"><div className="flex flex-col"><span className="text-xs font-medium text-slate-700">{paymentMethod}</span><Badge className={`text-[10px] w-fit ${paymentStatus === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{paymentStatus}</Badge></div></td>
                      <td className="px-4 py-3"><Badge className={`${badgeClass} flex items-center gap-1.5 w-fit px-3 py-1 border`}>{statusName}</Badge></td>
                      <td className="px-4 py-3">
                        <Select value={statusName} onValueChange={(value) => { if (value && value !== statusName) handleStatusChange(order.id, value); }}>
                          <SelectTrigger className="w-28 h-8 text-xs border-slate-200 focus:ring-blue-500"><SelectValue placeholder="Update" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Unpaid">Unpaid</SelectItem><SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Preparing">Preparing</SelectItem><SelectItem value="Ready for Pickup">Ready for Pickup</SelectItem>
                            <SelectItem value="Out for Delivery">Out for Delivery</SelectItem><SelectItem value="Completed">Completed</SelectItem>
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

      {/* PAGINATION */}
      {meta && meta.total > 0 && (() => {
        const currentPage = Math.floor(meta.offset / meta.limit) + 1;
        const totalPages = Math.ceil(meta.total / meta.limit);
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        if (endPage - startPage < maxVisiblePages - 1) startPage = Math.max(1, endPage - maxVisiblePages + 1);
        const pageNumbers = [];
        for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);
        return (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <p className="text-xs sm:text-sm text-gray-500">
              Showing <span className="font-medium">{meta.offset + 1}</span> to{' '}
              <span className="font-medium">{Math.min(meta.offset + meta.limit, meta.total)}</span>{' '}
              of <span className="font-medium">{meta.total}</span> orders
              <span className="hidden sm:inline"><span className="ml-2 text-gray-400">·</span><span className="ml-2">Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span></span></span>
            </p>
            <div className="flex items-center justify-center sm:justify-end gap-1">
              <Button variant="outline" size="sm" disabled={meta.offset === 0} onClick={() => handlePageChange(0)} className="hidden sm:inline-flex border-blue-500 text-blue-600 hover:bg-blue-50 disabled:opacity-50"><ChevronLeft className="h-4 w-4 mr-1" /> First</Button>
              <Button variant="outline" size="sm" disabled={meta.offset === 0} onClick={() => handlePageChange(Math.max(0, meta.offset - meta.limit))} className="border-blue-500 text-blue-600 hover:bg-blue-50 disabled:opacity-50"><ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline ml-1">Prev</span></Button>
              {pageNumbers.map((pn) => (<Button key={pn} variant={pn === currentPage ? 'default' : 'outline'} size="sm" onClick={() => handlePageChange((pn - 1) * meta.limit)} className={pn === currentPage ? 'bg-blue-600 text-white hover:bg-blue-700' : 'border-blue-500 text-blue-600 hover:bg-blue-50'}>{pn}</Button>))}
              <Button variant="outline" size="sm" disabled={!meta.hasMore} onClick={() => handlePageChange(meta.offset + meta.limit)} className="border-blue-500 text-blue-600 hover:bg-blue-50 disabled:opacity-50"><span className="hidden sm:inline mr-1">Next</span> <ChevronRight className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" disabled={!meta.hasMore} onClick={() => handlePageChange((totalPages - 1) * meta.limit)} className="hidden sm:inline-flex border-blue-500 text-blue-600 hover:bg-blue-50 disabled:opacity-50">Last <ChevronRight className="h-4 w-4 ml-1" /></Button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ============================================================
// USER ORDERS VIEW
// ============================================================
function UserOrdersView({ user }: { user: any }) {
  const getMyOrders = async (): Promise<Order[]> => {
    const response = await apiClient.get('/orders/my-orders');
    return response.data.data || [];
  };
  const { data: orders, isLoading, isError, error } = useQuery({ queryKey: ['my-orders'], queryFn: getMyOrders, enabled: !!user, retry: 1 });

  if (isLoading) {
    return (<div className="container mx-auto px-4 py-8"><h1 className="text-2xl font-bold text-amber-800 mb-4">My Orders</h1><div className="space-y-4">{[...Array(3)].map((_, i) => (<div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>))}</div></div>);
  }
  if (isError) {
    return (<div className="container mx-auto px-4 py-16 text-center"><p className="text-red-500">⚠️ Failed to load orders</p><p className="text-gray-500 text-sm mt-1">{error instanceof Error ? error.message : 'Please try again later.'}</p></div>);
  }
  if (!orders || orders.length === 0) {
    return (<div className="container mx-auto px-4 py-16 text-center"><h2 className="text-2xl font-semibold text-gray-600">No orders yet</h2><p className="text-gray-500 mt-2">Start shopping to place your first order!</p></div>);
  }
  return (
    <div className="container mx-auto px-4 py-4 max-w-lg pb-20">
      <h1 className="text-2xl font-bold text-amber-800 mb-4">My Orders</h1>
      <div className="space-y-4">
        {orders.map((order) => (
          <Link to={`/orders/${order.id}`} key={order.id}>
            <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group">
              <CardHeader className="pb-2"><div className="flex justify-between items-start">
                <div><CardTitle className="text-sm font-medium group-hover:text-amber-700 transition-colors">Order #{order.id.slice(0, 8)}</CardTitle><p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p></div>
                <Badge className={getStatusColor(order.status.status_name)}><span className="flex items-center gap-1">{getStatusIcon(order.status.status_name)}{order.status.status_name}</span></Badge>
              </div></CardHeader>
              <CardContent><div className="flex justify-between items-center text-sm"><div className="flex items-center gap-2 text-gray-600"><span>{order.order_type} • {new Date(order.scheduled_for).toLocaleDateString('en-US')}</span></div><div className="flex items-center gap-3"><span className="font-bold text-amber-800">${Number(order.total_price).toFixed(2)}</span><Eye className="h-4 w-4 text-gray-400 group-hover:text-amber-600 transition-colors" /></div></div></CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// EXPORTS: route-based, not role-based
// Default = user order page (/orders)
// AdminOrders = admin management page (/admin/orders)
// ============================================================
function UserOrdersWrapper() {
  const { user } = useAuth();
  if (!user) {
    return (<div className="container mx-auto px-4 py-16 text-center"><p className="text-gray-600">Please log in to view your orders.</p></div>);
  }
  return <UserOrdersView user={user} />;
}

export default function Orders() {
  return <UserOrdersWrapper />;
}

export function AdminOrders() {
  return <AdminOrdersView />;
}
