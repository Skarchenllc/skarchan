'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FiHome,
  FiUsers,
  FiShield,
  FiBell,
  FiSettings,
  FiZap,
} from 'react-icons/fi';
import { useTheme } from '@/contexts/ThemeContext';

const menuItems = [
  { name: 'Dashboard', href: '/', icon: FiHome },
  { name: 'Users', href: '/users', icon: FiUsers },
  { name: 'Roles & Permissions', href: '/roles', icon: FiShield },
  { name: 'Notifications', href: '/notifications', icon: FiBell },
  { name: 'Settings', href: '/settings', icon: FiSettings },
];

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { theme } = useTheme();
  const logoSource = theme.logoFile || theme.logoUrl;

  return (
    <aside className="w-64 bg-gray-900 text-white h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-3">
          {logoSource ? (
            <img src={logoSource} alt="Logo" className="h-10 w-auto object-contain" />
          ) : (
            <div className="w-10 h-10 bg-[#5147e6] flex items-center justify-center">
              <FiZap className="w-6 h-6 text-[#01411C]" />
            </div>
          )}
          <h1 className="text-2xl font-bold text-white">{theme.appName || 'NexaCore'}</h1>
        </Link>
      </div>

      <nav className="mt-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center px-6 py-3 text-sm font-medium transition-colors
                ${
                  isActive
                    ? 'bg-gray-800 text-blue-400 border-r-4 border-blue-400'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }
              `}
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-800">
        <p className="text-xs text-gray-400">Version 1.0.0</p>
      </div>
    </aside>
  );
};

export default Sidebar;
