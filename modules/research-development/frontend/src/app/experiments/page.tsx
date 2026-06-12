'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Beaker } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { api } from '@/lib/api';

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadExperiments();
  }, []);

  const loadExperiments = async () => {
    try {
      const data = await api.experiments.list();
      const experimentsArray = Array.isArray(data) ? data : (data.experiments || data.data || data.items || []);
      setExperiments(experimentsArray);
    } catch (error) {
      console.error('Failed to load experiments:', error);
      setExperiments([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredExperiments = experiments.filter((experiment) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (experiment.experiment_name && experiment.experiment_name.toLowerCase().includes(search)) ||
      (experiment.experiment_code && experiment.experiment_code.toLowerCase().includes(search)) ||
      (experiment.experiment_type && experiment.experiment_type.toLowerCase().includes(search))
    );
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold text-black">Experiments</h1>
        </div>
        <Link href="/experiments/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Experiment
        </Link>
      </div>

      {/* Search Filter */}
      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search experiments by name, code, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Experiments Table */}
      <div className="card">
        {filteredExperiments.length === 0 ? (
          <div className="text-center py-12">
            <Beaker className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No experiments found</p>
            <Link href="/experiments/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Experiment
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-black">Code</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Experiment Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Start Date</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExperiments.map((experiment) => (
                  <tr key={experiment.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-black font-medium">{experiment.experiment_code}</td>
                    <td className="py-3 px-4 text-black">{experiment.experiment_name}</td>
                    <td className="py-3 px-4 text-gray-600 capitalize">{experiment.experiment_type}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                        {experiment.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{experiment.start_date || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/experiments/${experiment.id}`}
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
