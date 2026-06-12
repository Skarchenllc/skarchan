"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, Users, FileText, TrendingUp, Target, Mail } from "lucide-react";
import Navigation from "@/components/Navigation";

interface Stats {
  campaigns: { total: number; active: number; leads: number; conversions: number };
  leads: { total: number; new: number; qualified: number; converted: number };
  content: { total: number; published: number; views: number; shares: number };
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
      const [campaignsRes, leadsRes, contentRes] = await Promise.all([
        fetch(`${apiUrl}/api/campaigns`),
        fetch(`${apiUrl}/api/leads`),
        fetch(`${apiUrl}/api/content`),
      ]);

      const campaignsData = await campaignsRes.json();
      const leadsData = await leadsRes.json();
      const contentData = await contentRes.json();

      const campaigns = campaignsData.campaigns || [];
      const leads = leadsData.leads || [];
      const content = contentData.content || [];

      setStats({
        campaigns: {
          total: campaigns.length,
          active: campaigns.filter((c: any) => c.status === 'active').length,
          leads: campaigns.reduce((sum: number, c: any) => sum + (c.leads_generated || 0), 0),
          conversions: campaigns.reduce((sum: number, c: any) => sum + (c.conversions || 0), 0),
        },
        leads: {
          total: leads.length,
          new: leads.filter((l: any) => l.status === 'new').length,
          qualified: leads.filter((l: any) => l.status === 'qualified').length,
          converted: leads.filter((l: any) => l.status === 'converted').length,
        },
        content: {
          total: content.length,
          published: content.filter((c: any) => c.status === 'published').length,
          views: content.reduce((sum: number, c: any) => sum + (c.views || 0), 0),
          shares: content.reduce((sum: number, c: any) => sum + (c.shares || 0), 0),
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
                  <Target className="w-5 h-5 text-gray-900" />
                  <span className="text-sm text-gray-600">Total Campaigns</span>
                  <span className="text-xl font-bold text-gray-900">{stats?.campaigns.total || 0}</span>
                </div>
                <div className="h-6 w-px bg-gray-300"></div>
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-gray-900" />
                  <span className="text-sm text-gray-600">Active Campaigns</span>
                  <span className="text-xl font-bold text-gray-900">{stats?.campaigns.active || 0}</span>
                </div>
                <div className="h-6 w-px bg-gray-300"></div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-900" />
                  <span className="text-sm text-gray-600">Total Leads</span>
                  <span className="text-xl font-bold text-gray-900">{stats?.leads.total || 0}</span>
                </div>
                <div className="h-6 w-px bg-gray-300"></div>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-900" />
                  <span className="text-sm text-gray-600">Published Content</span>
                  <span className="text-xl font-bold text-gray-900">{stats?.content.published || 0}</span>
                </div>
                <div className="h-6 w-px bg-gray-300"></div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-gray-900" />
                  <span className="text-sm text-gray-600">Conversions</span>
                  <span className="text-xl font-bold text-gray-900">{stats?.campaigns.conversions || 0}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-black mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  href="/campaigns/new"
                  className="border border-gray-200 rounded-lg p-6 hover:border-blue-600 transition"
                >
                  <Target className="w-5 h-5 text-gray-900 mb-3" />
                  <h3 className="font-semibold text-black">Create Campaign</h3>
                </Link>

                <Link
                  href="/leads/new"
                  className="border border-gray-200 rounded-lg p-6 hover:border-blue-600 transition"
                >
                  <Users className="w-5 h-5 text-gray-900 mb-3" />
                  <h3 className="font-semibold text-black">Add Lead</h3>
                </Link>

                <Link
                  href="/content/new"
                  className="border border-gray-200 rounded-lg p-6 hover:border-blue-600 transition"
                >
                  <FileText className="w-5 h-5 text-gray-900 mb-3" />
                  <h3 className="font-semibold text-black">Create Content</h3>
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h2 className="text-lg font-semibold text-black mb-4">Overview</h2>
              <div className="border border-gray-200 rounded-lg">
                <div className="grid grid-cols-3 divide-x divide-gray-200">
                  <div className="p-6">
                    <div className="text-sm text-gray-600 mb-2">Lead Conversion Rate</div>
                    <div className="text-2xl font-bold text-black">
                      {stats?.leads.total
                        ? ((stats.leads.converted / stats.leads.total) * 100).toFixed(1)
                        : 0}%
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="text-sm text-gray-600 mb-2">Total Content Views</div>
                    <div className="text-2xl font-bold text-black">
                      {stats?.content.views.toLocaleString() || 0}
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="text-sm text-gray-600 mb-2">Content Shares</div>
                    <div className="text-2xl font-bold text-black">
                      {stats?.content.shares.toLocaleString() || 0}
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
