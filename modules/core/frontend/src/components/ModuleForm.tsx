'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { moduleBuilderAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Module {
  id: string;
  module_code: string;
  module_name: string;
  module_label: string;
  description?: string;
  icon?: string;
  color?: string;
  is_system_module: boolean;
  is_active: boolean;
  display_order: number;
}

interface ModuleFormProps {
  module?: Module | null;
  onSave: () => void;
  onCancel: () => void;
}

const COLOR_OPTIONS = [
  { value: '#3B82F6', label: 'Blue', name: 'blue' },
  { value: '#10B981', label: 'Green', name: 'green' },
  { value: '#8B5CF6', label: 'Purple', name: 'purple' },
  { value: '#F59E0B', label: 'Amber', name: 'amber' },
  { value: '#EF4444', label: 'Red', name: 'red' },
  { value: '#EC4899', label: 'Pink', name: 'pink' },
  { value: '#14B8A6', label: 'Teal', name: 'teal' },
  { value: '#6366F1', label: 'Indigo', name: 'indigo' },
];

export default function ModuleForm({ module, onSave, onCancel }: ModuleFormProps) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableModules, setAvailableModules] = useState<Module[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);

  const [formData, setFormData] = useState({
    module_code: '',
    module_name: '',
    description: '',
    parent_id: '',  // For selecting parent module
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    // Load available modules for parent selection
    loadAvailableModules();

    if (module) {
      setFormData({
        module_code: module.module_code || '',
        module_name: module.module_name || '',
        description: module.description || '',
        parent_id: '',  // Will be set if module has parent
        display_order: module.display_order || 0,
        is_active: module.is_active ?? true,
      });
    }
  }, [module]);

  const loadAvailableModules = async () => {
    try {
      setLoadingModules(true);
      const response = await moduleBuilderAPI.listModules({
        include_system: true,
      });
      // Flatten the tree structure to get all modules
      const flattenModules = (modules: any[]): Module[] => {
        let result: Module[] = [];
        modules.forEach((mod: any) => {
          result.push(mod);
          if (mod.children && mod.children.length > 0) {
            result = result.concat(flattenModules(mod.children));
          }
        });
        return result;
      };
      const allModules = response.data.modules || [];
      setAvailableModules(allModules);
    } catch (error) {
      console.error('Error loading modules:', error);
    } finally {
      setLoadingModules(false);
    }
  };

  const generateModuleCode = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      module_name: name,
      module_code: module ? formData.module_code : generateModuleCode(name),
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.module_name.trim()) {
      newErrors.module_name = 'Branch name is required';
    }

    if (!formData.module_code.trim()) {
      newErrors.module_code = 'Branch code is required';
    } else if (!/^[a-z0-9_-]+$/i.test(formData.module_code)) {
      newErrors.module_code = 'Branch code can only contain letters, numbers, hyphens, and underscores';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!user) {
      alert('User not found. Please log in again.');
      return;
    }

    // Check for org_id (new field name) or organization_id (old field name)
    const orgId = (user as any).org_id || (user as any).organization_id;

    if (!orgId) {
      alert('Organization ID not found. Please log in again.');
      return;
    }

    setSaving(true);

    try {
      if (module) {
        // Update existing module
        await moduleBuilderAPI.updateModule(module.id, {
          ...formData,
          module_label: formData.module_name,  // Use module_name as label
          icon: formData.module_name.substring(0, 2).toUpperCase(),  // Auto-generate icon
          color: '#3B82F6',  // Default blue color
          last_modified_by: user.id,
        });
      } else {
        // Create new module
        const moduleData: any = {
          ...formData,
          module_label: formData.module_name,  // Use module_name as label
          icon: formData.module_name.substring(0, 2).toUpperCase(),  // Auto-generate icon
          color: '#3B82F6',  // Default blue color
          organization_id: orgId,
          created_by: user.id,
        };

        // Only include parent_id if it's not empty
        if (formData.parent_id) {
          moduleData.parent_id = formData.parent_id;
        } else {
          delete moduleData.parent_id;
        }

        await moduleBuilderAPI.createModule(moduleData);
      }

      onSave();
    } catch (error: any) {
      console.error('Error saving module:', error);
      alert(error.response?.data?.detail || 'Failed to save module');
    } finally {
      setSaving(false);
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
            {module ? 'Edit Branch' : 'Create New Branch'}
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
          {/* Branch Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Branch Name *
            </label>
            <input
              type="text"
              value={formData.module_name}
              onChange={(e) => handleNameChange(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.module_name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Manufacturing, Quality Control"
            />
            {errors.module_name && (
              <p className="mt-1 text-sm text-red-600">{errors.module_name}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Display name for the branch
            </p>
          </div>

          {/* Branch Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Branch Code *
            </label>
            <input
              type="text"
              value={formData.module_code}
              onChange={(e) => handleChange('module_code', e.target.value)}
              disabled={!!module} // Can't change code when editing
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono ${
                errors.module_code ? 'border-red-500' : 'border-gray-300'
              } ${module ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder="e.g., manufacturing, quality_control"
            />
            {errors.module_code && (
              <p className="mt-1 text-sm text-red-600">{errors.module_code}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {module ? 'Branch code cannot be changed' : 'Auto-generated from branch name'}
            </p>
          </div>

          {/* Branch Type - Main Branch or Nested Branch */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Branch Type *
            </label>
            <select
              value={formData.parent_id}
              onChange={(e) => handleChange('parent_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Main Branch (Top Level)</option>
              {availableModules.map((mod) => (
                <option key={mod.id} value={mod.id}>
                  Nested under: {mod.module_label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Choose "Main Branch" for a top-level branch, or select a parent to nest this branch
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
              placeholder="Brief description of what this module does..."
            />
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
            <p className="text-xs text-gray-500 ml-7 mt-1">
              Inactive branches are hidden from all users
            </p>
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving...' : module ? 'Update Branch' : 'Create Branch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
