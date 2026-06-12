"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Plus, Search, Mail, Phone } from "lucide-react";
import Navigation from "@/components/Navigation";

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  source: string | null;
  status: string;
  score: number;
  created_at: string;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const apiUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/leads` : '/api/leads';
      const res = await fetch(apiUrl);
      const data = await res.json();
      setLeads(data.leads || []);
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "text-blue-600 bg-blue-50";
      case "contacted": return "text-gray-600 bg-gray-100";
      case "qualified": return "text-blue-600 bg-blue-100";
      case "converted": return "text-gray-800 bg-gray-200";
      case "lost": return "text-gray-500 bg-gray-50";
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
            <h1 className="text-3xl font-bold text-black">Leads</h1>
          </div>
          <Link
            href="/leads/new"
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>New Lead</span>
          </Link>
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">{selectedIds.size} lead{selectedIds.size > 1 ? 's' : ''} selected</span>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50">Export CSV</button>
              <button className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50">Send Email</button>
              <button className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50">Assign To</button>
              <button className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50">Change Status</button>
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
              placeholder="Search leads..."
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
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
          </select>
        </div>

        {/* Leads List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading leads...</div>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-12 border border-gray-200 rounded-lg">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-black mb-2">No leads found</h3>
            <p className="text-gray-600 mb-4">Start capturing leads for your campaigns</p>
            <Link
              href="/leads/new"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>Add Lead</span>
            </Link>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left w-12">
                    <input type="checkbox" className="rounded border-gray-300"
                      checked={selectedIds.size === filteredLeads.length && filteredLeads.length > 0}
                      onChange={(e) => setSelectedIds(e.target.checked ? new Set(filteredLeads.map(l => l.id)) : new Set())} />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase w-16">S.#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLeads.map((lead, index) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input type="checkbox" className="rounded border-gray-300"
                        checked={selectedIds.has(lead.id)}
                        onChange={(e) => {
                          const newSet = new Set(selectedIds);
                          e.target.checked ? newSet.add(lead.id) : newSet.delete(lead.id);
                          setSelectedIds(newSet);
                        }} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{index + 1}</td>
                    <td className="px-6 py-4">
                      <Link href={`/leads/${lead.id}`} className="hover:text-blue-600">
                        <div className="font-semibold text-black">
                          {lead.first_name} {lead.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{lead.job_title || "—"}</div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1 text-sm text-gray-600 mb-1">
                        <Mail className="w-3 h-3 text-blue-600" />
                        <a href={`mailto:${lead.email}`} className="hover:text-blue-600">{lead.email}</a>
                      </div>
                      {lead.phone && (
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <Phone className="w-3 h-3 text-blue-600" />
                          <span>{lead.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{lead.company || "—"}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                      {lead.source?.replace("_", " ") || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-black">{lead.score}/100</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(lead.created_at).toLocaleDateString()}
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
