import { apiClient } from './client';
import type { User } from '../types';

// ============================================================
// 🟢 LOGIN - POST /api/auth/login
// ============================================================
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
    profile: {
      full_name: string;
      phone: string;
      default_address: string;
    };
  };
}

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const response = await apiClient.post('/auth/login', credentials);
  return response.data;
};

// ============================================================
// 🟢 REGISTER - POST /api/auth/register
// ============================================================
export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  default_address?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  userId: string;
  token: string;
}

export const register = async (data: RegisterData): Promise<RegisterResponse> => {
  const response = await apiClient.post('/auth/register', data);
  return response.data;
};

// ============================================================
// 🟢 GET PROFILE - GET /api/auth/profile
// ============================================================
export const getProfile = async (): Promise<User> => {
  const response = await apiClient.get('/auth/profile');
  return response.data.data;
};

// ============================================================
// 🟢 LOGOUT - Frontend only
// ============================================================
export const logout = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};