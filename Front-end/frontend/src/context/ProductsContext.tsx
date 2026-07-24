import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Product } from '../api/products.api';

interface ProductsContextType {
  products: Product[];
  setProducts: (products: Product[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <ProductsContext.Provider value={{ products, setProducts, isLoading, setIsLoading }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
}