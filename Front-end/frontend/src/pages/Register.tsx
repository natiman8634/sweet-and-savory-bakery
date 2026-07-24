import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../store/authSlice';
import type { AppDispatch, RootState } from '../store';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    default_address: '',
  });
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(register(formData)).unwrap();
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-amber-700">
            🍰 Create Account
          </CardTitle>
          <CardDescription>Join Sweet & Savory Bakery</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <Input
                id="full_name"
                type="text"
                required
                placeholder="John Doe"
                value={formData.full_name}
                onChange={handleChange}
                className="mt-1"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <Input
                id="email"
                type="email"
                required
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
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
                placeholder="•••••••• (min 8 chars)"
                value={formData.password}
                onChange={handleChange}
                className="mt-1"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <Input
                id="phone"
                type="tel"
                required
                placeholder="+251911000000"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1"
              />
            </div>
            <div>
              <label htmlFor="default_address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <Input
                id="default_address"
                type="text"
                required
                placeholder="Your address"
                value={formData.default_address}
                onChange={handleChange}
                className="mt-1"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-700"
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
            <p className="text-sm text-center text-gray-600 mt-4">
              Already have an account?{' '}
              <Link to="/login" className="text-amber-600 hover:text-amber-700 font-medium">
                Sign In
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}