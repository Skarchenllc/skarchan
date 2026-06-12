'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { customFieldsAPI } from '@/lib/api';
import FrontendTab from '@/components/FrontendTab';
import OptionListsTab from '@/components/OptionListsTab';
import ModuleEntityFields from '@/components/ModuleEntityFields';
import ModuleForm from '@/components/ModuleForm';
import CreateEntityWizard from '@/components/CreateEntityWizard';
import { Plus, Layers } from 'lucide-react';

type BackendSection = 'system-modules' | 'lists';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { theme, features, updateTheme, updateFeatures } = useTheme();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'backend' | 'frontend'>('backend');
  const [backendSection, setBackendSection] = useState<BackendSection>('system-modules');

  // The Home banner's "Custom Development" dropdown deep-links here with
  // ?section=system-modules | lists | frontend. Read it once and map to the
  // right top-tab + sub-section.
  useEffect(() => {
    const section = searchParams?.get('section');
    if (!section) return;
    if (section === 'frontend') {
      setActiveTab('frontend');
      return;
    }
    if (section === 'system-modules' || section === 'lists') {
      setActiveTab('backend');
      setBackendSection(section);
    }
  }, [searchParams]);
  const [showCreateBranch, setShowCreateBranch] = useState(false);
  const [showCreateEntity, setShowCreateEntity] = useState(false);
  const [systemModulesReloadKey, setSystemModulesReloadKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );


  // Custom Fields state
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [selectedEntityType, setSelectedEntityType] = useState<string>('');
  const [showCreateFieldModal, setShowCreateFieldModal] = useState(false);
  const [editingField, setEditingField] = useState<any | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);


  // Custom Fields functions
  const fetchFields = async () => {
    try {
      setLoadingFields(true);
      const params = selectedEntityType ? { entity_type: selectedEntityType } : {};
      const response = await customFieldsAPI.listDefinitions(params);
      setCustomFields(response.data.data || []);
    } catch (error) {
      console.error('Error fetching custom fields:', error);
      setCustomFields([]);
    } finally {
      setLoadingFields(false);
    }
  };

  const handleDeleteField = async (id: string) => {
    if (!confirm('Are you sure you want to delete this custom field? All associated data will be lost.')) {
      return;
    }

    try {
      await customFieldsAPI.deleteDefinition(id);
      await fetchFields();
    } catch (error) {
      console.error('Error deleting field:', error);
      alert('Failed to delete custom field');
    }
  };

  const handleToggleVisibility = async (field: any) => {
    try {
      await customFieldsAPI.updateDefinition(field.id, {
        is_visible: !field.is_visible,
        last_modified_by: user?.id || '00000000-0000-0000-0000-000000000001',
      });
      await fetchFields();
    } catch (error) {
      console.error('Error updating field:', error);
    }
  };

  return (
    <ProtectedRoute>
      <div>
        <div>
          <div className="mb-6">
            {/* Header and H1 removed — AppShell top bar already shows the
                module name and the global nav. */}
          </div>

          {message && (
            <div
              className={`mb-6 p-4 border ${
                message.type === 'success'
                  ? 'border-green-500 text-green-700 bg-green-50'
                  : 'border-red-500 text-red-700 bg-red-50'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Section content. The Custom Development dropdown in the Home
              banner is the navigation — no in-page tab strip needed. The
              active section is set from the ?section= query param. */}
          <div>
                {activeTab === 'backend' && (
                  <div>
                    {backendSection === 'system-modules' && (
                      <div>
                        <div className="flex items-center justify-end mb-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setShowCreateEntity(true)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold"
                            style={{ border: '1px solid #5147e6', color: '#5147e6', backgroundColor: '#ffffff' }}
                          >
                            <Layers className="w-4 h-4" />
                            Create Entity
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowCreateBranch(true)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold"
                            style={{ backgroundColor: '#5147e6', color: '#ffffff' }}
                          >
                            <Plus className="w-4 h-4" />
                            Create Branch
                          </button>
                        </div>
                        <ModuleEntityFields key={systemModulesReloadKey} />
                      </div>
                    )}

                    {backendSection === 'lists' && (
                      <OptionListsTab />
                    )}

                  </div>
                )}

                {activeTab === 'frontend' && (
                  <FrontendTab onMessage={setMessage} />
                )}
          </div>
        </div>

        {showCreateBranch && (
          <ModuleForm
            module={null}
            onSave={() => {
              setShowCreateBranch(false);
              setSystemModulesReloadKey((k) => k + 1);
            }}
            onCancel={() => setShowCreateBranch(false)}
          />
        )}

        {showCreateEntity && (
          <CreateEntityWizard
            onClose={() => setShowCreateEntity(false)}
            onCreated={(entityType, moduleCode) => {
              setSystemModulesReloadKey((k) => k + 1);
              if (moduleCode) {
                window.location.href = `/modules/${moduleCode}/${entityType}`;
              }
            }}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
