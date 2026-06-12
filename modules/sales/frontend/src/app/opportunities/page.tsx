"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Target, Plus, Search } from "lucide-react";
import Navigation from "@/components/Navigation";

interface Opportunity {
  id: string;
  opportunity_name: string;
  opportunity_code: string;
  customer_id: string;
  customer_name: string;
  stage: string;
  probability: number;
  amount: number;
  expected_close_date: string | null;
  status: string;
  created_at: string;
}

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    try {
      const apiUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/opportunities` : '/api/opportunities';
      const res = await fetch(apiUrl);
      const data = await res.json();
      setOpportunities(data.opportunities || []);
    } catch (error) {
      console.error("Error fetching opportunities:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOpportunities = opportunities.filter((opp) => {
    const matchesSearch =
      opp.opportunity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.opportunity_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = stageFilter === "all" || opp.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "prospecting": return "text-gray-600 bg-gray-100";
      case "qualification": return "text-blue-600 bg-blue-50";
      case "proposal": return "text-blue-600 bg-blue-100";
      case "negotiation": return "text-blue-700 bg-blue-200";
      case "closed_won": return "text-blue-600 bg-blue-50";
      case "closed_lost": return "text-gray-500 bg-gray-50";
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
            <h1 className="text-3xl font-bold text-black">Opportunities</h1>
          </div>
          <Link
            href="/opportunities/new"
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>New Opportunity</span>
          </Link>
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">{selectedIds.size} opportunit{selectedIds.size > 1 ? 'ies' : 'y'} selected</span>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50">Export CSV</button>
              <button className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50">Change Stage</button>
              <button className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50">Assign Rep</button>
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
              placeholder="Search opportunities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-600"
          >
            <option value="all">All Stages</option>
            <option value="prospecting">Prospecting</option>
            <option value="qualification">Qualification</option>
            <option value="proposal">Proposal</option>
            <option value="negotiation">Negotiation</option>
            <option value="closed_won">Closed Won</option>
            <option value="closed_lost">Closed Lost</option>
          </select>
        </div>

        {/* Opportunities List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading opportunities...</div>
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <div className="text-center py-12 border border-gray-200 rounded-lg">
            <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-black mb-2">No opportunities found</h3>
            <p className="text-gray-600 mb-4">Start tracking your sales pipeline</p>
            <Link
              href="/opportunities/new"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>Create Opportunity</span>
            </Link>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left w-12">
                    <input type="checkbox" className="rounded border-gray-300"
                      checked={selectedIds.size === filteredOpportunities.length && filteredOpportunities.length > 0}
                      onChange={(e) => setSelectedIds(e.target.checked ? new Set(filteredOpportunities.map(o => o.id)) : new Set())} />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase w-16">S.#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Opportunity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Stage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Probability</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Expected Close</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOpportunities.map((opp, index) => (
                  <tr key={opp.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input type="checkbox" className="rounded border-gray-300"
                        checked={selectedIds.has(opp.id)}
                        onChange={(e) => {
                          const newSet = new Set(selectedIds);
                          e.target.checked ? newSet.add(opp.id) : newSet.delete(opp.id);
                          setSelectedIds(newSet);
                        }} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{index + 1}</td>
                    <td className="px-6 py-4">
                      <Link href={`/opportunities/${opp.id}`} className="hover:text-blue-600">
                        <div className="font-semibold text-black">{opp.opportunity_name}</div>
                        <div className="text-sm text-gray-500">{opp.opportunity_code}</div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {opp.customer_name || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getStageColor(opp.stage)}`}>
                        {opp.stage.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-black font-semibold">
                      ${opp.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-black">
                      {opp.probability}%
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {opp.expected_close_date ? new Date(opp.expected_close_date).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                      {opp.status}
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
