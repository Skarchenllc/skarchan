'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Microscope } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { api } from '@/lib/api';

export default function PrototypesPage() {
  const [prototypes, setPrototypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPrototypes();
  }, []);

  const loadPrototypes = async () => {
    try {
      const data = await api.prototypes.list();
      const prototypesArray = Array.isArray(data) ? data : (data.prototypes || data.data || data.items || []);
      setPrototypes(prototypesArray);
    } catch (error) {
      console.error('Failed to load prototypes:', error);
      setPrototypes([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPrototypes = prototypes.filter((prototype) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (prototype.prototype_name && prototype.prototype_name.toLowerCase().includes(search)) ||
      (prototype.prototype_code && prototype.prototype_code.toLowerCase().includes(search)) ||
      (prototype.development_stage && prototype.development_stage.toLowerCase().includes(search))
    );
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold text-black">Prototypes</h1>
        </div>
        <Link href="/prototypes/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Prototype
        </Link>
      </div>

      {/* Search Filter */}
      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search prototypes by name, code, or development stage..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Prototypes Table */}
      <div className="card">
        {filteredPrototypes.length === 0 ? (
          <div className="text-center py-12">
            <Microscope className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No prototypes found</p>
            <Link href="/prototypes/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Prototype
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-black">Code</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Prototype Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Version</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Development Stage</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Status</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPrototypes.map((prototype) => (
                  <tr key={prototype.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-black font-medium">{prototype.prototype_code}</td>
                    <td className="py-3 px-4 text-black">{prototype.prototype_name}</td>
                    <td className="py-3 px-4 text-gray-600">{prototype.prototype_version || '-'}</td>
                    <td className="py-3 px-4 text-gray-600 capitalize">{prototype.development_stage}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                        {prototype.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/prototypes/${prototype.id}`}
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
