'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Warehouse, AlertTriangle } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { fetchApi } from '@/lib/api';
import { Inventory } from '@/lib/types';

export default function InventoryPage() {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationFilter, setLocationFilter] = useState('');

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const data = await fetchApi<{inventory: Inventory[]}>('/inventory');
      setInventory(data.inventory || []);
    } catch (error) {
      console.error('Failed to load inventory:', error);
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredInventory = inventory.filter((item) => {
    const matchesLocation = !locationFilter || item.location === locationFilter;
    return matchesLocation;
  });

  const locations = Array.from(new Set(inventory.map((i) => i.location)));

  const isLowStock = (item: Inventory) => {
    if (item.reorder_point) {
      return item.quantity_available <= item.reorder_point;
    }
    if (item.minimum_stock_level) {
      return item.quantity_available <= item.minimum_stock_level;
    }
    return false;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold text-black">Inventory</h1>
        </div>
        <Link href="/inventory/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Inventory
        </Link>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="input-field"
          >
            <option value="">All Locations</option>
            {locations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card">
        {filteredInventory.length === 0 ? (
          <div className="text-center py-12">
            <Warehouse className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No inventory items found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-black">Product</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Location</th>
                  <th className="text-right py-3 px-4 font-semibold text-black">On Hand</th>
                  <th className="text-right py-3 px-4 font-semibold text-black">Allocated</th>
                  <th className="text-right py-3 px-4 font-semibold text-black">Available</th>
                  <th className="text-right py-3 px-4 font-semibold text-black">Min Level</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Status</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-black font-medium">
                      {item.product_name || `Product #${item.product_id}`}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{item.location}</td>
                    <td className="py-3 px-4 text-right text-black">{item.quantity_on_hand}</td>
                    <td className="py-3 px-4 text-right text-gray-600">{item.quantity_reserved}</td>
                    <td className="py-3 px-4 text-right text-black font-medium">
                      {item.quantity_available}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {item.minimum_stock_level || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isLowStock(item) ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-50 text-red-700">
                          <AlertTriangle className="w-3 h-3" />
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-green-50 text-green-700">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/inventory/${item.id}`}
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
