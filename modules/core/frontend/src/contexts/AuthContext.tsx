'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { User, LoginCredentials, RegisterData, AuthContextType } from '@/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        const response = await authAPI.getCurrentUser();
        setUser(response.data);
      } else {
        // No token, user is not logged in - this is normal
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear invalid tokens
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await authAPI.login(
        credentials.username_or_email,
        credentials.password
      );

      const { access_token, refresh_token } = response.data;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);

      const userResponse = await authAPI.getCurrentUser();
      setUser(userResponse.data);

      router.push('/');
    } catch (error: any) {
      const detail = error.response?.data?.detail;

      // Handle array of validation errors
      if (Array.isArray(detail)) {
        const errorMessages = detail.map((err: any) => {
          if (typeof err === 'object' && err.msg) {
            return err.msg;
          }
          return String(err);
        }).join(', ');
        throw new Error(errorMessages || 'Login failed');
      }

      // Handle string error message
      throw new Error(typeof detail === 'string' ? detail : 'Login failed');
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await authAPI.register(data);

      const { access_token, refresh_token } = response.data;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);

      const userResponse = await authAPI.getCurrentUser();
      setUser(userResponse.data);

      router.push('/');
    } catch (error: any) {
      const detail = error.response?.data?.detail;

      // Handle array of validation errors
      if (Array.isArray(detail)) {
        const errorMessages = detail.map((err: any) => {
          if (typeof err === 'object' && err.msg) {
            return err.msg;
          }
          return String(err);
        }).join(', ');
        throw new Error(errorMessages || 'Registration failed');
      }

      // Handle string error message
      throw new Error(typeof detail === 'string' ? detail : 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      router.push('/login');
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setUser(response.data);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
