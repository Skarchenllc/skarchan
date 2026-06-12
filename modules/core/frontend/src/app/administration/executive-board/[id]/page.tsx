'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Mail,
  Phone,
  Calendar,
  Building,
  Edit,
  Trash2,
  User,
  Briefcase,
  Clock,
  ArrowLeft,
  X,
} from 'lucide-react';
import LoadingSpinner from '@/components/administration/LoadingSpinner';
import DynamicEntityForm from '@shared/components/DynamicEntityForm';
import { api, extractObject } from '@/lib/administration/api';
import type { ExecutiveBoard } from '@/lib/administration/types';

export default function ExecutiveBoardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [executive, setExecutive] = useState<ExecutiveBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchExecutive();
  }, [params.id]);

  const fetchExecutive = async () => {
    try {
      const data = await api.executiveBoard.get(params.id as string);
      const extractedData = extractObject<ExecutiveBoard>(data, 'executive_board_member');
      setExecutive(extractedData);
    } catch (error) {
      console.error('Error fetching executive:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this executive board member?')) {
      return;
    }

    setDeleting(true);
    try {
      await api.executiveBoard.delete(params.id as string);
      router.push('/administration/executive-board');
    } catch (error) {
      console.error('Error deleting executive:', error);
      alert('Failed to delete executive board member');
      setDeleting(false);
    }
  };

  const handleSaveEdit = async () => {
    setShowEditModal(false);
    await fetchExecutive();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!executive) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Executive board member not found</p>
        <Link href="/administration/executive-board" className="text-primary hover:text-primary-dark mt-4 inline-block">
          Back to Executive Board
        </Link>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'on_leave':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const calculateTenure = () => {
    if (!executive.start_date) return 'N/A';
    const start = new Date(executive.start_date);
    const now = new Date();
    const years = now.getFullYear() - start.getFullYear();
    const months = now.getMonth() - start.getMonth();
    const totalMonths = years * 12 + months;

    if (totalMonths < 12) {
      return `${totalMonths} month${totalMonths !== 1 ? 's' : ''}`;
    }
    const displayYears = Math.floor(totalMonths / 12);
    const displayMonths = totalMonths % 12;
    return `${displayYears} year${displayYears !== 1 ? 's' : ''}${displayMonths > 0 ? ` ${displayMonths} month${displayMonths !== 1 ? 's' : ''}` : ''}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Link
            href="/administration/executive-board"
            className="text-primary hover:text-primary-dark text-sm flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Executive Board
          </Link>
          <h1 className="text-3xl font-bold text-black mt-3">{executive.member_name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-xl text-gray-600">{executive.position}</p>
            <span
              className={`px-3 py-1 text-sm font-medium rounded border ${getStatusColor(executive.status)}`}
            >
              {executive.status.replace('_', ' ').toUpperCase()}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Profile Photo */}
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-8 text-center">
              {executive.photo_url ? (
                <div className="w-32 h-32 bg-white rounded-full mx-auto overflow-hidden border-4 border-white shadow-lg">
                  <img
                    src={executive.photo_url}
                    alt={executive.member_name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 bg-white rounded-full mx-auto flex items-center justify-center border-4 border-white shadow-lg">
                  <span className="text-5xl font-bold text-blue-600">
                    {executive.member_name.charAt(0)}
                  </span>
                </div>
              )}
              <h3 className="text-white font-bold text-xl mt-4">{executive.member_name}</h3>
            </div>

            {/* Quick Info */}
            <div className="p-6 space-y-4">
              {executive.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <a href={`mailto:${executive.email}`} className="text-sm text-primary hover:underline">
                    {executive.email}
                  </a>
                </div>
              )}
              {executive.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <a href={`tel:${executive.phone}`} className="text-sm text-gray-700">
                    {executive.phone}
                  </a>
                </div>
              )}
              {executive.department && (
                <div className="flex items-center gap-3">
                  <Building className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-700">{executive.department}</span>
                </div>
              )}
              {executive.start_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-700">
                    {new Date(executive.start_date).toLocaleDateString()}
                  </span>
                </div>
              )}
              {executive.start_date && (
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-700">Tenure: {calculateTenure()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Biography */}
          {executive.bio && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-black mb-3 flex items-center gap-2">
                <User className="w-5 h-5" />
                Biography
              </h2>
            </div>
          )}

          {/* Professional Details */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Professional Details
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Position</h3>
                <p className="text-black">{executive.position}</p>
              </div>
              {executive.department && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Department</h3>
                  <p className="text-black">{executive.department}</p>
                </div>
              )}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                <span
                  className={`inline-block px-3 py-1 text-sm font-medium rounded border ${getStatusColor(
                    executive.status
                  )}`}
                >
                  {executive.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              {executive.start_date && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Start Date</h3>
                  <p className="text-black">{new Date(executive.start_date).toLocaleDateString()}</p>
                </div>
              )}
              {executive.reports_to && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Reports To</h3>
                  <p className="text-black">{executive.reports_to}</p>
                </div>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Created:</span>{' '}
                <span className="text-gray-700">
                  {executive.created_at
                    ? new Date(executive.created_at).toLocaleString()
                    : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Last Updated:</span>{' '}
                <span className="text-gray-700">
                  {executive.updated_at
                    ? new Date(executive.updated_at).toLocaleString()
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-black">Edit Executive Member</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-600 hover:text-black"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <DynamicEntityForm
                entityType="executive_board"
                recordId={executive.id}
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
