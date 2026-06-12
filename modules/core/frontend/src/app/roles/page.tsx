'use client';

import React, { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Card from '@/components/Card';
import Table from '@/components/Table';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import Input from '@/components/Input';
import { rolesAPI, permissionsAPI } from '@/lib/api';
import { Role, Permission } from '@/types';
import { FiPlus, FiEdit2, FiTrash2, FiShield } from 'react-icons/fi';
import { Shield } from 'lucide-react';
import { format } from 'date-fns';

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const [formData, setFormData] = useState({
    role_code: '',
    role_name: '',
    role_description: '',
    is_active: true,
  });

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const unwrap = (resp: any) => {
    const body = resp?.data;
    if (Array.isArray(body)) return body;
    return body?.roles || body?.permissions || body?.data || body?.items || [];
  };

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await rolesAPI.list();
      setRoles(unwrap(response));
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await permissionsAPI.list();
      setPermissions(unwrap(response));
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
      setPermissions([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRole) {
        const { role_code, ...updatePayload } = formData as any;
        await rolesAPI.update(editingRole.id, updatePayload);
      } else {
        await rolesAPI.create({ ...formData, permissions: [], scope: 'organization' });
      }
      setShowModal(false);
      resetForm();
      fetchRoles();
    } catch (error: any) {
      console.error('Failed to save role:', error);
      const detail = error?.response?.data?.detail;
      let msg = 'Failed to save role.';
      if (typeof detail === 'string') msg = detail;
      else if (Array.isArray(detail)) msg = detail.map((d: any) => `${(d.loc || []).slice(-1)}: ${d.msg}`).join('\n');
      alert(msg);
    }
  };

  const handleDelete = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;

    try {
      await rolesAPI.delete(roleId);
      fetchRoles();
    } catch (error) {
      console.error('Failed to delete role:', error);
      alert('Failed to delete role. Please try again.');
    }
  };

  const handleEdit = (role: Role) => {
    const r = role as any;
    setEditingRole(role);
    setFormData({
      role_code: r.role_code || r.code || '',
      role_name: r.role_name || r.name || '',
      role_description: r.role_description || r.description || '',
      is_active: r.is_active ?? true,
    });
    setShowModal(true);
  };

  const handleViewPermissions = (role: Role) => {
    setSelectedRole(role);
    setShowPermissionsModal(true);
  };

  const resetForm = () => {
    setFormData({
      role_code: '',
      role_name: '',
      role_description: '',
      is_active: true,
    });
    setEditingRole(null);
  };

  const columns = [
    {
      key: 'role_name',
      header: 'Role Name',
      render: (role: Role) => {
        const r = role as any;
        return (
          <div className="flex items-center gap-2">
            <FiShield className="w-4 h-4 text-[#01411C]" />
            <span className="font-medium text-black">{r.role_name || r.name || r.role_code}</span>
          </div>
        );
      },
    },
    {
      key: 'role_description',
      header: 'Description',
      render: (role: Role) => {
        const r = role as any;
        return <div className="text-black">{r.role_description || r.description || 'No description'}</div>;
      },
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (role: Role) => (
        <span
          className={`px-2 py-1 text-xs font-medium border ${
            role.is_active
              ? 'border-[#01411C] text-[#01411C]'
              : 'border-gray-400 text-gray-600'
          }`}
        >
          {role.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'created_date',
      header: 'Created At',
      render: (role: Role) => {
        const r = role as any;
        const raw = r.created_date || r.created_at;
        const d = raw ? new Date(raw) : null;
        const valid = d && !isNaN(d.getTime());
        return <div className="text-black">{valid ? format(d as Date, 'MMM dd, yyyy') : '—'}</div>;
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (role: Role) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleViewPermissions(role)}
            className="text-[#5147e6] hover:text-[#01411C]"
            title="View Permissions"
          >
            <FiShield className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleEdit(role)}
            className="text-[#5147e6] hover:text-[#01411C]"
            title="Edit"
          >
            <FiEdit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(role.id)}
            className="text-[#5147e6] hover:text-[#01411C]"
            title="Delete"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const groupPermissionsByModule = (perms: Permission[]) => {
    return perms.reduce((acc, perm) => {
      if (!acc[perm.module]) {
        acc[perm.module] = [];
      }
      acc[perm.module].push(perm);
      return acc;
    }, {} as Record<string, Permission[]>);
  };

  const groupedPermissions = groupPermissionsByModule(permissions);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <main className="mt-16 p-8 max-w-7xl mx-auto">
          <div className="mb-12">
            <h1 className="text-3xl font-bold text-gray-900">Roles & Permissions</h1>
          </div>

          {/* Compact Statistics Bar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-8">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <FiShield className="w-5 h-5 text-gray-900" />
                <span className="text-sm text-gray-600">Total Roles</span>
                <span className="text-xl font-bold text-gray-900">{roles.length}</span>
              </div>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <FiShield className="w-5 h-5 text-gray-900" />
                <span className="text-sm text-gray-600">Total Permissions</span>
                <span className="text-xl font-bold text-gray-900">{permissions.length}</span>
              </div>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <FiShield className="w-5 h-5 text-gray-900" />
                <span className="text-sm text-gray-600">Active Roles</span>
                <span className="text-xl font-bold text-gray-900">{roles.filter((r) => r.is_active).length}</span>
              </div>
            </div>
          </div>

            <Card>
              <div className="mb-4 flex justify-end">
                <Button
                  onClick={() => {
                    resetForm();
                    setShowModal(true);
                  }}
                >
                  <FiPlus className="w-4 h-4 mr-2" />
                  Add Role
                </Button>
              </div>

              <Table columns={columns} data={roles} loading={loading} />
            </Card>

            <Modal
              isOpen={showModal}
              onClose={() => {
                setShowModal(false);
                resetForm();
              }}
              title={editingRole ? 'Edit Role' : 'Create New Role'}
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Role Name"
                  type="text"
                  value={formData.role_name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      role_name: name,
                      role_code: editingRole ? prev.role_code : name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''),
                    }));
                  }}
                  required
                />

                <Input
                  label="Role Code"
                  type="text"
                  value={formData.role_code}
                  onChange={(e) => setFormData({ ...formData, role_code: e.target.value })}
                  required
                  disabled={!!editingRole}
                  helperText={editingRole ? 'Role code cannot be changed' : 'Auto-generated from role name'}
                />

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.role_description}
                    onChange={(e) => setFormData({ ...formData, role_description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-[#01411C] focus:outline-none focus:border-[#5147e6]"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="is_active" className="text-sm text-black">
                    Active Role
                  </label>
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingRole ? 'Update Role' : 'Create Role'}
                  </Button>
                </div>
              </form>
            </Modal>

            <Modal
              isOpen={showPermissionsModal}
              onClose={() => setShowPermissionsModal(false)}
              title={`Permissions for ${selectedRole?.name || ''}`}
              size="lg"
            >
              <div className="space-y-6">
                {Object.keys(groupedPermissions).length === 0 ? (
                  <p className="text-black text-center py-8 pt-24">No permissions available</p>
                ) : (
                  Object.entries(groupedPermissions).map(([module, perms]) => (
                    <div key={module} className="border-b border-[#01411C] pb-4 last:border-b-0">
                      <h4 className="font-semibold text-black mb-3 capitalize">
                        {module} Module
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {perms.map((perm) => (
                          <div
                            key={perm.id}
                            className="flex items-center gap-2 p-2 border border-[#01411C]"
                          >
                            <input type="checkbox" />
                            <div>
                              <p className="text-sm font-medium text-black">{perm.name}</p>
                              <p className="text-xs text-black">{perm.code}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Modal>
        </main>
      </div>
    </ProtectedRoute>
  );
}
