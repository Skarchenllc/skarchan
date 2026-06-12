'use client';

import SharedHeader from './SharedHeader';
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Warehouse,
  Factory,
  FileText,
} from 'lucide-react';

// Navigation structure - converted dropdown to individual links
const navigationGroups = [
  {
    name: 'Products',
    href: '/products',
    icon: Package,
    type: 'single' as const,
  },
  {
    name: 'Work Orders',
    href: '/work-orders',
    icon: ClipboardList,
    type: 'single' as const,
  },
  {
    name: 'Inventory',
    href: '/inventory',
    icon: Warehouse,
    type: 'single' as const,
  },
  {
    name: 'Production Lines',
    href: '/production-lines',
    icon: Factory,
    type: 'single' as const,
  },
  {
    name: 'Bill of Materials',
    href: '/bom',
    icon: FileText,
    type: 'single' as const,
  },
];

export default function Navigation() {
  return <SharedHeader moduleName="Production" navigationGroups={navigationGroups} />;
}
