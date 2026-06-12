"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Plus, Search, Eye, Share2 } from "lucide-react";
import Navigation from "@/components/Navigation";

interface Content {
  id: string;
  title: string;
  slug: string;
  content_type: string;
  excerpt: string | null;
  status: string;
  published_at: string | null;
  author: string | null;
  views: number;
  shares: number;
  category: string | null;
  tags: string[] | null;
  created_at: string;
}

export default function ContentPage() {
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const apiUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/content` : '/api/content';
      const res = await fetch(apiUrl);
      const data = await res.json();
      setContent(data.content || []);
    } catch (error) {
      console.error("Error fetching content:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredContent = content.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "text-blue-600 bg-blue-50";
      case "draft": return "text-gray-600 bg-gray-100";
      case "archived": return "text-gray-500 bg-gray-50";
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
            <h1 className="text-3xl font-bold text-black">Content</h1>
          </div>
          <Link
            href="/content/new"
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>New Content</span>
          </Link>
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">{selectedIds.size} content item{selectedIds.size > 1 ? 's' : ''} selected</span>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50">Export CSV</button>
              <button className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50">Publish</button>
              <button className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50">Archive</button>
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
              placeholder="Search content..."
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
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Content List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading content...</div>
          </div>
        ) : filteredContent.length === 0 ? (
          <div className="text-center py-12 border border-gray-200 rounded-lg">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-black mb-2">No content found</h3>
            <p className="text-gray-600 mb-4">Start creating content for your marketing efforts</p>
            <Link
              href="/content/new"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>Create Content</span>
            </Link>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left w-12">
                    <input type="checkbox" className="rounded border-gray-300"
                      checked={selectedIds.size === filteredContent.length && filteredContent.length > 0}
                      onChange={(e) => setSelectedIds(e.target.checked ? new Set(filteredContent.map(c => c.id)) : new Set())} />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase w-16">S.#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Author</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Views</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Shares</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredContent.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input type="checkbox" className="rounded border-gray-300"
                        checked={selectedIds.has(item.id)}
                        onChange={(e) => {
                          const newSet = new Set(selectedIds);
                          e.target.checked ? newSet.add(item.id) : newSet.delete(item.id);
                          setSelectedIds(newSet);
                        }} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{index + 1}</td>
                    <td className="px-6 py-4">
                      <Link href={`/content/${item.id}`} className="hover:text-blue-600">
                        <div className="font-semibold text-black">{item.title}</div>
                        {item.excerpt && (
                          <div className="text-sm text-gray-500 line-clamp-1">{item.excerpt}</div>
                        )}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                      {item.content_type.replace("_", " ")}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.author || "—"}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <Eye className="w-4 h-4 text-blue-600" />
                        <span>{item.views}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <Share2 className="w-4 h-4 text-blue-600" />
                        <span>{item.shares}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {item.published_at
                        ? new Date(item.published_at).toLocaleDateString()
                        : new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/content/${item.id}/edit`} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        Edit
                      </Link>
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
