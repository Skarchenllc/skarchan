'use client';

import SharedHeader from './SharedHeader';
import {
  Package,
  Warehouse,
  TrendingUp,
  Settings,
  ArrowLeftRight,
  Package2,
} from 'lucide-react';

// Navigation structure for Inventory module - organized into logical groups
const navigationGroups = [
  // Inventory Management
  {
    name: 'Inventory',
    icon: Package,
    type: 'dropdown' as const,
    items: [
      {
        name: 'Stock Items',
        href: '/stock-items',
        icon: Package2,
      },
      {
        name: 'Warehouses',
        href: '/warehouses',
        icon: Warehouse,
      },
    ],
  },

  // Transactions
  {
    name: 'Transactions',
    icon: TrendingUp,
    type: 'dropdown' as const,
    items: [
      {
        name: 'Stock Movements',
        href: '/stock-movements',
        icon: TrendingUp,
      },
      {
        name: 'Stock Adjustments',
        href: '/stock-adjustments',
        icon: Settings,
      },
      {
        name: 'Stock Transfers',
        href: '/stock-transfers',
        icon: ArrowLeftRight,
      },
    ],
  },
];

export default function Navigation() {
  return <SharedHeader moduleName="Inventory Management" navigationGroups={navigationGroups} />;
}
