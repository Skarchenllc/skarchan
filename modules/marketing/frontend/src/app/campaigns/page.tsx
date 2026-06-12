"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Target, Plus, Search } from "lucide-react";
import Navigation from "@/components/Navigation";

interface Campaign {
  id: string;
  campaign_name: string;
  campaign_code: string;
  campaign_type: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  budget: number;
  budget_spent: number;
  leads_generated: number;
  conversions: number;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const apiUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/campaigns` : '/api/campaigns';
      const res = await fetch(apiUrl);
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = campaign.campaign_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "text-blue-600 bg-blue-50";
      case "completed": return "text-gray-600 bg-gray-100";
      case "paused": return "text-gray-500 bg-gray-50";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-3xl font-bold text-black">Campaigns</h1>
          </div>
          <Link
            href="/campaigns/new"
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>New Campaign</span>
          </Link>
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">{selectedIds.size} campaign{selectedIds.size > 1 ? 's' : ''} selected</span>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50">Export CSV</button>
              <button className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50">Clone</button>
              <button className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-600"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Campaigns List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading campaigns...</div>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="text-center py-12 border border-gray-200 rounded-lg">
            <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-black mb-2">No campaigns found</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first campaign</p>
            <Link
              href="/campaigns/new"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>Create Campaign</span>
            </Link>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left w-12">
                    <input type="checkbox" className="rounded border-gray-300"
                      checked={selectedIds.size === filteredCampaigns.length && filteredCampaigns.length > 0}
                      onChange={(e) => setSelectedIds(e.target.checked ? new Set(filteredCampaigns.map(c => c.id)) : new Set())} />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase w-16">S.#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Campaign</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Budget</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Leads</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Conversions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Dates</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCampaigns.map((campaign, index) => (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input type="checkbox" className="rounded border-gray-300"
                        checked={selectedIds.has(campaign.id)}
                        onChange={(e) => {
                          const newSet = new Set(selectedIds);
                          e.target.checked ? newSet.add(campaign.id) : newSet.delete(campaign.id);
                          setSelectedIds(newSet);
                        }} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{index + 1}</td>
                    <td className="px-6 py-4">
                      <Link href={`/campaigns/${campaign.id}`} className="hover:text-blue-600">
                        <div className="font-semibold text-black">{campaign.campaign_name}</div>
                        <div className="text-sm text-gray-500">{campaign.campaign_code}</div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                      {campaign.campaign_type.replace("_", " ")}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-black">
                      ${campaign.budget_spent.toLocaleString()} / ${campaign.budget.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-black">{campaign.leads_generated}</td>
                    <td className="px-6 py-4 text-sm text-black">{campaign.conversions}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {campaign.start_date ? new Date(campaign.start_date).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
