"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Plus, Search } from "lucide-react";
import Navigation from "@/components/Navigation";

interface Quote {
  id: string;
  quote_number: string;
  customer_id: string;
  customer_name: string;
  opportunity_id: string | null;
  quote_date: string;
  valid_until: string | null;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  status: string;
  created_at: string;
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const apiUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/quotes` : '/api/quotes';
      const res = await fetch(apiUrl);
      const data = await res.json();
      setQuotes(data.quotes || []);
    } catch (error) {
      console.error("Error fetching quotes:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuotes = quotes.filter((quote) => {
    const matchesSearch =
      quote.quote_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "text-gray-600 bg-gray-100";
      case "sent": return "text-blue-600 bg-blue-50";
      case "accepted": return "text-blue-600 bg-blue-50";
      case "rejected": return "text-gray-500 bg-gray-50";
      case "expired": return "text-gray-600 bg-gray-100";
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
            <h1 className="text-3xl font-bold text-black">Quotes</h1>
          </div>
          <Link
            href="/quotes/new"
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>New Quote</span>
          </Link>
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">{selectedIds.size} quote{selectedIds.size > 1 ? 's' : ''} selected</span>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50">Export PDF</button>
              <button className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50">Send Email</button>
              <button className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50">Mark as Sent</button>
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
              placeholder="Search quotes..."
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
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        {/* Quotes List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading quotes...</div>
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div className="text-center py-12 border border-gray-200 rounded-lg">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-black mb-2">No quotes found</h3>
            <p className="text-gray-600 mb-4">Start creating quotes for your customers</p>
            <Link
              href="/quotes/new"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>Create Quote</span>
            </Link>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left w-12">
                    <input type="checkbox" className="rounded border-gray-300"
                      checked={selectedIds.size === filteredQuotes.length && filteredQuotes.length > 0}
                      onChange={(e) => setSelectedIds(e.target.checked ? new Set(filteredQuotes.map(q => q.id)) : new Set())} />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase w-16">S.#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Quote Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Quote Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Valid Until</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Total Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredQuotes.map((quote, index) => (
                  <tr key={quote.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input type="checkbox" className="rounded border-gray-300"
                        checked={selectedIds.has(quote.id)}
                        onChange={(e) => {
                          const newSet = new Set(selectedIds);
                          e.target.checked ? newSet.add(quote.id) : newSet.delete(quote.id);
                          setSelectedIds(newSet);
                        }} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{index + 1}</td>
                    <td className="px-6 py-4">
                      <Link href={`/quotes/${quote.id}`} className="hover:text-blue-600">
                        <div className="font-semibold text-black">{quote.quote_number}</div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {quote.customer_name || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(quote.quote_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {quote.valid_until ? new Date(quote.valid_until).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-black font-semibold">
                      ${quote.total_amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getStatusColor(quote.status)}`}>
                        {quote.status}
                      </span>
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
