import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { loginSchema } from '../schemas/validation';
import { z } from 'zod';
import { LogIn } from 'lucide-react';

export const Login = () => {
  const { login, currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if already logged in
  React.useEffect(() => {
    if (currentUser) {
      navigate(currentUser.role === 'ADMIN' ? '/admin/dashboard' : '/client/dashboard');
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate form
      loginSchema.parse({ email, password });
      setErrors({});
      setLoading(true);

      await login(email, password);
      showToast("Successfully logged in", "success");
      // Navigation is handled by the useEffect above once currentUser updates
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        (error as z.ZodError<any>).issues.forEach(err => {
          if (err.path[0]) newErrors[err.path[0].toString()] = err.message;
        });
        setErrors(newErrors);
      } else {
        showToast(error instanceof Error ? error.message : "Failed to log in", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
            <span className="text-white font-bold text-2xl">C</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome back</h2>
          <p className="mt-2 text-sm text-gray-500">
            Sign in to your ClientConnect account
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              placeholder="you@example.com"
            />
            
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                Forgot your password?
              </a>
            </div>
          </div>

          <Button type="submit" className="w-full gap-2" isLoading={loading}>
            <LogIn className="w-4 h-4" /> Sign in
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500">
            Sign up as a client
          </Link>
        </div>
      </div>
    </div>
  );
};
