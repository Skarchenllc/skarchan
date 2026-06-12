'use client'

import { useState, useEffect } from 'react'
import { X, Check } from 'lucide-react'
import { apiClient } from '@/lib/administration/api-client'

interface Role {
  id: number
  name: string
  description: string
  permission_ids: number[]
}

interface Permission {
  id: number
  name: string
  description: string
  resource: string
  action: string
}

interface RolePermissionsProps {
  role: Role | null
  onClose: () => void
}

export function RolePermissions({ role, onClose }: RolePermissionsProps) {
  const [formData, setFormData] = useState({
    name: role?.name || '',
    description: role?.description || '',
    permission_ids: role?.permission_ids || [],
  })
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTab, setSelectedTab] = useState<string>('all')

  useEffect(() => {
    fetchPermissions()
  }, [])

  const fetchPermissions = async () => {
    try {
      const data = await apiClient.get('/permissions')
      setPermissions(data)
    } catch (error) {
      console.error('Failed to fetch permissions:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (role) {
        await apiClient.put(`/roles/${role.id}`, formData)
      } else {
        await apiClient.post('/roles', formData)
      }
      onClose()
    } catch (error) {
      console.error('Failed to save role:', error)
      alert('Failed to save role')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const togglePermission = (permissionId: number) => {
    setFormData((prev) => ({
      ...prev,
      permission_ids: prev.permission_ids.includes(permissionId)
        ? prev.permission_ids.filter((id) => id !== permissionId)
        : [...prev.permission_ids, permissionId],
    }))
  }

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.resource]) {
      acc[permission.resource] = []
    }
    acc[permission.resource].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)

  const resources = Object.keys(groupedPermissions)
  const displayPermissions =
    selectedTab === 'all'
      ? permissions
      : groupedPermissions[selectedTab] || []

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background border rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-background border-b p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {role ? 'Edit Role' : 'Create Role'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-md transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Role Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g., Administrator"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Description *
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Describe the role and its purpose"
              />
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <label className="block text-sm font-medium mb-4">Permissions</label>

            {/* Resource Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              <button
                type="button"
                onClick={() => setSelectedTab('all')}
                className={`px-4 py-2 rounded-md whitespace-nowrap transition-colors ${
                  selectedTab === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                All Permissions
              </button>
              {resources.map((resource) => (
                <button
                  key={resource}
                  type="button"
                  onClick={() => setSelectedTab(resource)}
                  className={`px-4 py-2 rounded-md whitespace-nowrap transition-colors ${
                    selectedTab === resource
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {resource}
                </button>
              ))}
            </div>

            {/* Permissions List */}
            {displayPermissions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No permissions available
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {displayPermissions.map((permission) => (
                  <label
                    key={permission.id}
                    className={`flex items-start gap-3 p-3 border rounded-md cursor-pointer transition-colors ${
                      formData.permission_ids.includes(permission.id)
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        checked={formData.permission_ids.includes(permission.id)}
                        onChange={() => togglePermission(permission.id)}
                        className="h-4 w-4"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{permission.name}</span>
                        {formData.permission_ids.includes(permission.id) && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {permission.description}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs bg-muted px-2 py-1 rounded">
                          {permission.resource}
                        </span>
                        <span className="text-xs bg-muted px-2 py-1 rounded">
                          {permission.action}
                        </span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div className="mt-4 p-3 bg-muted/50 rounded-md">
              <p className="text-sm text-muted-foreground">
                {formData.permission_ids.length} permission(s) selected
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : role ? 'Update Role' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
