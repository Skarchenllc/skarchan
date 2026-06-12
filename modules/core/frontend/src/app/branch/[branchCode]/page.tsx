'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { FiTrendingUp, FiUsers, FiFileText, FiActivity } from 'react-icons/fi';
import { moduleBuilderAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Branch {
  id: string;
  module_code: string;
  module_name: string;
  module_label: string;
  description?: string;
  icon?: string;
  color?: string;
}

export default function BranchDashboard() {
  const params = useParams();
  const { user } = useAuth();
  const branchCode = params.branchCode as string;
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBranch = async () => {
      try {
        setLoading(true);
        const orgId = (user as any)?.org_id || (user as any)?.organization_id;

        const response = await moduleBuilderAPI.getModulesWithComponents({
          organization_id: orgId,
          include_system: false,
        });

        const foundBranch = (response.data.modules || []).find(
          (m: any) => m.module_code === branchCode
        );

        if (foundBranch) {
          setBranch(foundBranch);
        }
      } catch (error) {
        console.error('Error loading branch:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user && branchCode) {
      loadBranch();
    }
  }, [user, branchCode]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Branch Not Found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-16 h-16 rounded-lg flex items-center justify-center font-bold text-2xl"
            style={{
              backgroundColor: branch.color ? `${branch.color}30` : '#E5E7EB',
              color: branch.color || '#4B5563'
            }}
          >
            {branch.icon || 'BR'}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{branch.module_label}</h1>
            {branch.description && (
              <p className="text-gray-600 mt-1">{branch.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">0</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FiFileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">0</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <FiUsers className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">0</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <FiTrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Recent Activity</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">0</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <FiActivity className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Welcome to {branch.module_label}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Getting Started</h3>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-900 mb-2">Configuration</h3>
          </div>
        </div>
      </div>
    </div>
  );
}
