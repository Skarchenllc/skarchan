'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';

interface UserData {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
}

interface ThemeData {
  appName: string;
  primaryColor: string;
  secondaryColor: string;
  logoFile?: string;
  logoUrl?: string;
}

interface UserMenuProps {
  theme?: ThemeData;
}

const defaultTheme: ThemeData = {
  appName: 'NexaCore',
  primaryColor: '#5147e6',
  secondaryColor: '#01411C',
};

export default function UserMenu({ theme: themeProp }: UserMenuProps) {
  const [user, setUser] = useState<UserData | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<ThemeData>(themeProp || defaultTheme);

  useEffect(() => {
    checkAuth();

    // Load theme from localStorage if not provided as prop
    if (!themeProp) {
      try {
        const sharedTheme = localStorage.getItem('shared_theme');
        if (sharedTheme) {
          const parsedTheme = JSON.parse(sharedTheme);
          setTheme({ ...defaultTheme, ...parsedTheme });
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
      }
    }

    // Listen for auth-sync message from other windows/tabs
    const handleAuthSync = (event: MessageEvent) => {
      if (event.origin === window.location.origin || event.origin.startsWith('http://localhost:')) {
        if (event.data.type === 'AUTH_SYNC') {
          const { access_token, refresh_token, user: userData } = event.data;
          if (access_token) {
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);
            setUser(userData);
          }
        }
      }
    };

    window.addEventListener('message', handleAuthSync);
    return () => window.removeEventListener('message', handleAuthSync);
  }, [themeProp]);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        const response = await fetch('/api/v1/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/nexacore';
  };

  const getInitials = () => {
    if (!user) return '';
    const firstInitial = user.first_name?.charAt(0) || user.username?.charAt(0) || '';
    const lastInitial = user.last_name?.charAt(0) || '';
    return (firstInitial + lastInitial).toUpperCase();
  };

  if (loading) {
    return (
      <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
    );
  }

  if (!user) {
    // Redirect to login with return URL
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const loginUrl = `/login?returnUrl=${encodeURIComponent(currentUrl)}`;

    return (
      <Link
        href={loginUrl}
        className="px-4 py-2 text-sm font-medium text-white rounded-lg transition"
        style={{ backgroundColor: theme.primaryColor }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
      >
        Sign In
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
      >
        {/* Avatar Circle with Initials */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm"
          style={{
            background: `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.secondaryColor} 100%)`
          }}
        >
          {getInitials()}
        </div>

        {/* User Name */}
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium text-gray-900">
            {user.full_name || `${user.first_name} ${user.last_name}` || user.username}
          </div>
        </div>

        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown Content */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-2xl border border-gray-200 z-50">
            {/* User Info Section */}
            <div
              className="px-4 py-3 border-b border-gray-100"
              style={{
                background: `linear-gradient(135deg, ${theme.primaryColor}15 0%, ${theme.secondaryColor}15 100%)`
              }}
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                  style={{
                    background: `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.secondaryColor} 100%)`
                  }}
                >
                  {getInitials()}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {user.full_name || `${user.first_name} ${user.last_name}` || user.username}
                  </div>
                  <div className="text-sm text-gray-600">{user.email}</div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <Link
                href="/nexacore" onClick={(e) => { e.preventDefault(); window.location.href = "/nexacore"; }}
                className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                onClick={() => setShowDropdown(false)}
              >
                <User className="w-4 h-4 text-gray-500" />
                <span>My Profile</span>
              </Link>

              <Link
                href="/nexacore" onClick={(e) => { e.preventDefault(); window.location.href = "/nexacore"; }}
                className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                onClick={() => setShowDropdown(false)}
              >
                <Settings className="w-4 h-4 text-gray-500" />
                <span>Settings</span>
              </Link>

              <div className="border-t border-gray-100 my-2"></div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
