'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FolderKanban,
  CheckSquare,
  Target,
  Users,
  Clock,
  DollarSign,
  Plus,
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { fetchApi } from '@/lib/api';
import { StatsOverview } from '@/lib/types';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    projects: { total_count: 0, active_count: 0 } as StatsOverview,
    tasks: { total_count: 0 } as StatsOverview,
    milestones: { total_count: 0 } as StatsOverview,
    resources: { total_count: 0 } as StatsOverview,
    timeTracking: { total_count: 0 } as StatsOverview,
    budgets: { total_count: 0 } as StatsOverview,
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
      title: 'New Project',
      icon: FolderKanban,
      href: '/projects/new',
      description: 'Create a new project',
    },
    {
      title: 'New Task',
      icon: CheckSquare,
      href: '/tasks/new',
      description: 'Add a new task',
    },
    {
      title: 'New Milestone',
      icon: Target,
      href: '/milestones/new',
      description: 'Create a milestone',
    },
    {
      title: 'Add Resource',
      icon: Users,
      href: '/resources/new',
      description: 'Add a resource',
    },
    {
      title: 'Log Time',
      icon: Clock,
      href: '/time-tracking/new',
      description: 'Track time entry',
    },
    {
      title: 'New Budget',
      icon: DollarSign,
      href: '/budgets/new',
      description: 'Create a budget',
    },
  ];

  const moduleCards = [
    {
      title: 'Projects',
      icon: FolderKanban,
      href: '/projects',
      count: stats.projects.total_count,
      color: 'blue',
    },
    {
      title: 'Tasks',
      icon: CheckSquare,
      href: '/tasks',
      count: stats.tasks.total_count,
      color: 'green',
    },
    {
      title: 'Milestones',
      icon: Target,
      href: '/milestones',
      count: stats.milestones.total_count,
      color: 'purple',
    },
    {
      title: 'Resources',
      icon: Users,
      href: '/resources',
      count: stats.resources.total_count,
      color: 'orange',
    },
    {
      title: 'Time Tracking',
      icon: Clock,
      href: '/time-tracking',
      count: stats.timeTracking.total_count,
      color: 'indigo',
    },
    {
      title: 'Budgets',
      icon: DollarSign,
      href: '/budgets',
      count: stats.budgets.total_count,
      color: 'yellow',
    },
  ];

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-black">Project Management Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage your projects, tasks, and resources efficiently</p>
      </div>

      {/* Module Overview Cards */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-black mb-4">Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
