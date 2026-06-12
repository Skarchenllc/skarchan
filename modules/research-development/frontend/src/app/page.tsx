'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Lightbulb,
  Beaker,
  Microscope,
  BookOpen,
  Award,
  FileText,
  Users,
  Target,
  DollarSign,
  GitBranch,
  Plus,
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { fetchApi } from '@/lib/api';
import { StatsOverview } from '@/lib/types';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    projects: { total_count: 0, active_count: 0 } as StatsOverview,
    experiments: { total_count: 0 } as StatsOverview,
    prototypes: { total_count: 0 } as StatsOverview,
    papers: { total_count: 0 } as StatsOverview,
    patents: { total_count: 0 } as StatsOverview,
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
      icon: Lightbulb,
      href: '/projects/new',
      description: 'Create a new R&D project',
    },
    {
      title: 'New Experiment',
      icon: Beaker,
      href: '/experiments/new',
      description: 'Record a new experiment',
    },
    {
      title: 'New Prototype',
      icon: Microscope,
      href: '/prototypes/new',
      description: 'Register a new prototype',
    },
    {
      title: 'New Research Paper',
      icon: BookOpen,
      href: '/research-papers/new',
      description: 'Add a research paper',
    },
    {
      title: 'New Patent',
      icon: Award,
      href: '/patents/new',
      description: 'File a patent application',
    },
    {
      title: 'Add Equipment',
      icon: FileText,
      href: '/lab-equipment/new',
      description: 'Register lab equipment',
    },
    {
      title: 'Add Team Member',
      icon: Users,
      href: '/team-members/new',
      description: 'Add research team member',
    },
    {
      title: 'New Milestone',
      icon: Target,
      href: '/milestones/new',
      description: 'Create project milestone',
    },
  ];

  const moduleCards = [
    {
      title: 'Projects',
      icon: Lightbulb,
      href: '/projects',
      count: stats.projects.total_count,
      color: 'blue',
    },
    {
      title: 'Experiments',
      icon: Beaker,
      href: '/experiments',
      count: stats.experiments.total_count,
      color: 'green',
    },
    {
      title: 'Prototypes',
      icon: Microscope,
      href: '/prototypes',
      count: stats.prototypes.total_count,
      color: 'purple',
    },
    {
      title: 'Research Papers',
      icon: BookOpen,
      href: '/research-papers',
      count: stats.papers.total_count,
      color: 'orange',
    },
    {
      title: 'Patents',
      icon: Award,
      href: '/patents',
      count: stats.patents.total_count,
      color: 'red',
    },
    {
      title: 'Lab Equipment',
      icon: FileText,
      href: '/lab-equipment',
      count: 0,
      color: 'gray',
    },
    {
      title: 'Team Members',
      icon: Users,
      href: '/team-members',
      count: 0,
      color: 'indigo',
    },
    {
      title: 'Milestones',
      icon: Target,
      href: '/milestones',
      count: 0,
      color: 'pink',
    },
    {
      title: 'Budgets',
      icon: DollarSign,
      href: '/budgets',
      count: 0,
      color: 'yellow',
    },
    {
      title: 'Collaborations',
      icon: GitBranch,
      href: '/collaborations',
      count: 0,
      color: 'teal',
    },
  ];

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-black">Research & Development Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage your research projects, experiments, and innovations</p>
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
