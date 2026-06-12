'use client';

import React, { useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { FiHome, FiZap, FiFolder, FiFileText } from 'react-icons/fi';
import { moduleBuilderAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

interface SubBranch {
  id: string;
  component_code: string;
  component_name: string;
  component_label: string;
  description?: string;
  icon?: string;
  display_order: number;
  is_active: boolean;
}

interface Branch {
  id: string;
  module_code: string;
  module_name: string;
  module_label: string;
  description?: string;
  icon?: string;
  color?: string;
  components: SubBranch[];
}

export default function BranchLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const { user } = useAuth();
  const { theme } = useTheme();
  const branchCode = params.branchCode as string;
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const logoSource = theme.logoFile || theme.logoUrl;

  useEffect(() => {
    const loadBranch = async () => {
      try {
        setLoading(true);
        const orgId = (user as any)?.org_id || (user as any)?.organization_id;

        // Get all modules with components
        const response = await moduleBuilderAPI.getModulesWithComponents({
          organization_id: orgId,
          include_system: false,
        });

        // Find the branch with matching code
        const foundBranch = (response.data.modules || []).find(
          (m: any) => m.module_code === branchCode
        );

        if (foundBranch) {
          setBranch(foundBranch);
        }
      } catch (error) {
        console.error('Error loading branch:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user && branchCode) {
      loadBranch();
    }
  }, [user, branchCode]);

  const subBranches = branch?.components || [];
  const activeSubBranches = subBranches
    .filter((sb) => sb.is_active !== false) // Show all unless explicitly set to false
    .sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white h-screen fixed left-0 top-0 overflow-y-auto">
        <div className="p-6">
          <Link href="/nexacore" className="flex items-center gap-3">
            {logoSource ? (
              <img src={logoSource} alt="Logo" className="h-10 w-auto object-contain" />
            ) : (
              <div className="w-10 h-10 bg-[#5147e6] flex items-center justify-center">
                <FiZap className="w-6 h-6 text-[#01411C]" />
              </div>
            )}
            <h1 className="text-2xl font-bold text-white">{theme.appName || 'NexaCore'}</h1>
          </Link>
        </div>

        {/* Branch Info */}
        {branch && (
          <div className="px-6 py-4 border-t border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center font-bold"
                style={{
                  backgroundColor: branch.color ? `${branch.color}30` : '#374151',
                  color: branch.color || '#9CA3AF'
                }}
              >
                {branch.icon || <FiFolder className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">{branch.module_label}</h2>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="mt-6">
          {/* Dashboard Link */}
          <Link
            href={`/branch/${branchCode}`}
            className={`
              flex items-center px-6 py-3 text-sm font-medium transition-colors
              ${
                pathname === `/branch/${branchCode}`
                  ? 'bg-gray-800 text-blue-400 border-r-4 border-blue-400'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }
            `}
          >
            <FiHome className="w-5 h-5 mr-3" />
            Dashboard
          </Link>

          {/* Sub Branches */}
          {loading ? (
            <div className="px-6 py-3 text-sm text-gray-400">Loading...</div>
          ) : activeSubBranches.length > 0 ? (
            <>
              <div className="px-6 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Sub Branches
              </div>
              {activeSubBranches.map((subBranch) => {
                const isActive = pathname === `/branch/${branchCode}/${subBranch.component_code}`;

                return (
                  <Link
                    key={subBranch.id}
                    href={`/branch/${branchCode}/${subBranch.component_code}`}
                    className={`
                      flex items-center px-6 py-3 text-sm font-medium transition-colors
                      ${
                        isActive
                          ? 'bg-gray-800 text-blue-400 border-r-4 border-blue-400'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }
                    `}
                  >
                    {subBranch.icon ? (
                      <div className="w-5 h-5 mr-3 flex items-center justify-center text-xs font-bold">
                        {subBranch.icon}
                      </div>
                    ) : (
                      <FiFileText className="w-5 h-5 mr-3" />
                    )}
                    {subBranch.component_label}
                  </Link>
                );
              })}
            </>
          ) : (
            <div className="px-6 py-3 text-xs text-gray-400">
              No sub branches yet. Add them in Settings.
            </div>
          )}

          {/* Back to Control Room */}
          <div className="mt-6 border-t border-gray-800 pt-6">
            <Link
              href="/nexacore"
              className="flex items-center px-6 py-3 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <FiHome className="w-5 h-5 mr-3" />
              Back to Control Room
            </Link>
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-800">
          <p className="text-xs text-gray-400">Version 1.0.0</p>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-64 flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
