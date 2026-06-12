'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, ClipboardList } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { api } from '@/lib/api';

export default function PurchaseRequisitionsPage() {
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadRequisitions();
  }, []);

  const loadRequisitions = async () => {
    try {
      const data = await api.purchase_requisitions.list();
      const requisitionsArray = Array.isArray(data) ? data : (data.purchase_requisitions || data.data || []);
      setRequisitions(requisitionsArray);
    } catch (error) {
      console.error('Failed to load purchase requisitions:', error);
      setRequisitions([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequisitions = requisitions.filter((req) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (req.requisition_number && req.requisition_number.toLowerCase().includes(search)) ||
      (req.department && req.department.toLowerCase().includes(search)) ||
      (req.status && req.status.toLowerCase().includes(search))
    );
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold text-black">Purchase Requisitions</h1>
        </div>
        <Link href="/purchase-requisitions/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Purchase Requisition
        </Link>
      </div>

      {/* Search Filter */}
      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search requisitions by number, department, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Requisitions Table */}
      <div className="card">
        {filteredRequisitions.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No purchase requisitions found</p>
            <Link href="/purchase-requisitions/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Requisition
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-black">Requisition Number</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Requested By</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Department</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Type</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Priority</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Status</th>
                  <th className="text-right py-3 px-4 font-semibold text-black">Est. Cost</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequisitions.map((req) => (
                  <tr key={req.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-black font-medium">{req.requisition_number}</td>
                    <td className="py-3 px-4 text-gray-600">{req.requisition_date}</td>
                    <td className="py-3 px-4 text-gray-600">{req.requested_by || '-'}</td>
                    <td className="py-3 px-4 text-gray-600">{req.department || '-'}</td>
                    <td className="py-3 px-4 text-gray-600 capitalize">{req.requisition_type}</td>
                    <td className="py-3 px-4 text-center capitalize">{req.priority || '-'}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">${req.total_estimated_cost?.toFixed(2) || '0.00'}</td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/purchase-requisitions/${req.id}`}
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
