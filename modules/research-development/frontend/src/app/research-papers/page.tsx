'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, BookOpen } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { api } from '@/lib/api';

export default function ResearchPapersPage() {
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPapers();
  }, []);

  const loadPapers = async () => {
    try {
      const data = await api.research_papers.list();
      const papersArray = Array.isArray(data) ? data : (data.research_papers || data.data || data.items || []);
      setPapers(papersArray);
    } catch (error) {
      console.error('Failed to load research papers:', error);
      setPapers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPapers = papers.filter((paper) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (paper.title && paper.title.toLowerCase().includes(search)) ||
      (paper.authors && paper.authors.toLowerCase().includes(search)) ||
      (paper.publication_type && paper.publication_type.toLowerCase().includes(search))
    );
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold text-black">Research Papers</h1>
        </div>
        <Link href="/research-papers/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Research Paper
        </Link>
      </div>

      {/* Search Filter */}
      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search research papers by title, authors, or publication type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Research Papers Table */}
      <div className="card">
        {filteredPapers.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No research papers found</p>
            <Link href="/research-papers/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Research Paper
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-black">Title</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Authors</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Publication Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Publication Date</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPapers.map((paper) => (
                  <tr key={paper.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-black font-medium">{paper.title}</td>
                    <td className="py-3 px-4 text-gray-600">{paper.authors}</td>
                    <td className="py-3 px-4 text-gray-600 capitalize">{paper.publication_type}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                        {paper.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{paper.publication_date || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/research-papers/${paper.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
