'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

interface User {
  id: number
  email: string
  username: string
  full_name: string
  is_active: boolean
  is_superuser: boolean
  role_ids: number[]
}

interface Role {
  id: number
  name: string
}

interface UserFormProps {
  user: User | null
  onClose: () => void
}

export function UserForm({ user, onClose }: UserFormProps) {
  const [formData, setFormData] = useState({
    email: user?.email || '',
    username: user?.username || '',
    full_name: user?.full_name || '',
    password: '',
    is_active: user?.is_active ?? true,
    is_superuser: user?.is_superuser ?? false,
    role_ids: user?.role_ids || [],
  })
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      const data = await apiClient.get('/roles')
      setRoles(data)
    } catch (error) {
      console.error('Failed to fetch roles:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (user) {
        await apiClient.put(`/users/${user.id}`, formData)
      } else {
        await apiClient.post('/users', formData)
      }
      onClose()
    } catch (error) {
      console.error('Failed to save user:', error)
      alert('Failed to save user')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const toggleRole = (roleId: number) => {
    setFormData((prev) => ({
      ...prev,
      role_ids: prev.role_ids.includes(roleId)
        ? prev.role_ids.filter((id) => id !== roleId)
        : [...prev.role_ids, roleId],
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-background border-b p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {user ? 'Edit User' : 'Create User'}
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
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Username *
              </label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Password {!user && '*'}
              </label>
              <input
                type="password"
                required={!user}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder={user ? 'Leave blank to keep current password' : '********'}
              />
            </div>

            <div className="border rounded-lg p-4 space-y-3">
              <label className="block text-sm font-medium">Roles</label>
              {roles.length === 0 ? (
                <p className="text-sm text-muted-foreground">No roles available</p>
              ) : (
                <div className="space-y-2">
                  {roles.map((role) => (
                    <label
                      key={role.id}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.role_ids.includes(role.id)}
                        onChange={() => toggleRole(role.id)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">{role.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => handleChange('is_active', e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium">Active</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_superuser}
                  onChange={(e) => handleChange('is_superuser', e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium">Superuser</span>
              </label>
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
              {loading ? 'Saving...' : user ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
