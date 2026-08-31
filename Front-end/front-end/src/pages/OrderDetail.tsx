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
} from 'lucide-react';

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

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
    case 'unpaid':
      return <Clock className="h-4 w-4" />;
    case 'preparing':
      return <Package className="h-4 w-4" />;
    case 'ready for pickup':
      return <CheckCircle className="h-4 w-4" />;
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

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: order, isLoading, isError } = useQuery({
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

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-amber-700 transition-colors">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/orders" className="hover:text-amber-700 transition-colors">Orders</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-800 font-medium">#{order.id.slice(0, 8)}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Order Details</h1>
          <p className="text-sm text-gray-500 mt-1">
            Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <Badge className={`${getStatusColor(statusName)} flex items-center gap-1.5 px-3 py-1.5 text-sm`}>
          {getStatusIcon(statusName)} {statusName}
        </Badge>
      </div>

      {/* Order Info Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Package className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Order Type</p>
              <p className="font-semibold text-slate-800">{order.order_type}</p>
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
                {new Date(order.scheduled_for).toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
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
                  <p className="font-semibold text-slate-800">{order.payment.payment_method}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${order.payment.payment_status === 'Completed' ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                  <CheckCircle className={`h-5 w-5 ${order.payment.payment_status === 'Completed' ? 'text-emerald-600' : 'text-amber-600'}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Payment Status</p>
                  <p className="font-semibold text-slate-800">{order.payment.payment_status}</p>
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
              <p className="text-xs text-gray-500 mb-1">Delivery Address</p>
              <p className="font-medium text-slate-800">{order.customer.default_address}</p>
              {order.customer.phone && (
                <p className="text-sm text-gray-500 mt-1">{order.customer.phone}</p>
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
              <div key={item.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                <div className="h-14 w-14 rounded-lg bg-amber-50 overflow-hidden shrink-0">
                  {item.product?.image_url ? (
                    <img src={item.product.image_url} alt={item.product.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xl text-amber-200">🍞</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">{item.product?.name || 'Product'}</p>
                  <p className="text-sm text-gray-500">
                    ${Number(item.product?.price || 0).toFixed(2)} × {item.quantity}
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
