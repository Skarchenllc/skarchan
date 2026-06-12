'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Award } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { api } from '@/lib/api';

export default function PatentsPage() {
  const [patents, setPatents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPatents();
  }, []);

  const loadPatents = async () => {
    try {
      const data = await api.patents.list();
      const patentsArray = Array.isArray(data) ? data : (data.patents || data.data || data.items || []);
      setPatents(patentsArray);
    } catch (error) {
      console.error('Failed to load patents:', error);
      setPatents([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatents = patents.filter((patent) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (patent.title && patent.title.toLowerCase().includes(search)) ||
      (patent.patent_number && patent.patent_number.toLowerCase().includes(search)) ||
      (patent.inventors && patent.inventors.toLowerCase().includes(search))
    );
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold text-black">Patents</h1>
        </div>
        <Link href="/patents/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Patent
        </Link>
      </div>

      {/* Search Filter */}
      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search patents by number, title, or inventors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Patents Table */}
      <div className="card">
        {filteredPatents.length === 0 ? (
          <div className="text-center py-12">
            <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No patents found</p>
            <Link href="/patents/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Patent
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-black">Patent Number</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Title</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Inventors</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Filing Date</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatents.map((patent) => (
                  <tr key={patent.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-black font-medium">{patent.patent_number}</td>
                    <td className="py-3 px-4 text-black">{patent.title}</td>
                    <td className="py-3 px-4 text-gray-600">{patent.inventors}</td>
                    <td className="py-3 px-4 text-gray-600 capitalize">{patent.patent_type}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                        {patent.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{patent.filing_date || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/patents/${patent.id}`}
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
