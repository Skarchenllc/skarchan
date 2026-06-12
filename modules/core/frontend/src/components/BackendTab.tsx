'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Plus, Edit, Trash2, Package, FileText, Database } from 'lucide-react';
import { moduleBuilderAPI, customFieldsAPI } from '@/lib/api';
import ModuleForm from './ModuleForm';
import ComponentForm from './ComponentForm';
import CustomFieldForm from './CustomFieldForm';
import { useAuth } from '@/contexts/AuthContext';

interface Module {
  id: string;
  module_code: string;
  module_name: string;
  module_label: string;
  description?: string;
  depth: number;
  parent_id?: string;
  is_active: boolean;
  display_order: number;
  children?: Module[];
  components?: Component[];
}

interface Component {
  id: string;
  component_code: string;
  component_name: string;
  component_label: string;
  description?: string;
  module_id: string;
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

export default function BackendTab() {
  const { user } = useAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(false);

  // Expansion state
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedComponents, setExpandedComponents] = useState<Set<string>>(new Set());

  // Selection state
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);

  // Modal state
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [showComponentForm, setShowComponentForm] = useState(false);
  const [showFieldForm, setShowFieldForm] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingComponent, setEditingComponent] = useState<Component | null>(null);
  const [editingField, setEditingField] = useState<CustomField | null>(null);

  useEffect(() => {
    loadModulesWithComponents();
  }, []);

  const loadModulesWithComponents = async () => {
    try {
      setLoading(true);
      const orgId = (user as any)?.org_id || (user as any)?.organization_id;
      const response = await moduleBuilderAPI.getModulesWithComponents({
        organization_id: orgId,
        include_system: true,
      });
      setModules(response.data.modules || []);
    } catch (error) {
      console.error('Error loading modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFieldsForComponent = async (componentCode: string) => {
    try {
      const response = await customFieldsAPI.listDefinitions({
        entity_type: componentCode,
      });
      // API returns array directly in response.data
      const fieldsData = Array.isArray(response.data) ? response.data : (response.data.data || []);
      setFields(fieldsData);
    } catch (error) {
      console.error('Error loading fields:', error);
      setFields([]);
    }
  };

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const toggleComponent = async (componentId: string, componentCode: string) => {
    const newExpanded = new Set(expandedComponents);
    if (newExpanded.has(componentId)) {
      newExpanded.delete(componentId);
      setFields([]);
    } else {
      newExpanded.add(componentId);
      await loadFieldsForComponent(componentCode);
    }
    setExpandedComponents(newExpanded);
  };

  const handleDeleteModule = async (module: Module) => {
    if (!confirm(`Are you sure you want to delete the branch "${module.module_name}"? All sub branches and fields will also be deleted.`)) {
      return;
    }
    try {
      await moduleBuilderAPI.deleteModule(module.id);
      await loadModulesWithComponents();
    } catch (error) {
      console.error('Error deleting branch:', error);
      alert('Failed to delete branch');
    }
  };

  const handleDeleteComponent = async (component: Component) => {
    if (!confirm(`Are you sure you want to delete the sub branch "${component.component_name}"? All fields will also be deleted.`)) {
      return;
    }
    try {
      await moduleBuilderAPI.deleteComponent(component.id);
      await loadModulesWithComponents();
    } catch (error) {
      console.error('Error deleting sub branch:', error);
      alert('Failed to delete sub branch');
    }
  };

  const handleDeleteField = async (field: CustomField) => {
    if (!confirm(`Are you sure you want to delete the field "${field.field_name}"?`)) {
      return;
    }
    try {
      await customFieldsAPI.deleteDefinition(field.id);
      if (selectedComponent) {
        await loadFieldsForComponent(selectedComponent.component_code);
      }
    } catch (error) {
      console.error('Error deleting field:', error);
      alert('Failed to delete field');
    }
  };

  const renderFields = (component: Component) => {
    const componentFields = fields.filter(f => f.entity_type === component.component_code);

    if (!expandedComponents.has(component.id)) return null;

    return (
      <div className="ml-12 mt-2 border-l-2 border-gray-200 pl-4 space-y-2">
        {componentFields.length === 0 ? (
          <div className="text-sm text-gray-500 italic py-2">
            No custom fields yet. Click "Add Field" to create one.
          </div>
        ) : (
          componentFields.map((field) => (
            <div
              key={field.id}
              className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Database className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="font-medium text-gray-900">
                    {field.field_label}
                    {field.is_required && <span className="text-red-500 ml-1">*</span>}
                  </div>
                  <div className="text-xs text-gray-600">
                    Type: {field.field_type} • Order: {field.display_order}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {
                    setEditingField(field);
                    setSelectedComponent(component);
                    setShowFieldForm(true);
                  }}
                  className="p-1 hover:bg-blue-200 rounded"
                  title="Edit field"
                >
                  <Edit className="w-4 h-4 text-blue-600" />
                </button>
                <button
                  onClick={() => handleDeleteField(field)}
                  className="p-1 hover:bg-red-200 rounded"
                  title="Delete field"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
          ))
        )}
        <button
          onClick={() => {
            setEditingField(null);
            setSelectedComponent(component);
            setShowFieldForm(true);
          }}
          className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-300 hover:border-blue-400 transition-colors w-full"
        >
          <Plus className="w-4 h-4" />
          Add Field to {component.component_name}
        </button>
      </div>
    );
  };

  const renderComponents = (module: Module) => {
    if (!expandedModules.has(module.id)) return null;

    const moduleComponents = module.components || [];

    return (
      <div className="ml-8 mt-2 border-l-2 border-gray-200 pl-4 space-y-2">
        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={() => {
              setEditingComponent(null);
              setSelectedModule(module);
              setShowComponentForm(true);
            }}
            className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg border border-green-300 hover:border-green-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Sub Branch
          </button>
          <button
            onClick={() => {
              setEditingField(null);
              // Create a pseudo-component with the module's code to add fields to the module itself
              setSelectedComponent({
                id: module.id,
                component_code: module.module_code,
                component_name: module.module_name,
                component_label: module.module_label,
                module_id: module.id,
                is_active: true,
                display_order: 0,
              });
              setShowFieldForm(true);
            }}
            className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-300 hover:border-blue-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Field
          </button>
        </div>

        {/* Components List */}
        {moduleComponents.length === 0 ? (
          <div className="text-sm text-gray-500 italic py-2">
            No sub branches yet. Use the buttons above to add sub branches or fields.
          </div>
        ) : (
          moduleComponents.map((component) => (
            <div key={component.id}>
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors group">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleComponent(component.id, component.component_code)}
                    className="p-1 hover:bg-green-200 rounded"
                  >
                    {expandedComponents.has(component.id) ? (
                      <ChevronDown className="w-5 h-5 text-green-600" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-green-600" />
                    )}
                  </button>
                  <FileText className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium text-gray-900">{component.component_label}</div>
                    <div className="text-xs text-gray-600">
                      Code: {component.component_code} • Order: {component.display_order}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingComponent(component);
                      setSelectedModule(module);
                      setShowComponentForm(true);
                    }}
                    className="p-1 hover:bg-green-200 rounded"
                    title="Edit sub branch"
                  >
                    <Edit className="w-4 h-4 text-green-600" />
                  </button>
                  <button
                    onClick={() => handleDeleteComponent(component)}
                    className="p-1 hover:bg-red-200 rounded"
                    title="Delete sub branch"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
              {renderFields(component)}
            </div>
          ))
        )}
      </div>
    );
  };

  const renderModule = (module: Module) => {
    return (
      <div key={module.id} className="space-y-2">
        <div className="flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors group">
          <div className="flex items-center gap-3">
            <button
              onClick={() => toggleModule(module.id)}
              className="p-1 hover:bg-purple-200 rounded"
            >
              {expandedModules.has(module.id) ? (
                <ChevronDown className="w-5 h-5 text-purple-600" />
              ) : (
                <ChevronRight className="w-5 h-5 text-purple-600" />
              )}
            </button>
            <Package className="w-6 h-6 text-purple-600" />
            <div>
              <div className="font-semibold text-gray-900">
                {module.module_label}
                {module.depth > 0 && (
                  <span className="ml-2 text-xs px-2 py-1 bg-purple-200 text-purple-700 rounded">
                    Sub-Module (Depth {module.depth})
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-600">
                Code: {module.module_code} • Components: {module.components?.length || 0}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => {
                setEditingModule(module);
                setShowModuleForm(true);
              }}
              className="p-1 hover:bg-purple-200 rounded"
              title="Edit branch"
            >
              <Edit className="w-5 h-5 text-purple-600" />
            </button>
            <button
              onClick={() => handleDeleteModule(module)}
              className="p-1 hover:bg-red-200 rounded"
              title="Delete branch"
            >
              <Trash2 className="w-5 h-5 text-red-600" />
            </button>
          </div>
        </div>
        {renderComponents(module)}
        {module.children && module.children.length > 0 && (
          <div className="ml-8 space-y-2">
            {module.children.map((child) => renderModule(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Backend Development</h2>
        </div>
        <button
          onClick={() => {
            setEditingModule(null);
            setShowModuleForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Branch
        </button>
      </div>

      {/* Legend */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Structure Legend</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-600" />
            <span><strong>Branches</strong> - Main organizational units</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-600" />
            <span><strong>Sub Branches</strong> - Entities within branches</span>
          </div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            <span><strong>Fields</strong> - Data properties for branches/sub branches</span>
          </div>
        </div>
      </div>

      {/* Branch Tree */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading branches...</div>
      ) : modules.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Branches Yet</h3>
          <button
            onClick={() => {
              setEditingModule(null);
              setShowModuleForm(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create First Branch
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {modules.map((module) => renderModule(module))}
        </div>
      )}

      {/* Modals */}
      {showModuleForm && (
        <ModuleForm
          module={editingModule}
          onSave={async () => {
            setShowModuleForm(false);
            setEditingModule(null);
            await loadModulesWithComponents();
          }}
          onCancel={() => {
            setShowModuleForm(false);
            setEditingModule(null);
          }}
        />
      )}

      {showComponentForm && selectedModule && (
        <ComponentForm
          component={editingComponent}
          moduleId={selectedModule.id}
          onSave={async () => {
            setShowComponentForm(false);
            setEditingComponent(null);
            setSelectedModule(null);
            await loadModulesWithComponents();
          }}
          onCancel={() => {
            setShowComponentForm(false);
            setEditingComponent(null);
            setSelectedModule(null);
          }}
        />
      )}

      {showFieldForm && selectedComponent && (
        <CustomFieldForm
          field={editingField}
          entityType={selectedComponent.component_code}
          onSave={async (fieldData) => {
            try {
              if (editingField) {
                // Update existing field
                await customFieldsAPI.updateDefinition(editingField.id, fieldData);
              } else {
                // Create new field
                await customFieldsAPI.createDefinition(fieldData);
              }
              setShowFieldForm(false);
              setEditingField(null);
              if (selectedComponent) {
                await loadFieldsForComponent(selectedComponent.component_code);
              }
            } catch (error) {
              // Let the error propagate to CustomFieldForm for display
              throw error;
            }
          }}
          onCancel={() => {
            setShowFieldForm(false);
            setEditingField(null);
          }}
        />
      )}
    </div>
  );
}
