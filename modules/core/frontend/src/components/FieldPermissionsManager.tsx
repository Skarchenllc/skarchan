'use client'

import { useState, useEffect } from 'react'
import { X, Save, Plus, Trash2, Eye, Edit3, Lock } from 'lucide-react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8011/api/v1'

interface FieldDefinition {
  id: string
  field_name: string
  field_label: string
  field_type: string
  entity_type: string
  is_required: boolean
  is_active: boolean
}

interface FieldPermission {
  id: string
  field_definition_id: string
  role_name: string
  can_view: boolean
  can_edit: boolean
  can_delete: boolean
}

interface FieldPermissionWithDefinition {
  permission: FieldPermission | null
  definition: FieldDefinition
}

interface FieldPermissionsManagerProps {
  fieldId?: string
  onClose: () => void
}

const predefinedRoles = [
  'admin',
  'sales_manager',
  'sales_rep',
  'marketing_manager',
  'marketing_specialist',
  'support_manager',
  'support_agent',
  'finance_manager',
  'accountant',
  'viewer'
]

export default function FieldPermissionsManager({ fieldId, onClose }: FieldPermissionsManagerProps) {
  const [fields, setFields] = useState<FieldDefinition[]>([])
  const [permissions, setPermissions] = useState<FieldPermission[]>([])
  const [selectedField, setSelectedField] = useState<string>(fieldId || '')
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [rolePermissions, setRolePermissions] = useState<Record<string, { can_view: boolean; can_edit: boolean; can_delete: boolean }>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadFields()
    loadPermissions()
  }, [])

  useEffect(() => {
    if (selectedField) {
      loadFieldPermissions(selectedField)
    }
  }, [selectedField])

  const loadFields = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/custom-fields/definitions?is_active=true`)
      const data = await response.json()
      setFields(data)
    } catch (error) {
      console.error('Failed to load fields:', error)
      setError('Failed to load custom fields')
    } finally {
      setLoading(false)
    }
  }

  const loadPermissions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/custom-fields/permissions`)
      const data = await response.json()
      setPermissions(data)
    } catch (error) {
      console.error('Failed to load permissions:', error)
    }
  }

  const loadFieldPermissions = async (fieldId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/custom-fields/${fieldId}/permissions/summary`)
      const data = await response.json()

      // Convert to rolePermissions format
      const rolePerms: Record<string, { can_view: boolean; can_edit: boolean; can_delete: boolean }> = {}
      data.permissions.forEach((perm: any) => {
        rolePerms[perm.role_name] = {
          can_view: perm.can_view,
          can_edit: perm.can_edit,
          can_delete: perm.can_delete
        }
      })
      setRolePermissions(rolePerms)
    } catch (error) {
      console.error('Failed to load field permissions:', error)
    }
  }

  const savePermission = async (roleName: string) => {
    if (!selectedField) return

    const perms = rolePermissions[roleName]
    if (!perms) return

    try {
      setSaving(true)
      setError('')

      // Check if permission already exists
      const existingPermission = permissions.find(
        p => p.field_definition_id === selectedField && p.role_name === roleName
      )

      if (existingPermission) {
        // Update existing
        const response = await fetch(`${API_BASE_URL}/custom-fields/permissions/${existingPermission.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            can_view: perms.can_view,
            can_edit: perms.can_edit,
            can_delete: perms.can_delete,
            last_modified_by: '00000000-0000-0000-0000-000000000001'
          })
        })

        if (!response.ok) {
          throw new Error('Failed to update permission')
        }
      } else {
        // Create new
        const response = await fetch(`${API_BASE_URL}/custom-fields/permissions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            field_definition_id: selectedField,
            role_name: roleName,
            can_view: perms.can_view,
            can_edit: perms.can_edit,
            can_delete: perms.can_delete,
            created_by: '00000000-0000-0000-0000-000000000001',
            last_modified_by: '00000000-0000-0000-0000-000000000001'
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.detail || 'Failed to create permission')
        }
      }

      setSuccess(`Permissions saved for ${roleName}`)
      setTimeout(() => setSuccess(''), 3000)

      // Reload permissions
      await loadPermissions()
      await loadFieldPermissions(selectedField)
    } catch (error: any) {
      console.error('Failed to save permission:', error)
      setError(error.message || 'Failed to save permission')
    } finally {
      setSaving(false)
    }
  }

  const deletePermission = async (roleName: string) => {
    if (!selectedField) return
    if (!confirm(`Remove all permissions for ${roleName} on this field?`)) return

    try {
      const permission = permissions.find(
        p => p.field_definition_id === selectedField && p.role_name === roleName
      )

      if (!permission) return

      const response = await fetch(`${API_BASE_URL}/custom-fields/permissions/${permission.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete permission')
      }

      // Remove from local state
      const updated = { ...rolePermissions }
      delete updated[roleName]
      setRolePermissions(updated)

      setSuccess(`Permissions removed for ${roleName}`)
      setTimeout(() => setSuccess(''), 3000)

      // Reload permissions
      await loadPermissions()
    } catch (error) {
      console.error('Failed to delete permission:', error)
      setError('Failed to delete permission')
    }
  }

  const addRolePermission = () => {
    if (!selectedRole || rolePermissions[selectedRole]) {
      setError('Please select a role that has not been added yet')
      return
    }

    setRolePermissions({
      ...rolePermissions,
      [selectedRole]: { can_view: true, can_edit: false, can_delete: false }
    })
    setSelectedRole('')
  }

  const updateRolePermission = (roleName: string, permission: 'can_view' | 'can_edit' | 'can_delete', value: boolean) => {
    setRolePermissions({
      ...rolePermissions,
      [roleName]: {
        ...rolePermissions[roleName],
        [permission]: value
      }
    })
  }

  const selectedFieldData = fields.find(f => f.id === selectedField)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Field Permissions Manager</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
              {success}
            </div>
          )}

          {/* Field Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Custom Field
            </label>
            <select
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a field...</option>
              {fields.map(field => (
                <option key={field.id} value={field.id}>
                  {field.field_label} ({field.entity_type}) - {field.field_type}
                </option>
              ))}
            </select>
          </div>

          {selectedField && selectedFieldData && (
            <>
              {/* Field Info */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Field Name:</span>
                    <p className="text-gray-900">{selectedFieldData.field_name}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Label:</span>
                    <p className="text-gray-900">{selectedFieldData.field_label}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Type:</span>
                    <p className="text-gray-900">{selectedFieldData.field_type}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Entity:</span>
                    <p className="text-gray-900">{selectedFieldData.entity_type}</p>
                  </div>
                </div>
              </div>

              {/* Add Role */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add Role Permission
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a role...</option>
                    {predefinedRoles
                      .filter(role => !rolePermissions[role])
                      .map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={addRolePermission}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Role
                  </button>
                </div>
              </div>

              {/* Permissions Table */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Role Permissions</h3>

                {Object.keys(rolePermissions).length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <Lock className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No permissions configured yet</p>
                    <p className="text-sm text-gray-500 mt-1">Add a role to get started</p>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Role
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <div className="flex items-center justify-center gap-1">
                              <Eye className="w-4 h-4" />
                              <span>View</span>
                            </div>
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <div className="flex items-center justify-center gap-1">
                              <Edit3 className="w-4 h-4" />
                              <span>Edit</span>
                            </div>
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <div className="flex items-center justify-center gap-1">
                              <Trash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </div>
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Object.entries(rolePermissions).map(([roleName, perms]) => (
                          <tr key={roleName} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {roleName}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={perms.can_view}
                                onChange={(e) => updateRolePermission(roleName, 'can_view', e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={perms.can_edit}
                                onChange={(e) => updateRolePermission(roleName, 'can_edit', e.target.checked)}
                                disabled={!perms.can_view}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={perms.can_delete}
                                onChange={(e) => updateRolePermission(roleName, 'can_delete', e.target.checked)}
                                disabled={!perms.can_view}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                              />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => savePermission(roleName)}
                                  disabled={saving}
                                  className="px-3 py-1 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors text-sm flex items-center gap-1 disabled:opacity-50"
                                >
                                  <Save className="w-3 h-3" />
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deletePermission(roleName)}
                                  className="px-3 py-1 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors text-sm flex items-center gap-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Remove
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Help Text */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Permission Guidelines</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li><strong>View:</strong> User can see the field value</li>
                  <li><strong>Edit:</strong> User can modify the field value (requires View permission)</li>
                  <li><strong>Delete:</strong> User can delete the custom field definition (requires View permission)</li>
                  <li className="mt-2 text-xs text-gray-500">
                    Note: If no permissions are defined for a role, the default is View-only access
                  </li>
                </ul>
              </div>
            </>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
