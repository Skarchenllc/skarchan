'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Scale,
  Edit,
  Trash2,
  ArrowLeft,
  X,
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import DynamicEntityForm from '@shared/components/DynamicEntityForm';
import { api, extractObject } from '@/lib/api';
import type { LegalCase } from '@/lib/types';

export default function LegalCaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [legalCase, setLegalCase] = useState<LegalCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchCase();
  }, [params.id]);

  const fetchCase = async () => {
    try {
      const data = await api.legalCases.get(params.id as string);
      const extractedData = extractObject<LegalCase>(data, 'legal_cases');
      setLegalCase(extractedData);
    } catch (error) {
      console.error('Error fetching legal case:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this legal case?')) {
      return;
    }

    setDeleting(true);
    try {
      await api.legalCases.delete(params.id as string);
      router.push('/legal-cases');
    } catch (error) {
      console.error('Error deleting case:', error);
      alert('Failed to delete legal case');
      setDeleting(false);
    }
  };

  const handleSaveEdit = async () => {
    setShowEditModal(false);
    await fetchCase();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!legalCase) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Legal case not found</p>
        <Link href="/legal-cases" className="text-primary hover:text-primary-dark mt-4 inline-block">
          Back to Legal Cases
        </Link>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'settled': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'appealed': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Link
            href="/legal-cases"
            className="text-primary hover:text-primary-dark text-sm flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Legal Cases
          </Link>
          <h1 className="text-3xl font-bold text-black mt-3">{legalCase.case_number}</h1>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-xl text-gray-600">{legalCase.title}</p>
            <span
              className={`px-3 py-1 text-sm font-medium rounded border ${getStatusColor(legalCase.status)}`}
            >
              {legalCase.status.replace(/_/g, ' ').toUpperCase()}
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

      {/* Case Details */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-6 text-center">
          <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center border-4 border-white shadow-lg">
            <Scale className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="text-white font-bold text-xl mt-4">{legalCase.case_number}</h3>
          <p className="text-blue-100 text-sm mt-1">{legalCase.title}</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Case Type</h3>
              <p className="text-black">{legalCase.case_type.replace(/_/g, ' ')}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Priority</h3>
              <span
                className={`inline-block px-3 py-1 text-sm font-medium rounded border ${getPriorityColor(legalCase.priority)}`}
              >
                {legalCase.priority.toUpperCase()}
              </span>
            </div>
            {legalCase.filing_date && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Filing Date</h3>
                <p className="text-black">{new Date(legalCase.filing_date).toLocaleDateString()}</p>
              </div>
            )}
            {legalCase.plaintiff && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Plaintiff</h3>
                <p className="text-black">{legalCase.plaintiff}</p>
              </div>
            )}
            {legalCase.defendant && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Defendant</h3>
                <p className="text-black">{legalCase.defendant}</p>
              </div>
            )}
            {legalCase.court_jurisdiction && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Court Jurisdiction</h3>
                <p className="text-black">{legalCase.court_jurisdiction}</p>
              </div>
            )}
            {legalCase.assigned_attorney && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Assigned Attorney</h3>
                <p className="text-black">{legalCase.assigned_attorney}</p>
              </div>
            )}
            {legalCase.estimated_value && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Estimated Value</h3>
                <p className="text-black">${legalCase.estimated_value.toLocaleString()}</p>
              </div>
            )}
            {legalCase.actual_cost && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Actual Cost</h3>
                <p className="text-black">${legalCase.actual_cost.toLocaleString()}</p>
              </div>
            )}
          </div>

          {legalCase.description && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
              <p className="text-black whitespace-pre-wrap leading-relaxed">{legalCase.description}</p>
            </div>
          )}

          {legalCase.outcome && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Outcome</h3>
              <p className="text-black whitespace-pre-wrap leading-relaxed">{legalCase.outcome}</p>
            </div>
          )}

          {legalCase.notes && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
              <p className="text-black whitespace-pre-wrap leading-relaxed">{legalCase.notes}</p>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Created: {new Date(legalCase.created_at).toLocaleString()}</span>
            <span>Updated: {new Date(legalCase.updated_at).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-black">Edit Legal Case</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-600 hover:text-black"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <DynamicEntityForm
                entityType="legal_cases"
                recordId={legalCase.id}
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
