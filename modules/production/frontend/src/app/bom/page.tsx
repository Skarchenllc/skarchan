'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, FileText } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { fetchApi } from '@/lib/api';
import { BillOfMaterial } from '@/lib/types';

export default function BOMPage() {
  const [boms, setBoms] = useState<BillOfMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBOMs();
  }, []);

  const loadBOMs = async () => {
    try {
      const data = await fetchApi<{bill_of_materials: BillOfMaterial[]}>('/bom');
      setBoms(data.bill_of_materials || []);
    } catch (error) {
      console.error('Failed to load BOMs:', error);
      setBoms([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold text-black">Bill of Materials</h1>
        </div>
        <Link href="/bom/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New BOM
        </Link>
      </div>

      {/* BOMs Table */}
      <div className="card">
        {boms.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No bills of materials found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-black">BOM Code</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Product</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Version</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Description</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Effective Date</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Status</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {boms.map((bom) => (
                  <tr key={bom.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-black font-medium">{bom.bom_code}</td>
                    <td className="py-3 px-4 text-black">
                      {bom.product_name || `Product #${bom.product_id}`}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{bom.version}</td>
                    <td className="py-3 px-4 text-gray-600">{bom.description || '-'}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {bom.effective_date ? new Date(bom.effective_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          bom.is_active
                            ? 'bg-green-50 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {bom.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/bom/${bom.id}`}
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
