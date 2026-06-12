'use client';

import React, { useState, useEffect } from 'react';
import { FiFolder, FiChevronDown, FiChevronRight, FiPlus, FiEdit, FiTrash2, FiEye, FiEyeOff } from 'react-icons/fi';
import { moduleBuilderAPI, customFieldsAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import CustomFieldForm from './CustomFieldForm';

interface SystemModule {
  id: string;
  module_code: string;
  module_name: string;
  module_label: string;
  description?: string;
  icon?: string;
  color?: string;
  is_system_module: boolean;
  is_active: boolean;
  components: SystemComponent[];
}

interface SystemComponent {
  id: string;
  component_code: string;
  component_name: string;
  component_label: string;
  description?: string;
  is_active: boolean;
  display_order: number;
}

interface CustomField {
  id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  entity_type: string;
  is_required: boolean;
  is_visible: boolean;
  display_order: number;
}

export default function SystemModulesTab() {
  const { user } = useAuth();
  const [modules, setModules] = useState<SystemModule[]>([]);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [selectedComponent, setSelectedComponent] = useState<SystemComponent | null>(null);
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFieldForm, setShowFieldForm] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);

  useEffect(() => {
    loadSystemModules();
  }, []);

  const loadSystemModules = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading system modules...');
      const response = await moduleBuilderAPI.getModulesWithComponents({
        include_system: true,
      });

      console.log('📦 API Response:', response);
      console.log('📦 Response.data type:', typeof response.data, Array.isArray(response.data) ? 'Array' : 'Object');
      console.log('📦 Response.data:', response.data);

      // API returns { data: [...] } where data is array of modules
      const allModules = Array.isArray(response.data) ? response.data : (response.data.modules || []);
      console.log('📋 All modules count:', allModules.length);

      // Filter only system modules
      const systemModules = allModules.filter(
        (module: SystemModule) => module.is_system_module
      );

      console.log('✅ System modules count:', systemModules.length);
      console.log('✅ System modules:', systemModules.map((m: SystemModule) => m.module_name));

      setModules(systemModules);
    } catch (error) {
      console.error('❌ Error loading system modules:', error);
    } finally {
      setLoading(false);
    }
  };

  // Enable/disable a module. Optimistic; tells the sidebar to refresh so a
  // disabled module disappears from the menu immediately.
  const setModuleActive = async (m: SystemModule, active: boolean) => {
    setModules((prev) => prev.map((x) => (x.id === m.id ? { ...x, is_active: active } : x)));
    try {
      await moduleBuilderAPI.updateModule(m.id, { is_active: active });
      window.dispatchEvent(new Event('modules-changed'));
    } catch (error) {
      console.error('Failed to toggle module', error);
      setModules((prev) => prev.map((x) => (x.id === m.id ? { ...x, is_active: !active } : x)));
      alert('Failed to update module');
    }
  };

  const loadFieldsForComponent = async (componentCode: string) => {
    try {
      console.log('Loading fields for:', componentCode);
      const response = await customFieldsAPI.listDefinitions({
        entity_type: componentCode,
      });

      // API may return array directly or in data property
      const fieldsData = Array.isArray(response.data)
        ? response.data
        : (response.data.data || []);

      console.log('Loaded fields:', fieldsData.map((f: any) => ({ name: f.field_name, label: f.field_label })));
      setFields(fieldsData);
      console.log('State updated with', fieldsData.length, 'fields');
    } catch (error) {
      console.error('Error loading fields:', error);
      setFields([]);
    }
  };

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
      // Also clear selected component if this module is being collapsed
      if (selectedComponent) {
        const module = modules.find(m => m.id === moduleId);
        if (module?.components.some(c => c.id === selectedComponent.id)) {
          setSelectedComponent(null);
          setFields([]);
        }
      }
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const handleComponentClick = async (component: SystemComponent) => {
    setSelectedComponent(component);
    await loadFieldsForComponent(component.component_code);
  };

  const handleDeleteField = async (fieldId: string) => {
    if (!confirm('Are you sure you want to delete this field?')) return;

    try {
      await customFieldsAPI.deleteDefinition(fieldId);
      if (selectedComponent) {
        await loadFieldsForComponent(selectedComponent.component_code);
      }
    } catch (error) {
      console.error('Error deleting field:', error);
      alert('Failed to delete field');
    }
  };

  const handleToggleFieldVisibility = async (field: CustomField) => {
    try {
      await customFieldsAPI.updateDefinition(field.id, {
        ...field,
        is_visible: !field.is_visible,
        last_modified_by: user?.id,
      });

      if (selectedComponent) {
        await loadFieldsForComponent(selectedComponent.component_code);
      }
    } catch (error) {
      console.error('Error toggling field visibility:', error);
      alert('Failed to update field');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-xl font-bold text-blue-900 mb-2">System Modules</h2>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Panel - Module & Component List */}
        <div className="col-span-4 space-y-2">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              System Modules ({modules.length})
            </h3>

            {modules.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No system modules found</p>
            ) : (
              <div className="space-y-2">
                {modules.map((module) => (
                  <div key={module.id} className={`border border-gray-200 rounded-lg overflow-hidden ${module.is_active === false ? 'opacity-60' : ''}`}>
                    {/* Module Header */}
                    <div className="w-full flex items-center justify-between p-3 bg-gray-50">
                      <button onClick={() => toggleModule(module.id)} className="flex items-center gap-3 min-w-0 text-left">
                        <div className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-gray-200 text-gray-600 shrink-0">
                          {module.module_code.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 truncate">{module.module_label}</div>
                          <div className="text-xs text-gray-500">{module.module_code}</div>
                        </div>
                      </button>
                      <div className="flex items-center gap-2 shrink-0">
                        <Switch on={module.is_active !== false} onChange={(v) => setModuleActive(module, v)} />
                        <button onClick={() => toggleModule(module.id)} className="p-1 text-gray-400" title={expandedModules.has(module.id) ? 'Collapse' : 'Expand'}>
                          {expandedModules.has(module.id) ? <FiChevronDown className="w-5 h-5" /> : <FiChevronRight className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Components List */}
                    {expandedModules.has(module.id) && module.components && module.components.length > 0 && (
                      <div className="bg-white divide-y divide-gray-100">
                        {module.components
                          .sort((a, b) => a.display_order - b.display_order)
                          .map((component) => (
                            <button
                              key={component.id}
                              onClick={() => handleComponentClick(component)}
                              className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors ${
                                selectedComponent?.id === component.id
                                  ? 'bg-blue-50 border-l-4 border-blue-600'
                                  : ''
                              }`}
                            >
                              <div className="font-medium text-gray-900">{component.component_label}</div>
                              <div className="text-xs text-gray-500">{component.component_code}</div>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Component Fields */}
        <div className="col-span-8">
          {!selectedComponent ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <FiFolder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Component Selected</h3>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200">
              {/* Component Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedComponent.component_label}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Entity Type: <span className="font-mono font-semibold">{selectedComponent.component_code}</span>
                    </p>
                    {selectedComponent.description && (
                      <p className="text-sm text-gray-600 mt-2">{selectedComponent.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setEditingFieldId(null);
                      setShowFieldForm(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FiPlus className="w-4 h-4" />
                    Add Field
                  </button>
                </div>
              </div>

              {/* Fields List */}
              <div className="p-6">
                {showFieldForm && !editingFieldId ? (
                  <div className="mb-6 border border-gray-300 rounded-lg p-6 bg-gray-50">
                    <h4 className="text-lg font-bold text-gray-900 mb-4">
                      Create New Field
                    </h4>
                    <CustomFieldForm
                      field={null}
                      entityType={selectedComponent.component_code}
                      onSave={async (fieldData) => {
                        try {
                          await customFieldsAPI.createDefinition(fieldData);
                          setShowFieldForm(false);
                          await loadFieldsForComponent(selectedComponent.component_code);
                        } catch (error) {
                          throw error;
                        }
                      }}
                      onCancel={() => {
                        setShowFieldForm(false);
                      }}
                    />
                  </div>
                ) : null}

                {fields.length === 0 && !showFieldForm ? (
                  <div className="text-center py-12">
                    <FiPlus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">No Custom Fields</h4>
                    <p className="text-gray-600 mb-6">
                      This component doesn't have any custom fields yet. Add fields to extend its functionality.
                    </p>
                    <button
                      onClick={() => {
                        setEditingFieldId(null);
                        setShowFieldForm(true);
                      }}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <FiPlus className="w-5 h-5" />
                      Add First Field
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                      Custom Fields ({fields.length})
                    </h4>
                    {fields
                      .sort((a, b) => a.display_order - b.display_order)
                      .map((field) => (
                        <div key={field.id} className="border border-gray-200 rounded-lg overflow-hidden">
                          {/* Field Row */}
                          <div className="flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <div className="font-semibold text-gray-900">{field.field_label}</div>
                                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                                  {field.field_type}
                                </span>
                                {field.is_required && (
                                  <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 font-medium">
                                    Required
                                  </span>
                                )}
                                {!field.is_visible && (
                                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
                                    Hidden
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                Field Name: <span className="font-mono">{field.field_name}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleToggleFieldVisibility(field)}
                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title={field.is_visible ? 'Hide field' : 'Show field'}
                              >
                                {field.is_visible ? (
                                  <FiEye className="w-4 h-4" />
                                ) : (
                                  <FiEyeOff className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingFieldId(editingFieldId === field.id ? null : field.id);
                                  setShowFieldForm(false);
                                }}
                                className={`p-2 rounded transition-colors ${
                                  editingFieldId === field.id
                                    ? 'text-blue-600 bg-blue-50'
                                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                                }`}
                                title="Edit field"
                              >
                                <FiEdit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteField(field.id)}
                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete field"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Inline Edit Form */}
                          {editingFieldId === field.id && (
                            <div className="p-6 bg-gray-50 border-t border-gray-200">
                              <CustomFieldForm
                                field={field}
                                entityType={selectedComponent.component_code}
                                inline={true}
                                onSave={async (fieldData) => {
                                  try {
                                    console.log('Saving field:', field.field_name, 'with new label:', fieldData.field_label);
                                    await customFieldsAPI.updateDefinition(field.id, fieldData);
                                    console.log('✅ Saved! Old label was:', field.field_label, 'New label:', fieldData.field_label);
                                    setEditingFieldId(null);
                                    await loadFieldsForComponent(selectedComponent.component_code);
                                  } catch (error) {
                                    console.error('Error saving field:', error);
                                    throw error;
                                  }
                                }}
                                onCancel={() => {
                                  setEditingFieldId(null);
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Switch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); onChange(!on); }}
      title={on ? 'Enabled — click to disable (hides it from the menu)' : 'Disabled — click to enable'}
      className="relative inline-flex items-center rounded-full transition-colors focus:outline-none shrink-0"
      style={{ width: 40, height: 22, background: on ? '#01411C' : '#cbd5e1' }}
      aria-pressed={on}>
      <span className="inline-block rounded-full bg-white shadow transition-transform"
        style={{ width: 18, height: 18, transform: on ? 'translateX(20px)' : 'translateX(2px)' }} />
    </button>
  );
}
