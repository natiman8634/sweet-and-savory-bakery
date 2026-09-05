import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  ArrowLeft,
  Clock,
  Package,
  CheckCircle,
  XCircle,
  ChevronRight,
  Truck,
  CreditCard,
  MapPin,
  Calendar,
  ClipboardList,
  CircleCheckBig,
  PackageCheck,
  Store,
  Wallet,
  CookingPot,
  BadgeCheck,
  ShoppingBag,
  Home,
  Bike,
  MapPinned,
} from 'lucide-react';

// ============================================================
// TYPES
// ============================================================
interface OrderItem {
  id: string;
  quantity: number;
  subtotal: number;
  product?: {
    id: string;
    name: string;
    price: number;
    image_url: string;
  };
}

interface OrderDetail {
  id: string;
  total_price: number;
  order_type: string;
  scheduled_for: string;
  status: { id: number; status_name: string };
  created_at: string;
  orderItems: OrderItem[];
  payment?: {
    id: string;
    amount: number;
    payment_method: string;
    payment_status: string;
    paid_at?: string;
  };
  customer?: {
    id: string;
    full_name: string;
    phone: string;
    default_address: string;
  };
}

// ============================================================
// TIMELINE STEP DEFINITION
// ============================================================
interface TimelineStep {
  key: string;
  label: string;
  description: string;
  icon: React.ElementType;
}

const PICKUP_STEPS: TimelineStep[] = [
  {
    key: 'order_placed',
    label: 'Order Placed',
    description: 'Your order has been received at our bakery',
    icon: Store,
  },
  {
    key: 'payment_confirmed',
    label: 'Payment Confirmed',
    description: 'Payment has been securely processed',
    icon: Wallet,
  },
  {
    key: 'preparing',
    label: 'Preparing',
    description: 'Our chefs are crafting your order',
    icon: CookingPot,
  },
  {
    key: 'ready_for_pickup',
    label: 'Ready for Pickup',
    description: 'Your order is packed and waiting',
    icon: BadgeCheck,
  },
  {
    key: 'completed',
    label: 'Picked Up',
    description: 'Enjoy your treats!',
    icon: ShoppingBag,
  },
];

const DELIVERY_STEPS: TimelineStep[] = [
  {
    key: 'order_placed',
    label: 'Order Placed',
    description: 'Your order has been placed from home',
    icon: Home,
  },
  {
    key: 'payment_confirmed',
    label: 'Payment Confirmed',
    description: 'Payment has been securely processed',
    icon: Wallet,
  },
  {
    key: 'preparing',
    label: 'Preparing',
    description: 'Our chefs are crafting your order',
    icon: CookingPot,
  },
  {
    key: 'out_for_delivery',
    label: 'Out for Delivery',
    description: 'Your order is on its way to you',
    icon: Bike,
  },
  {
    key: 'completed',
    label: 'Delivered',
    description: 'Delivered right to your doorstep',
    icon: MapPinned,
  },
];

// Maps backend status names to the step index they correspond to
const STATUS_TO_STEP_INDEX: Record<string, number> = {
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

// ============================================================
// ORDER TRACKING TIMELINE COMPONENT
// ============================================================
function OrderTrackingTimeline({
  orderType,
  currentStatus,
  isCancelled,
}: {
  orderType: string;
  currentStatus: string;
  isCancelled: boolean;
}) {
  const steps =
    orderType.toLowerCase() === 'delivery' ? DELIVERY_STEPS : PICKUP_STEPS;

  const currentStepIndex = isCancelled
    ? -1
    : STATUS_TO_STEP_INDEX[currentStatus.toLowerCase()] ?? 0;

  return (
    <Card className="border-0 shadow-sm mb-6 overflow-visible">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="p-1.5 bg-slate-100 rounded-lg">
            <ClipboardList className="h-4 w-4 text-slate-600" />
          </div>
          Order Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-2">
        <div className="relative">
          {steps.map((step, index) => {
            const isCompleted = !isCancelled && index < currentStepIndex;
            const isActive =
              !isCancelled && index === currentStepIndex;
            const isUpcoming = isCancelled || index > currentStepIndex;
            const isLast = index === steps.length - 1;

            const StepIcon = step.icon;

            // Determine circle and connector colors
            let circleBg = '';
            let circleBorder = '';
            let circleText = '';
            let connectorColor = '';
            let labelColor = '';
            let descColor = '';

            if (isCompleted) {
              circleBg = 'bg-emerald-500';
              circleBorder = 'border-emerald-500';
              circleText = 'text-white';
              connectorColor = 'bg-emerald-400';
              labelColor = 'text-slate-800';
              descColor = 'text-slate-500';
            } else if (isActive) {
              circleBg = 'bg-amber-500';
              circleBorder = 'border-amber-500';
              circleText = 'text-white';
              connectorColor = 'bg-slate-200';
              labelColor = 'text-slate-800 font-semibold';
              descColor = 'text-amber-600';
            } else {
              circleBg = 'bg-white';
              circleBorder = 'border-slate-300';
              circleText = 'text-slate-400';
              connectorColor = 'bg-slate-200';
              labelColor = 'text-slate-400';
              descColor = 'text-slate-400';
            }

            // Cancelled override for the active step area
            if (isCancelled && index === 0) {
              circleBg = 'bg-red-500';
              circleBorder = 'border-red-500';
              circleText = 'text-white';
              labelColor = 'text-red-600';
              descColor = 'text-red-400';
            }

            return (
              <div key={step.key} className="relative flex gap-4">
                {/* Vertical connector line + circle column */}
                <div className="flex flex-col items-center">
                  {/* Circle */}
                  <div
                    className={`
                      relative z-10 flex items-center justify-center
                      w-10 h-10 rounded-full border-2 shrink-0
                      transition-all duration-300
                      ${circleBg} ${circleBorder} ${circleText}
                      ${isActive ? 'ring-4 ring-amber-100 shadow-lg shadow-amber-200/50' : ''}
                      ${isCompleted ? 'shadow-md shadow-emerald-200/50' : ''}
                    `}
                  >
                    {/* Always show the step icon regardless of state */}
                    <StepIcon className="h-5 w-5" />

                    {/* Small checkmark overlay for completed steps */}
                    {isCompleted && (
                      <span className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-white border border-emerald-500">
                        <CheckCircle className="h-2.5 w-2.5 text-emerald-500" />
                      </span>
                    )}

                    {/* Small X overlay for cancelled */}
                    {isCancelled && index === 0 && (
                      <span className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-white border border-red-500">
                        <XCircle className="h-2.5 w-2.5 text-red-500" />
                      </span>
                    )}

                    {/* Pulse animation for active step */}
                    {isActive && (
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-20" />
                    )}
                  </div>

                  {/* Connector line */}
                  {!isLast && (
                    <div
                      className={`
                        w-0.5 flex-1 min-h-[2rem]
                        ${isCompleted ? connectorColor : 'bg-slate-200'}
                        ${isCompleted ? '' : 'border-l-2 border-dashed border-slate-200 bg-transparent'}
                      `}
                      style={
                        isCompleted
                          ? undefined
                          : { width: '2px', background: 'repeating-linear-gradient(to bottom, #e2e8f0 0, #e2e8f0 4px, transparent 4px, transparent 8px)' }
                      }
                    />
                  )}
                </div>

                {/* Content column */}
                <div className={`pb-6 ${isLast ? 'pb-0' : ''} flex-1 min-w-0`}>
                  <div className="flex items-center gap-2">
                    <p className={`text-sm ${labelColor}`}>{step.label}</p>
                    {isActive && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold uppercase tracking-wide">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-600" />
                        </span>
                        Current
                      </span>
                    )}
                    {isCompleted && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-semibold uppercase tracking-wide">
                        Done
                      </span>
                    )}
                  </div>
                  <p className={`text-xs mt-0.5 ${descColor}`}>
                    {isCancelled && index === 0
                      ? 'This order has been cancelled'
                      : step.description}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Cancelled overlay — shown after normal steps */}
          {isCancelled && (
            <div className="relative flex gap-4">
              <div className="flex flex-col items-center">
                <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 bg-red-500 border-red-500 text-white shadow-lg shadow-red-200/50">
                  <XCircle className="h-5 w-5" />
                </div>
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <p className="text-sm font-semibold text-red-600">
                  Order Cancelled
                </p>
                <p className="text-xs text-red-400 mt-0.5">
                  This order has been cancelled
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// STATUS HELPERS (for badge)
// ============================================================
const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
    case 'unpaid':
      return <Clock className="h-4 w-4" />;
    case 'preparing':
      return <Package className="h-4 w-4" />;
    case 'ready for pickup':
      return <PackageCheck className="h-4 w-4" />;
    case 'out for delivery':
      return <Truck className="h-4 w-4" />;
    case 'completed':
      return <CheckCircle className="h-4 w-4" />;
    case 'cancelled':
      return <XCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
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
// MAIN COMPONENT
// ============================================================
export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();

  const {
    data: order,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['order', id],
    queryFn: async (): Promise<OrderDetail> => {
      const response = await apiClient.get(`/orders/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 bg-gray-200 rounded" />
          <div className="h-48 bg-gray-200 rounded-xl" />
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-red-500 text-xl">Failed to load order</p>
        <Link to="/orders">
          <Button className="mt-4 bg-amber-700 hover:bg-amber-800">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Orders
          </Button>
        </Link>
      </div>
    );
  }

  const statusName = order.status?.status_name || 'Unknown';
  const isCancelled = statusName.toLowerCase() === 'cancelled';

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link
          to="/"
          className="hover:text-amber-700 transition-colors"
        >
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link
          to="/orders"
          className="hover:text-amber-700 transition-colors"
        >
          Orders
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-800 font-medium">
          #{order.id.slice(0, 8)}
        </span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Order Details
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Placed on{' '}
            {new Date(order.created_at).toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <Badge
          className={`${getStatusColor(statusName)} flex items-center gap-1.5 px-3 py-1.5 text-sm`}
        >
          {getStatusIcon(statusName)} {statusName}
        </Badge>
      </div>

      {/* ===== ORDER TRACKING TIMELINE ===== */}
      <OrderTrackingTimeline
        orderType={order.order_type}
        currentStatus={statusName}
        isCancelled={isCancelled}
      />

      {/* Order Info Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Package className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Order Type</p>
              <p className="font-semibold text-slate-800">
                {order.order_type}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Scheduled For</p>
              <p className="font-semibold text-slate-800">
                {new Date(order.scheduled_for).toLocaleDateString(
                  'en-US',
                  {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  }
                )}
              </p>
            </div>
          </CardContent>
        </Card>
        {order.payment && (
          <>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <CreditCard className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Payment</p>
                  <p className="font-semibold text-slate-800">
                    {order.payment.payment_method}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    order.payment.payment_status === 'Completed'
                      ? 'bg-emerald-50'
                      : 'bg-amber-50'
                  }`}
                >
                  <CheckCircle
                    className={`h-5 w-5 ${
                      order.payment.payment_status === 'Completed'
                        ? 'text-emerald-600'
                        : 'text-amber-600'
                    }`}
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-500">
                    Payment Status
                  </p>
                  <p className="font-semibold text-slate-800">
                    {order.payment.payment_status}
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Delivery Address */}
      {order.customer?.default_address && (
        <Card className="border-0 shadow-sm mb-6">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="p-2 bg-purple-50 rounded-lg shrink-0">
              <MapPin className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">
                Delivery Address
              </p>
              <p className="font-medium text-slate-800">
                {order.customer.default_address}
              </p>
              {order.customer.phone && (
                <p className="text-sm text-gray-500 mt-1">
                  {order.customer.phone}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Items */}
      <Card className="border-0 shadow-sm mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Order Items</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="divide-y divide-gray-100">
            {order.orderItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div className="h-14 w-14 rounded-lg bg-amber-50 overflow-hidden shrink-0">
                  {item.product?.image_url ? (
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Package className="h-6 w-6 text-amber-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">
                    {item.product?.name || 'Product'}
                  </p>
                  <p className="text-sm text-gray-500">
                    ${Number(item.product?.price || 0).toFixed(2)} ×{' '}
                    {item.quantity}
                  </p>
                </div>
                <p className="font-semibold text-slate-800 shrink-0">
                  ${Number(item.subtotal).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="border-t border-gray-200 mt-4 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total</span>
              <span className="text-2xl font-bold text-amber-700">
                ${Number(order.total_price).toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Back Button */}
      <Link to="/orders" className="block">
        <Button variant="outline" className="w-full border-gray-200 text-gray-600 hover:bg-gray-50">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Orders
        </Button>
      </Link>
    </div>
  );
}