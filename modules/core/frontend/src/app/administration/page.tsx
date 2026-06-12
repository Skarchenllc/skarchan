'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LoadingSpinner from '@/components/administration/LoadingSpinner';
import ExpirationsWidget from '@/components/administration/ExpirationsWidget';
import api from '@/lib/api';
import {
  FiUsers,
  FiShield,
  FiFileText,
  FiCheckSquare,
  FiAlertCircle,
  FiTrendingUp,
  FiGrid,
  FiList,
} from 'react-icons/fi';

interface ModuleCard {
  title: string;
  description: string;
  href: string;
  icon: any;
  color: string;
  endpoint?: string;        // single listing endpoint to count records from
  endpoints?: string[];     // multiple endpoints → counts summed
}

const modules: ModuleCard[] = [
  {
    title: 'Executive Board',
    description: 'Executive board management and oversight',
    href: '/administration/executive-board',
    icon: FiUsers,
    color: 'blue',
    endpoint: '/api/v1/administration/executive-board',
  },
  // Users & Roles removed — duplicated the core /users route.
  // Strategic Initiatives moved to Project Management as it's a portfolio
  // of long-running projects.
  {
    title: 'Compliance',
    description: 'Policies and audits',
    href: '/administration/compliance',
    icon: FiCheckSquare,
    color: 'yellow',
    // Two endpoints summed for the count
    endpoints: ['/api/v1/administration/compliance-policies', '/api/v1/administration/compliance-audits'],
  },
  {
    title: 'Legal Cases',
    description: 'Legal case management and tracking',
    href: '/administration/legal-cases',
    icon: FiAlertCircle,
    color: 'red',
    endpoint: '/api/v1/administration/legal-cases',
  },
  {
    title: 'Contracts',
    description: 'Contracts, renewals, and obligations',
    href: '/administration/contracts',
    icon: FiFileText,
    color: 'blue',
    endpoint: '/api/v1/administration/contracts',
  },
  // Asset Management moved to Accounting & Finance.
  {
    title: 'Document Management',
    description: 'Documents, contracts, legal records',
    href: '/administration/documents',
    icon: FiFileText,
    color: 'green',
    endpoint: '/api/v1/administration/documents',
  },
  // Subscriptions moved to Accounting & Finance.
  {
    title: 'Credentials',
    description: 'Centralized credential vault for service accounts and API keys',
    href: '/administration/credentials',
    icon: FiShield,
    color: 'yellow',
    endpoint: '/api/v1/administration/credentials',
  },
  {
    title: 'Risk Register',
    description: 'Identified risks with likelihood, impact, and mitigation',
    href: '/administration/risks',
    icon: FiAlertCircle,
    color: 'red',
    endpoint: '/api/v1/administration/risks',
  },
  {
    title: 'Licenses & Permits',
    description: 'Business licenses, regulatory certs, and renewal dates',
    href: '/administration/licenses',
    icon: FiShield,
    color: 'green',
    endpoint: '/api/v1/administration/licenses',
  },
  {
    title: 'Board Meetings',
    description: 'Governance meeting records — agenda, attendees, decisions',
    href: '/administration/board-meetings',
    icon: FiUsers,
    color: 'purple',
    endpoint: '/api/v1/administration/board-meetings',
  },
  {
    title: 'Insurance Policies',
    description: 'Organization-wide coverage with policy and renewal tracking',
    href: '/administration/insurance-policies',
    icon: FiShield,
    color: 'blue',
    endpoint: '/api/v1/administration/insurance-policies',
  },
];

function extractCount(resp: any): number | null {
  if (resp == null) return null;
  if (Array.isArray(resp)) return resp.length;
  if (typeof resp === 'object') {
    if (typeof resp.total === 'number') return resp.total;
    if (typeof resp.count === 'number') return resp.count;
    if (Array.isArray(resp.data)) return resp.data.length;
    if (Array.isArray(resp.items)) return resp.items.length;
  }
  return null;
}

export default function AdministrationDashboard() {
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Record<string, number | null>>({});
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('admin_view_mode') : null;
    if (saved === 'list' || saved === 'cards') setViewMode(saved);
  }, []);

  const changeViewMode = (m: 'cards' | 'list') => {
    setViewMode(m);
    if (typeof window !== 'undefined') localStorage.setItem('admin_view_mode', m);
  };

  useEffect(() => {
    (async () => {
      const result: Record<string, number | null> = {};
      await Promise.all(modules.map(async (m) => {
        const endpoints = m.endpoints ?? (m.endpoint ? [m.endpoint] : []);
        if (endpoints.length === 0) { result[m.href] = null; return; }
        try {
          const responses = await Promise.all(endpoints.map(e => api.get(e).catch(() => null)));
          const counts = responses.map(r => (r ? extractCount(r.data) : null));
          const valid = counts.filter((c): c is number => typeof c === 'number');
          result[m.href] = valid.length > 0 ? valid.reduce((a, b) => a + b, 0) : null;
        } catch {
          result[m.href] = null;
        }
      }));
      setCounts(result);
      setLoading(false);
    })();
  }, []);

  const navigationGroups = [
    {
      name: 'Dashboard',
      href: '/administration',
      icon: FiTrendingUp,
      type: 'single' as const,
    },
    {
      name: 'Executive Board',
      href: '/administration/executive-board',
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
      href: '/administration/strategic-initiatives',
      icon: FiTrendingUp,
      type: 'single' as const,
    },
    {
      name: 'Compliance',
      icon: FiFileText,
      type: 'dropdown' as const,
      items: [
        { name: 'Policies', href: '/administration/compliance-policies', icon: FiFileText },
        { name: 'Audits', href: '/administration/compliance-audits', icon: FiCheckSquare },
      ],
    },
    {
      name: 'Legal Cases',
      href: '/administration/legal-cases',
      icon: FiAlertCircle,
      type: 'single' as const,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8">
          {/* Header */}
          <div className="mb-8">
          </div>

          {/* View toggle */}
          <div className="flex items-center justify-end gap-2 mb-4">
            <button
              type="button"
              onClick={() => changeViewMode('cards')}
              aria-pressed={viewMode === 'cards'}
              title="Cards view"
              className={`p-2 ${viewMode === 'cards' ? 'bg-[#5147e6] text-white' : ''}`}
            >
              <FiGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => changeViewMode('list')}
              aria-pressed={viewMode === 'list'}
              title="List view"
              className={`p-2 ${viewMode === 'list' ? 'bg-[#5147e6] text-white' : ''}`}
            >
              <FiList className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((module) => {
                const c = counts[module.href];
                return (
                  <Link
                    key={module.href}
                    href={module.href}
                    className="block bg-white border p-6"
                  >
                    <h3 className="text-lg font-semibold mb-2">{module.title}</h3>
                    <div className="text-3xl font-bold">{c ?? '—'}</div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Module</th>
                    <th className="text-right p-3 font-semibold">Records</th>
                  </tr>
                </thead>
                <tbody>
                  {modules.map((module) => {
                    const c = counts[module.href];
                    return (
                      <tr key={module.href} className="border-b">
                        <td className="p-3">
                          <Link href={module.href} className="block">
                            {module.title}
                          </Link>
                        </td>
                        <td className="p-3 text-right font-mono">{c ?? '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <ExpirationsWidget />
        </div>
    </div>
  );
}
