'use client';

import React, { useState, useEffect } from 'react';
import { FiEdit, FiTrash2, FiPlus } from 'react-icons/fi';
import { customFieldsAPI, entityRecordsAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface DynamicEntityListProps {
  entityType: string;
  onEdit?: (recordId: string) => void;
  onDelete?: (recordId: string) => void;
  onCreate?: () => void;
}

interface FieldDefinition {
  id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  is_visible: boolean;
  display_order: number;
}

/**
 * DynamicEntityList - Drupal-style dynamic table/list builder
 *
 * Displays records in a table with columns based on field definitions.
 * When you change field labels or visibility, the table updates automatically.
 */
export default function DynamicEntityList({
  entityType,
  onEdit,
  onDelete,
  onCreate
}: DynamicEntityListProps) {
  const { user } = useAuth();
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [entityType]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load field definitions (only visible ones for display)
      const fieldsResponse = await customFieldsAPI.listDefinitions({
        entity_type: entityType,
        is_visible: true,
      });

      const fieldsData = Array.isArray(fieldsResponse.data)
        ? fieldsResponse.data
        : (fieldsResponse.data.data || []);

      const sortedFields = fieldsData.sort((a: FieldDefinition, b: FieldDefinition) =>
        a.display_order - b.display_order
      );

      setFields(sortedFields);

      // Load records
      const orgId = (user as any)?.org_id || (user as any)?.organization_id;
      const recordsResponse = await entityRecordsAPI.list({
        entity_type: entityType,
        organization_id: orgId,
      });

      setRecords(recordsResponse.data.records || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;

    try {
      await entityRecordsAPI.delete(entityType, recordId);
      await loadData(); // Reload
      if (onDelete) onDelete(recordId);
    } catch (error) {
      console.error('Error deleting record:', error);
      alert('Failed to delete record');
    }
  };

  const formatFieldValue = (field: FieldDefinition, value: any) => {
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    switch (field.field_type) {
      case 'checkbox':
      case 'boolean':
        return value ? 'Yes' : 'No';

      case 'date':
        try {
          return new Date(value).toLocaleDateString();
        } catch {
          return value;
        }

      case 'datetime':
        try {
          return new Date(value).toLocaleString();
        } catch {
          return value;
        }

      case 'currency':
        return `$${parseFloat(value).toFixed(2)}`;

      case 'percentage':
        return `${parseFloat(value).toFixed(2)}%`;

      case 'multi_picklist':
        return Array.isArray(value) ? value.join(', ') : value;

      default:
        return String(value);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-yellow-800 font-medium">No fields configured</p>
        <p className="text-yellow-700 text-sm mt-2">
          Go to Settings → System Modules to configure fields for "{entityType}"
        </p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <FiPlus className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Records Yet</h3>
        {onCreate && (
          <button
            onClick={onCreate}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="w-5 h-5" />
            Create Record
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {fields.slice(0, 6).map((field) => (
                <th
                  key={field.id}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {field.field_label}
                </th>
              ))}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {records.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50">
                {fields.slice(0, 6).map((field) => (
                  <td key={field.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatFieldValue(field, record.data[field.field_name])}
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(record.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <FiEdit className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(record.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
