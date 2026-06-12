'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { UserForm } from '@/components/user-form'

interface User {
  id: number
  email: string
  username: string
  full_name: string
  is_active: boolean
  is_superuser: boolean
  role_ids: number[]
  created_at: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showUserForm, setShowUserForm] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await apiClient.get('/users')
      setUsers(data)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = () => {
    setSelectedUser(null)
    setShowUserForm(true)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setShowUserForm(true)
  }

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      await apiClient.delete(`/users/${userId}`)
      fetchUsers()
    } catch (error) {
      console.error('Failed to delete user:', error)
    }
  }

  const handleFormClose = () => {
    setShowUserForm(false)
    setSelectedUser(null)
    fetchUsers()
  }

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage system users and their access
          </p>
        </div>
        <button
          onClick={handleCreateUser}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add User
        </button>
      </div>

      <div className="flex items-center gap-2 p-2 border rounded-md">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 outline-none bg-transparent"
        />
      </div>

      {loading ? (
        <div className="text-center py-8 pt-24">Loading users...</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-4 font-medium">Username</th>
                <th className="text-left p-4 font-medium">Email</th>
                <th className="text-left p-4 font-medium">Full Name</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Role</th>
                <th className="text-right p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-muted-foreground">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-t hover:bg-muted/50">
                    <td className="p-4">{user.username}</td>
                    <td className="p-4">{user.email}</td>
                    <td className="p-4">{user.full_name}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          user.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4">
                      {user.is_superuser ? (
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                          Superuser
                        </span>
                      ) : (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          User
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-2 hover:bg-muted rounded-md transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 hover:bg-destructive/10 text-destructive rounded-md transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showUserForm && (
        <UserForm
          user={selectedUser}
          onClose={handleFormClose}
        />
      )}
    </div>
  )
}
