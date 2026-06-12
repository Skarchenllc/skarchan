'use client';

import SharedHeader from './SharedHeader';
import {
  Ticket,
  BookOpen,
  ClipboardList,
  MessageSquare,
  FileCheck,
  HelpCircle,
  Headphones,
  Shield,
} from 'lucide-react';

// Navigation structure for Customer Service module - organized into logical groups
const navigationGroups = [
  // Support Activities
  {
    name: 'Support',
    icon: Headphones,
    type: 'dropdown' as const,
    items: [
      {
        name: 'Support Tickets',
        href: '/customer-service/support-tickets',
        icon: Ticket,
      },
      {
        name: 'Service Requests',
        href: '/customer-service/service-requests',
        icon: ClipboardList,
      },
    ],
  },

  // Knowledge & Feedback
  {
    name: 'Knowledge',
    icon: BookOpen,
    type: 'dropdown' as const,
    items: [
      {
        name: 'Knowledge Base',
        href: '/customer-service/knowledge-base',
        icon: HelpCircle,
      },
      {
        name: 'Customer Feedback',
        href: '/customer-service/customer-feedback',
        icon: MessageSquare,
      },
    ],
  },

  // SLA Management
  {
    name: 'SLA',
    icon: Shield,
    type: 'dropdown' as const,
    items: [
      {
        name: 'SLA Agreements',
        href: '/customer-service/sla-agreements',
        icon: FileCheck,
      },
    ],
  },
];

export default function Navigation() {
  return <SharedHeader moduleName="Customer Service" navigationGroups={navigationGroups} />;
}
