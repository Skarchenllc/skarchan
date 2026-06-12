'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Package } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { fetchApi } from '@/lib/api';
import { Product } from '@/lib/types';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await fetchApi<{products: Product[]}>('/products');
      setProducts(data.products || []);
    } catch (error) {
      console.error('Failed to load products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.product_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(products.map((p) => p.category)));

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold text-black">Products</h1>
        </div>
        <Link href="/products/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Product
        </Link>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input-field"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="card">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No products found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-black">Code</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Category</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Unit</th>
                  <th className="text-right py-3 px-4 font-semibold text-black">Cost</th>
                  <th className="text-right py-3 px-4 font-semibold text-black">Price</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Status</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-black font-medium">{product.product_code}</td>
                    <td className="py-3 px-4 text-black">{product.product_name}</td>
                    <td className="py-3 px-4 text-gray-600 capitalize">{product.category.replace('_', ' ')}</td>
                    <td className="py-3 px-4 text-gray-600">{product.unit_of_measure}</td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {product.standard_cost ? `$${Number(product.standard_cost).toFixed(2)}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {product.selling_price ? `$${Number(product.selling_price).toFixed(2)}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          product.is_active
                            ? 'bg-green-50 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/products/${product.id}`}
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
