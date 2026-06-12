'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LoadingSpinner from '@/components/administration/LoadingSpinner';
import { api, extractArray } from '@/lib/administration/api';
import type { LegalCase } from '@/lib/administration/types';

export default function LegalCasesListPage() {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [filteredCases, setFilteredCases] = useState<LegalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    case_type: '',
    priority: '',
  });

  useEffect(() => {
    async function fetchCases() {
      try {
        const data = await api.legalCases.list();
        const extractedData = extractArray<LegalCase>(data, 'legal_cases');
        setCases(extractedData);
        setFilteredCases(extractedData);
      } catch (error) {
        console.error('Error fetching legal cases:', error);
        setCases([]);
        setFilteredCases([]);
      } finally {
        setLoading(false);
      }
    }

    fetchCases();
  }, []);

  useEffect(() => {
    let filtered = [...cases];

    if (filters.status) {
      filtered = filtered.filter(c => c.status === filters.status);
    }
    if (filters.case_type) {
      filtered = filtered.filter(c => c.case_type === filters.case_type);
    }
    if (filters.priority) {
      filtered = filtered.filter(c => c.priority === filters.priority);
    }

    setFilteredCases(filtered);
  }, [filters, cases]);

  if (loading) {
    return <LoadingSpinner />;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'settled':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'appealed':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-bold text-black">Legal Cases</h1>
        </div>
        <Link
          href="/administration/legal-cases/new"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          New Case
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="settled">Settled</option>
              <option value="closed">Closed</option>
              <option value="appealed">Appealed</option>
            </select>
          </div>

          <div>
            <label htmlFor="case_type" className="block text-sm font-medium text-black mb-1">
              Type
            </label>
            <select
              id="case_type"
              value={filters.case_type}
              onChange={(e) => setFilters({ ...filters, case_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Types</option>
              <option value="litigation">Litigation</option>
              <option value="contract_dispute">Contract Dispute</option>
              <option value="regulatory">Regulatory</option>
              <option value="intellectual_property">Intellectual Property</option>
              <option value="employment">Employment</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-black mb-1">
              Priority
            </label>
            <select
              id="priority"
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
      </div>

      {filteredCases.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-500">No legal cases found</p>
          <Link
            href="/administration/legal-cases/new"
            className="mt-4 inline-block text-primary hover:text-primary-dark"
          >
            Create your first legal case
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Case Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Filing Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCases.map((legalCase) => (
                <tr key={legalCase.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link href={`/administration/legal-cases/${legalCase.id}`} className="text-primary hover:text-primary-dark">
                      {legalCase.case_number}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-black">{legalCase.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {legalCase.case_type.replace(/_/g, ' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(legalCase.status)}`}>
                      {legalCase.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(legalCase.priority)}`}>
                      {legalCase.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {legalCase.filing_date ? new Date(legalCase.filing_date).toLocaleDateString() : 'N/A'}
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
