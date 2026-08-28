import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { Button } from '../components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../components/ui/form';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { Badge } from '../components/ui/badge';

// ============================================================
// 1. Validation Schema - MATCHES BACKEND
// ============================================================
const checkoutSchema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  phone: z.string().min(10, 'Phone number is required'),
  address: z.string().min(5, 'Address is required'),
  order_type: z.enum(['Pickup', 'Delivery'], {
    required_error: 'Please select order type',
  }),
  scheduled_for: z.string().optional(),
  payment_method: z.enum(['Cash', 'Chapa'], {
    required_error: 'Please select payment method',
  }),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

// ============================================================
// 2. Component
// ============================================================
export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Redirect if cart is empty
  if (items.length === 0 && !orderComplete) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-semibold text-gray-600">Your cart is empty</h2>
        <p className="text-gray-500 mt-2">Add some items before checking out.</p>
        <Link to="/products">
          <Button className="mt-6 bg-amber-700 hover:bg-amber-800">
            <ArrowLeft className="mr-2 h-4 w-4" /> Start Shopping
          </Button>
        </Link>
      </div>
    );
  }

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      full_name: user?.profile?.full_name || '',
      phone: user?.profile?.phone || '',
      address: user?.profile?.default_address || '',
      order_type: 'Pickup',
      payment_method: 'Cash',
      scheduled_for: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
    },
  });

  const onSubmit = async (data: CheckoutFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // ✅ Prepare order items for backend
      const orderItems = items.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity,
      }));

      // ✅ Build request data based on authentication status
      let orderData: any = {
        items: orderItems,
        order_type: data.order_type,
        // Convert datetime-local (YYYY-MM-DDTHH:MM) to ISO string so it passes backend validation
        scheduled_for: data.scheduled_for
          ? new Date(data.scheduled_for).toISOString()
          : undefined,
        payment_method: data.payment_method,
      };

      // ✅ For guests, include customer details
      if (!user) {
        orderData = {
          ...orderData,
          customer_name: data.full_name,
          customer_phone: data.phone,
          customer_email: 'guest@example.com', // Required for guest orders
          customer_address: data.address,
        };
      }

      console.log('📦 Sending order data:', orderData);

      // ✅ Choose endpoint based on authentication
      const endpoint = user ? '/orders' : '/orders/guest';
      const response = await apiClient.post(endpoint, orderData);

      const result = response.data;
      console.log('✅ Order response:', result);

      if (result.success) {
        const newOrderId = result.data?.id || result.orderId || result.data?.orderId;
        setOrderId(newOrderId);
        setOrderComplete(true);
        clearCart();
      } else {
        setError(result.message || 'Failed to place order');
      }
    } catch (err: any) {
      console.error('❌ Checkout error:', err);
      
      // ✅ Better error messaging
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.response?.status === 400) {
        setError('Invalid order data. Please check your details and try again.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Order Complete View
  if (orderComplete) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-3xl font-bold text-amber-800 mb-2">Order Placed!</h1>
        <p className="text-gray-600 mb-4">
          Thank you for your order. We'll start preparing it right away.
        </p>
        <Card className="mb-6">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Order Reference</p>
            <p className="text-xl font-mono font-bold text-amber-800">
              #{orderId?.slice(0, 8)}
            </p>
            <Badge className="mt-2 bg-green-100 text-green-800 border-green-300">
              <CheckCircle className="h-3 w-3 mr-1" /> Confirmed
            </Badge>
          </CardContent>
        </Card>
        <div className="space-y-3">
          <Link to="/orders">
            <Button className="w-full bg-amber-700 hover:bg-amber-800">
              View My Orders
            </Button>
          </Link>
          <Link to="/products">
            <Button variant="outline" className="w-full">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Checkout Form
  return (
    <div className="container mx-auto px-4 py-4 max-w-lg pb-20">
      <Link to="/cart" className="inline-flex items-center text-sm text-gray-600 hover:text-amber-700 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Cart
      </Link>

      <h1 className="text-2xl font-bold text-amber-800 mb-4">📦 Checkout</h1>

      <div className="grid gap-6">
        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between text-sm">
                <span>
                  {item.name} <span className="text-gray-500">×{item.quantity}</span>
                </span>
                <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-2 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-amber-800">${totalPrice.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Checkout Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="John Doe" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="+251 911 000 000" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Address</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Bole Road, Addis Ababa" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="order_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select order type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Pickup">🛍️ Pickup</SelectItem>
                          <SelectItem value="Delivery">🚚 Delivery</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scheduled_for"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scheduled For</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="payment_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Cash" id="cash" />
                            <label htmlFor="cash" className="text-sm font-medium">💰 Cash</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Chapa" id="chapa" />
                            <label htmlFor="chapa" className="text-sm font-medium">💳 Chapa</label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {error && (
                  <div className="text-red-500 text-sm bg-red-50 p-3 rounded border border-red-200">
                    ❌ {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-amber-700 hover:bg-amber-800"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    `Place Order - $${totalPrice.toFixed(2)}`
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}