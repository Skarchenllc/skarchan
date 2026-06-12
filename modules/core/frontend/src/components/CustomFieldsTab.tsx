'use client';

import { Plus, Edit2, Trash2, Eye, EyeOff, Settings as SettingsIcon, Shield } from 'lucide-react';
import CustomFieldForm from './CustomFieldForm';
import FieldPermissionsManager from './FieldPermissionsManager';
import { MODULE_ENTITIES, getAllEntities, getModuleByEntityValue, MODULE_COLORS, ENTITY_BADGE_COLORS } from '@/config/moduleEntities';
import { useState } from 'react';

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'number', label: 'Number' },
  { value: 'currency', label: 'Currency' },
  { value: 'percentage', label: 'Percentage' },
  { value: 'date', label: 'Date' },
  { value: 'datetime', label: 'Date & Time' },
  { value: 'boolean', label: 'Checkbox' },
  { value: 'picklist', label: 'Dropdown (Single)' },
  { value: 'multi_picklist', label: 'Dropdown (Multi)' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'url', label: 'URL' },
];

interface CustomFieldsTabProps {
  fields: any[];
  loading: boolean;
  selectedEntityType: string;
  setSelectedEntityType: (value: string) => void;
  showCreateModal: boolean;
  setShowCreateModal: (value: boolean) => void;
  editingField: any;
  setEditingField: (value: any) => void;
  showPermissionsModal: boolean;
  setShowPermissionsModal: (value: boolean) => void;
  handleDelete: (id: string) => void;
  handleToggleVisibility: (field: any) => void;
  handleSaveField: (data: any) => Promise<void>;
}

export default function CustomFieldsTab({
  fields,
  loading,
  selectedEntityType,
  setSelectedEntityType,
  showCreateModal,
  setShowCreateModal,
  editingField,
  setEditingField,
  showPermissionsModal,
  setShowPermissionsModal,
  handleDelete,
  handleToggleVisibility,
  handleSaveField,
}: CustomFieldsTabProps) {
  const [selectedModule, setSelectedModule] = useState<string>('');

  const allEntities = getAllEntities();

  // Filter entities by selected module
  const filteredEntities = selectedModule
    ? allEntities.filter(e => e.module === selectedModule)
    : allEntities;

  const groupedFields = fields.reduce((acc, field) => {
    if (!acc[field.entity_type]) {
      acc[field.entity_type] = [];
    }
    acc[field.entity_type].push(field);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Custom Fields</h2>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowPermissionsModal(true)}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Shield className="w-5 h-5 mr-2" />
              Manage Permissions
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Custom Field
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Filter by Module:</label>
            <select
              value={selectedModule}
              onChange={(e) => {
                setSelectedModule(e.target.value);
                setSelectedEntityType(''); // Reset entity filter when module changes
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Modules</option>
              {MODULE_ENTITIES.map((module) => (
                <option key={module.id} value={module.id}>
                  {module.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Filter by Entity:</label>
            <select
              value={selectedEntityType}
              onChange={(e) => setSelectedEntityType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Entities</option>
              {filteredEntities.map((entity) => (
                <option key={entity.value} value={entity.value}>
                  {entity.label} ({entity.module.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
          <div className="text-sm text-gray-600">
            Total: {fields.length} field{fields.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Custom Fields List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading custom fields...</p>
        </div>
      ) : fields.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <SettingsIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No custom fields yet</h3>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Custom Field
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedFields).map(([entityType, entityFields]) => {
            const entity = allEntities.find(e => e.value === entityType);
            const module = entity ? getModuleByEntityValue(entityType) : null;
            const moduleColors = module ? MODULE_COLORS[module.id] : MODULE_COLORS['administration'];

            return (
            <div key={entityType} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {entity?.label || entityType}
                  </h3>
                  {module && (
                    <span className={`px-2 py-1 text-xs font-medium rounded ${moduleColors.bg} ${moduleColors.text}`}>
                      {module.name}
                    </span>
                  )}
                  <span className="text-sm font-normal text-gray-600">
                    ({entityFields.length} field{entityFields.length !== 1 ? 's' : ''})
                  </span>
                </div>
                {entity?.description && (
                  <span className="text-xs text-gray-500 italic">{entity.description}</span>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Field Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Group
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Properties
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {entityFields
                      .sort((a, b) => a.display_order - b.display_order)
                      .map((field) => (
                        <tr key={field.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {field.field_label}
                              </div>
                              <div className="text-sm text-gray-500 font-mono">
                                {field.field_name}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              {FIELD_TYPES.find(t => t.value === field.field_type)?.label || field.field_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {field.field_group || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {field.is_required && (
                                <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800">
                                  Required
                                </span>
                              )}
                              {field.is_unique && (
                                <span className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-800">
                                  Unique
                                </span>
                              )}
                              {field.is_searchable && (
                                <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
                                  Searchable
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {field.display_order}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleToggleVisibility(field)}
                                className="text-gray-600 hover:text-gray-900 p-1"
                                title={field.is_visible ? 'Hide field' : 'Show field'}
                              >
                                {field.is_visible ? (
                                  <Eye className="w-4 h-4" />
                                ) : (
                                  <EyeOff className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => setEditingField(field)}
                                className="text-blue-600 hover:text-blue-900 p-1"
                                title="Edit field"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(field.id)}
                                className="text-red-600 hover:text-red-900 p-1"
                                title="Delete field"
                              >
                                <Trash2 className="w-4 h-4" />
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
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingField) && (
        <CustomFieldForm
          field={editingField}
          onSave={handleSaveField}
          onCancel={() => {
            setShowCreateModal(false);
            setEditingField(null);
          }}
        />
      )}

      {/* Field Permissions Manager */}
      {showPermissionsModal && (
        <FieldPermissionsManager
          onClose={() => setShowPermissionsModal(false)}
        />
      )}
    </div>
  );
}
