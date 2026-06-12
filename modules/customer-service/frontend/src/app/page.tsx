'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Ticket,
  BookOpen,
  ClipboardList,
  MessageSquare,
  FileCheck,
  Plus,
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { fetchApi } from '@/lib/api';
import { StatsOverview } from '@/lib/types';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    tickets: { total_count: 0, active_count: 0 } as StatsOverview,
    knowledge: { total_count: 0 } as StatsOverview,
    requests: { total_count: 0 } as StatsOverview,
    feedback: { total_count: 0 } as StatsOverview,
    sla: { total_count: 0 } as StatsOverview,
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
      title: 'New Support Ticket',
      icon: Ticket,
      href: '/support-tickets/new',
      description: 'Create a new support ticket',
    },
    {
      title: 'New Service Request',
      icon: ClipboardList,
      href: '/service-requests/new',
      description: 'Submit a service request',
    },
    {
      title: 'Add Knowledge Article',
      icon: BookOpen,
      href: '/knowledge-base/new',
      description: 'Add to knowledge base',
    },
    {
      title: 'Record Feedback',
      icon: MessageSquare,
      href: '/customer-feedback/new',
      description: 'Record customer feedback',
    },
    {
      title: 'New SLA Agreement',
      icon: FileCheck,
      href: '/sla-agreements/new',
      description: 'Create SLA agreement',
    },
  ];

  const moduleCards = [
    {
      title: 'Support Tickets',
      icon: Ticket,
      href: '/support-tickets',
      count: stats.tickets.total_count,
      color: 'blue',
    },
    {
      title: 'Knowledge Base',
      icon: BookOpen,
      href: '/knowledge-base',
      count: stats.knowledge.total_count,
      color: 'green',
    },
    {
      title: 'Service Requests',
      icon: ClipboardList,
      href: '/service-requests',
      count: stats.requests.total_count,
      color: 'purple',
    },
    {
      title: 'Customer Feedback',
      icon: MessageSquare,
      href: '/customer-feedback',
      count: stats.feedback.total_count,
      color: 'orange',
    },
    {
      title: 'SLA Agreements',
      icon: FileCheck,
      href: '/sla-agreements',
      count: stats.sla.total_count,
      color: 'red',
    },
  ];

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-black">Customer Service Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage support tickets, service requests, and customer satisfaction</p>
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
