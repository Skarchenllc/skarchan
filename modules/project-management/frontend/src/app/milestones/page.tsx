'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Target } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { api } from '@/lib/api';

export default function MilestonesPage() {
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadMilestones();
  }, []);

  const loadMilestones = async () => {
    try {
      const data = await api.pm_milestones.list();
      const milestonesArray = Array.isArray(data) ? data : (data.milestones || data.data || []);
      setMilestones(milestonesArray);
    } catch (error) {
      console.error('Failed to load milestones:', error);
      setMilestones([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredMilestones = milestones.filter((milestone) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (milestone.milestone_name && milestone.milestone_name.toLowerCase().includes(search)) ||
      (milestone.responsible_person && milestone.responsible_person.toLowerCase().includes(search))
    );
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold text-black">Milestones</h1>
        </div>
        <Link href="/milestones/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Milestone
        </Link>
      </div>

      {/* Search Filter */}
      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search milestones by name or responsible person..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Milestones Table */}
      <div className="card">
        {filteredMilestones.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No milestones found</p>
            <Link href="/milestones/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Milestone
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-black">Milestone Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Responsible Person</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Due Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Status</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Progress</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMilestones.map((milestone) => (
                  <tr key={milestone.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-black font-medium">{milestone.milestone_name}</td>
                    <td className="py-3 px-4 text-gray-600">{milestone.responsible_person || '-'}</td>
                    <td className="py-3 px-4 text-gray-600">{milestone.due_date || '-'}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                        {milestone.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">{milestone.progress_percentage || 0}%</td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/milestones/${milestone.id}`}
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
