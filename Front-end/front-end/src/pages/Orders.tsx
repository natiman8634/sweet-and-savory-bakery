import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Clock, Package, CheckCircle, XCircle } from 'lucide-react';

interface Order {
  id: string;
  total_price: number;
  order_type: string;
  scheduled_for: string;
  status: { id: number; status_name: string };
  created_at: string;
}

const getMyOrders = async (): Promise<Order[]> => {
  const response = await apiClient.get('/orders/my-orders');
  return response.data.data || [];
};

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
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function Orders() {
  const { user } = useAuth();

  const { data: orders, isLoading, isError, error } = useQuery({
    queryKey: ['my-orders'],
    queryFn: getMyOrders,
    enabled: !!user,
    retry: 1,
  });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-gray-600">Please log in to view your orders.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-amber-800 mb-4">📋 My Orders</h1>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-red-500">⚠️ Failed to load orders</p>
        <p className="text-gray-500 text-sm mt-1">
          {error instanceof Error ? error.message : 'Please try again later.'}
        </p>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">📦</div>
        <h2 className="text-2xl font-semibold text-gray-600">No orders yet</h2>
        <p className="text-gray-500 mt-2">Start shopping to place your first order!</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 max-w-lg pb-20">
      <h1 className="text-2xl font-bold text-amber-800 mb-4">📋 My Orders</h1>
      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-sm font-medium">
                    Order #{order.id.slice(0, 8)}
                  </CardTitle>
                  <p className="text-xs text-gray-500">
                    {new Date(order.created_at).toLocaleDateString('en-US', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <Badge className={getStatusColor(order.status.status_name)}>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(order.status.status_name)}
                    {order.status.status_name}
                  </span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">
                  {order.order_type} • {new Date(order.scheduled_for).toLocaleDateString('en-US')}
                </span>
                <span className="font-bold text-amber-800">
                  ${Number(order.total_price).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}