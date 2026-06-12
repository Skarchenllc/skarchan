'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit2 } from 'lucide-react';
import LoadingSpinner from '@/components/production/LoadingSpinner';
import { fetchApi } from '@/lib/production/api';
import { Inventory } from '@/lib/production/types';

export default function InventoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [error, setError] = useState('');

  useEffect(() => {
    loadInventory();
  }, [params.id]);

  const loadInventory = async () => {
    try {
      const data = await fetchApi<Inventory>(`/inventory/${params.id}`);
      setInventory(data);
      setFormData({
        location: data.location,
        quantity_on_hand: data.quantity_on_hand.toString(),
        quantity_allocated: data.quantity_allocated.toString(),
        minimum_stock_level: data.minimum_stock_level?.toString() || '',
        maximum_stock_level: data.maximum_stock_level?.toString() || '',
        reorder_point: data.reorder_point?.toString() || '',
      });
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const payload = {
        location: formData.location,
        quantity_on_hand: parseFloat(formData.quantity_on_hand),
        quantity_allocated: parseFloat(formData.quantity_allocated),
        minimum_stock_level: formData.minimum_stock_level ? parseFloat(formData.minimum_stock_level) : undefined,
        maximum_stock_level: formData.maximum_stock_level ? parseFloat(formData.maximum_stock_level) : undefined,
        reorder_point: formData.reorder_point ? parseFloat(formData.reorder_point) : undefined,
      };

      await fetchApi(`/inventory/${params.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      setEditing(false);
      loadInventory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update inventory');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!inventory) {
    return <div>Inventory record not found</div>;
  }

  const isLowStock = () => {
    if (inventory.reorder_point) {
      return inventory.quantity_available <= inventory.reorder_point;
    }
    if (inventory.minimum_stock_level) {
      return inventory.quantity_available <= inventory.minimum_stock_level;
    }
    return false;
  };

  return (
    <div>
      <div className="mb-8">
        <Link href="/inventory" className="text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Inventory
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black">
              {inventory.product?.name || `Product #${inventory.product_id}`}
            </h1>
          </div>
          {!editing && (
            <button onClick={() => setEditing(true)} className="btn-primary flex items-center gap-2">
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>
      </div>

      <div className="card max-w-3xl">
        {editing ? (
          <form onSubmit={handleUpdate}>
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">Location</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Quantity on Hand</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.quantity_on_hand}
                  onChange={(e) => setFormData({ ...formData, quantity_on_hand: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Quantity Allocated</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.quantity_allocated}
                  onChange={(e) => setFormData({ ...formData, quantity_allocated: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Minimum Stock Level</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.minimum_stock_level}
                  onChange={(e) => setFormData({ ...formData, minimum_stock_level: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Maximum Stock Level</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.maximum_stock_level}
                  onChange={(e) => setFormData({ ...formData, maximum_stock_level: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Reorder Point</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.reorder_point}
                  onChange={(e) => setFormData({ ...formData, reorder_point: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button type="submit" className="btn-primary">Save Changes</button>
              <button type="button" onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Product</label>
                <p className="text-black font-medium">
                  {inventory.product?.name || `Product #${inventory.product_id}`}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Location</label>
                <p className="text-black">{inventory.location}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Quantity on Hand</label>
                <p className="text-black text-2xl font-bold">{inventory.quantity_on_hand}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Quantity Allocated</label>
                <p className="text-black text-2xl font-bold">{inventory.quantity_allocated}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Quantity Available</label>
                <p className="text-black text-2xl font-bold">{inventory.quantity_available}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                {isLowStock() ? (
                  <span className="inline-block px-3 py-2 rounded text-sm font-medium bg-red-50 text-red-700">
                    Low Stock Alert
                  </span>
                ) : (
                  <span className="inline-block px-3 py-2 rounded text-sm font-medium bg-green-50 text-green-700">
                    In Stock
                  </span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Minimum Stock Level</label>
                <p className="text-black">{inventory.minimum_stock_level || '-'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Maximum Stock Level</label>
                <p className="text-black">{inventory.maximum_stock_level || '-'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Reorder Point</label>
                <p className="text-black">{inventory.reorder_point || '-'}</p>
              </div>

              {inventory.last_stock_check && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Last Stock Check</label>
                  <p className="text-black">{new Date(inventory.last_stock_check).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
