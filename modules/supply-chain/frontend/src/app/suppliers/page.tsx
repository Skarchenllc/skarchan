'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Users } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { api } from '@/lib/api';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const data = await api.suppliers.list();
      const suppliersArray = Array.isArray(data) ? data : (data.suppliers || data.data || []);
      setSuppliers(suppliersArray);
    } catch (error) {
      console.error('Failed to load suppliers:', error);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter((supplier) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (supplier.supplier_name && supplier.supplier_name.toLowerCase().includes(search)) ||
      (supplier.supplier_code && supplier.supplier_code.toLowerCase().includes(search)) ||
      (supplier.email && supplier.email.toLowerCase().includes(search))
    );
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold text-black">Suppliers</h1>
        </div>
        <Link href="/suppliers/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Supplier
        </Link>
      </div>

      {/* Search Filter */}
      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search suppliers by name, code, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="card">
        {filteredSuppliers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No suppliers found</p>
            <Link href="/suppliers/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Supplier
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-black">Code</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Supplier Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Contact Person</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Phone</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Rating</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Status</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-black font-medium">{supplier.supplier_code}</td>
                    <td className="py-3 px-4 text-black">{supplier.supplier_name}</td>
                    <td className="py-3 px-4 text-gray-600 capitalize">{supplier.supplier_type}</td>
                    <td className="py-3 px-4 text-gray-600">{supplier.contact_person || '-'}</td>
                    <td className="py-3 px-4 text-gray-600">{supplier.email || '-'}</td>
                    <td className="py-3 px-4 text-gray-600">{supplier.phone || '-'}</td>
                    <td className="py-3 px-4 text-center capitalize">{supplier.rating || '-'}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                        {supplier.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/suppliers/${supplier.id}`}
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
