'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Input from '@/components/Input';
import Button from '@/components/Button';
import Footer from '@/components/Footer';
import { FiLock, FiMail } from 'react-icons/fi';

export default function LoginPage() {
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    username_or_email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState({
    appName: 'NexaCore',
    primaryColor: '#5147e6',
    secondaryColor: '#01411C',
  });

  // Load theme from localStorage
  useEffect(() => {
    try {
      const sharedTheme = localStorage.getItem('shared_theme');
      if (sharedTheme) {
        const parsedTheme = JSON.parse(sharedTheme);
        setTheme({ ...theme, ...parsedTheme });
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Show loading spinner while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" autoComplete="on">
          <div className="relative">
            <FiMail className="absolute left-3 top-10 text-gray-400" />
            <Input
              label="Username or Email"
              type="text"
              name="username_or_email"
              value={formData.username_or_email}
              onChange={handleChange}
              placeholder="Enter your username or email"
              required
              className="pl-10"
              autoComplete="username"
            />
          </div>

          <div className="relative">
            <FiLock className="absolute left-3 top-10 text-gray-400" />
            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              className="pl-10"
              autoComplete="current-password"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2 rounded" />
              <span className="text-gray-600">Remember me</span>
            </label>
            <Link href="/forgot-password" className="text-blue-600 hover:text-blue-700">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" fullWidth loading={loading}>
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
              Register here
            </Link>
          </p>
        </div>
      </div>
      <Footer theme={theme} />
    </div>
  );
}
