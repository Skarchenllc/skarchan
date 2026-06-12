'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Shield,
  Edit,
  Trash2,
  ArrowLeft,
  X,
  FileText,
  Calendar,
} from 'lucide-react';
import LoadingSpinner from '@/components/administration/LoadingSpinner';
import DynamicEntityForm from '@shared/components/DynamicEntityForm';
import { api, extractObject } from '@/lib/administration/api';
import type { CompliancePolicy } from '@/lib/administration/types';

export default function CompliancePolicyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [policy, setPolicy] = useState<CompliancePolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchPolicy();
  }, [params.id]);

  const fetchPolicy = async () => {
    try {
      const data = await api.compliancePolicies.get(params.id as string);
      const extractedData = extractObject<CompliancePolicy>(data, 'compliance_policies');
      setPolicy(extractedData);
    } catch (error) {
      console.error('Error fetching compliance policy:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this compliance policy?')) {
      return;
    }

    setDeleting(true);
    try {
      await api.compliancePolicies.delete(params.id as string);
      router.push('/administration/compliance-policies');
    } catch (error) {
      console.error('Error deleting policy:', error);
      alert('Failed to delete compliance policy');
      setDeleting(false);
    }
  };

  const handleSaveEdit = async () => {
    setShowEditModal(false);
    await fetchPolicy();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!policy) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Compliance policy not found</p>
        <Link href="/administration/compliance-policies" className="text-primary hover:text-primary-dark mt-4 inline-block">
          Back to Compliance Policies
        </Link>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'under_review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'archived': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Link
            href="/administration/compliance-policies"
            className="text-primary hover:text-primary-dark text-sm flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Compliance Policies
          </Link>
          <h1 className="text-3xl font-bold text-black mt-3">{policy.policy_code}</h1>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-xl text-gray-600">{policy.policy_name}</p>
            <span
              className={`px-3 py-1 text-sm font-medium rounded border ${getStatusColor(policy.status)}`}
            >
              {policy.status.replace(/_/g, ' ').toUpperCase()}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowEditModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      {/* Policy Details */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-6 text-center">
          <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center border-4 border-white shadow-lg">
            <Shield className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="text-white font-bold text-xl mt-4">{policy.policy_code}</h3>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Category</h3>
              <p className="text-black">{policy.category.replace(/_/g, ' ')}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Version</h3>
              <p className="text-black">{policy.version}</p>
            </div>
            {policy.effective_date && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Effective Date</h3>
                <p className="text-black flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {new Date(policy.effective_date).toLocaleDateString()}
                </p>
              </div>
            )}
            {policy.review_date && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Review Date</h3>
                <p className="text-black flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {new Date(policy.review_date).toLocaleDateString()}
                </p>
              </div>
            )}
            {policy.owner_department && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Owner Department</h3>
                <p className="text-black">{policy.owner_department}</p>
              </div>
            )}
            {policy.document_url && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Document</h3>
                <a
                  href={policy.document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary-dark flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  View Document
                </a>
              </div>
            )}
          </div>

          {policy.description && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
              <p className="text-black whitespace-pre-wrap leading-relaxed">{policy.description}</p>
            </div>
          )}

          {policy.scope && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Scope</h3>
              <p className="text-black whitespace-pre-wrap leading-relaxed">{policy.scope}</p>
            </div>
          )}

          {policy.compliance_requirements && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Compliance Requirements</h3>
              <p className="text-black whitespace-pre-wrap leading-relaxed">{policy.compliance_requirements}</p>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Created: {new Date(policy.created_at).toLocaleString()}</span>
            <span>Updated: {new Date(policy.updated_at).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-black">Edit Compliance Policy</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-600 hover:text-black"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <DynamicEntityForm
                entityType="compliance_policies"
                recordId={policy.id}
                onSave={handleSaveEdit}
                onCancel={() => setShowEditModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
