'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Target,
  Edit,
  Trash2,
  ArrowLeft,
  X,
  Calendar,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import DynamicEntityForm from '@shared/components/DynamicEntityForm';
import { api, extractObject } from '@/lib/api';
import type { StrategicInitiative } from '@/lib/types';

export default function StrategicInitiativeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [initiative, setInitiative] = useState<StrategicInitiative | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchInitiative();
  }, [params.id]);

  const fetchInitiative = async () => {
    try {
      const data = await api.strategicInitiatives.get(params.id as string);
      const extractedData = extractObject<StrategicInitiative>(data, 'strategic_initiatives');
      setInitiative(extractedData);
    } catch (error) {
      console.error('Error fetching strategic initiative:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this strategic initiative?')) {
      return;
    }

    setDeleting(true);
    try {
      await api.strategicInitiatives.delete(params.id as string);
      router.push('/strategic-initiatives');
    } catch (error) {
      console.error('Error deleting initiative:', error);
      alert('Failed to delete strategic initiative');
      setDeleting(false);
    }
  };

  const handleSaveEdit = async () => {
    setShowEditModal(false);
    await fetchInitiative();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!initiative) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Strategic initiative not found</p>
        <Link href="/strategic-initiatives" className="text-primary hover:text-primary-dark mt-4 inline-block">
          Back to Strategic Initiatives
        </Link>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'on_hold': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
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
            href="/strategic-initiatives"
            className="text-primary hover:text-primary-dark text-sm flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Strategic Initiatives
          </Link>
          <h1 className="text-3xl font-bold text-black mt-3">{initiative.initiative_name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-xl text-gray-600">{initiative.category.replace(/_/g, ' ')}</p>
            <span
              className={`px-3 py-1 text-sm font-medium rounded border ${getStatusColor(initiative.status)}`}
            >
              {initiative.status.replace(/_/g, ' ').toUpperCase()}
            </span>
            <span
              className={`px-3 py-1 text-sm font-medium rounded border ${getPriorityColor(initiative.priority)}`}
            >
              {initiative.priority.toUpperCase()}
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

      {/* Initiative Details */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-6 text-center">
          <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center border-4 border-white shadow-lg">
            <Target className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="text-white font-bold text-xl mt-4">{initiative.initiative_name}</h3>
          <p className="text-blue-100 text-sm mt-1">{initiative.category.replace(/_/g, ' ')}</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Progress Bar */}
          {initiative.progress_percentage !== null && initiative.progress_percentage !== undefined && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Progress
                </span>
                <span className="text-2xl font-bold text-blue-600">{initiative.progress_percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all"
                  style={{ width: `${initiative.progress_percentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Financial Summary */}
          {(initiative.budget || initiative.actual_spend) && (
            <div className="grid grid-cols-2 gap-4">
              {initiative.budget && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <DollarSign className="w-4 h-4" />
                    Budget
                  </div>
                  <p className="text-2xl font-bold text-black">${initiative.budget.toLocaleString()}</p>
                </div>
              )}
              {initiative.actual_spend && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <DollarSign className="w-4 h-4" />
                    Actual Spend
                  </div>
                  <p className="text-2xl font-bold text-black">${initiative.actual_spend.toLocaleString()}</p>
                  {initiative.budget && (
                    <p className="text-xs text-gray-500 mt-1">
                      {((initiative.actual_spend / initiative.budget) * 100).toFixed(1)}% of budget
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {initiative.start_date && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Start Date</h3>
                <p className="text-black flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {new Date(initiative.start_date).toLocaleDateString()}
                </p>
              </div>
            )}
            {initiative.target_completion_date && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Target Completion</h3>
                <p className="text-black flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {new Date(initiative.target_completion_date).toLocaleDateString()}
                </p>
              </div>
            )}
            {initiative.actual_completion_date && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Actual Completion</h3>
                <p className="text-black flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {new Date(initiative.actual_completion_date).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Team */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {initiative.owner && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Owner</h3>
                <p className="text-black">{initiative.owner}</p>
              </div>
            )}
            {initiative.stakeholders && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Stakeholders</h3>
                <p className="text-black">{initiative.stakeholders}</p>
              </div>
            )}
          </div>

          {initiative.description && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
              <p className="text-black whitespace-pre-wrap leading-relaxed">{initiative.description}</p>
            </div>
          )}

          {initiative.objectives && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Objectives</h3>
              <p className="text-black whitespace-pre-wrap leading-relaxed">{initiative.objectives}</p>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Created: {new Date(initiative.created_at).toLocaleString()}</span>
            <span>Updated: {new Date(initiative.updated_at).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-black">Edit Strategic Initiative</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-600 hover:text-black"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <DynamicEntityForm
                entityType="strategic_initiatives"
                recordId={initiative.id}
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
