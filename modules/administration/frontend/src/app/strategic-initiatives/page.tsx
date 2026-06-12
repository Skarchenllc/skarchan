'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import { api, extractArray } from '@/lib/api';
import type { StrategicInitiative } from '@/lib/types';

export default function StrategicInitiativesListPage() {
  const [initiatives, setInitiatives] = useState<StrategicInitiative[]>([]);
  const [filteredInitiatives, setFilteredInitiatives] = useState<StrategicInitiative[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
  });

  useEffect(() => {
    async function fetchInitiatives() {
      try {
        const data = await api.strategicInitiatives.list();
        const extractedData = extractArray<StrategicInitiative>(data, 'strategic_initiatives');
        setInitiatives(extractedData);
        setFilteredInitiatives(extractedData);
      } catch (error) {
        console.error('Error fetching strategic initiatives:', error);
        setInitiatives([]);
        setFilteredInitiatives([]);
      } finally {
        setLoading(false);
      }
    }

    fetchInitiatives();
  }, []);

  useEffect(() => {
    let filtered = [...initiatives];

    if (filters.status) {
      filtered = filtered.filter(i => i.status === filters.status);
    }
    if (filters.priority) {
      filtered = filtered.filter(i => i.priority === filters.priority);
    }
    if (filters.category) {
      filtered = filtered.filter(i => i.category === filters.category);
    }

    setFilteredInitiatives(filtered);
  }, [filters, initiatives]);

  if (loading) {
    return <LoadingSpinner />;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'on_hold': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-bold text-black">Strategic Initiatives</h1>
        </div>
        <Link
          href="/strategic-initiatives/new"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          New Initiative
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
              <option value="planning">Planning</option>
              <option value="in_progress">In Progress</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
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
              <option value="growth">Growth</option>
              <option value="efficiency">Efficiency</option>
              <option value="innovation">Innovation</option>
              <option value="transformation">Transformation</option>
              <option value="market_expansion">Market Expansion</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {filteredInitiatives.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-500">No strategic initiatives found</p>
          <Link
            href="/strategic-initiatives/new"
            className="mt-4 inline-block text-primary hover:text-primary-dark"
          >
            Create your first initiative
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInitiatives.map((initiative) => (
            <Link
              key={initiative.id}
              href={`/strategic-initiatives/${initiative.id}`}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-primary transition-colors"
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold text-black">{initiative.initiative_name}</h3>
                <p className="text-sm text-gray-600 mt-1">{initiative.category.replace(/_/g, ' ')}</p>

                <div className="mt-4 flex gap-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(initiative.status)}`}>
                    {initiative.status.replace(/_/g, ' ')}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(initiative.priority)}`}>
                    {initiative.priority}
                  </span>
                </div>

                {initiative.progress_percentage !== null && initiative.progress_percentage !== undefined && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{initiative.progress_percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${initiative.progress_percentage}%` }}
                      />
                    </div>
                  </div>
                )}

                {(initiative.budget || initiative.actual_spend) && (
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    {initiative.budget && (
                      <div>
                        <p className="text-gray-500">Budget</p>
                        <p className="text-black font-medium">${initiative.budget.toLocaleString()}</p>
                      </div>
                    )}
                    {initiative.actual_spend && (
                      <div>
                        <p className="text-gray-500">Spent</p>
                        <p className="text-black font-medium">${initiative.actual_spend.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                )}

                {initiative.owner && (
                  <div className="mt-4 text-xs text-gray-600">
                    Owner: {initiative.owner}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
