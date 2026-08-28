import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { CartItem,  } from '../types';

// ============================================================
// 1. Action Types
// ============================================================
type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'quantity'> & { quantity?: number } }
  | { type: 'REMOVE_ITEM'; payload: { productId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] };

// ============================================================
// 2. Reducer
// ============================================================
const cartReducer = (state: CartItem[], action: CartAction): CartItem[] => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { productId, name, price, image_url, maxStock, quantity = 1 } = action.payload;
      const existing = state.find((item) => item.productId === productId);
      if (existing) {
        // Increase quantity but cap at maxStock
        const newQty = Math.min(existing.quantity + quantity, existing.maxStock);
        return state.map((item) =>
          item.productId === productId ? { ...item, quantity: newQty } : item
        );
      }
      // New item
      return [...state, { productId, name, price, image_url, quantity, maxStock }];
    }

    case 'REMOVE_ITEM':
      return state.filter((item) => item.productId !== action.payload.productId);

    case 'UPDATE_QUANTITY': {
      const { productId, quantity } = action.payload;
      if (quantity <= 0) {
        // Remove item if quantity is 0 or negative
        return state.filter((item) => item.productId !== productId);
      }
      return state.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.min(quantity, item.maxStock) }
          : item
      );
    }

    case 'CLEAR_CART':
      return [];

    case 'LOAD_CART':
      return action.payload;

    default:
      return state;
  }
};

// ============================================================
// 3. Context
// ============================================================
interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (product: { id: string; name: string; price: number; image_url: string; stock_quantity: number }) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'bakery_cart';

// ============================================================
// 4. Provider
// ============================================================
export function CartProvider({ children }: { children: ReactNode }) {
  // Load initial state from localStorage
  const loadCartFromStorage = (): CartItem[] => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading cart from storage:', error);
    }
    return [];
  };

  const [items, dispatch] = useReducer(cartReducer, [], loadCartFromStorage);

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving cart to storage:', error);
    }
  }, [items]);

  // Compute totals
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Actions
  const addItem = (product: { id: string; name: string; price: number; image_url: string; stock_quantity: number }) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        productId: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url || '',
        maxStock: product.stock_quantity,
        quantity: 1,
      },
    });
  };

  const removeItem = (productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { productId } });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const value: CartContextType = {
    items,
    totalItems,
    totalPrice,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// ============================================================
// 5. Custom Hook
// ============================================================
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}