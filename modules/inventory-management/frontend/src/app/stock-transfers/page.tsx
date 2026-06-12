'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, ArrowLeftRight } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { api } from '@/lib/api';

export default function StockTransfersPage() {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadTransfers();
  }, []);

  const loadTransfers = async () => {
    try {
      const data = await api.stock_transfers.list();
      const transfersArray = Array.isArray(data) ? data : (data.stock_transfers || data.data || []);
      setTransfers(transfersArray);
    } catch (error) {
      console.error('Failed to load stock transfers:', error);
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransfers = transfers.filter((transfer) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (transfer.transfer_number && transfer.transfer_number.toLowerCase().includes(search)) ||
      (transfer.status && transfer.status.toLowerCase().includes(search))
    );
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold text-black">Stock Transfers</h1>
        </div>
        <Link href="/stock-transfers/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Stock Transfer
        </Link>
      </div>

      {/* Search Filter */}
      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search transfers by number or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Stock Transfers Table */}
      <div className="card">
        {filteredTransfers.length === 0 ? (
          <div className="text-center py-12">
            <ArrowLeftRight className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No stock transfers found</p>
            <Link href="/stock-transfers/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Transfer
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-black">Transfer Number</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Transfer Date</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Quantity</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Expected Delivery</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Actual Delivery</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Initiated By</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransfers.map((transfer) => (
                  <tr key={transfer.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-black font-medium">{transfer.transfer_number}</td>
                    <td className="py-3 px-4 text-gray-600">{new Date(transfer.transfer_date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-center">{transfer.quantity}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {transfer.expected_delivery_date ? new Date(transfer.expected_delivery_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {transfer.actual_delivery_date ? new Date(transfer.actual_delivery_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                        {transfer.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{transfer.initiated_by || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/stock-transfers/${transfer.id}`}
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
