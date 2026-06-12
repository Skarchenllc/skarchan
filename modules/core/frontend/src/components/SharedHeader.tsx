'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ChevronDown, Zap } from 'lucide-react';
import {
  FiHome,
  FiUsers,
  FiShield,
  FiBell,
  FiSettings,
} from 'react-icons/fi';

interface SharedTheme {
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  logoFile?: string;
  appName: string;
}

const defaultTheme: SharedTheme = {
  primaryColor: '#5147e6',
  secondaryColor: '#01411C',
  appName: 'NexaCore',
};

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
}

interface NavigationGroup {
  name: string;
  href?: string;
  icon: any;
  type: 'single' | 'dropdown';
  items?: NavigationItem[];
}

interface SharedHeaderProps {
  moduleName: string;
  navigationGroups?: NavigationGroup[];
}

// Fetch theme from localStorage or API
async function fetchSharedTheme(): Promise<SharedTheme> {
  if (typeof window !== 'undefined') {
    // Try localStorage first
    try {
      const stored = localStorage.getItem('shared_theme');
      if (stored) {
        return { ...defaultTheme, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error);
    }

    // Try API
    try {
      const apiUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/v1/public/theme` : '/api/v1/public/theme';
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        const theme: SharedTheme = {
          primaryColor: data.primaryColor || defaultTheme.primaryColor,
          secondaryColor: data.secondaryColor || defaultTheme.secondaryColor,
          logoUrl: data.logoUrl || undefined,
          logoFile: data.logoFile || undefined,
          appName: data.appName || defaultTheme.appName,
        };
        localStorage.setItem('shared_theme', JSON.stringify(theme));
        return theme;
      }
    } catch (error) {
      console.warn('Failed to fetch theme from API:', error);
    }
  }

  return defaultTheme;
}

export default function SharedHeader({ moduleName, navigationGroups }: SharedHeaderProps) {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [theme, setTheme] = useState<SharedTheme>(defaultTheme);
  const [user, setUser] = useState<any>(null);

  // Load theme
  useEffect(() => {
    const loadTheme = async () => {
      const fetchedTheme = await fetchSharedTheme();
      setTheme(fetchedTheme);
    };

    loadTheme();

    // Listen for theme updates
    const handleThemeUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<SharedTheme>;
      setTheme({ ...defaultTheme, ...customEvent.detail });
    };

    window.addEventListener('theme-updated', handleThemeUpdate);

    // Refresh theme every 30 seconds
    const interval = setInterval(() => {
      loadTheme();
    }, 30000);

    return () => {
      window.removeEventListener('theme-updated', handleThemeUpdate);
      clearInterval(interval);
    };
  }, []);

  // Load user from localStorage
  useEffect(() => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  }, []);

  const logoSource = theme.logoFile || theme.logoUrl;

  const isActive = (href: string) => {
    if (href === '/' || href === '/dashboard') {
      return pathname === href || pathname === '/dashboard';
    }
    return pathname?.startsWith(href);
  };

  const isGroupActive = (items?: NavigationItem[]) => {
    if (!items) return false;
    return items.some(item => pathname?.startsWith(item.href));
  };

  // Core navigation menu items
  const coreMenuItems = [
    { name: 'Dashboard', href: '/', icon: FiHome },
    { name: 'Users', href: '/users', icon: FiUsers },
    { name: 'Roles & Permissions', href: '/roles', icon: FiShield },
    { name: 'Notifications', href: '/notifications', icon: FiBell },
    { name: 'Settings', href: '/settings', icon: FiSettings },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
  };

  return (
    <nav className="bg-white border-b-2 sticky top-0 left-0 right-0 z-50" style={{ borderColor: theme.secondaryColor }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand - Left Side */}
          <div className="flex-shrink-0">
            <a href="/nexacore" onClick={(e) => { e.preventDefault(); window.location.href = `${window.location.origin}/nexacore`; }} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="text-xl font-bold" style={{ color: theme.primaryColor }}>{theme.appName}</span>
              <span className="text-xl text-gray-400">|</span>
              <span className="text-lg font-medium text-gray-600">{moduleName}</span>
            </a>
          </div>

          {/* Center: Navigation Menu */}
          <div className="flex-1 flex justify-center">
            {/* Core Navigation Menu - Only show for Core module */}
            {moduleName === 'Control Room' && (
              <div className="hidden md:flex md:space-x-1">
                {coreMenuItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        active
                          ? 'text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      style={active ? { backgroundColor: theme.secondaryColor } : {}}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Module-specific Navigation Items */}
            {navigationGroups && navigationGroups.length > 0 && (
              <div className="hidden sm:flex sm:space-x-2">
                {navigationGroups.map((group) => {
                  const GroupIcon = group.icon;

                  // Single link item
                  if (group.type === 'single' && group.href) {
                    return (
                      <Link
                        key={group.name}
                        href={group.href}
                        className={`inline-flex items-center px-3 pt-1 border-b-2 text-sm font-medium ${
                          isActive(group.href)
                            ? 'text-black'
                            : 'border-transparent text-black'
                        }`}
                        style={isActive(group.href) ? { borderBottomColor: theme.secondaryColor } : {}}
                        onMouseEnter={(e) => e.currentTarget.style.borderBottomColor = theme.secondaryColor}
                        onMouseLeave={(e) => !isActive(group.href) && (e.currentTarget.style.borderBottomColor = 'transparent')}
                      >
                        <GroupIcon className="w-4 h-4 mr-2" />
                        {group.name}
                      </Link>
                    );
                  }

                  // Dropdown group
                  return (
                    <div
                      key={group.name}
                      className="relative"
                      onMouseEnter={() => setOpenDropdown(group.name)}
                      onMouseLeave={() => setOpenDropdown(null)}
                    >
                      <button
                        className={`inline-flex items-center px-3 pt-1 border-b-2 text-sm font-medium h-16 ${
                          isGroupActive(group.items)
                            ? 'text-black'
                            : 'border-transparent text-black'
                        }`}
                        style={isGroupActive(group.items) ? { borderBottomColor: theme.secondaryColor } : {}}
                        onMouseEnter={(e) => e.currentTarget.style.borderBottomColor = theme.secondaryColor}
                        onMouseLeave={(e) => !isGroupActive(group.items) && (e.currentTarget.style.borderBottomColor = 'transparent')}
                      >
                        <GroupIcon className="w-4 h-4 mr-2" />
                        {group.name}
                        <ChevronDown className="w-3 h-3 ml-1" />
                      </button>

                      {/* Dropdown Menu */}
                      {openDropdown === group.name && group.items && (
                        <div className="absolute left-0 top-full mt-0 w-56 bg-white rounded-b-lg shadow-lg py-2 z-50" style={{ borderColor: theme.secondaryColor, borderWidth: '1px' }}>
                          {group.items.map((item) => {
                            const ItemIcon = item.icon;
                            return (
                              <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center px-4 py-2.5 text-sm transition-colors ${
                                  isActive(item.href)
                                    ? 'text-white font-medium'
                                    : 'text-black hover:bg-gray-50'
                                }`}
                                style={isActive(item.href) ? { backgroundColor: theme.secondaryColor } : {}}
                              >
                                <ItemIcon className="w-4 h-4 mr-3" />
                                {item.name}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Side: User Menu */}
          <div className="flex items-center">
            {user && (
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'user' ? null : 'user')}
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                    style={{ backgroundColor: theme.secondaryColor }}
                  >
                    {user.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user.username}</span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {openDropdown === 'user' && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50 border" style={{ borderColor: theme.secondaryColor }}>
                    <Link
                      href="/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <FiSettings className="w-4 h-4 mr-3" />
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <FiUsers className="w-4 h-4 mr-3" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
