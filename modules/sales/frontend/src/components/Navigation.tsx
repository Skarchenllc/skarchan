'use client';

import SharedHeader from './SharedHeader';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  TrendingUp,
  FileText,
  Package,
} from 'lucide-react';

// Navigation structure with groups
const navigationGroups = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    type: 'single' as const,
  },
  {
    name: 'Customers',
    href: '/customers',
    icon: Users,
    type: 'single' as const,
  },
  {
    name: 'Opportunities',
    href: '/opportunities',
    icon: TrendingUp,
    type: 'single' as const,
  },
  {
    name: 'Quotes',
    href: '/quotes',
    icon: FileText,
    type: 'single' as const,
  },
  {
    name: 'Orders',
    href: '/orders',
    icon: Package,
    type: 'single' as const,
  },
];

export default function Navigation() {
  return <SharedHeader moduleName="Sales" navigationGroups={navigationGroups} />;
}
