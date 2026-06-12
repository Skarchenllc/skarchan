'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Package2 } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { api } from '@/lib/api';

export default function StockItemsPage() {
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadStockItems();
  }, []);

  const loadStockItems = async () => {
    try {
      const data = await api.stock_items.list();
      const itemsArray = Array.isArray(data) ? data : (data.stock_items || data.data || []);
      setStockItems(itemsArray);
    } catch (error) {
      console.error('Failed to load stock items:', error);
      setStockItems([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = stockItems.filter((item) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (item.item_name && item.item_name.toLowerCase().includes(search)) ||
      (item.item_code && item.item_code.toLowerCase().includes(search)) ||
      (item.category && item.category.toLowerCase().includes(search))
    );
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold text-black">Stock Items</h1>
        </div>
        <Link href="/stock-items/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Stock Item
        </Link>
      </div>

      {/* Search Filter */}
      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search stock items by name, code, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Stock Items Table */}
      <div className="card">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Package2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No stock items found</p>
            <Link href="/stock-items/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Stock Item
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-black">Code</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Item Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Category</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Unit</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Current Stock</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Reorder Level</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Status</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-black font-medium">{item.item_code}</td>
                    <td className="py-3 px-4 text-black">{item.item_name}</td>
                    <td className="py-3 px-4 text-gray-600 capitalize">{item.category}</td>
                    <td className="py-3 px-4 text-gray-600">{item.unit_of_measure}</td>
                    <td className="py-3 px-4 text-center">{item.current_stock || 0}</td>
                    <td className="py-3 px-4 text-center">{item.reorder_level || '-'}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/stock-items/${item.id}`}
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
