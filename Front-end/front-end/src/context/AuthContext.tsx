import { createContext, useContext, useState, useEffect,type ReactNode } from 'react';
import { login as loginApi, register as registerApi } from '../api/authApi';
import  type {  AuthUser,  AuthContextType, RegisterData } from '../types';

// ============================================================
// 1. Create the Context
// ============================================================
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================
// 2. Create the Provider
// ============================================================
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Check if user is already logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          // ✅ Verify token is still valid by fetching profile
        //   const profile = await getProfile();
          setUser(JSON.parse(storedUser));
        } catch (error) {
          // Token is invalid or expired
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // ============================================================
  // 3. Login Function
  // ============================================================
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await loginApi({ email, password });
      
      // ✅ Store token and user data
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      setUser(response.user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // 4. Register Function
  // ============================================================
  const register = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const response = await registerApi(data);
      
      // ✅ Store token and user data after registration
      localStorage.setItem('token', response.token);
      
      // Fetch user profile after registration
    //   const profile = await getProfile();
      const userData = {
        id: response.userId,
        email: data.email,
        role: 'Customer',
        profile: {
          full_name: data.full_name,
          phone: data.phone || '',
          default_address: data.default_address || '',
        },
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // 5. Logout Function
  // ============================================================
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  };

  // ============================================================
  // 6. Provide the Context Value
  // ============================================================
  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================================
// 7. Custom Hook to use Auth Context
// ============================================================
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}