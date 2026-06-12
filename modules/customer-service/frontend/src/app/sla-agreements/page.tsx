'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, FileCheck } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { api } from '@/lib/api';

export default function SLAAgreementsPage() {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAgreements();
  }, []);

  const loadAgreements = async () => {
    try {
      const data = await api.sla_agreements.list();
      const agreementsArray = Array.isArray(data) ? data : (data.sla_agreements || data.data || []);
      setAgreements(agreementsArray);
    } catch (error) {
      console.error('Failed to load SLA agreements:', error);
      setAgreements([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAgreements = agreements.filter((agreement) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (agreement.agreement_name && agreement.agreement_name.toLowerCase().includes(search)) ||
      (agreement.customer_name && agreement.customer_name.toLowerCase().includes(search)) ||
      (agreement.agreement_type && agreement.agreement_type.toLowerCase().includes(search))
    );
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold text-black">SLA Agreements</h1>
        </div>
        <Link href="/sla-agreements/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Agreement
        </Link>
      </div>

      {/* Search Filter */}
      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search agreements by name, customer, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Agreements Table */}
      <div className="card">
        {filteredAgreements.length === 0 ? (
          <div className="text-center py-12">
            <FileCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No SLA agreements found</p>
            <Link href="/sla-agreements/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Agreement
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-black">Agreement Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Priority</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Status</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Response Time</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAgreements.map((agreement) => (
                  <tr key={agreement.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-black font-medium">{agreement.agreement_name}</td>
                    <td className="py-3 px-4 text-gray-600">{agreement.customer_name || '-'}</td>
                    <td className="py-3 px-4 text-gray-600 capitalize">{agreement.agreement_type}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-purple-50 text-purple-700 capitalize">
                        {agreement.priority_level}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                        {agreement.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">{agreement.response_time_hours}h</td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/sla-agreements/${agreement.id}`}
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
