import { apiClient } from '../lib/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  default_address: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  default_address: string;
  role_id: number;
  role?: {
    id: number;
    role_name: string;
  };
}

export const authApi = {
  login: (credentials: LoginCredentials) =>
    apiClient.post<{
      user: { id: string; email: string; full_name: string; phone: string; default_address: string; role_id: number; role?: { id: number; role_name: string; } | undefined; } | null;
      user: any;
      user: { id: string; email: string; full_name: string; phone: string; default_address: string; role_id: number; role?: { id: number; role_name: string; } | undefined; } | null; token: string; message: string 
}>('/api/auth/login', credentials),

  register: (data: RegisterData) =>
    apiClient.post<{
      token: string | null;
      user: { id: string; email: string; full_name: string; phone: string; default_address: string; role_id: number; role?: { id: number; role_name: string; } | undefined; } | null;
      token: string;
      user: any;
      token: string | null;
      user: { id: string; email: string; full_name: string; phone: string; default_address: string; role_id: number; role?: { id: number; role_name: string; } | undefined; } | null; message: string; userId: string 
}>('/api/auth/register', data),

  getProfile: () =>
    apiClient.get<{ success: boolean; data: User }>('/api/users/profile'),

  updateProfile: (data: Partial<RegisterData>) =>
    apiClient.put<{ success: boolean; data: User }>('/api/users/profile', data),

  changePassword: (data: { current_password: string; new_password: string }) =>
    apiClient.patch<{ success: boolean; message: string }>('/api/users/change-password', data),
};