import { apiClient } from '../lib/api';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock_quantity: number;
  is_available: boolean;
  category_id: number;
  category?: {
    id: number;
    category_name: string;
  };
  _count?: {
    reviews: number;
  };
}

// ✅ Helper to extract products from any response format
const extractProducts = (data: any): Product[] => {
  if (!data) return [];
  
  // If it's already an array
  if (Array.isArray(data)) return data;
  
  // If data.data is an array
  if (data.data && Array.isArray(data.data)) return data.data;
  
  // If data.data.data is an array (nested)
  if (data.data?.data && Array.isArray(data.data.data)) return data.data.data;
  
  // If data.products is an array
  if (data.products && Array.isArray(data.products)) return data.products;
  
  // If data.items is an array
  if (data.items && Array.isArray(data.items)) return data.items;
  
  // If data.results is an array
  if (data.results && Array.isArray(data.results)) return data.results;
  
  // If data.list is an array
  if (data.list && Array.isArray(data.list)) return data.list;
  
  // Check if any key contains an array
  for (const key in data) {
    if (Array.isArray(data[key])) {
      return data[key];
    }
  }
  
  return [];
};

export const productsApi = {
  getAll: async (params?: { category?: string; search?: string }) => {
    try {
      const response = await apiClient.get('/api/products', { params });
      
      console.log('API Response:', response.data);
      
      const productsData = extractProducts(response.data);
      
      console.log('Extracted products:', productsData.length);
      
      return {
        success: response.data?.success !== false,
        data: productsData
      };
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        data: []
      };
    }
  },

  getById: (id: string) =>
    apiClient.get<{ success: boolean; data: Product }>(`/api/products/${id}`),

  getCategories: () =>
    apiClient.get<{ success: boolean; data: { id: number; category_name: string }[] }>('/api/categories'),
};