'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ClipboardCheck,
  Edit,
  Trash2,
  ArrowLeft,
  X,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import DynamicEntityForm from '@shared/components/DynamicEntityForm';
import { api, extractObject } from '@/lib/api';
import type { ComplianceAudit } from '@/lib/types';

export default function ComplianceAuditDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [audit, setAudit] = useState<ComplianceAudit | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchAudit();
  }, [params.id]);

  const fetchAudit = async () => {
    try {
      const data = await api.complianceAudits.get(params.id as string);
      const extractedData = extractObject<ComplianceAudit>(data, 'compliance_audits');
      setAudit(extractedData);
    } catch (error) {
      console.error('Error fetching compliance audit:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this compliance audit?')) {
      return;
    }

    setDeleting(true);
    try {
      await api.complianceAudits.delete(params.id as string);
      router.push('/compliance-audits');
    } catch (error) {
      console.error('Error deleting audit:', error);
      alert('Failed to delete compliance audit');
      setDeleting(false);
    }
  };

  const handleSaveEdit = async () => {
    setShowEditModal(false);
    await fetchAudit();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!audit) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Compliance audit not found</p>
        <Link href="/compliance-audits" className="text-primary hover:text-primary-dark mt-4 inline-block">
          Back to Compliance Audits
        </Link>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'deferred': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Link
            href="/compliance-audits"
            className="text-primary hover:text-primary-dark text-sm flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Compliance Audits
          </Link>
          <h1 className="text-3xl font-bold text-black mt-3">{audit.audit_number}</h1>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-xl text-gray-600">{audit.title}</p>
            <span
              className={`px-3 py-1 text-sm font-medium rounded border ${getStatusColor(audit.status)}`}
            >
              {audit.status.replace(/_/g, ' ').toUpperCase()}
            </span>
            <span
              className={`px-3 py-1 text-sm font-medium rounded border ${getRiskLevelColor(audit.risk_level)}`}
            >
              {audit.risk_level.toUpperCase()} RISK
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

      {/* Audit Details */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-6 text-center">
          <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center border-4 border-white shadow-lg">
            <ClipboardCheck className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="text-white font-bold text-xl mt-4">{audit.audit_number}</h3>
          <p className="text-blue-100 text-sm mt-1">{audit.title}</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Score Display */}
          {audit.score !== null && audit.score !== undefined && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Audit Score</span>
                <span className="text-3xl font-bold text-blue-600">{audit.score}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    audit.score >= 90 ? 'bg-green-600' :
                    audit.score >= 70 ? 'bg-yellow-500' :
                    audit.score >= 50 ? 'bg-orange-500' : 'bg-red-600'
                  }`}
                  style={{ width: `${audit.score}%` }}
                />
              </div>
            </div>
          )}

          {/* Basic Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Audit Type</h3>
              <p className="text-black">{audit.audit_type.replace(/_/g, ' ')}</p>
            </div>
            {audit.auditor_name && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Auditor</h3>
                <p className="text-black">{audit.auditor_name}</p>
              </div>
            )}
            {audit.audit_date && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Audit Date</h3>
                <p className="text-black flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {new Date(audit.audit_date).toLocaleDateString()}
                </p>
              </div>
            )}
            {audit.follow_up_date && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Follow-up Date</h3>
                <p className="text-black flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {new Date(audit.follow_up_date).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Risk Level Warning */}
          {(audit.risk_level === 'high' || audit.risk_level === 'critical') && (
            <div className={`p-4 rounded-lg border-l-4 ${
              audit.risk_level === 'critical'
                ? 'bg-red-50 border-red-500'
                : 'bg-orange-50 border-orange-500'
            }`}>
              <div className="flex items-center gap-2">
                <AlertTriangle className={`w-5 h-5 ${
                  audit.risk_level === 'critical' ? 'text-red-600' : 'text-orange-600'
                }`} />
                <span className={`font-medium ${
                  audit.risk_level === 'critical' ? 'text-red-800' : 'text-orange-800'
                }`}>
                  {audit.risk_level.toUpperCase()} RISK LEVEL - Immediate attention required
                </span>
              </div>
            </div>
          )}

          {/* Findings */}
          {audit.findings && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Findings</h3>
              <p className="text-black whitespace-pre-wrap leading-relaxed">{audit.findings}</p>
            </div>
          )}

          {/* Recommendations */}
          {audit.recommendations && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Recommendations</h3>
              <p className="text-black whitespace-pre-wrap leading-relaxed">{audit.recommendations}</p>
            </div>
          )}

          {/* Action Items */}
          {audit.action_items && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Action Items</h3>
              <p className="text-black whitespace-pre-wrap leading-relaxed">{audit.action_items}</p>
            </div>
          )}

          {/* Notes */}
          {audit.notes && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
              <p className="text-black whitespace-pre-wrap leading-relaxed">{audit.notes}</p>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Created: {new Date(audit.created_at).toLocaleString()}</span>
            <span>Updated: {new Date(audit.updated_at).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-black">Edit Compliance Audit</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-600 hover:text-black"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <DynamicEntityForm
                entityType="compliance_audits"
                recordId={audit.id}
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
