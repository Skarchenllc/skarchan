'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { moduleBuilderAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Component {
  id: string;
  component_code: string;
  component_name: string;
  component_label: string;
  description?: string;
  icon?: string;
  display_order: number;
}

interface ComponentFormProps {
  component?: Component | null;
  moduleId: string;
  onSave: () => void;
  onCancel: () => void;
}

export default function ComponentForm({ component, moduleId, onSave, onCancel }: ComponentFormProps) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Debug: Log moduleId when component mounts or updates
  useEffect(() => {
    console.log('ComponentForm received moduleId:', moduleId);
  }, [moduleId]);

  const [formData, setFormData] = useState({
    component_code: '',
    component_name: '',
    description: '',
    display_order: 0,
    is_active: true,
    base_fields_config: {},
    list_view_config: {},
    form_view_config: {},
    permissions_config: {},
  });

  useEffect(() => {
    if (component) {
      setFormData({
        component_code: component.component_code || '',
        component_name: component.component_name || '',
        description: component.description || '',
        display_order: component.display_order || 0,
        is_active: true,
        base_fields_config: {},
        list_view_config: {},
        form_view_config: {},
        permissions_config: {},
      });
    }
  }, [component]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.component_code.trim()) {
      newErrors.component_code = 'Sub branch code is required';
    } else if (!/^[a-z0-9_-]+$/i.test(formData.component_code)) {
      newErrors.component_code = 'Sub branch code can only contain letters, numbers, hyphens, and underscores';
    }

    if (!formData.component_name.trim()) {
      newErrors.component_name = 'Sub branch name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!user?.id) {
      alert('User ID not found. Please log in again.');
      return;
    }

    if (!moduleId) {
      alert('Branch ID is missing. Please close and reopen the form.');
      return;
    }

    setSaving(true);

    try {
      if (component) {
        // Update existing component
        await moduleBuilderAPI.updateComponent(component.id, {
          ...formData,
          component_label: formData.component_name,  // Use component_name as label
          icon: formData.component_name.substring(0, 2).toUpperCase(),  // Auto-generate icon
          last_modified_by: user.id,
        });
      } else {
        // Create new component
        const componentData = {
          ...formData,
          component_label: formData.component_name,  // Use component_name as label
          icon: formData.component_name.substring(0, 2).toUpperCase(),  // Auto-generate icon
          module_id: moduleId,
          created_by: user.id,
        };

        console.log('Creating component with data:', componentData);
        await moduleBuilderAPI.createComponent(componentData);
      }

      onSave();
    } catch (error: any) {
      console.error('Error saving component:', error);
      const errorDetail = error.response?.data?.detail;
      if (Array.isArray(errorDetail)) {
        const errorMessages = errorDetail.map((err: any) =>
          `${err.loc?.join(' > ') || 'Field'}: ${err.msg}`
        ).join('\n');
        alert(`Validation errors:\n${errorMessages}`);
      } else {
        alert(errorDetail || 'Failed to save sub branch');
      }
    } finally {
      setSaving(false);
    }
  };

  const generateComponentCode = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      component_name: name,
      component_code: component ? formData.component_code : generateComponentCode(name),
    });
    // Clear errors
    if (errors.component_name) {
      setErrors({ ...errors, component_name: '' });
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    // Clear error for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">
            {component ? 'Edit Sub Branch' : 'Create New Sub Branch'}
          </h3>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={saving}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Sub Branch Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sub Branch Name *
            </label>
            <input
              type="text"
              value={formData.component_name}
              onChange={(e) => handleNameChange(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.component_name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Production Lines, Quality Inspections"
            />
            {errors.component_name && (
              <p className="mt-1 text-sm text-red-600">{errors.component_name}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Display name for the sub branch
            </p>
          </div>

          {/* Sub Branch Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sub Branch Code *
            </label>
            <input
              type="text"
              value={formData.component_code}
              onChange={(e) => handleChange('component_code', e.target.value)}
              disabled={!!component} // Can't change code when editing
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono ${
                errors.component_code ? 'border-red-500' : 'border-gray-300'
              } ${component ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder="e.g., production_lines, quality_inspections"
            />
            {errors.component_code && (
              <p className="mt-1 text-sm text-red-600">{errors.component_code}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {component ? 'Sub branch code cannot be changed' : 'Auto-generated from sub branch name'}
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Brief description of what this sub branch manages..."
            />
            <p className="mt-1 text-xs text-gray-500">
              Explain what data this sub branch will store (e.g., "Track production line efficiency and downtime")
            </p>
          </div>

          {/* Display Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Order
            </label>
            <input
              type="number"
              value={formData.display_order}
              onChange={(e) => handleChange('display_order', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
            />
            <p className="mt-1 text-xs text-gray-500">
              Lower numbers appear first in lists
            </p>
          </div>

          {/* Active Toggle */}
          <div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => handleChange('is_active', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Active
              </span>
            </label>
            <p className="mt-1 ml-7 text-xs text-gray-500">
              Inactive sub branches are hidden from users
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900 font-medium mb-2">
              What happens next?
            </p>
            <ul className="text-sm text-blue-800 space-y-1 ml-4 list-disc">
              <li>This sub branch will be created with basic structure</li>
              <li>You can add custom fields for data entry</li>
              <li>You can configure workflows for automation</li>
              <li>Default fields like ID, created_at, updated_at are automatic</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving...' : component ? 'Update Sub Branch' : 'Create Sub Branch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
