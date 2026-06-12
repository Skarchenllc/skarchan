'use client';

import SharedHeader from './SharedHeader';
import {
  LayoutDashboard,
  Target,
  Users,
  FileText,
  TrendingUp,
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
    name: 'Campaigns',
    href: '/campaigns',
    icon: Target,
    type: 'single' as const,
  },
  {
    name: 'Leads',
    href: '/leads',
    icon: Users,
    type: 'single' as const,
  },
  {
    name: 'Content',
    href: '/content',
    icon: FileText,
    type: 'single' as const,
  },
];

export default function Navigation() {
  return <SharedHeader moduleName="Marketing" navigationGroups={navigationGroups} />;
}
