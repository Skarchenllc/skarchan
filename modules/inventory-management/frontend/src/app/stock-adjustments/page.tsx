'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Settings } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { api } from '@/lib/api';

export default function StockAdjustmentsPage() {
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAdjustments();
  }, []);

  const loadAdjustments = async () => {
    try {
      const data = await api.stock_adjustments.list();
      const adjustmentsArray = Array.isArray(data) ? data : (data.stock_adjustments || data.data || []);
      setAdjustments(adjustmentsArray);
    } catch (error) {
      console.error('Failed to load stock adjustments:', error);
      setAdjustments([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAdjustments = adjustments.filter((adjustment) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (adjustment.adjustment_type && adjustment.adjustment_type.toLowerCase().includes(search)) ||
      (adjustment.reference_number && adjustment.reference_number.toLowerCase().includes(search)) ||
      (adjustment.reason && adjustment.reason.toLowerCase().includes(search))
    );
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold text-black">Stock Adjustments</h1>
        </div>
        <Link href="/stock-adjustments/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Stock Adjustment
        </Link>
      </div>

      {/* Search Filter */}
      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search adjustments by type, reference, or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Stock Adjustments Table */}
      <div className="card">
        {filteredAdjustments.length === 0 ? (
          <div className="text-center py-12">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No stock adjustments found</p>
            <Link href="/stock-adjustments/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Adjustment
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-black">Adjustment Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Reference</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Date</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Qty Before</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Adjusted</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Qty After</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Reason</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Status</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdjustments.map((adjustment) => (
                  <tr key={adjustment.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-black capitalize">{adjustment.adjustment_type}</td>
                    <td className="py-3 px-4 text-gray-600">{adjustment.reference_number || '-'}</td>
                    <td className="py-3 px-4 text-gray-600">{new Date(adjustment.adjustment_date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-center">{adjustment.quantity_before || '-'}</td>
                    <td className="py-3 px-4 text-center font-semibold">{adjustment.quantity_adjusted}</td>
                    <td className="py-3 px-4 text-center">{adjustment.quantity_after || '-'}</td>
                    <td className="py-3 px-4 text-gray-600 truncate max-w-xs">{adjustment.reason || '-'}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                        {adjustment.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/stock-adjustments/${adjustment.id}`}
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
