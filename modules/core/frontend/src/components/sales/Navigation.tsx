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
    href: '/sales',
    icon: LayoutDashboard,
    type: 'single' as const,
  },
  {
    name: 'Customers',
    href: '/sales/customers',
    icon: Users,
    type: 'single' as const,
  },
  {
    name: 'Opportunities',
    href: '/sales/opportunities',
    icon: TrendingUp,
    type: 'single' as const,
  },
  {
    name: 'Quotes',
    href: '/sales/quotes',
    icon: FileText,
    type: 'single' as const,
  },
  {
    name: 'Orders',
    href: '/sales/orders',
    icon: Package,
    type: 'single' as const,
  },
];

export default function Navigation() {
  return <SharedHeader moduleName="Sales" navigationGroups={navigationGroups} />;
}
