'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  FileText,
  ClipboardList,
  MessageSquare,
  FileSignature,
  Plus,
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { fetchApi } from '@/lib/api';
import { StatsOverview } from '@/lib/types';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    suppliers: { total_count: 0, active_count: 0 } as StatsOverview,
    purchaseOrders: { total_count: 0 } as StatsOverview,
    purchaseRequisitions: { total_count: 0 } as StatsOverview,
    rfq: { total_count: 0 } as StatsOverview,
    contracts: { total_count: 0 } as StatsOverview,
  });

  useEffect(() => {
    // For now, use placeholder stats since backend might not have stats endpoints yet
    // In production, this would fetch from actual API endpoints
    setLoading(false);
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  const quickActions = [
    {
      title: 'New Supplier',
      icon: Users,
      href: '/suppliers/new',
      description: 'Register a new supplier',
    },
    {
      title: 'New Purchase Requisition',
      icon: ClipboardList,
      href: '/purchase-requisitions/new',
      description: 'Create a purchase requisition',
    },
    {
      title: 'New RFQ',
      icon: MessageSquare,
      href: '/rfq/new',
      description: 'Send request for quotation',
    },
    {
      title: 'New Purchase Order',
      icon: FileText,
      href: '/purchase-orders/new',
      description: 'Create a purchase order',
    },
    {
      title: 'New Contract',
      icon: FileSignature,
      href: '/supplier-contracts/new',
      description: 'Register supplier contract',
    },
  ];

  const moduleCards = [
    {
      title: 'Suppliers',
      icon: Users,
      href: '/suppliers',
      count: stats.suppliers.total_count,
      color: 'blue',
    },
    {
      title: 'Purchase Requisitions',
      icon: ClipboardList,
      href: '/purchase-requisitions',
      count: stats.purchaseRequisitions.total_count,
      color: 'green',
    },
    {
      title: 'RFQ',
      icon: MessageSquare,
      href: '/rfq',
      count: stats.rfq.total_count,
      color: 'purple',
    },
    {
      title: 'Purchase Orders',
      icon: FileText,
      href: '/purchase-orders',
      count: stats.purchaseOrders.total_count,
      color: 'orange',
    },
    {
      title: 'Supplier Contracts',
      icon: FileSignature,
      href: '/supplier-contracts',
      count: stats.contracts.total_count,
      color: 'red',
    },
  ];

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-black">Supply Chain Management Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage suppliers, procurement, and supply chain operations</p>
      </div>

      {/* Module Overview Cards */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-black mb-4">Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {moduleCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                href={card.href}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-600 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className="w-5 h-5 text-gray-700" />
                  <span className="text-2xl font-bold text-black">{card.count}</span>
                </div>
                <h3 className="text-sm font-medium text-gray-900">{card.title}</h3>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-black mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                href={action.href}
                className="border border-gray-200 rounded-lg p-6 hover:border-blue-600 hover:shadow-md transition"
              >
                <Icon className="w-6 h-6 text-blue-600 mb-3" />
                <h3 className="font-semibold text-black mb-1">{action.title}</h3>
                <p className="text-sm text-gray-600">{action.description}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
