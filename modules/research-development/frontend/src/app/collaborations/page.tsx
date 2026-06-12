'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, GitBranch } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { api } from '@/lib/api';

export default function CollaborationsPage() {
  const [collaborations, setCollaborations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadCollaborations();
  }, []);

  const loadCollaborations = async () => {
    try {
      const data = await api.rd_collaborations.list();
      const collaborationsArray = Array.isArray(data) ? data : (data.rd_collaborations || data.data || data.items || []);
      setCollaborations(collaborationsArray);
    } catch (error) {
      console.error('Failed to load collaborations:', error);
      setCollaborations([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCollaborations = collaborations.filter((collaboration) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (collaboration.collaboration_name && collaboration.collaboration_name.toLowerCase().includes(search)) ||
      (collaboration.partner_organization && collaboration.partner_organization.toLowerCase().includes(search)) ||
      (collaboration.collaboration_type && collaboration.collaboration_type.toLowerCase().includes(search))
    );
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold text-black">Collaborations</h1>
        </div>
        <Link href="/collaborations/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Collaboration
        </Link>
      </div>

      {/* Search Filter */}
      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search collaborations by name, partner, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Collaborations Table */}
      <div className="card">
        {filteredCollaborations.length === 0 ? (
          <div className="text-center py-12">
            <GitBranch className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No collaborations found</p>
            <Link href="/collaborations/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Collaboration
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-black">Collaboration Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Partner Organization</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Start Date</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCollaborations.map((collaboration) => (
                  <tr key={collaboration.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-black font-medium">{collaboration.collaboration_name}</td>
                    <td className="py-3 px-4 text-gray-600">{collaboration.partner_organization}</td>
                    <td className="py-3 px-4 text-gray-600 capitalize">{collaboration.collaboration_type}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                        {collaboration.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{collaboration.start_date || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/collaborations/${collaboration.id}`}
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
