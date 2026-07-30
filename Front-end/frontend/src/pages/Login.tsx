import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../store/authSlice';
import type { AppDispatch, RootState } from '../store';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export default function Login() {
  const [email, setEmail] = useState('admin@bakery.com');
  const [password, setPassword] = useState('Admin@123');
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  // ✅ Redirect based on user role after login
  useEffect(() => {
    if (isAuthenticated && user) {
      const userRole = user?.role?.role_name || user?.role;
      console.log('👤 User logged in:', user);
      console.log('👑 User role:', userRole);
      
      if (userRole === 'Admin') {
        toast.success('Welcome Admin!');
        navigate('/admin/dashboard');
      } else {
        toast.success('Login successful!');
        navigate('/');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await dispatch(login({ email, password })).unwrap();
      console.log('✅ Login result:', result);
      // Redirect will happen in useEffect above
    } catch (err) {
      console.error('❌ Login error:', err);
      toast.error(error || 'Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-amber-700">
            🍰 Sweet & Savory Bakery
          </CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <Input
                id="email"
                type="email"
                required
                placeholder="admin@bakery.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <Input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
              />
            </div>
            
            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">
                ❌ {error}
              </div>
            )}
            
            <Button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-700"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
            
            
            
            <p className="text-sm text-center text-gray-600 mt-4">
              Don't have an account?{' '}
              <Link to="/register" className="text-amber-600 hover:text-amber-700 font-medium">
                Register
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}