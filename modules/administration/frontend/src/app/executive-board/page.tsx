'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Filter, Users, TrendingUp, Award, Download, Grid, List } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { api, extractArray } from '@/lib/api';
import type { ExecutiveBoard } from '@/lib/types';

export default function ExecutiveBoardListPage() {
  const [executives, setExecutives] = useState<ExecutiveBoard[]>([]);
  const [filteredExecutives, setFilteredExecutives] = useState<ExecutiveBoard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [stats, setStats] = useState({
    total_members: 0,
    active_members: 0,
    csuite_count: 0,
    board_members_count: 0,
  });

  useEffect(() => {
    fetchExecutives();
    fetchStats();
  }, []);

  useEffect(() => {
    filterExecutives();
  }, [searchTerm, statusFilter, positionFilter, executives]);

  const fetchExecutives = async () => {
    try {
      const data = await api.executiveBoard.list();
      const extractedData = extractArray<ExecutiveBoard>(data, 'executive_board');
      setExecutives(extractedData);
      setFilteredExecutives(extractedData);
    } catch (error) {
      console.error('Error fetching executive board:', error);
      setExecutives([]);
      setFilteredExecutives([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.executiveBoard.stats();
      setStats(response);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const filterExecutives = () => {
    let filtered = executives;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (exec) =>
          exec.member_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          exec.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
          exec.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((exec) => exec.status === statusFilter);
    }

    // Position filter
    if (positionFilter !== 'all') {
      if (positionFilter === 'csuite') {
        filtered = filtered.filter((exec) =>
          ['CEO', 'CFO', 'COO', 'CTO', 'CMO', 'CHRO'].includes(exec.position)
        );
      } else if (positionFilter === 'board') {
        filtered = filtered.filter((exec) =>
          exec.position.toLowerCase().includes('board member')
        );
      }
    }

    setFilteredExecutives(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'on_leave':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Position', 'Department', 'Email', 'Phone', 'Status', 'Start Date'];
    const csvData = filteredExecutives.map((exec) => [
      exec.member_name,
      exec.position,
      exec.department || '',
      exec.email || '',
      exec.phone || '',
      exec.status,
      exec.start_date || '',
    ]);

    const csv = [
      headers.join(','),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `executive-board-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-bold text-black">Executive Board</h1>
        </div>
        <div className="flex gap-3">
          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 flex items-center gap-2 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 flex items-center gap-2 transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <Link
            href="/executive-board/new"
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            Add Executive
          </Link>
        </div>
      </div>

      {/* Compact Statistics Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-8">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Total Members</span>
            <span className="text-xl font-bold text-gray-900">{stats.total_members}</span>
          </div>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Active</span>
            <span className="text-xl font-bold text-gray-900">{stats.active_members}</span>
          </div>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">C-Suite</span>
            <span className="text-xl font-bold text-gray-900">{stats.csuite_count}</span>
          </div>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Board Members</span>
            <span className="text-xl font-bold text-gray-900">{stats.board_members_count}</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, position, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option>
            </select>
          </div>

          {/* Position Filter */}
          <div>
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Positions</option>
              <option value="csuite">C-Suite</option>
              <option value="board">Board Members</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredExecutives.length} of {executives.length} executives
        </div>
      </div>

      {/* Executive Cards/List */}
      {filteredExecutives.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-500">
            {searchTerm || statusFilter !== 'all' || positionFilter !== 'all'
              ? 'No executives match your filters'
              : 'No executive board members found'}
          </p>
          {executives.length === 0 && (
            <Link
              href="/executive-board/new"
              className="mt-4 inline-block text-primary hover:text-primary-dark"
            >
              Add your first executive member
            </Link>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        // Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExecutives.map((executive) => (
            <Link
              key={executive.id}
              href={`/executive-board/${executive.id}`}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-primary hover:shadow-lg transition-all"
            >
              <div className="p-6">
                {executive.photo_url && (
                  <div className="w-20 h-20 bg-gray-200 rounded-full mb-4 overflow-hidden">
                    <img
                      src={executive.photo_url}
                      alt={executive.member_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                {!executive.photo_url && (
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {executive.member_name.charAt(0)}
                    </span>
                  </div>
                )}
                <h3 className="text-lg font-semibold text-black">{executive.member_name}</h3>
                <p className="text-sm text-gray-600 mt-1">{executive.position}</p>
                {executive.department && (
                  <p className="text-sm text-gray-500 mt-1">{executive.department}</p>
                )}
                {executive.email && (
                  <p className="text-xs text-gray-500 mt-2">{executive.email}</p>
                )}
                <div className="mt-4 flex items-center justify-between">
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded ${getStatusColor(
                      executive.status
                    )}`}
                  >
                    {executive.status.replace('_', ' ')}
                  </span>
                  {executive.start_date && (
                    <span className="text-xs text-gray-500">
                      Since {new Date(executive.start_date).getFullYear()}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        // List View
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Executive
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredExecutives.map((executive) => (
                  <tr
                    key={executive.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => window.location.href = `/executive-board/${executive.id}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {executive.photo_url ? (
                          <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden mr-3">
                            <img
                              src={executive.photo_url}
                              alt={executive.member_name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                            <span className="text-sm font-bold text-white">
                              {executive.member_name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {executive.member_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{executive.position}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{executive.department || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {executive.email && (
                          <div>{executive.email}</div>
                        )}
                        {executive.phone && (
                          <div className="text-xs text-gray-400">{executive.phone}</div>
                        )}
                        {!executive.email && !executive.phone && '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getStatusColor(
                          executive.status
                        )}`}
                      >
                        {executive.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {executive.start_date
                        ? new Date(executive.start_date).toLocaleDateString()
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
