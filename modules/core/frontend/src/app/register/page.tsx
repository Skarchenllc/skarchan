'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Input from '@/components/Input';
import Button from '@/components/Button';
import Footer from '@/components/Footer';
import { FiUser, FiMail, FiLock, FiBriefcase } from 'react-icons/fi';

export default function RegisterPage() {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    first_name: '',
    last_name: '',
    org_name: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      await register(formData);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <FiUser className="absolute left-3 top-10 text-gray-400" />
            <Input
              label="Username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Choose a username"
              required
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <FiUser className="absolute left-3 top-10 text-gray-400" />
              <Input
                label="First Name"
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="Enter your first name"
                required
                className="pl-10"
              />
            </div>

            <div className="relative">
              <FiUser className="absolute left-3 top-10 text-gray-400" />
              <Input
                label="Last Name"
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Enter your last name"
                required
                className="pl-10"
              />
            </div>
          </div>

          <div className="relative">
            <FiMail className="absolute left-3 top-10 text-gray-400" />
            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <FiLock className="absolute left-3 top-10 text-gray-400" />
              <Input
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                required
                className="pl-10"
                helperText="At least 8 characters"
              />
            </div>

            <div className="relative">
              <FiLock className="absolute left-3 top-10 text-gray-400" />
              <Input
                label="Confirm Password"
                type="password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
                className="pl-10"
              />
            </div>
          </div>

          <div className="border-t pt-4 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Details</h3>

            <div className="relative">
              <FiBriefcase className="absolute left-3 top-10 text-gray-400" />
              <Input
                label="Organization Name"
                type="text"
                name="org_name"
                value={formData.org_name}
                onChange={handleChange}
                placeholder="Enter organization name"
                required
                className="pl-10"
              />
            </div>
          </div>

          <Button type="submit" fullWidth loading={loading} className="mt-6">
            Create Account
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
      <Footer theme={theme} />
    </div>
  );
}
