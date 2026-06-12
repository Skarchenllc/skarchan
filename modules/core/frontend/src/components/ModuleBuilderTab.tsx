'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Layers, Box, ChevronDown, ChevronRight } from 'lucide-react';
import { moduleBuilderAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import ModuleForm from './ModuleForm';
import ComponentForm from './ComponentForm';

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
  components: Component[];
}

interface Component {
  id: string;
  component_code: string;
  component_name: string;
  component_label: string;
  description?: string;
  icon?: string;
  display_order: number;
}

export default function ModuleBuilderTab() {
  const { user } = useAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [showComponentForm, setShowComponentForm] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingComponent, setEditingComponent] = useState<Component | null>(null);
  const [selectedModuleForComponent, setSelectedModuleForComponent] = useState<string | null>(null);

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      setLoading(true);
      const response = await moduleBuilderAPI.getModulesWithComponents({
        include_system: true
      });
      setModules(response.data.modules);
    } catch (error) {
      console.error('Error fetching modules:', error);
    } finally {
      setLoading(false);
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

  const handleDeleteModule = async (moduleId: string, moduleName: string) => {
    if (!confirm(`Are you sure you want to delete branch "${moduleName}"? This will also delete all its sub branches and custom fields.`)) {
      return;
    }

    try {
      await moduleBuilderAPI.deleteModule(moduleId);
      await fetchModules();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to delete branch');
    }
  };

  const handleDeleteComponent = async (componentId: string, componentName: string) => {
    if (!confirm(`Are you sure you want to delete sub branch "${componentName}"?`)) {
      return;
    }

    try {
      await moduleBuilderAPI.deleteComponent(componentId);
      await fetchModules();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to delete sub branch');
    }
  };

  const openComponentForm = (moduleId: string) => {
    console.log('Opening component form for module:', moduleId);
    setSelectedModuleForComponent(moduleId);
    setEditingComponent(null);
    setShowComponentForm(true);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Branch Builder</h2>
          </div>
          <button
            onClick={() => {
              setEditingModule(null);
              setShowModuleForm(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Branch
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Total Branches</span>
            </div>
            <div className="text-2xl font-bold text-blue-900 mt-2">{modules.length}</div>
            <div className="text-xs text-blue-700 mt-1">
              {modules.filter(m => !m.is_system_module).length} custom
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Box className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">Total Sub Branches</span>
            </div>
            <div className="text-2xl font-bold text-green-900 mt-2">
              {modules.reduce((sum, m) => sum + m.components.length, 0)}
            </div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">System Branches</span>
            </div>
            <div className="text-2xl font-bold text-purple-900 mt-2">
              {modules.filter(m => m.is_system_module).length}
            </div>
          </div>
        </div>
      </div>

      {/* Branches List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading branches...</p>
        </div>
      ) : modules.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Layers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No branches yet</h3>
          <button
            onClick={() => setShowModuleForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Branch
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {modules.map((module) => (
            <div key={module.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Module Header */}
              <div className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center gap-3 flex-1">
                  <button
                    onClick={() => toggleModule(module.id)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {expandedModules.has(module.id) ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </button>

                  {module.icon && (
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: module.color || '#3B82F6' }}
                    >
                      {module.icon.substring(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{module.module_label}</h3>
                      {module.is_system_module && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-800">
                          System
                        </span>
                      )}
                      {!module.is_active && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-gray-600 font-mono">{module.module_code}</span>
                      <span className="text-sm text-gray-500">{module.components.length} sub branches</span>
                    </div>
                    {module.description && (
                      <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!module.is_system_module && (
                    <>
                      <button
                        onClick={() => {
                          setEditingModule(module);
                          setShowModuleForm(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit branch"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteModule(module.id, module.module_name)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete branch"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => openComponentForm(module.id)}
                    className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-1"
                    title="Add sub branch"
                  >
                    <Plus className="w-4 h-4" />
                    Add Sub Branch
                  </button>
                </div>
              </div>

              {/* Sub Branches List */}
              {expandedModules.has(module.id) && (
                <div className="border-t border-gray-200 bg-gray-50 p-4">
                  {module.components.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Box className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No sub branches yet. Add your first sub branch to get started.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {module.components.map((component) => (
                        <div
                          key={component.id}
                          className="bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{component.component_label}</h4>
                              <p className="text-xs text-gray-600 font-mono mt-1">{component.component_code}</p>
                              {component.description && (
                                <p className="text-xs text-gray-500 mt-2">{component.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingComponent(component);
                                  setSelectedModuleForComponent(module.id);
                                  setShowComponentForm(true);
                                }}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Edit sub branch"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteComponent(component.id, component.component_name)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete sub branch"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Module Form Modal */}
      {showModuleForm && (
        <ModuleForm
          module={editingModule}
          onSave={() => {
            setShowModuleForm(false);
            setEditingModule(null);
            fetchModules();
          }}
          onCancel={() => {
            setShowModuleForm(false);
            setEditingModule(null);
          }}
        />
      )}

      {/* Component Form Modal */}
      {showComponentForm && (
        <ComponentForm
          component={editingComponent}
          moduleId={selectedModuleForComponent || ''}
          onSave={() => {
            setShowComponentForm(false);
            setEditingComponent(null);
            setSelectedModuleForComponent(null);
            fetchModules();
          }}
          onCancel={() => {
            setShowComponentForm(false);
            setEditingComponent(null);
            setSelectedModuleForComponent(null);
          }}
        />
      )}
    </div>
  );
}
