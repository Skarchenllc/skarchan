'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit2, Trash2 } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { fetchApi } from '@/lib/api';
import { Product } from '@/lib/types';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [error, setError] = useState('');

  useEffect(() => {
    loadProduct();
  }, [params.id]);

  const loadProduct = async () => {
    try {
      const data = await fetchApi<Product>(`/products/${params.id}`);
      setProduct(data);
      setFormData({
        code: data.code,
        name: data.name,
        description: data.description || '',
        category: data.category,
        unit_of_measure: data.unit_of_measure,
        standard_cost: data.standard_cost?.toString() || '',
        selling_price: data.selling_price?.toString() || '',
        reorder_point: data.reorder_point?.toString() || '',
        lead_time_days: data.lead_time_days?.toString() || '',
        specifications: data.specifications ? JSON.stringify(data.specifications, null, 2) : '',
        is_active: data.is_active,
      });
    } catch (error) {
      console.error('Failed to load product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      let specifications = null;
      if (formData.specifications.trim()) {
        try {
          specifications = JSON.parse(formData.specifications);
        } catch {
          setError('Invalid JSON format in specifications');
          return;
        }
      }

      const payload = {
        code: formData.code,
        name: formData.name,
        description: formData.description || undefined,
        category: formData.category,
        unit_of_measure: formData.unit_of_measure,
        standard_cost: formData.standard_cost ? parseFloat(formData.standard_cost) : undefined,
        selling_price: formData.selling_price ? parseFloat(formData.selling_price) : undefined,
        reorder_point: formData.reorder_point ? parseInt(formData.reorder_point) : undefined,
        lead_time_days: formData.lead_time_days ? parseInt(formData.lead_time_days) : undefined,
        specifications,
        is_active: formData.is_active,
      };

      await fetchApi(`/products/${params.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      setEditing(false);
      loadProduct();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update product');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await fetchApi(`/products/${params.id}`, { method: 'DELETE' });
      router.push('/products');
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!product) {
    return <div>Product not found</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <Link href="/products" className="text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black">{product.name}</h1>
            <p className="text-gray-600 mt-2">{product.code}</p>
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
                <label className="block text-sm font-medium text-black mb-2">Product Code</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Product Name</label>
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
                <label className="block text-sm font-medium text-black mb-2">Category</label>
                <input
                  type="text"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Unit of Measure</label>
                <input
                  type="text"
                  required
                  value={formData.unit_of_measure}
                  onChange={(e) => setFormData({ ...formData, unit_of_measure: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Standard Cost</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.standard_cost}
                  onChange={(e) => setFormData({ ...formData, standard_cost: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Selling Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.selling_price}
                  onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Reorder Point</label>
                <input
                  type="number"
                  value={formData.reorder_point}
                  onChange={(e) => setFormData({ ...formData, reorder_point: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Lead Time (Days)</label>
                <input
                  type="number"
                  value={formData.lead_time_days}
                  onChange={(e) => setFormData({ ...formData, lead_time_days: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-black mb-2">Specifications (JSON)</label>
                <textarea
                  value={formData.specifications}
                  onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                  className="input-field font-mono text-sm"
                  rows={4}
                />
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
                <label className="block text-sm font-medium text-gray-600 mb-1">Category</label>
                <p className="text-black">{product.category}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Unit of Measure</label>
                <p className="text-black">{product.unit_of_measure}</p>
              </div>

              {product.description && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
                  <p className="text-black">{product.description}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Standard Cost</label>
                <p className="text-black">{product.standard_cost ? `$${product.standard_cost.toFixed(2)}` : '-'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Selling Price</label>
                <p className="text-black">{product.selling_price ? `$${product.selling_price.toFixed(2)}` : '-'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Reorder Point</label>
                <p className="text-black">{product.reorder_point || '-'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Lead Time</label>
                <p className="text-black">{product.lead_time_days ? `${product.lead_time_days} days` : '-'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                  product.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {product.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {product.specifications && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Specifications</label>
                  <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-auto">
                    {JSON.stringify(product.specifications, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
