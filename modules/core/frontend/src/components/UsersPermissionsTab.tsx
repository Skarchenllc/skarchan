'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Shield, Key, ExternalLink } from 'lucide-react';
import { usersAPI, rolesAPI, permissionsAPI } from '@/lib/api';

interface User {
  id: string;
  email: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  roles?: { id: string; name: string }[];
}

interface Role {
  id: string;
  name: string;
  description?: string;
  is_system?: boolean;
  permissions?: any[];
}

interface Permission {
  id: string;
  code: string;
  name?: string;
  module?: string;
  description?: string;
}

export default function UsersPermissionsTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [u, r, p] = await Promise.all([
          usersAPI.list().catch(() => ({ data: [] })),
          rolesAPI.list().catch(() => ({ data: [] })),
          permissionsAPI.list().catch(() => ({ data: [] })),
        ]);
        const unwrap = (x: any) => {
          const body = x?.data;
          if (Array.isArray(body)) return body;
          return body?.users || body?.roles || body?.permissions || body?.items || body?.data || [];
        };
        setUsers(unwrap(u));
        setRoles(unwrap(r));
        setPermissions(unwrap(p));
      } catch (e: any) {
        setError(e?.message || 'Failed to load users and permissions');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="p-6 text-sm text-gray-500">Loading users, roles, and permissions…</div>;
  }
  if (error) {
    return <div className="p-6 text-sm text-red-700 bg-red-50 border border-red-200 rounded">{error}</div>;
  }

  const displayName = (u: User) => u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email;

  return (
    <div className="space-y-8">
      {/* Users */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Users
            <span className="text-sm font-normal text-gray-500">({users.length})</span>
          </h3>
          <Link href="/users" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
            Manage all users <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
        <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
          {users.length === 0 ? (
            <div className="p-6 text-sm text-gray-500 italic">No users found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-gray-700">Name</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-700">Email</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-700">Roles</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.slice(0, 25).map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-800">{displayName(u)}</td>
                    <td className="px-4 py-2 text-gray-600">{u.email}</td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-1">
                        {(u.roles || []).map(r => (
                          <span key={r.id} className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">{r.name}</span>
                        ))}
                        {(!u.roles || u.roles.length === 0) && <span className="text-xs text-gray-400">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      {u.is_active === false
                        ? <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-700">inactive</span>
                        : <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">active</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {users.length > 25 && (
            <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 border-t border-gray-200">
              Showing 25 of {users.length}. <Link href="/users" className="text-blue-600 hover:underline">View all →</Link>
            </div>
          )}
        </div>
      </section>

      {/* Roles */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Roles
            <span className="text-sm font-normal text-gray-500">({roles.length})</span>
          </h3>
          <Link href="/roles" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
            Manage roles <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
        <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
          {roles.length === 0 ? (
            <div className="p-6 text-sm text-gray-500 italic">No roles defined.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-gray-700">Role</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-700">Description</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-700">Permissions</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-700">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {roles.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-800">{r.name}</td>
                    <td className="px-4 py-2 text-gray-600">{r.description || <span className="text-gray-400">—</span>}</td>
                    <td className="px-4 py-2 text-gray-600">{(r.permissions || []).length}</td>
                    <td className="px-4 py-2">
                      {r.is_system
                        ? <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-700">system</span>
                        : <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700">custom</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Permissions */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Key className="w-5 h-5" />
            Permissions
            <span className="text-sm font-normal text-gray-500">({permissions.length})</span>
          </h3>
        </div>
        <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
          {permissions.length === 0 ? (
            <div className="p-6 text-sm text-gray-500 italic">No permissions registered.</div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-gray-700">Code</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-700">Module</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-700">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {permissions.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-xs text-gray-800">{p.code}</td>
                      <td className="px-4 py-2 text-gray-600">{p.module || <span className="text-gray-400">—</span>}</td>
                      <td className="px-4 py-2 text-gray-600">{p.description || p.name || <span className="text-gray-400">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
