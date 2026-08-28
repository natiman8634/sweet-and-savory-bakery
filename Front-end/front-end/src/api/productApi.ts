import { apiClient } from './client';
import type { Product } from '../types';

export const getProducts = async (): Promise<Product[]> => {
  const response = await apiClient.get('/products');
  const payload = response.data;

  const data = payload?.data?.data ?? payload?.data ?? [];

  if (Array.isArray(data)) {
    return data;
  }

  console.warn('⚠️ Products API did not return an array:', payload);
  return [];
};

export const getProductById = async (id: string): Promise<Product> => {
  const response = await apiClient.get(`/products/${id}`);
  return response.data.data;
};

export const getCategories = async () => {
  const response = await apiClient.get('/categories');
  const payload = response.data;

  // Handle both raw array and wrapped { success, data } formats
  const data = payload?.data?.data ?? payload?.data ?? [];

  if (Array.isArray(data)) {
    return data;
  }

  console.warn('⚠️ Categories API did not return an array:', payload);
  return [];
};