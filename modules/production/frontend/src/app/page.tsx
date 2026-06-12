'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Package,
  ClipboardList,
  Warehouse,
  Factory,
  Plus,
  Eye
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { fetchApi } from '@/lib/api';
import { StatsOverview } from '@/lib/types';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    products: {} as StatsOverview,
    workOrders: {} as StatsOverview,
    inventory: {} as StatsOverview,
    productionLines: {} as StatsOverview,
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [products, workOrders, inventory, productionLines] = await Promise.all([
          fetchApi<StatsOverview>('/products/stats/overview'),
          fetchApi<StatsOverview>('/work-orders/stats/overview'),
          fetchApi<StatsOverview>('/inventory/stats/overview'),
          fetchApi<StatsOverview>('/production-lines/stats/overview'),
        ]);

        setStats({ products, workOrders, inventory, productionLines });
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  const quickActions = [
    {
      title: 'New Product',
      icon: Package,
      href: '/products/new',
    },
    {
      title: 'New Work Order',
      icon: ClipboardList,
      href: '/work-orders/new',
    },
    {
      title: 'View Inventory',
      icon: Warehouse,
      href: '/inventory',
    },
    {
      title: 'View Production Lines',
      icon: Factory,
      href: '/production-lines',
    },
  ];

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-black">Production Dashboard</h1>
      </div>

      {/* Compact Statistics Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-8">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Total Products</span>
            <span className="text-xl font-bold text-gray-900">{stats.products.total_count || 0}</span>
          </div>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Work Orders</span>
            <span className="text-xl font-bold text-gray-900">{stats.workOrders.total_count || 0}</span>
          </div>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Inventory Items</span>
            <span className="text-xl font-bold text-gray-900">{stats.inventory.total_count || 0}</span>
          </div>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <Factory className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Production Lines</span>
            <span className="text-xl font-bold text-gray-900">{stats.productionLines.total_count || 0}</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-black mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                href={action.href}
                className="border border-gray-200 rounded-lg p-6 hover:border-blue-600 transition"
              >
                <Icon className="w-5 h-5 text-gray-900 mb-3" />
                <h3 className="font-semibold text-black">{action.title}</h3>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
