'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, TrendingUp } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { api } from '@/lib/api';

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadMovements();
  }, []);

  const loadMovements = async () => {
    try {
      const data = await api.stock_movements.list();
      const movementsArray = Array.isArray(data) ? data : (data.stock_movements || data.data || []);
      setMovements(movementsArray);
    } catch (error) {
      console.error('Failed to load stock movements:', error);
      setMovements([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredMovements = movements.filter((movement) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (movement.movement_type && movement.movement_type.toLowerCase().includes(search)) ||
      (movement.reference_number && movement.reference_number.toLowerCase().includes(search))
    );
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold text-black">Stock Movements</h1>
        </div>
        <Link href="/stock-movements/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Stock Movement
        </Link>
      </div>

      {/* Search Filter */}
      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search stock movements by type or reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Stock Movements Table */}
      <div className="card">
        {filteredMovements.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No stock movements found</p>
            <Link href="/stock-movements/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Record Your First Movement
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-black">Movement Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Reference</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Date</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Quantity</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Source</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Destination</th>
                  <th className="text-right py-3 px-4 font-semibold text-black">Total Value</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovements.map((movement) => (
                  <tr key={movement.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-black capitalize">{movement.movement_type}</td>
                    <td className="py-3 px-4 text-gray-600">{movement.reference_number || '-'}</td>
                    <td className="py-3 px-4 text-gray-600">{new Date(movement.movement_date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-center">{movement.quantity}</td>
                    <td className="py-3 px-4 text-gray-600">{movement.source || '-'}</td>
                    <td className="py-3 px-4 text-gray-600">{movement.destination || '-'}</td>
                    <td className="py-3 px-4 text-right">${movement.total_value?.toFixed(2) || '0.00'}</td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/stock-movements/${movement.id}`}
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
