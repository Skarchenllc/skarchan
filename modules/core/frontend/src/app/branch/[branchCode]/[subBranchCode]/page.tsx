'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { FiPlus, FiX, FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';
import { moduleBuilderAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import DynamicEntityForm from '@shared/components/DynamicEntityForm';
import DynamicEntityList from '@/components/DynamicEntityList';

interface SubBranch {
  id: string;
  component_code: string;
  component_name: string;
  component_label: string;
  description?: string;
  icon?: string;
  color?: string;
}

export default function SubBranchPage() {
  const params = useParams();
  const { user } = useAuth();
  const branchCode = params.branchCode as string;
  const subBranchCode = params.subBranchCode as string;
  const [subBranch, setSubBranch] = useState<SubBranch | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const orgId = (user as any)?.org_id || (user as any)?.organization_id;

        // Load sub-branch info
        const response = await moduleBuilderAPI.getModulesWithComponents({
          organization_id: orgId,
          include_system: false,
        });

        // Find the branch
        const branch = (response.data.modules || []).find(
          (m: any) => m.module_code === branchCode
        );

        // Find the sub-branch within the branch
        if (branch && branch.components) {
          const foundSubBranch = branch.components.find(
            (c: any) => c.component_code === subBranchCode
          );
          if (foundSubBranch) {
            setSubBranch(foundSubBranch);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user && branchCode && subBranchCode) {
      loadData();
    }
  }, [user, branchCode, subBranchCode]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!subBranch) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Sub-Branch Not Found</h1>
        </div>
      </div>
    );
  }

  const handleEdit = (recordId: string) => {
    setEditingRecordId(recordId);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingRecordId(null);
    setShowForm(true);
  };

  const handleSave = () => {
    setShowForm(false);
    setEditingRecordId(null);
    // Trigger refresh by reloading page
    window.location.reload();
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingRecordId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/nexacore"
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{subBranch.component_label}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-sm text-gray-600">
                    Entity Type: <span className="font-mono font-semibold">{subBranch.component_code}</span>
                  </p>
                  {subBranch.description && (
                    <>
                      <span className="text-gray-400">•</span>
                      <p className="text-sm text-gray-600">{subBranch.description}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
            {!showForm && (
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiPlus className="w-5 h-5" />
                Create Record
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Drupal-style Info Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg font-bold">D</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-blue-900 mb-1">
                Dynamic Form System (Drupal Field API)
              </h3>
              <p className="text-sm text-blue-700 leading-relaxed">
                This page uses <strong>dynamic forms</strong> powered by field definitions from the database.
                All fields, labels, types, and validation rules are configured in Settings → System Modules.
                When you change a field label there, it automatically appears here!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {showForm ? (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {editingRecordId ? `Edit ${subBranch.component_label}` : `Create New ${subBranch.component_label}`}
            </h2>
            <DynamicEntityForm
              entityType={subBranchCode}
              entityId={editingRecordId || undefined}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </div>
        ) : (
          <DynamicEntityList
            entityType={subBranchCode}
            onEdit={handleEdit}
            onCreate={handleCreate}
          />
        )}
      </div>
    </div>
  );
}
