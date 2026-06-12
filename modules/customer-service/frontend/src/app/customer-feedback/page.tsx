'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, MessageSquare } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { api } from '@/lib/api';

export default function CustomerFeedbackPage() {
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    try {
      const data = await api.customer_feedback.list();
      const feedbackArray = Array.isArray(data) ? data : (data.customer_feedback || data.data || []);
      setFeedback(feedbackArray);
    } catch (error) {
      console.error('Failed to load customer feedback:', error);
      setFeedback([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredFeedback = feedback.filter((item) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (item.customer_name && item.customer_name.toLowerCase().includes(search)) ||
      (item.subject && item.subject.toLowerCase().includes(search)) ||
      (item.feedback_type && item.feedback_type.toLowerCase().includes(search))
    );
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold text-black">Customer Feedback</h1>
        </div>
        <Link href="/customer-feedback/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Feedback
        </Link>
      </div>

      {/* Search Filter */}
      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search feedback by customer, subject, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Feedback Table */}
      <div className="card">
        {filteredFeedback.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No customer feedback found</p>
            <Link href="/customer-feedback/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Record Your First Feedback
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-black">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Subject</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Type</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Rating</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Date</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeedback.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-black font-medium">{item.customer_name}</td>
                    <td className="py-3 px-4 text-black">{item.subject || '-'}</td>
                    <td className="py-3 px-4 text-gray-600 capitalize">{item.feedback_type}</td>
                    <td className="py-3 px-4 text-center">
                      {item.rating ? (
                        <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-yellow-50 text-yellow-700">
                          {item.rating}/5
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{item.feedback_date ? new Date(item.feedback_date).toLocaleDateString() : '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/customer-feedback/${item.id}`}
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
