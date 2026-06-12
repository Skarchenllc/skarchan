'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Factory } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { fetchApi } from '@/lib/api';
import { ProductionLine } from '@/lib/types';

export default function ProductionLinesPage() {
  const [lines, setLines] = useState<ProductionLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadLines();
  }, []);

  const loadLines = async () => {
    try {
      const data = await fetchApi<{production_lines: ProductionLine[]}>('/production-lines');
      setLines(data.production_lines || []);
    } catch (error) {
      console.error('Failed to load production lines:', error);
      setLines([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLines = lines.filter((line) => {
    const matchesStatus = !statusFilter || line.status === statusFilter;
    return matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-green-50 text-green-700';
      case 'idle': return 'bg-blue-50 text-blue-700';
      case 'maintenance': return 'bg-yellow-50 text-yellow-700';
      case 'offline': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold text-black">Production Lines</h1>
        </div>
        <Link href="/production-lines/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Production Line
        </Link>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
          >
            <option value="">All Statuses</option>
            <option value="operational">Operational</option>
            <option value="idle">Idle</option>
            <option value="maintenance">Maintenance</option>
            <option value="offline">Offline</option>
          </select>
        </div>
      </div>

      {/* Production Lines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLines.length === 0 ? (
          <div className="col-span-full text-center py-12 card">
            <Factory className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No production lines found</p>
          </div>
        ) : (
          filteredLines.map((line) => (
            <Link
              key={line.id}
              href={`/production-lines/${line.id}`}
              className="card hover:border-blue-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <Factory className="w-6 h-6 text-blue-600" />
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(line.status)}`}>
                  {line.status}
                </span>
              </div>

              <h3 className="text-lg font-bold text-black mb-1">{line.line_name}</h3>
              <p className="text-sm text-gray-600 mb-2">{line.line_code}</p>

              {line.notes && (
                <p className="text-sm text-gray-600 mb-3">{line.notes}</p>
              )}

              <div className="pt-3 border-t border-gray-200 space-y-2">
                {line.location && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Location:</span>
                    <span className="text-black font-medium">{line.location}</span>
                  </div>
                )}
                {line.capacity_per_hour && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Capacity/Hour:</span>
                    <span className="text-black font-medium">{line.capacity_per_hour}</span>
                  </div>
                )}
                {line.current_work_order_id && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Current WO:</span>
                    <span className="text-blue-600 font-medium">#{line.current_work_order_id}</span>
                  </div>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
