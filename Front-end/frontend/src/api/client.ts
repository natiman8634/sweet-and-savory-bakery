/* eslint-disable @typescript-eslint/no-explicit-any */
// src/api/client.ts
import axios, { type AxiosInstance, AxiosError, type InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 30000
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError) => Promise.reject(error)
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  public getClient(): AxiosInstance {
    return this.client;
  }

  public get<T>(url: string, params?: any): Promise<T> {
    return this.client.get<T>(url, { params }).then(res => res.data);
  }

  public post<T>(url: string, data?: any): Promise<T> {
    return this.client.post<T>(url, data).then(res => res.data);
  }

  public put<T>(url: string, data?: any): Promise<T> {
    return this.client.put<T>(url, data).then(res => res.data);
  }

  public patch<T>(url: string, data?: any): Promise<T> {
    return this.client.patch<T>(url, data).then(res => res.data);
  }

  public delete<T>(url: string): Promise<T> {
    return this.client.delete<T>(url).then(res => res.data);
  }
}

export const apiClient = new ApiClient();
export default apiClient;