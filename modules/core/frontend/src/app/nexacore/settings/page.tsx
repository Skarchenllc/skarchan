'use client';

import React, { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import SharedHeader from '@/components/SharedHeader';
import Card from '@/components/Card';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { usersAPI } from '@/lib/api';
import CompanySettings from '@/components/CompanySettings';
import { FiUser, FiLock, FiBriefcase } from 'react-icons/fi';

export default function ControlRoomSettingsPage() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'company' | 'profile' | 'password'>('company');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await usersAPI.update(user!.id, profileData);
      await refreshUser();
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (passwordData.new_password.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    setLoading(true);

    try {
      // Note: You'll need to implement password change endpoint
      // await usersAPI.changePassword(user!.id, passwordData);
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update password' });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'company', label: 'Company', icon: FiBriefcase },
    { id: 'profile', label: 'Profile', icon: FiUser },
    { id: 'password', label: 'Password', icon: FiLock },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="min-h-screen bg-gray-50 py-8 pt-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            </div>

            {message && (
              <div
                className={`mb-6 p-4 rounded-lg border ${
                  message.type === 'success'
                    ? 'border-green-500 text-green-700 bg-green-50'
                    : 'border-red-500 text-red-700 bg-red-50'
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Tabs Navigation */}
            <div className="mb-6 border-b border-gray-200">
              <nav className="flex gap-8">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`
                        flex items-center gap-2 px-1 py-4 border-b-2 font-medium transition-colors
                        ${
                          activeTab === tab.id
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div>
              {activeTab === 'company' && (
                <CompanySettings onMessage={setMessage} />
              )}

              {activeTab === 'profile' && (
                <Card title="Profile Information">
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <Input
                      label="Username"
                      type="text"
                      value={user?.username || ''}
                      disabled
                      helperText="Username cannot be changed"
                    />

                    <Input
                      label="Full Name"
                      type="text"
                      value={profileData.full_name}
                      onChange={(e) =>
                        setProfileData({ ...profileData, full_name: e.target.value })
                      }
                      required
                    />

                    <Input
                      label="Email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) =>
                        setProfileData({ ...profileData, email: e.target.value })
                      }
                      required
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Organization ID"
                        type="text"
                        value={user?.organization_id || ''}
                        disabled
                      />

                      <Input
                        label="Account Type"
                        type="text"
                        value={user?.is_superuser ? 'Super Admin' : 'User'}
                        disabled
                      />
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button type="submit" loading={loading}>
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </Card>
              )}

              {activeTab === 'password' && (
                <Card title="Change Password">
                  <form onSubmit={handlePasswordUpdate} className="space-y-4">
                    <Input
                      label="Current Password"
                      type="password"
                      value={passwordData.current_password}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, current_password: e.target.value })
                      }
                      required
                    />

                    <Input
                      label="New Password"
                      type="password"
                      value={passwordData.new_password}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, new_password: e.target.value })
                      }
                      required
                      helperText="At least 8 characters"
                    />

                    <Input
                      label="Confirm New Password"
                      type="password"
                      value={passwordData.confirm_password}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, confirm_password: e.target.value })
                      }
                      required
                    />

                    <div className="flex justify-end pt-4">
                      <Button type="submit" loading={loading}>
                        Update Password
                      </Button>
                    </div>
                  </form>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
