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
    href: '/marketing',
    icon: LayoutDashboard,
    type: 'single' as const,
  },
  {
    name: 'Campaigns',
    href: '/marketing/campaigns',
    icon: Target,
    type: 'single' as const,
  },
  {
    name: 'Leads',
    href: '/marketing/leads',
    icon: Users,
    type: 'single' as const,
  },
  {
    name: 'Content',
    href: '/marketing/content',
    icon: FileText,
    type: 'single' as const,
  },
];

export default function Navigation() {
  return <SharedHeader moduleName="Marketing" navigationGroups={navigationGroups} />;
}
