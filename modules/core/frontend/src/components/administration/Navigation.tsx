'use client';

import SharedHeader from './SharedHeader';
import {
  LayoutDashboard,
  Building2,
  Scale,
  Shield,
  Target,
  FileText,
  CheckSquare,
  Users,
  Briefcase,
  CreditCard,
  Key,
  Folder,
  AlertTriangle,
  BadgeCheck,
} from 'lucide-react';

const navigationGroups = [
  {
    name: 'Dashboard',
    href: '/administration',
    icon: LayoutDashboard,
    type: 'single' as const,
  },
  {
    name: 'Executive Board',
    href: '/administration/executive-board',
    icon: Building2,
    type: 'single' as const,
  },
  {
    name: 'Compliance',
    href: '/administration/compliance',
    icon: Shield,
    type: 'single' as const,
  },
  {
    name: 'Legal Cases',
    href: '/administration/legal-cases',
    icon: Scale,
    type: 'single' as const,
  },
  {
    name: 'Risk & Licenses',
    icon: AlertTriangle,
    type: 'dropdown' as const,
    items: [
      { name: 'Risk Register',     href: '/administration/risks',              icon: AlertTriangle },
      { name: 'Licenses & Permits', href: '/administration/licenses',          icon: BadgeCheck },
      { name: 'Insurance Policies', href: '/administration/insurance-policies', icon: Shield },
    ],
  },
  {
    name: 'Board',
    href: '/administration/board-meetings',
    icon: Users,
    type: 'single' as const,
  },
  {
    name: 'Records',
    icon: Folder,
    type: 'dropdown' as const,
    items: [
      { name: 'Contracts',        href: '/administration/contracts',        icon: FileText },
      { name: 'Documents',        href: '/administration/documents',        icon: Folder },
      { name: 'Credentials',      href: '/administration/credentials',      icon: Key },
    ],
  },
];

export default function Navigation() {
  return <SharedHeader moduleName="Administration" navigationGroups={navigationGroups} />;
}
