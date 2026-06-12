'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Folder, FileText, Hash, Plus, Pencil, Trash2, Wand2 } from 'lucide-react';
import { customFieldsAPI, moduleBuilderAPI } from '@/lib/api';
import axios from 'axios';
import CustomFieldForm from './CustomFieldForm';

const fieldsApi = {
  list: (entity_type: string) =>
    customFieldsAPI.listDefinitions({ entity_type, limit: 1000 } as any),
  create: (data: any) => customFieldsAPI.createDefinition(data),
  update: (id: string, data: any) => customFieldsAPI.updateDefinition(id, data),
  remove: (id: string) => customFieldsAPI.deleteDefinition(id),
  autoGenerate: (entity_type?: string) =>
    axios.post('/api/v1/development/custom-fields/auto-generate', null, {
      params: entity_type ? { entity_type } : {},
    }),
};

interface FieldDef {
  id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  is_required: boolean;
  is_visible: boolean;
}

interface EntityType {
  id: string;
  component_code: string;
  component_label: string;
  component_name: string;
  is_active: boolean;
  display_order: number;
}

interface ModuleNode {
  id: string;
  module_code: string;
  module_name: string;
  module_label: string;
  color?: string;
  is_active: boolean;
  is_system_module: boolean;
  show_in_navigation?: boolean;
  components: EntityType[];
}

/**
 * Drupal-style "Manage fields" tree, sourced from the DB:
 *   Module  →  Entity type  →  Fields
 */
export default function ModuleEntityFields() {
  const [modules, setModules] = useState<ModuleNode[]>([]);
  const [loadingModules, setLoadingModules] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedEntities, setExpandedEntities] = useState<Set<string>>(new Set());
  const [fieldsByEntity, setFieldsByEntity] = useState<Record<string, FieldDef[]>>({});
  const [loadingEntities, setLoadingEntities] = useState<Set<string>>(new Set());
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [addingForEntity, setAddingForEntity] = useState<string | null>(null);
  const [autoGenerating, setAutoGenerating] = useState<string | null>(null);
  const [togglingModuleId, setTogglingModuleId] = useState<string | null>(null);

  const toggleModuleActive = async (mod: ModuleNode) => {
    try {
      setTogglingModuleId(mod.id);
      await moduleBuilderAPI.updateModule(mod.id, { is_active: !mod.is_active });
      // optimistic update without re-fetching everything
      setModules(prev => prev.map(m => m.id === mod.id ? { ...m, is_active: !m.is_active } : m));
    } catch (err: any) {
      console.error('Failed to toggle module:', err);
      alert(`Couldn't toggle module: ${err?.response?.data?.detail || err.message}`);
    } finally {
      setTogglingModuleId(null);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await moduleBuilderAPI.getModulesWithEntityTypes();
        const data = Array.isArray((res.data as any)?.data) ? (res.data as any).data : (res.data as any);
        setModules(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load modules:', err);
        setModules([]);
      } finally {
        setLoadingModules(false);
      }
    })();
  }, []);

  const toggleModule = (id: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const loadFields = async (entityCode: string) => {
    setLoadingEntities(prev => new Set(prev).add(entityCode));
    try {
      const res = await fieldsApi.list(entityCode);
      const data = Array.isArray(res.data) ? res.data : ((res.data as any).data || []);
      setFieldsByEntity(prev => ({ ...prev, [entityCode]: data }));
    } catch {
      setFieldsByEntity(prev => ({ ...prev, [entityCode]: [] }));
    } finally {
      setLoadingEntities(prev => {
        const next = new Set(prev);
        next.delete(entityCode);
        return next;
      });
    }
  };

  const toggleEntity = async (entityCode: string) => {
    const isExpanded = expandedEntities.has(entityCode);

    setExpandedEntities(prev => {
      const next = new Set(prev);
      isExpanded ? next.delete(entityCode) : next.add(entityCode);
      return next;
    });

    if (!isExpanded && !fieldsByEntity[entityCode]) {
      await loadFields(entityCode);
    }
  };

  const handleAutoGenerate = async (entityCode?: string) => {
    const target = entityCode || 'ALL';
    if (!confirm(`Auto-generate fields by introspecting the database schema for ${entityCode ? `"${entityCode}"` : 'every entity type'}? Existing fields are kept.`)) return;
    try {
      setAutoGenerating(target);
      const res = await fieldsApi.autoGenerate(entityCode);
      const r: any = res.data;
      const created = r.fields_created ?? 0;
      const skipped = r.fields_already_present ?? 0;
      const noTable = (r.no_table || []).length;
      alert(`Done.\n\nNew fields created: ${created}\nAlready present:   ${skipped}\nEntities without a table: ${noTable}`);
      // Refresh fields for the entity (or all expanded ones)
      if (entityCode) {
        await loadFields(entityCode);
      } else {
        for (const ec of Array.from(expandedEntities)) {
          await loadFields(ec);
        }
      }
    } catch (err: any) {
      console.error('Auto-generate failed:', err);
      alert(`Auto-generate failed: ${err?.response?.data?.detail || err.message}`);
    } finally {
      setAutoGenerating(null);
    }
  };

  const handleDelete = async (entityCode: string, fieldId: string, fieldLabel: string) => {
    if (!confirm(`Delete field "${fieldLabel}"? This cannot be undone.`)) return;
    try {
      await fieldsApi.remove(fieldId);
      await loadFields(entityCode);
    } catch (error) {
      console.error('Error deleting field:', error);
      alert('Failed to delete field.');
    }
  };

  if (loadingModules) {
    return (
      <div className="border border-gray-200 rounded-lg bg-white p-6 text-sm text-gray-500">
        Loading modules…
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="border border-yellow-200 rounded-lg bg-yellow-50 p-6 text-sm text-yellow-800">
        No modules found in the database.
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button
          type="button"
          onClick={() => handleAutoGenerate()}
          disabled={autoGenerating !== null}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
          style={{ border: '1px solid #5147e6', color: '#5147e6', backgroundColor: '#ffffff' }}
          title="Introspect database schema and create field definitions for every entity"
        >
          <Wand2 className="w-4 h-4" />
          {autoGenerating === 'ALL' ? 'Generating…' : 'Auto-generate fields for all'}
        </button>
      </div>
      <div className="border border-gray-200 rounded-lg bg-white divide-y divide-gray-200">
      {modules.filter((mod) => mod.is_system_module).map((mod) => {
        const isOpen = expandedModules.has(mod.id);
        const components = mod.components || [];
        return (
          <div key={mod.id} className={mod.is_active ? '' : 'opacity-50'}>
            <div className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
              <button
                type="button"
                onClick={() => toggleModule(mod.id)}
                className="flex items-center gap-3 flex-1 text-left"
              >
                {isOpen ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                <Folder className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-900 truncate">
                  {mod.module_label || mod.module_name}
                </span>
                <span className="text-xs text-gray-500">
                  {components.length} entity {components.length === 1 ? 'type' : 'types'}
                </span>
                {!mod.is_system_module && (
                  <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700">custom</span>
                )}
              </button>

              {/* Enable/disable toggle — prominent. ONLY for the main system
                  modules (the 13 in the sidebar); custom sub-branches don't get it. */}
              {/* Enable/disable switch — a div, not a <button>, so the global
                  button !important style can't flatten it to navy. */}
              {mod.is_system_module && (
                <div
                  role="switch"
                  aria-checked={mod.is_active}
                  onClick={(e) => { e.stopPropagation(); if (togglingModuleId !== mod.id) toggleModuleActive(mod); }}
                  title={mod.is_active
                    ? 'Active — visible in the sidebar. Click to disable & hide it.'
                    : 'Inactive — hidden from the sidebar. Click to enable & show it.'}
                  className={`cursor-pointer relative inline-flex items-center rounded-full transition-colors shrink-0 ${togglingModuleId === mod.id ? 'opacity-50' : ''}`}
                  style={{ width: 40, height: 22, background: mod.is_active ? '#01411C' : '#cbd5e1' }}
                >
                  <span className="inline-block rounded-full bg-white shadow transition-transform"
                    style={{ width: 18, height: 18, transform: mod.is_active ? 'translateX(20px)' : 'translateX(2px)' }} />
                </div>
              )}
            </div>

            {isOpen && (
              <div className="bg-gray-50/50">
                {components.map((ent) => {
                  const entityOpen = expandedEntities.has(ent.component_code);
                  const fields = fieldsByEntity[ent.component_code];
                  const isLoading = loadingEntities.has(ent.component_code);
                  const isAdding = addingForEntity === ent.component_code;
                  return (
                    <div key={ent.id} className="border-t border-gray-200">
                      <div className="flex items-center px-4 py-2 hover:bg-gray-100">
                        <button
                          type="button"
                          onClick={() => toggleEntity(ent.component_code)}
                          className="flex items-center gap-3 flex-1 text-left"
                        >
                          <span className="w-4">
                            {entityOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                          </span>
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-800">{ent.component_label || ent.component_name}</span>
                          <code className="text-xs text-gray-500">{ent.component_code}</code>
                          {fields !== undefined && (
                            <span className="ml-auto text-xs text-gray-500">
                              {fields.length} {fields.length === 1 ? 'field' : 'fields'}
                            </span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!entityOpen) {
                              await toggleEntity(ent.component_code);
                            }
                            setAddingForEntity(ent.component_code);
                            setEditingFieldId(null);
                          }}
                          className="ml-3 inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 rounded"
                          title="Add field"
                        >
                          <Plus className="w-3 h-3" />
                          Add Field
                        </button>
                      </div>

                      {entityOpen && (
                        <div className="px-4 py-2 space-y-1 bg-white border-t border-gray-100">
                          {isAdding && (
                            <div className="mb-3 p-3 border border-blue-200 rounded bg-blue-50">
                              <CustomFieldForm
                                field={null}
                                entityType={ent.component_code}
                                inline
                                onSave={async (data) => {
                                  await fieldsApi.create(data);
                                  setAddingForEntity(null);
                                  await loadFields(ent.component_code);
                                }}
                                onCancel={() => setAddingForEntity(null)}
                              />
                            </div>
                          )}

                          {isLoading && <div className="text-xs text-gray-500 px-8">Loading fields…</div>}
                          {!isLoading && fields && fields.length === 0 && !isAdding && (
                            <div className="text-xs text-gray-500 italic px-8">No fields defined.</div>
                          )}
                          {!isLoading && fields && fields.map((f) => {
                            if (editingFieldId === f.id) {
                              return (
                                <div key={f.id} className="p-3 border border-amber-200 rounded bg-amber-50">
                                  <CustomFieldForm
                                    field={f}
                                    entityType={ent.component_code}
                                    inline
                                    onSave={async (data) => {
                                      await fieldsApi.update(f.id, data);
                                      setEditingFieldId(null);
                                      await loadFields(ent.component_code);
                                    }}
                                    onCancel={() => setEditingFieldId(null)}
                                  />
                                </div>
                              );
                            }
                            return (
                              <div key={f.id} className="flex items-center gap-3 text-sm py-1.5 px-8 hover:bg-gray-50 rounded">
                                <Hash className="w-3 h-3 text-gray-400" />
                                <span className="font-medium text-gray-800">{f.field_label}</span>
                                <code className="text-xs text-gray-500">{f.field_name}</code>
                                <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-700">{f.field_type}</span>
                                {f.is_required && <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">required</span>}
                                {!f.is_visible && <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">hidden</span>}
                                <div className="ml-auto flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingFieldId(f.id);
                                      setAddingForEntity(null);
                                    }}
                                    className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                                    title="Edit field"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(ent.component_code, f.id, f.field_label)}
                                    className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                                    title="Delete field"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
                {components.length === 0 && (
                  <div className="px-10 py-3 text-xs text-gray-500 italic border-t border-gray-200">
                    No entity types in this module.
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
}
