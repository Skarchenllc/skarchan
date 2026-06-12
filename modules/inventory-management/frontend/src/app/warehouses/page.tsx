'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Warehouse } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { api } from '@/lib/api';

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    try {
      const data = await api.warehouses.list();
      const warehousesArray = Array.isArray(data) ? data : (data.warehouses || data.data || []);
      setWarehouses(warehousesArray);
    } catch (error) {
      console.error('Failed to load warehouses:', error);
      setWarehouses([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredWarehouses = warehouses.filter((warehouse) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (warehouse.warehouse_name && warehouse.warehouse_name.toLowerCase().includes(search)) ||
      (warehouse.warehouse_code && warehouse.warehouse_code.toLowerCase().includes(search)) ||
      (warehouse.location && warehouse.location.toLowerCase().includes(search))
    );
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold text-black">Warehouses</h1>
        </div>
        <Link href="/warehouses/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Warehouse
        </Link>
      </div>

      {/* Search Filter */}
      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search warehouses by name, code, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Warehouses Table */}
      <div className="card">
        {filteredWarehouses.length === 0 ? (
          <div className="text-center py-12">
            <Warehouse className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No warehouses found</p>
            <Link href="/warehouses/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Warehouse
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-black">Code</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Warehouse Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Location</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Manager</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Capacity</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Status</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWarehouses.map((warehouse) => (
                  <tr key={warehouse.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-black font-medium">{warehouse.warehouse_code}</td>
                    <td className="py-3 px-4 text-black">{warehouse.warehouse_name}</td>
                    <td className="py-3 px-4 text-gray-600 capitalize">{warehouse.warehouse_type}</td>
                    <td className="py-3 px-4 text-gray-600">{warehouse.location}</td>
                    <td className="py-3 px-4 text-gray-600">{warehouse.manager_name || '-'}</td>
                    <td className="py-3 px-4 text-center">{warehouse.capacity || '-'}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                        {warehouse.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/warehouses/${warehouse.id}`}
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
