'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { moduleBuilderAPI } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import SharedHeader from '@/components/SharedHeader';

interface Module {
  id: string;
  module_code: string;
  module_label: string;
  description: string;
  icon: string;
  color: string;
  is_active?: boolean;
  entity_types: any[];
}

export default function ModulePage() {
  const params = useParams();
  const router = useRouter();
  const moduleCode = params.module as string;

  const [module, setModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadModule();
  }, [moduleCode]);

  const loadModule = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch module data with entity types
      const response = await moduleBuilderAPI.getModulesWithEntityTypes();
      const foundModule = response.data.data.find(
        (m: Module) => m.module_code === moduleCode
      );

      if (!foundModule) {
        setError(`Module "${moduleCode}" not found`);
        return;
      }

      if (foundModule.is_active === false) {
        setError(`Module "${moduleCode}" is currently disabled. An administrator can re-enable it from Settings → Backend → System Modules.`);
        return;
      }

      setModule(foundModule);
    } catch (err: any) {
      console.error('Error loading module:', err);
      setError(err.message || 'Failed to load module');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <div className="flex items-center justify-center min-h-screen pt-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading {moduleCode} module...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !module) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <div className="flex items-center justify-center min-h-screen pt-20">
            <div className="text-center">
              <div className="text-red-600 text-5xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Module Not Found</h1>
              <button
                onClick={() => router.push('/nexacore')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Back to Control Room
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="pt-20 pb-8">
          {/* Module Header */}
          <div
            className="bg-white shadow-sm border-b"
            style={{ borderTopColor: module.color, borderTopWidth: '4px' }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex items-center space-x-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-2xl"
                  style={{ backgroundColor: module.color }}
                >
                  {module.icon || '📦'}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{module.module_label}</h1>
                </div>
              </div>
            </div>
          </div>

      {/* Entity Types Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {module.entity_types.map((entityType) => (
            <div
              key={entityType.id}
              onClick={() => router.push(`/modules/${moduleCode}/${entityType.entity_type_code}`)}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-start space-x-3">
                <div
                  className="w-10 h-10 rounded flex items-center justify-center text-white"
                  style={{ backgroundColor: module.color }}
                >
                  {entityType.icon || '📄'}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {entityType.entity_type_label}
                  </h3>
                  {entityType.description && (
                    <p className="text-sm text-gray-600 mt-1">{entityType.description}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {module.entity_types.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-5xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Entity Types Found
            </h3>
          </div>
        )}
      </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
