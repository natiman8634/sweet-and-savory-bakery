import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../components/ui/form';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';

// ✅ Zod validation schema matching backend
const registerSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .refine((value) => !/\d/.test(value), 'Full name cannot contain numbers'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z
    .string()
    .trim()
    .refine(
      (value) => !value || /^\+?\d[\d\s-]{6,}$/.test(value),
      'Enter a valid phone number (digits, e.g. +251 911 123 456)'
    ),
  default_address: z.string().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [nameWarning, setNameWarning] = useState<string | null>(null);
  const nameWarningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Strip digits from the Full Name field and warn the user when they try to enter one
  const handleNameChange = (raw: string, onChange: (value: string) => void) => {
    const cleaned = raw.replace(/[0-9]/g, '');
    if (cleaned !== raw) {
      setNameWarning('Numbers are not allowed — please enter letters only');
      if (nameWarningTimer.current) clearTimeout(nameWarningTimer.current);
      nameWarningTimer.current = setTimeout(() => setNameWarning(null), 4000);
    } else if (nameWarning) {
      setNameWarning(null);
      if (nameWarningTimer.current) {
        clearTimeout(nameWarningTimer.current);
        nameWarningTimer.current = null;
      }
    }
    onChange(cleaned);
  };

  useEffect(() => {
    return () => {
      if (nameWarningTimer.current) clearTimeout(nameWarningTimer.current);
    };
  }, []);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      phone: '',
      default_address: '',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setError(null);
    setIsLoading(true);
    try {
      await register(data);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50/50 px-4 py-8">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="text-4xl mb-2">🎂</div>
          <CardTitle className="text-2xl text-amber-800">Join Our Bakery</CardTitle>
          <CardDescription>Create your Sweet & Savory Bakery account</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        autoComplete="name"
                        {...field}
                        onChange={(e) => handleNameChange(e.target.value, field.onChange)}
                      />
                    </FormControl>
                    {nameWarning && (
                      <p role="alert" className="text-sm font-medium text-amber-600">
                        {nameWarning}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>                      <FormLabel>Phone (Optional)</FormLabel>
                      <FormControl>
                        <Input type="tel" autoComplete="tel" placeholder="+251 911 000 000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="default_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Address (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Bole Road, Addis Ababa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && (
                <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                className="w-full bg-amber-700 hover:bg-amber-800"
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-amber-700 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}