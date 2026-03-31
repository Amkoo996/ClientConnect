import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import { Button } from '../components/Button';
import { LogIn } from 'lucide-react';

export const Login = () => {
  const { login, currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  React.useEffect(() => {
    if (currentUser) {
      navigate(currentUser.role === 'ADMIN' ? '/admin/dashboard' : '/client/dashboard');
    }
  }, [currentUser, navigate]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await login();
      showToast("Successfully logged in", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to log in", "error");
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
        
        <div className="mt-8 space-y-6">
          <Button onClick={handleGoogleLogin} className="w-full gap-2" isLoading={loading}>
            <LogIn className="w-4 h-4" /> Sign in with Google
          </Button>
        </div>

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
