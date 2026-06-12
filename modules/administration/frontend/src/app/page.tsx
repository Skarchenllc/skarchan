'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SharedHeader from '@/components/SharedHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  FiUsers,
  FiShield,
  FiFileText,
  FiCheckSquare,
  FiAlertCircle,
  FiTrendingUp,
  FiArrowRight,
} from 'react-icons/fi';

interface ModuleCard {
  title: string;
  description: string;
  href: string;
  icon: any;
  color: string;
}

const modules: ModuleCard[] = [
  {
    title: 'Executive Board',
    description: 'Executive board management and oversight',
    href: '/executive-board',
    icon: FiUsers,
    color: 'blue',
  },
  {
    title: 'Users & Roles',
    description: 'User management and role assignments',
    href: '/users',
    icon: FiShield,
    color: 'green',
  },
  {
    title: 'Strategic Initiatives',
    description: 'Strategic planning and initiatives tracking',
    href: '/strategic-initiatives',
    icon: FiTrendingUp,
    color: 'purple',
  },
  {
    title: 'Compliance Policies',
    description: 'Compliance policies and regulations',
    href: '/compliance-policies',
    icon: FiFileText,
    color: 'yellow',
  },
  {
    title: 'Compliance Audits',
    description: 'Audit management and compliance tracking',
    href: '/compliance-audits',
    icon: FiCheckSquare,
    color: 'indigo',
  },
  {
    title: 'Legal Cases',
    description: 'Legal case management and tracking',
    href: '/legal-cases',
    icon: FiAlertCircle,
    color: 'red',
  },
];

export default function AdministrationDashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 500);
  }, []);

  const navigationGroups = [
    {
      name: 'Dashboard',
      href: '/',
      icon: FiTrendingUp,
      type: 'single' as const,
    },
    {
      name: 'Executive Board',
      href: '/executive-board',
      icon: FiUsers,
      type: 'single' as const,
    },
    {
      name: 'Users & Roles',
      href: '/users',
      icon: FiShield,
      type: 'single' as const,
    },
    {
      name: 'Strategic',
      href: '/strategic-initiatives',
      icon: FiTrendingUp,
      type: 'single' as const,
    },
    {
      name: 'Compliance',
      icon: FiFileText,
      type: 'dropdown' as const,
      items: [
        { name: 'Policies', href: '/compliance-policies', icon: FiFileText },
        { name: 'Audits', href: '/compliance-audits', icon: FiCheckSquare },
      ],
    },
    {
      name: 'Legal Cases',
      href: '/legal-cases',
      icon: FiAlertCircle,
      type: 'single' as const,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedHeader moduleName="Administration" navigationGroups={navigationGroups} />

        <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Administration Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Manage organizational administration, compliance, and governance
            </p>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : (
            <>
              {/* Module Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((module) => {
                  const Icon = module.icon;
                  const colorClasses = {
                    blue: 'bg-blue-50 text-blue-600 border-blue-200',
                    green: 'bg-green-50 text-green-600 border-green-200',
                    purple: 'bg-purple-50 text-purple-600 border-purple-200',
                    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
                    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
                    red: 'bg-red-50 text-red-600 border-red-200',
                  };

                  return (
                    <Link
                      key={module.href}
                      href={module.href}
                      className="group relative bg-white rounded-lg border-2 border-gray-200 p-6 hover:border-gray-300 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className={`inline-flex p-3 rounded-lg ${colorClasses[module.color as keyof typeof colorClasses]} border mb-4`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                            {module.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {module.description}
                          </p>
                        </div>
                        <FiArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Quick Stats */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">--</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <FiUsers className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Policies</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">--</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <FiFileText className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Audits</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">--</p>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <FiCheckSquare className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
    </div>
  );
}
