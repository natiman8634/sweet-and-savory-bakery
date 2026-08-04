
export interface User {
  id: string;
  email: string;
  role_id: number;
  role?: { id: number; role_name: string };
  profile?: CustomerProfile;
}

export interface CustomerProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  default_address: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category_id: number;
  category?: { id: number; category_name: string };
  stock_quantity: number;
  is_available: boolean;
  averageRating?: number;
  reviewsCount?: number;
}

export interface Order {
  id: string;
  total_price: number;
  order_type: 'Pickup' | 'Delivery';
  scheduled_for: string;
  status: { id: number; status_name: string };
  orderItems: OrderItem[];
  payment?: Payment;
  created_at: string;
}

export interface OrderItem {
  id: string;
  product_id: string;
  product?: Product;
  quantity: number;
  subtotal: number;
}

export interface Payment {
  id: string;
  amount: number;
  payment_method: string;
  payment_status: string;
  paid_at?: string;
}

// ... existing types ...

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  profile: {
    full_name: string;
    phone: string;
    default_address: string;
  };
}

export interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  default_address?: string;
}