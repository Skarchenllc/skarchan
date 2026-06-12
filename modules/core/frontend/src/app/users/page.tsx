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
import { usersAPI, rolesAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { User, Role } from '@/types';
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import { Users } from 'lucide-react';
import { format } from 'date-fns';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    is_active: true,
    role_id: '',
  });

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [currentPage, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const pageSize = 10;
      const response = await usersAPI.list({
        page: currentPage,
        page_size: pageSize,
        search: searchTerm || undefined,
      });
      const body: any = response.data || {};
      const list = Array.isArray(body) ? body : (body.users || body.items || body.data || []);
      const total = body.total ?? list.length;
      setUsers(list);
      setTotalPages(Math.max(1, Math.ceil(total / pageSize)));
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsers([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await rolesAPI.list();
      const body: any = response.data;
      const list = Array.isArray(body) ? body : (body?.roles || body?.data || body?.items || []);
      setRoles(list);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      setRoles([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { role_id, ...rest } = formData as any;
      let userId: string;
      let existingRoleIds: string[] = [];

      if (editingUser) {
        const { password, ...updatePayload } = rest;
        await usersAPI.update(editingUser.id, updatePayload);
        userId = editingUser.id;
        existingRoleIds = ((editingUser as any).roles || []).map((r: any) => r.id);
      } else {
        const orgId = (currentUser as any)?.org_id || (currentUser as any)?.organization_id;
        if (!orgId) {
          alert('Cannot determine your organization. Please re-login.');
          return;
        }
        const created = await usersAPI.create({ ...rest, org_id: orgId });
        userId = (created.data as any)?.id;
      }

      if (userId) {
        // Remove any existing roles that aren't the newly-selected one
        for (const oldRoleId of existingRoleIds) {
          if (oldRoleId !== role_id) {
            try {
              await rolesAPI.removeFromUser(userId, oldRoleId);
            } catch (err) {
              console.error('Failed to remove old role:', err);
            }
          }
        }
        // Assign the new role only if it isn't already assigned
        if (role_id && !existingRoleIds.includes(role_id)) {
          try {
            await rolesAPI.assignToUser(userId, role_id);
          } catch (err: any) {
            if (err?.response?.status !== 400 && err?.response?.status !== 409) {
              console.error('Role assignment failed:', err);
              alert(`User saved, but role assignment failed: ${err?.response?.data?.detail || err.message}`);
            }
          }
        }
      }

      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      console.error('Failed to save user:', error);
      const detail = error?.response?.data?.detail;
      let msg = 'Failed to save user.';
      if (typeof detail === 'string') msg = detail;
      else if (Array.isArray(detail)) msg = detail.map((d: any) => `${(d.loc || []).slice(-1)}: ${d.msg}`).join('\n');
      alert(msg);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await usersAPI.delete(userId);
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user. Please try again.');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    const u = user as any;
    setFormData({
      username: user.username,
      email: user.email,
      first_name: u.first_name || '',
      last_name: u.last_name || '',
      password: '',
      is_active: user.is_active,
      role_id: u.roles?.[0]?.id || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      password: '',
      is_active: true,
      role_id: '',
    });
    setEditingUser(null);
  };

  const columns = [
    {
      key: 'username',
      header: 'Username',
      render: (user: User) => (
        <div className="font-medium text-gray-900">{user.username}</div>
      ),
    },
    {
      key: 'full_name',
      header: 'Full Name',
      render: (user: User) => {
        const u = user as any;
        const display = u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || '—';
        return <div className="text-gray-700">{display}</div>;
      },
    },
    {
      key: 'email',
      header: 'Email',
      render: (user: User) => <div className="text-gray-700">{user.email}</div>,
    },
    {
      key: 'roles',
      header: 'Roles',
      render: (user: User) => {
        const userRoles = (user as any).roles || [];
        if (userRoles.length === 0) {
          return <span className="text-gray-400 text-sm">—</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {userRoles.map((r: any) => (
              <span key={r.id} className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                {r.role_name || r.role_code}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (user: User) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            user.is_active
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {user.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'created_date',
      header: 'Created At',
      render: (user: User) => {
        const raw = (user as any).created_date || (user as any).created_at;
        const d = raw ? new Date(raw) : null;
        const valid = d && !isNaN(d.getTime());
        return (
          <div className="text-gray-600">
            {valid ? format(d as Date, 'MMM dd, yyyy') : '—'}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (user: User) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(user)}
            className="text-blue-600 hover:text-blue-800"
          >
            <FiEdit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(user.id)}
            className="text-red-600 hover:text-red-800"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <main className="mt-16 p-8 max-w-7xl mx-auto">
          <div className="mb-12">
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          </div>

            <Card>
              <div className="mb-4 flex justify-between items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <Button
                  onClick={() => {
                    resetForm();
                    setShowModal(true);
                  }}
                >
                  <FiPlus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </div>

              <Table
                columns={columns}
                data={users}
                loading={loading}
                pagination={{
                  currentPage,
                  totalPages,
                  onPageChange: setCurrentPage,
                }}
              />
            </Card>

            <Modal
              isOpen={showModal}
              onClose={() => {
                setShowModal(false);
                resetForm();
              }}
              title={editingUser ? 'Edit User' : 'Create New User'}
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  disabled={!!editingUser}
                />

                <Input
                  label="First Name"
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />

                <Input
                  label="Last Name"
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />

                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />

                {!editingUser && (
                  <Input
                    label="Password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    helperText="At least 8 characters"
                  />
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={formData.role_id}
                    onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">— No role —</option>
                    {roles.map((r: any) => (
                      <option key={r.id} value={r.id}>
                        {r.role_name || r.name || r.role_code} ({r.role_code || r.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-700">
                    Active User
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
                    {editingUser ? 'Update User' : 'Create User'}
                  </Button>
                </div>
              </form>
            </Modal>
        </main>
      </div>
    </ProtectedRoute>
  );
}
