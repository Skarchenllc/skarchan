'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, FileText } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { api } from '@/lib/api';

export default function LabEquipmentPage() {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    try {
      const data = await api.lab_equipment.list();
      const equipmentArray = Array.isArray(data) ? data : (data.lab_equipment || data.data || data.items || []);
      setEquipment(equipmentArray);
    } catch (error) {
      console.error('Failed to load lab equipment:', error);
      setEquipment([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredEquipment = equipment.filter((item) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (item.equipment_name && item.equipment_name.toLowerCase().includes(search)) ||
      (item.equipment_code && item.equipment_code.toLowerCase().includes(search)) ||
      (item.equipment_type && item.equipment_type.toLowerCase().includes(search)) ||
      (item.location && item.location.toLowerCase().includes(search))
    );
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold text-black">Lab Equipment</h1>
        </div>
        <Link href="/lab-equipment/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Equipment
        </Link>
      </div>

      {/* Search Filter */}
      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search equipment by name, code, type, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Lab Equipment Table */}
      <div className="card">
        {filteredEquipment.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No lab equipment found</p>
            <Link href="/lab-equipment/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Lab Equipment
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-black">Code</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Equipment Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Location</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Status</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEquipment.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-black font-medium">{item.equipment_code}</td>
                    <td className="py-3 px-4 text-black">{item.equipment_name}</td>
                    <td className="py-3 px-4 text-gray-600 capitalize">{item.equipment_type}</td>
                    <td className="py-3 px-4 text-gray-600">{item.location || '-'}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/lab-equipment/${item.id}`}
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
