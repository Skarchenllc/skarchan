'use client';

import SharedHeader from './SharedHeader';
import {
  Truck,
  FileText,
  ClipboardList,
  MessageSquare,
  FileSignature,
  Users,
  ShoppingCart,
} from 'lucide-react';

// Navigation structure for Supply Chain module - organized into logical groups
const navigationGroups = [
  // Suppliers
  {
    name: 'Suppliers',
    icon: Users,
    type: 'dropdown' as const,
    items: [
      {
        name: 'Suppliers',
        href: '/suppliers',
        icon: Users,
      },
      {
        name: 'Supplier Contracts',
        href: '/supplier-contracts',
        icon: FileSignature,
      },
    ],
  },

  // Procurement
  {
    name: 'Procurement',
    icon: ShoppingCart,
    type: 'dropdown' as const,
    items: [
      {
        name: 'Purchase Requisitions',
        href: '/purchase-requisitions',
        icon: ClipboardList,
      },
      {
        name: 'RFQ',
        href: '/rfq',
        icon: MessageSquare,
      },
      {
        name: 'Purchase Orders',
        href: '/purchase-orders',
        icon: FileText,
      },
    ],
  },
];

export default function Navigation() {
  return <SharedHeader moduleName="Supply Chain Management" navigationGroups={navigationGroups} />;
}
