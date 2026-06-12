'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit2, Trash2 } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { fetchApi } from '@/lib/api';
import { ProductionLine } from '@/lib/types';

export default function ProductionLineDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [line, setLine] = useState<ProductionLine | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [error, setError] = useState('');

  useEffect(() => {
    loadLine();
  }, [params.id]);

  const loadLine = async () => {
    try {
      const data = await fetchApi<ProductionLine>(`/production-lines/${params.id}`);
      setLine(data);
      setFormData({
        line_code: data.line_code,
        name: data.name,
        description: data.description || '',
        location: data.location,
        capacity_per_hour: data.capacity_per_hour?.toString() || '',
        status: data.status,
        is_active: data.is_active,
      });
    } catch (error) {
      console.error('Failed to load production line:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const payload = {
        line_code: formData.line_code,
        name: formData.name,
        description: formData.description || undefined,
        location: formData.location,
        capacity_per_hour: formData.capacity_per_hour ? parseFloat(formData.capacity_per_hour) : undefined,
        status: formData.status,
        is_active: formData.is_active,
      };

      await fetchApi(`/production-lines/${params.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      setEditing(false);
      loadLine();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update production line');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this production line?')) return;

    try {
      await fetchApi(`/production-lines/${params.id}`, { method: 'DELETE' });
      router.push('/production-lines');
    } catch (error) {
      console.error('Failed to delete production line:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-50 text-green-700';
      case 'maintenance': return 'bg-yellow-50 text-yellow-700';
      case 'inactive': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!line) {
    return <div>Production line not found</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <Link href="/production-lines" className="text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Production Lines
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black">{line.name}</h1>
            <p className="text-gray-600 mt-2">{line.line_code}</p>
          </div>
          <div className="flex gap-3">
            {!editing && (
              <>
                <button onClick={() => setEditing(true)} className="btn-primary flex items-center gap-2">
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button onClick={handleDelete} className="btn-secondary text-red-600 hover:text-red-700 flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </>
            )}
          </div>
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
                <label className="block text-sm font-medium text-black mb-2">Line Code</label>
                <input
                  type="text"
                  required
                  value={formData.line_code}
                  onChange={(e) => setFormData({ ...formData, line_code: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Line Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-black mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  rows={3}
                />
              </div>

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
                <label className="block text-sm font-medium text-black mb-2">Capacity per Hour</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.capacity_per_hour}
                  onChange={(e) => setFormData({ ...formData, capacity_per_hour: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Status</label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="input-field"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm font-medium text-black">Active</span>
                </label>
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
                <label className="block text-sm font-medium text-gray-600 mb-1">Line Code</label>
                <p className="text-black font-medium">{line.line_code}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(line.status)}`}>
                  {line.status}
                </span>
              </div>

              {line.description && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
                  <p className="text-black">{line.description}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Location</label>
                <p className="text-black">{line.location}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Capacity per Hour</label>
                <p className="text-black">{line.capacity_per_hour || '-'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Current Work Order</label>
                <p className="text-black">
                  {line.current_work_order_id ? (
                    <Link href={`/work-orders/${line.current_work_order_id}`} className="text-blue-600 hover:text-blue-700">
                      Work Order #{line.current_work_order_id}
                    </Link>
                  ) : (
                    'None'
                  )}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Active Status</label>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                  line.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {line.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
