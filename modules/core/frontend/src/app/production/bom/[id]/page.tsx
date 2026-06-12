'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit2, Trash2 } from 'lucide-react';
import LoadingSpinner from '@/components/production/LoadingSpinner';
import { fetchApi } from '@/lib/production/api';
import { BillOfMaterial } from '@/lib/production/types';

export default function BOMDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [bom, setBom] = useState<BillOfMaterial | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBOM();
  }, [params.id]);

  const loadBOM = async () => {
    try {
      const data = await fetchApi<BillOfMaterial>(`/bom/${params.id}`);
      setBom(data);
    } catch (error) {
      console.error('Failed to load BOM:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this BOM?')) return;

    try {
      await fetchApi(`/bom/${params.id}`, { method: 'DELETE' });
      router.push('/production/bom');
    } catch (error) {
      console.error('Failed to delete BOM:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!bom) {
    return <div>BOM not found</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <Link href="/production/bom" className="text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to BOMs
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black">{bom.bom_code}</h1>
          </div>
          <div className="flex gap-3">
            <button onClick={handleDelete} className="btn-secondary text-red-600 hover:text-red-700 flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* BOM Details */}
      <div className="card mb-6">
        <h2 className="text-xl font-bold text-black mb-6">BOM Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">BOM Code</label>
            <p className="text-black font-medium">{bom.bom_code}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Product</label>
            <p className="text-black">{bom.product?.name || `Product #${bom.product_id}`}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Version</label>
            <p className="text-black">{bom.version}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
              bom.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {bom.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>

          {bom.effective_date && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Effective Date</label>
              <p className="text-black">{new Date(bom.effective_date).toLocaleDateString()}</p>
            </div>
          )}

          {bom.description && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
              <p className="text-black">{bom.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Materials */}
      <div className="card">
        <h2 className="text-xl font-bold text-black mb-6">Materials</h2>

        {!bom.materials || bom.materials.length === 0 ? (
          <p className="text-gray-600">No materials defined</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-black">Material</th>
                  <th className="text-right py-3 px-4 font-semibold text-black">Quantity</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Unit</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Optional</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Notes</th>
                </tr>
              </thead>
              <tbody>
                {bom.materials.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-black font-medium">
                      {item.material?.name || `Material #${item.material_id}`}
                      {item.material?.code && (
                        <span className="text-gray-600 text-sm ml-2">({item.material.code})</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-black">{item.quantity}</td>
                    <td className="py-3 px-4 text-gray-600">{item.unit_of_measure}</td>
                    <td className="py-3 px-4 text-center">
                      {item.is_optional ? (
                        <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700">
                          Optional
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                          Required
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{item.notes || '-'}</td>
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
