'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Clock } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { api } from '@/lib/api';

export default function TimeTrackingPage() {
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadTimeEntries();
  }, []);

  const loadTimeEntries = async () => {
    try {
      const data = await api.time_tracking.list();
      const timeEntriesArray = Array.isArray(data) ? data : (data.time_tracking || data.data || []);
      setTimeEntries(timeEntriesArray);
    } catch (error) {
      console.error('Failed to load time entries:', error);
      setTimeEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTimeEntries = timeEntries.filter((entry) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (entry.work_description && entry.work_description.toLowerCase().includes(search)) ||
      (entry.work_date && entry.work_date.toLowerCase().includes(search))
    );
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold text-black">Time Tracking</h1>
        </div>
        <Link href="/time-tracking/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Log Time
        </Link>
      </div>

      {/* Search Filter */}
      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search time entries by description or date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Time Tracking Table */}
      <div className="card">
        {filteredTimeEntries.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No time entries found</p>
            <Link href="/time-tracking/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Log Your First Time Entry
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-black">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Description</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Hours</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Billable</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Status</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTimeEntries.map((entry) => (
                  <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-black font-medium">{entry.work_date}</td>
                    <td className="py-3 px-4 text-gray-600">{entry.work_description || '-'}</td>
                    <td className="py-3 px-4 text-center">{entry.hours_worked || 0}</td>
                    <td className="py-3 px-4 text-center">
                      {entry.billable ? (
                        <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-green-50 text-green-700">
                          Yes
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-gray-50 text-gray-700">
                          No
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                        {entry.status || 'Logged'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/time-tracking/${entry.id}`}
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
