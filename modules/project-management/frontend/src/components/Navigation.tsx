'use client';

import SharedHeader from './SharedHeader';
import {
  FolderKanban,
  CheckSquare,
  Target,
  Users,
  Clock,
  DollarSign,
  Briefcase,
  Calendar,
  Wallet,
} from 'lucide-react';

// Navigation structure for Project Management module - organized into logical groups
const navigationGroups = [
  // Projects Group
  {
    name: 'Projects',
    icon: Briefcase,
    type: 'dropdown' as const,
    items: [
      {
        name: 'Projects',
        href: '/projects',
        icon: FolderKanban,
      },
      {
        name: 'Tasks',
        href: '/tasks',
        icon: CheckSquare,
      },
      {
        name: 'Milestones',
        href: '/milestones',
        icon: Target,
      },
    ],
  },

  // Resources Group
  {
    name: 'Resources',
    icon: Users,
    type: 'dropdown' as const,
    items: [
      {
        name: 'Resources',
        href: '/resources',
        icon: Users,
      },
      {
        name: 'Time Tracking',
        href: '/time-tracking',
        icon: Clock,
      },
    ],
  },

  // Financial Group
  {
    name: 'Financial',
    icon: Wallet,
    type: 'dropdown' as const,
    items: [
      {
        name: 'Budgets',
        href: '/budgets',
        icon: DollarSign,
      },
    ],
  },
];

export default function Navigation() {
  return <SharedHeader moduleName="Project Management" navigationGroups={navigationGroups} />;
}
