"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Target, FileText, ShoppingCart, TrendingUp, DollarSign } from "lucide-react";
import Navigation from "@/components/Navigation";

interface Stats {
  customers: { total: number; active: number; leads: number; revenue: number };
  opportunities: { total: number; open: number; won: number; value: number };
  quotes: { total: number; pending: number; accepted: number; value: number };
  orders: { total: number; pending: number; completed: number; revenue: number };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const apiUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const [customersRes, opportunitiesRes, quotesRes, ordersRes] = await Promise.all([
        fetch(`${apiUrl}/api/customers`),
        fetch(`${apiUrl}/api/opportunities`),
        fetch(`${apiUrl}/api/quotes`),
        fetch(`${apiUrl}/api/orders`),
      ]);

      const customersData = await customersRes.json();
      const opportunitiesData = await opportunitiesRes.json();
      const quotesData = await quotesRes.json();
      const ordersData = await ordersRes.json();

      const customers = customersData.customers || [];
      const opportunities = opportunitiesData.opportunities || [];
      const quotes = quotesData.quotes || [];
      const orders = ordersData.orders || [];

      setStats({
        customers: {
          total: customers.length,
          active: customers.filter((c: any) => c.is_active).length,
          leads: 0,
          revenue: customers.reduce((sum: number, c: any) => sum + (c.total_lifetime_value || 0), 0),
        },
        opportunities: {
          total: opportunities.length,
          open: opportunities.filter((o: any) => !['closed_won', 'closed_lost'].includes(o.stage)).length,
          won: opportunities.filter((o: any) => o.stage === 'closed_won').length,
          value: opportunities.reduce((sum: number, o: any) => sum + (o.amount || 0), 0),
        },
        quotes: {
          total: quotes.length,
          pending: quotes.filter((q: any) => q.status === 'sent').length,
          accepted: quotes.filter((q: any) => q.status === 'accepted').length,
          value: quotes.reduce((sum: number, q: any) => sum + (q.total_amount || 0), 0),
        },
        orders: {
          total: orders.length,
          pending: orders.filter((o: any) => o.status === 'pending').length,
          completed: orders.filter((o: any) => o.status === 'delivered').length,
          revenue: orders.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0),
        },
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : (
          <>
            {/* Compact Statistics Bar */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-8">
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-900" />
                  <span className="text-sm text-gray-600">Total Customers</span>
                  <span className="text-xl font-bold text-gray-900">{stats?.customers.total || 0}</span>
                </div>
                <div className="h-6 w-px bg-gray-300"></div>
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-gray-900" />
                  <span className="text-sm text-gray-600">Total Opportunities</span>
                  <span className="text-xl font-bold text-gray-900">{stats?.opportunities.total || 0}</span>
                </div>
                <div className="h-6 w-px bg-gray-300"></div>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-900" />
                  <span className="text-sm text-gray-600">Total Quotes</span>
                  <span className="text-xl font-bold text-gray-900">{stats?.quotes.total || 0}</span>
                </div>
                <div className="h-6 w-px bg-gray-300"></div>
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-gray-900" />
                  <span className="text-sm text-gray-600">Total Orders</span>
                  <span className="text-xl font-bold text-gray-900">{stats?.orders.total || 0}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-black mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Link
                  href="/customers/new"
                  className="border border-gray-200 rounded-lg p-6 hover:border-blue-600 transition"
                >
                  <Users className="w-5 h-5 text-gray-900 mb-3" />
                  <h3 className="font-semibold text-black">Add Customer</h3>
                </Link>

                <Link
                  href="/opportunities/new"
                  className="border border-gray-200 rounded-lg p-6 hover:border-blue-600 transition"
                >
                  <Target className="w-5 h-5 text-gray-900 mb-3" />
                  <h3 className="font-semibold text-black">Create Opportunity</h3>
                </Link>

                <Link
                  href="/quotes/new"
                  className="border border-gray-200 rounded-lg p-6 hover:border-blue-600 transition"
                >
                  <FileText className="w-5 h-5 text-gray-900 mb-3" />
                  <h3 className="font-semibold text-black">Generate Quote</h3>
                </Link>

                <Link
                  href="/orders/new"
                  className="border border-gray-200 rounded-lg p-6 hover:border-blue-600 transition"
                >
                  <ShoppingCart className="w-5 h-5 text-gray-900 mb-3" />
                  <h3 className="font-semibold text-black">Create Order</h3>
                </Link>
              </div>
            </div>

            {/* Key Metrics */}
            <div>
              <h2 className="text-lg font-semibold text-black mb-4">Key Metrics</h2>
              <div className="border border-gray-200 rounded-lg">
                <div className="grid grid-cols-4 divide-x divide-gray-200">
                  <div className="p-6">
                    <div className="text-sm text-gray-600 mb-2">Customer Revenue</div>
                    <div className="text-2xl font-bold text-black">
                      ${stats?.customers.revenue.toLocaleString() || 0}
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="text-sm text-gray-600 mb-2">Opportunities Value</div>
                    <div className="text-2xl font-bold text-black">
                      ${stats?.opportunities.value.toLocaleString() || 0}
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="text-sm text-gray-600 mb-2">Quotes Value</div>
                    <div className="text-2xl font-bold text-black">
                      ${stats?.quotes.value.toLocaleString() || 0}
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="text-sm text-gray-600 mb-2">Orders Revenue</div>
                    <div className="text-2xl font-bold text-black">
                      ${stats?.orders.revenue.toLocaleString() || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
