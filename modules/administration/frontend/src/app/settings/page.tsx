'use client'

import { useState, useEffect } from 'react'
import { Save, RefreshCw } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

interface Settings {
  app_name: string
  app_description: string
  maintenance_mode: boolean
  allow_registration: boolean
  require_email_verification: boolean
  session_timeout: number
  max_login_attempts: number
  password_min_length: number
  password_require_uppercase: boolean
  password_require_numbers: boolean
  password_require_special: boolean
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    app_name: 'Administration Module',
    app_description: 'System administration and management',
    maintenance_mode: false,
    allow_registration: true,
    require_email_verification: true,
    session_timeout: 30,
    max_login_attempts: 5,
    password_min_length: 8,
    password_require_uppercase: true,
    password_require_numbers: true,
    password_require_special: true,
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      // const data = await apiClient.get('/settings')
      // setSettings(data)
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      // await apiClient.put('/settings', settings)
      alert('Settings saved successfully')
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (key: keyof Settings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">
            Configure system-wide settings and preferences
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 pt-24">Loading settings...</div>
      ) : (
        <div className="space-y-6">
          {/* General Settings */}
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">General Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Application Name
                </label>
                <input
                  type="text"
                  value={settings.app_name}
                  onChange={(e) => handleChange('app_name', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Application Description
                </label>
                <textarea
                  value={settings.app_description}
                  onChange={(e) => handleChange('app_description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium">
                    Maintenance Mode
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Enable maintenance mode to restrict access
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.maintenance_mode}
                  onChange={(e) => handleChange('maintenance_mode', e.target.checked)}
                  className="h-4 w-4"
                />
              </div>
            </div>
          </div>

          {/* Authentication Settings */}
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Authentication Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium">
                    Allow User Registration
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Allow new users to register
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.allow_registration}
                  onChange={(e) => handleChange('allow_registration', e.target.checked)}
                  className="h-4 w-4"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium">
                    Require Email Verification
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Users must verify their email
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.require_email_verification}
                  onChange={(e) =>
                    handleChange('require_email_verification', e.target.checked)
                  }
                  className="h-4 w-4"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Session Timeout (minutes)
                </label>
                <input
                  type="number"
                  value={settings.session_timeout}
                  onChange={(e) => handleChange('session_timeout', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Max Login Attempts
                </label>
                <input
                  type="number"
                  value={settings.max_login_attempts}
                  onChange={(e) =>
                    handleChange('max_login_attempts', parseInt(e.target.value))
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Password Policy */}
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Password Policy</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Minimum Password Length
                </label>
                <input
                  type="number"
                  value={settings.password_min_length}
                  onChange={(e) =>
                    handleChange('password_min_length', parseInt(e.target.value))
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  Require Uppercase Letters
                </label>
                <input
                  type="checkbox"
                  checked={settings.password_require_uppercase}
                  onChange={(e) =>
                    handleChange('password_require_uppercase', e.target.checked)
                  }
                  className="h-4 w-4"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  Require Numbers
                </label>
                <input
                  type="checkbox"
                  checked={settings.password_require_numbers}
                  onChange={(e) =>
                    handleChange('password_require_numbers', e.target.checked)
                  }
                  className="h-4 w-4"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  Require Special Characters
                </label>
                <input
                  type="checkbox"
                  checked={settings.password_require_special}
                  onChange={(e) =>
                    handleChange('password_require_special', e.target.checked)
                  }
                  className="h-4 w-4"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
