'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Users } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { api } from '@/lib/api';

export default function TeamMembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const data = await api.research_team_members.list();
      const membersArray = Array.isArray(data) ? data : (data.research_team_members || data.data || data.items || []);
      setMembers(membersArray);
    } catch (error) {
      console.error('Failed to load team members:', error);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter((member) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (member.full_name && member.full_name.toLowerCase().includes(search)) ||
      (member.role && member.role.toLowerCase().includes(search)) ||
      (member.expertise_area && member.expertise_area.toLowerCase().includes(search))
    );
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold text-black">Research Team</h1>
        </div>
        <Link href="/team-members/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Team Member
        </Link>
      </div>

      {/* Search Filter */}
      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search team members by name, role, or expertise area..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Team Members Table */}
      <div className="card">
        {filteredMembers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No team members found</p>
            <Link href="/team-members/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Team Member
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-black">Full Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Role</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Expertise Area</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Status</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Allocation %</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-black font-medium">{member.full_name}</td>
                    <td className="py-3 px-4 text-gray-600">{member.role}</td>
                    <td className="py-3 px-4 text-gray-600">{member.expertise_area || '-'}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                        {member.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">{member.allocation_percentage || 0}%</td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/team-members/${member.id}`}
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
