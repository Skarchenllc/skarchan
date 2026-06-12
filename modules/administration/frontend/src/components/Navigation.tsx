'use client';

import SharedHeader from './SharedHeader';
import {
  LayoutDashboard,
  Building2,
  Scale,
  Shield,
  Target,
} from 'lucide-react';

// Navigation structure - converted dropdown to individual links
const navigationGroups = [
  {
    name: 'Executive Board',
    href: '/executive-board',
    icon: Building2,
    type: 'single' as const,
  },
  {
    name: 'Legal Cases',
    href: '/legal-cases',
    icon: Scale,
    type: 'single' as const,
  },
  {
    name: 'Compliance Policies',
    href: '/compliance-policies',
    icon: Shield,
    type: 'single' as const,
  },
  {
    name: 'Strategic Initiatives',
    href: '/strategic-initiatives',
    icon: Target,
    type: 'single' as const,
  },
];

export default function Navigation() {
  return <SharedHeader moduleName="Administration" navigationGroups={navigationGroups} />;
}
