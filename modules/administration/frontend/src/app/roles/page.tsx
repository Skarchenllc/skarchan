'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Shield } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { RolePermissions } from '@/components/role-permissions'

interface Role {
  id: number
  name: string
  description: string
  permission_ids: number[]
  created_at: string
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [showRoleForm, setShowRoleForm] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const data = await apiClient.get('/roles')
      setRoles(data)
    } catch (error) {
      console.error('Failed to fetch roles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRole = () => {
    setSelectedRole(null)
    setShowRoleForm(true)
  }

  const handleEditRole = (role: Role) => {
    setSelectedRole(role)
    setShowRoleForm(true)
  }

  const handleDeleteRole = async (roleId: number) => {
    if (!confirm('Are you sure you want to delete this role?')) return

    try {
      await apiClient.delete(`/roles/${roleId}`)
      fetchRoles()
    } catch (error) {
      console.error('Failed to delete role:', error)
    }
  }

  const handleFormClose = () => {
    setShowRoleForm(false)
    setSelectedRole(null)
    fetchRoles()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Role Management</h1>
          <p className="text-muted-foreground">
            Configure roles and assign permissions
          </p>
        </div>
        <button
          onClick={handleCreateRole}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Role
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 pt-24">Loading roles...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.length === 0 ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              No roles found
            </div>
          ) : (
            roles.map((role) => (
              <div
                key={role.id}
                className="border rounded-lg p-6 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{role.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {role.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    {role.permission_ids.length} permissions assigned
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditRole(role)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border rounded-md hover:bg-muted transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteRole(role.id)}
                    className="flex items-center justify-center gap-2 px-3 py-2 border border-destructive text-destructive rounded-md hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showRoleForm && (
        <RolePermissions
          role={selectedRole}
          onClose={handleFormClose}
        />
      )}
    </div>
  )
}
