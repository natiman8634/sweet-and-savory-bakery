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
import { Input } from '../components/ui/input';
import { Link } from 'react-router-dom';
import {
  Clock,
  Package,
  CheckCircle,
  XCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronRight as ArrowRight,
  Filter,
  ShoppingBag,
  Search,
  Calendar,
  AlertCircle,
  Eye,
  Store,
  Wallet,
  CookingPot,
  BadgeCheck,
  ShoppingBag as ShoppingBagIcon,
  Home,
  Bike,
  MapPinned,
  ClipboardList,
  PackageCheck,
  Truck,
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
    case 'pending':
    case 'unpaid':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'preparing':
      return <Package className="h-4 w-4 text-blue-500" />;
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'cancelled':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
    case 'unpaid':
      return 'bg-yellow-100 text-yellow-800';
    case 'preparing':
      return 'bg-blue-100 text-blue-800';
    case 'ready for pickup':
      return 'bg-purple-100 text-purple-800';
    case 'out for delivery':
      return 'bg-indigo-100 text-indigo-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// ============================================================
// HORIZONTAL ORDER TIMELINE
// ============================================================
interface HTimelineStep {
  key: string;
  label: string;
  icon: React.ElementType;
}

const PICKUP_HSTEPS: HTimelineStep[] = [
  { key: 'order_placed', label: 'Placed', icon: Store },
  { key: 'payment_confirmed', label: 'Paid', icon: Wallet },
  { key: 'preparing', label: 'Preparing', icon: CookingPot },
  { key: 'ready_for_pickup', label: 'Ready', icon: BadgeCheck },
  { key: 'completed', label: 'Picked Up', icon: ShoppingBagIcon },
];

const DELIVERY_HSTEPS: HTimelineStep[] = [
  { key: 'order_placed', label: 'Placed', icon: Home },
  { key: 'payment_confirmed', label: 'Paid', icon: Wallet },
  { key: 'preparing', label: 'Preparing', icon: CookingPot },
  { key: 'out_for_delivery', label: 'On the Way', icon: Bike },
  { key: 'completed', label: 'Delivered', icon: MapPinned },
];

const HSTATUS_MAP: Record<string, number> = {
  unpaid: 0,
  pending: 0,
  'payment confirmed': 1,
  preparing: 2,
  'ready for pickup': 3,
  'out for delivery': 3,
  completed: 4,
  delivered: 4,
  'picked up': 4,
};

function HorizontalTimeline({
  orderType,
  statusName,
}: {
  orderType: string;
  statusName: string;
}) {
  const steps =
    orderType.toLowerCase() === 'delivery'
      ? DELIVERY_HSTEPS
      : PICKUP_HSTEPS;
  const isCancelled = statusName.toLowerCase() === 'cancelled';
  const currentIdx = isCancelled
    ? -1
    : HSTATUS_MAP[statusName.toLowerCase()] ?? 0;

  return (
    <div className="w-full px-1">
      <div className="flex items-center justify-between relative">
        {/* Background connector line */}
        <div className="absolute top-3 left-3 right-3 h-0.5 bg-slate-200 z-0" />
        {/* Active connector line */}
        {!isCancelled && currentIdx >= 0 && (
          <div
            className="absolute top-3 left-3 h-0.5 bg-emerald-500 z-[1] transition-all duration-500"
            style={{
              width: `${(currentIdx / (steps.length - 1)) * (100 - 6)}%`,
            }}
          />
        )}

        {steps.map((step, i) => {
          const isCompleted = !isCancelled && i < currentIdx;
          const isActive = !isCancelled && i === currentIdx;
          const isUpcoming = isCancelled || i > currentIdx;
          const StepIcon = step.icon;

          let circleClasses = '';
          let textColor = '';
          let labelClasses = '';

          if (isCompleted) {
            circleClasses =
              'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-200';
            textColor = 'text-emerald-700';
            labelClasses = 'font-medium';
          } else if (isActive) {
            circleClasses =
              'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-200 ring-2 ring-amber-100';
            textColor = 'text-amber-700';
            labelClasses = 'font-semibold';
          } else {
            circleClasses = 'bg-white border-slate-300 text-slate-400';
            textColor = 'text-slate-400';
            labelClasses = '';
          }

          return (
            <div
              key={step.key}
              className="flex flex-col items-center relative z-10"
            >
              <div
                className={`
                  w-6 h-6 rounded-full border-2 flex items-center justify-center
                  transition-all duration-300 shrink-0
                  ${circleClasses}
                `}
              >
                {isCompleted ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <StepIcon className="h-3 w-3" />
                )}
              </div>
              <p
                className={`text-[9px] mt-1 text-center leading-tight ${textColor} ${labelClasses}`}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// STATUS FILTER CHIPS
// ============================================================
const USER_STATUS_FILTERS = [
  { value: 'all', label: 'All Orders', color: 'bg-slate-100 text-slate-700 border-slate-200', activeColor: 'bg-slate-800 text-white border-slate-800' },
  { value: 'pending', label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200', activeColor: 'bg-amber-500 text-white border-amber-500' },
  { value: 'preparing', label: 'Preparing', color: 'bg-blue-50 text-blue-700 border-blue-200', activeColor: 'bg-blue-500 text-white border-blue-500' },
  { value: 'ready for pickup', label: 'Ready', color: 'bg-purple-50 text-purple-700 border-purple-200', activeColor: 'bg-purple-500 text-white border-purple-500' },
  { value: 'out for delivery', label: 'Out for Delivery', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', activeColor: 'bg-indigo-500 text-white border-indigo-500' },
  { value: 'completed', label: 'Completed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', activeColor: 'bg-emerald-500 text-white border-emerald-500' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-50 text-red-700 border-red-200', activeColor: 'bg-red-500 text-white border-red-500' },
];

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
  const dateDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pendingFromDate, setPendingFromDate] = useState('');
  const [pendingToDate, setPendingToDate] = useState('');

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

  const allOrders = data?.data || [];
  const trimmedSearch = searchInput.trim().toLowerCase();
  const orders = trimmedSearch
    ? allOrders.filter((o: any) =>
        o.id?.toLowerCase().includes(trimmedSearch) ||
        o.customer?.full_name?.toLowerCase().includes(trimmedSearch) ||
        o.customer_email?.toLowerCase().includes(trimmedSearch)
      )
    : allOrders;
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

      {statusError && <div className="flex items-center gap-2 text-rose-700 bg-rose-50 p-3 rounded-lg border border-rose-200 text-sm"><XCircle className="h-4 w-4" /> {statusError}</div>}

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
// USER ORDERS VIEW — REDESIGNED
// ============================================================
function UserOrdersView({ user }: { user: any }) {
  const [statusFilter, setStatusFilter] = useState('all');

  const getMyOrders = async (): Promise<Order[]> => {
    const response = await apiClient.get('/orders/my-orders');
    return response.data.data || [];
  };

  const {
    data: orders,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['my-orders'],
    queryFn: getMyOrders,
    enabled: !!user,
    retry: 1,
  });

  // Filter orders by selected status
  const filteredOrders =
    statusFilter === 'all'
      ? orders || []
      : (orders || []).filter(
          (o) =>
            o.status?.status_name?.toLowerCase() === statusFilter.toLowerCase()
        );

  // Count per status for chip badges
  const statusCounts = (orders || []).reduce((acc: Record<string, number>, o) => {
    const s = o.status?.status_name?.toLowerCase() || 'unknown';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-3" />
          <div className="flex gap-2 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-8 w-20 bg-gray-200 rounded-full animate-pulse" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4">
          <XCircle className="h-8 w-8 text-red-400" />
        </div>
        <p className="text-red-500 text-lg font-medium">Failed to load orders</p>
        <p className="text-gray-500 text-sm mt-1">
          {error instanceof Error ? error.message : 'Please try again later.'}
        </p>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-2xl">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-50 mb-4">
          <ShoppingBag className="h-10 w-10 text-amber-300" />
        </div>
        <h2 className="text-xl font-semibold text-slate-700">No orders yet</h2>
        <p className="text-gray-500 mt-2 mb-6">
          Start shopping to place your first order!
        </p>
        <Link to="/products">
          <Button className="bg-amber-600 hover:bg-amber-700 text-white px-6">
            <ShoppingBag className="h-4 w-4 mr-2" /> Browse Products
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl pb-20">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-amber-100 rounded-xl">
            <ShoppingBag className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">My Orders</h1>
            <p className="text-sm text-gray-500">
              {orders.length} order{orders.length !== 1 ? 's' : ''} total
            </p>
          </div>
        </div>
      </div>

      {/* Status Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-5 -mx-1 px-1 scrollbar-hide">
        {USER_STATUS_FILTERS.map((filter) => {
          const count =
            filter.value === 'all'
              ? orders.length
              : statusCounts[filter.value] || 0;
          const isActive = statusFilter === filter.value;
          return (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                border transition-all duration-200 whitespace-nowrap shrink-0
                ${
                  isActive
                    ? filter.activeColor + ' shadow-sm'
                    : filter.color + ' hover:shadow-sm'
                }
              `}
            >
              {filter.label}
              <span
                className={`
                  inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold px-1
                  ${isActive ? 'bg-white/25 text-white' : 'bg-black/5 text-inherit'}
                `}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Empty filtered state */}
      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-3">
            <Package className="h-8 w-8 text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium">No orders with this status</p>
          <p className="text-sm text-gray-400 mt-1">Try selecting a different filter</p>
        </div>
      )}

      {/* Order Cards */}
      <div className="space-y-3">
        {filteredOrders.map((order) => {
          const statusName = order.status?.status_name || 'Unknown';
          const isCancelled = statusName.toLowerCase() === 'cancelled';

          return (
            <Link to={`/orders/${order.id}`} key={order.id}>
              <Card
                className={`
                  overflow-hidden transition-all duration-200 cursor-pointer
                  border border-slate-200/80
                  hover:border-amber-300 hover:shadow-lg hover:shadow-amber-100/50
                  hover:-translate-y-0.5
                  active:scale-[0.99]
                  group
                `}
              >
                <CardContent className="p-0">
                  {/* Top section: Order info */}
                  <div className="p-4 pb-3">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                          #{order.id.slice(0, 8)}
                        </span>
                        <Badge className={`${getStatusColor(statusName)} px-2 py-0.5 text-[10px] border-0`}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(statusName)}
                            {statusName}
                          </span>
                        </Badge>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          {order.order_type === 'Delivery' ? (
                            <Truck className="h-3.5 w-3.5" />
                          ) : (
                            <Store className="h-3.5 w-3.5" />
                          )}
                          {order.order_type}
                        </span>
                        <span className="text-gray-300">|</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(order.created_at).toLocaleDateString(
                            'en-US',
                            {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            }
                          )}
                        </span>
                      </div>
                      <span className="text-lg font-bold text-slate-800">
                        ${Number(order.total_price).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Timeline */}
                  <div
                    className={`
                      px-4 py-3 border-t border-dashed
                      ${isCancelled ? 'border-red-200 bg-red-50/30' : 'border-slate-100 bg-slate-50/50'}
                    `}
                  >
                    <HorizontalTimeline
                      orderType={order.order_type}
                      statusName={statusName}
                    />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
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
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
          <Clock className="h-8 w-8 text-slate-300" />
        </div>
        <p className="text-slate-600 text-lg">Please log in to view your orders.</p>
        <Link to="/login">
          <Button className="mt-4 bg-amber-600 hover:bg-amber-700">Sign In</Button>
        </Link>
      </div>
    );
  }
  return <UserOrdersView user={user} />;
}

export default function Orders() {
  return <UserOrdersWrapper />;
}

export function AdminOrders() {
  return <AdminOrdersView />;
}
