'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, MessageSquare } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { api } from '@/lib/api';

export default function RFQPage() {
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadRFQs();
  }, []);

  const loadRFQs = async () => {
    try {
      const data = await api.rfq.list();
      const rfqsArray = Array.isArray(data) ? data : (data.rfqs || data.data || []);
      setRfqs(rfqsArray);
    } catch (error) {
      console.error('Failed to load RFQs:', error);
      setRfqs([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredRFQs = rfqs.filter((rfq) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (rfq.rfq_number && rfq.rfq_number.toLowerCase().includes(search)) ||
      (rfq.subject && rfq.subject.toLowerCase().includes(search)) ||
      (rfq.status && rfq.status.toLowerCase().includes(search))
    );
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold text-black">Request for Quotation (RFQ)</h1>
        </div>
        <Link href="/rfq/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New RFQ
        </Link>
      </div>

      {/* Search Filter */}
      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search RFQs by number, subject, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* RFQs Table */}
      <div className="card">
        {filteredRFQs.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No RFQs found</p>
            <Link href="/rfq/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Your First RFQ
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-black">RFQ Number</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Subject</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Submission Deadline</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Status</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRFQs.map((rfq) => (
                  <tr key={rfq.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-black font-medium">{rfq.rfq_number}</td>
                    <td className="py-3 px-4 text-gray-600">{rfq.rfq_date}</td>
                    <td className="py-3 px-4 text-black">{rfq.subject || '-'}</td>
                    <td className="py-3 px-4 text-gray-600 capitalize">{rfq.rfq_type}</td>
                    <td className="py-3 px-4 text-gray-600">{rfq.submission_deadline || '-'}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                        {rfq.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/rfq/${rfq.id}`}
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
