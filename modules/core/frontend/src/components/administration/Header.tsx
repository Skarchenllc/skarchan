'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LucideIcon, ChevronDown } from 'lucide-react';
import UserMenu from './UserMenu';

export interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

export interface NavigationGroup {
  name: string;
  href?: string;
  icon: LucideIcon;
  type: 'single' | 'dropdown';
  items?: NavigationItem[];
}

interface ThemeData {
  appName: string;
  primaryColor: string;
  secondaryColor: string;
  logoFile?: string;
  logoUrl?: string;
}

export interface HeaderProps {
  moduleName: string;
  moduleIcon: LucideIcon;
  navigationGroups?: NavigationGroup[];
  theme?: ThemeData;
}

const defaultTheme: ThemeData = {
  appName: 'NexaCore',
  primaryColor: '#5147e6',
  secondaryColor: '#01411C',
};

export default function Header({
  moduleName,
  moduleIcon: ModuleIcon,
  navigationGroups,
  theme: themeProp,
}: HeaderProps) {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeData>(themeProp || defaultTheme);

  // Load theme from localStorage if not provided
  useEffect(() => {
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
  }, [themeProp]);

  // Get logo source (prefer uploaded file over URL)
  const logoSource = theme.logoFile || theme.logoUrl;

  const isActive = (href: string) => {
    if (href === '/' || href === '/dashboard') {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  const isGroupActive = (items?: NavigationItem[]) => {
    if (!items) return false;
    return items.some(item => pathname?.startsWith(item.href));
  };

  return (
    <nav className="bg-white border-b-2" style={{ borderColor: theme.secondaryColor }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand - Left Side (Constant) */}
          <div className="flex-shrink-0">
            <a href="/nexacore" onClick={(e) => { e.preventDefault(); window.location.href = "/nexacore"; }} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              {logoSource ? (
                <img src={logoSource} alt="Logo" className="h-10 w-auto object-contain" />
              ) : (
                <div className="w-10 h-10 flex items-center justify-center" style={{ backgroundColor: theme.primaryColor }}>
                  <ModuleIcon className="w-6 h-6" style={{ color: theme.secondaryColor }} />
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold" style={{ color: theme.primaryColor }}>{theme.appName}</span>
                <span className="text-xl text-black">|</span>
                <span className="text-lg font-medium" style={{ color: theme.secondaryColor }}>{moduleName}</span>
              </div>
            </a>
          </div>

          {/* Right Side: Module Navigation + User Menu (Constant) */}
          <div className="flex items-center space-x-4">
            {/* Module-specific Navigation Items */}
            <div className="hidden sm:flex sm:space-x-2">
              {navigationGroups && navigationGroups.map((group) => {
                const GroupIcon = group.icon;

                // Single link item (Dashboard)
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

            {/* User Menu (Constant) - Always displayed on the right */}
            <UserMenu theme={theme} />
          </div>
        </div>
      </div>
    </nav>
  );
}
