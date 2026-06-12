'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, FileSignature } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { api } from '@/lib/api';

export default function SupplierContractsPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      const data = await api.supplier_contracts.list();
      const contractsArray = Array.isArray(data) ? data : (data.supplier_contracts || data.data || []);
      setContracts(contractsArray);
    } catch (error) {
      console.error('Failed to load supplier contracts:', error);
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredContracts = contracts.filter((contract) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (contract.contract_number && contract.contract_number.toLowerCase().includes(search)) ||
      (contract.contract_title && contract.contract_title.toLowerCase().includes(search)) ||
      (contract.status && contract.status.toLowerCase().includes(search))
    );
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold text-black">Supplier Contracts</h1>
        </div>
        <Link href="/supplier-contracts/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Contract
        </Link>
      </div>

      {/* Search Filter */}
      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search contracts by number, title, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Contracts Table */}
      <div className="card">
        {filteredContracts.length === 0 ? (
          <div className="text-center py-12">
            <FileSignature className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No supplier contracts found</p>
            <Link href="/supplier-contracts/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Contract
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-black">Contract Number</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Title</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Start Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">End Date</th>
                  <th className="text-right py-3 px-4 font-semibold text-black">Contract Value</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Status</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContracts.map((contract) => (
                  <tr key={contract.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-black font-medium">{contract.contract_number}</td>
                    <td className="py-3 px-4 text-black">{contract.contract_title}</td>
                    <td className="py-3 px-4 text-gray-600 capitalize">{contract.contract_type}</td>
                    <td className="py-3 px-4 text-gray-600">{contract.start_date}</td>
                    <td className="py-3 px-4 text-gray-600">{contract.end_date || '-'}</td>
                    <td className="py-3 px-4 text-right">${contract.contract_value?.toFixed(2) || '0.00'}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                        {contract.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/supplier-contracts/${contract.id}`}
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
