'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LoadingSpinner from '@/components/administration/LoadingSpinner';
import { api, extractArray } from '@/lib/administration/api';
import type { CompliancePolicy } from '@/lib/administration/types';

export default function CompliancePoliciesListPage() {
  const [policies, setPolicies] = useState<CompliancePolicy[]>([]);
  const [filteredPolicies, setFilteredPolicies] = useState<CompliancePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
  });

  useEffect(() => {
    async function fetchPolicies() {
      try {
        const data = await api.compliancePolicies.list();
        const extractedData = extractArray<CompliancePolicy>(data, 'compliance_policies');
        setPolicies(extractedData);
        setFilteredPolicies(extractedData);
      } catch (error) {
        console.error('Error fetching compliance policies:', error);
        setPolicies([]);
        setFilteredPolicies([]);
      } finally {
        setLoading(false);
      }
    }

    fetchPolicies();
  }, []);

  useEffect(() => {
    let filtered = [...policies];

    if (filters.status) {
      filtered = filtered.filter(p => p.status === filters.status);
    }
    if (filters.category) {
      filtered = filtered.filter(p => p.category === filters.category);
    }

    setFilteredPolicies(filtered);
  }, [filters, policies]);

  if (loading) {
    return <LoadingSpinner />;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-bold text-black">Compliance Policies</h1>
        </div>
        <Link
          href="/administration/compliance-policies/new"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          New Policy
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-black mb-1">
              Category
            </label>
            <select
              id="category"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Categories</option>
              <option value="data_privacy">Data Privacy</option>
              <option value="financial">Financial</option>
              <option value="operational">Operational</option>
              <option value="ethical">Ethical</option>
              <option value="safety">Safety</option>
              <option value="environmental">Environmental</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-black mb-1">
              Status
            </label>
            <select
              id="status"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="under_review">Under Review</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {filteredPolicies.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-500">No compliance policies found</p>
          <Link
            href="/administration/compliance-policies/new"
            className="mt-4 inline-block text-primary hover:text-primary-dark"
          >
            Create your first policy
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Policy Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Version
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Effective Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPolicies.map((policy) => (
                <tr key={policy.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link href={`/administration/compliance-policies/${policy.id}`} className="text-primary hover:text-primary-dark">
                      {policy.policy_code}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-black">{policy.policy_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {policy.category.replace(/_/g, ' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {policy.version}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(policy.status)}`}>
                      {policy.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {policy.effective_date ? new Date(policy.effective_date).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
