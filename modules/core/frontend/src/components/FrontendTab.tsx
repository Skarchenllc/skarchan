'use client';

import { useState } from 'react';
import Button from './Button';
import Card from './Card';
import { useTheme } from '@/contexts/ThemeContext';
import { FiToggleLeft, FiToggleRight } from 'react-icons/fi';

interface FrontendTabProps {
  onMessage: (message: { type: 'success' | 'error'; text: string }) => void;
}

export default function FrontendTab({ onMessage }: FrontendTabProps) {
  const { theme, features, updateTheme, updateFeatures } = useTheme();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Frontend Development</h2>
      </div>

      {/* Theme Settings */}
      <Card title="Theme & Appearance">
        <p className="text-sm text-gray-600 mb-6">
          Customize the frontend appearance including colors, typography, icons, and branding
        </p>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-black mb-4">Color Scheme</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Primary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={theme.primaryColor}
                    onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                    className="w-16 h-10 border-2 border-[#01411C] cursor-pointer"
                  />
                  <input
                    type="text"
                    value={theme.primaryColor}
                    onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-[#01411C] focus:outline-none focus:border-[#5147e6]"
                    placeholder="#5147e6"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Secondary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={theme.secondaryColor}
                    onChange={(e) => updateTheme({ secondaryColor: e.target.value })}
                    className="w-16 h-10 border-2 border-[#01411C] cursor-pointer"
                  />
                  <input
                    type="text"
                    value={theme.secondaryColor}
                    onChange={(e) => updateTheme({ secondaryColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-[#01411C] focus:outline-none focus:border-[#5147e6]"
                    placeholder="#01411C"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-black mb-4">Display Options</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 border border-gray-200 hover:border-[#01411C] transition-colors">
                <div className="flex items-center gap-3">
                  {theme.darkMode ? (
                    <FiToggleRight className="w-6 h-6 text-[#01411C]" />
                  ) : (
                    <FiToggleLeft className="w-6 h-6 text-gray-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-black">Dark Mode</p>
                    <p className="text-xs text-black">Enable dark theme interface</p>
                  </div>
                </div>
                <button
                  onClick={() => updateTheme({ darkMode: !theme.darkMode })}
                  className={`px-4 py-2 border-2 text-sm font-medium transition-colors ${
                    theme.darkMode
                      ? 'border-[#01411C] text-[#01411C]'
                      : 'border-gray-300 text-black'
                  }`}
                >
                  {theme.darkMode ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 hover:border-[#01411C] transition-colors">
                <div className="flex items-center gap-3">
                  {theme.compactView ? (
                    <FiToggleRight className="w-6 h-6 text-[#01411C]" />
                  ) : (
                    <FiToggleLeft className="w-6 h-6 text-gray-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-black">Compact View</p>
                    <p className="text-xs text-black">Reduce spacing and padding</p>
                  </div>
                </div>
                <button
                  onClick={() => updateTheme({ compactView: !theme.compactView })}
                  className={`px-4 py-2 border-2 text-sm font-medium transition-colors ${
                    theme.compactView
                      ? 'border-[#01411C] text-[#01411C]'
                      : 'border-gray-300 text-black'
                  }`}
                >
                  {theme.compactView ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-black mb-4">Typography</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Font Size (px)
                </label>
                <input
                  type="number"
                  value={theme.fontSize}
                  onChange={(e) => updateTheme({ fontSize: parseInt(e.target.value) || 16 })}
                  min="10"
                  max="32"
                  className="w-full px-3 py-2 border border-[#01411C] focus:outline-none focus:border-[#5147e6]"
                  placeholder="16"
                />
                <p className="text-xs text-black mt-1">Range: 10-32px</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Font Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={theme.fontColor}
                    onChange={(e) => updateTheme({ fontColor: e.target.value })}
                    className="w-16 h-10 border-2 border-[#01411C] cursor-pointer"
                  />
                  <input
                    type="text"
                    value={theme.fontColor}
                    onChange={(e) => updateTheme({ fontColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-[#01411C] focus:outline-none focus:border-[#5147e6]"
                    placeholder="#000000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Font Family
                </label>
                <input
                  type="text"
                  value={theme.fontFamily}
                  onChange={(e) => updateTheme({ fontFamily: e.target.value })}
                  className="w-full px-3 py-2 border border-[#01411C] focus:outline-none focus:border-[#5147e6]"
                  placeholder="Inter, sans-serif"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-black mb-4">Branding</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Application Name
                </label>
                <input
                  type="text"
                  value={theme.appName}
                  onChange={(e) => updateTheme({ appName: e.target.value })}
                  className="w-full px-3 py-2 border border-[#01411C] focus:outline-none focus:border-[#5147e6]"
                  placeholder="Core System"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Logo
                </label>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-black mb-1">Upload Logo Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            updateTheme({ logoFile: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full px-3 py-2 border border-[#01411C] focus:outline-none focus:border-[#5147e6]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-black mb-1">Or use URL</label>
                    <input
                      type="text"
                      value={theme.logoUrl}
                      onChange={(e) => updateTheme({ logoUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-[#01411C] focus:outline-none focus:border-[#5147e6]"
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                  {(theme.logoFile || theme.logoUrl) && (
                    <div className="mt-2 p-2 border border-[#01411C]">
                      <img
                        src={theme.logoFile || theme.logoUrl}
                        alt="Logo Preview"
                        className="max-h-16 object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={() => onMessage({ type: 'success', text: 'Theme settings saved successfully!' })}>
              Save Theme Settings
            </Button>
          </div>
        </div>
      </Card>

      {/* Feature Toggles */}
      <Card title="Feature Toggles">
        <p className="text-sm text-gray-600 mb-6">
          Enable or disable specific system features and capabilities
        </p>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-black mb-4">Notifications</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 border border-gray-200 hover:border-[#01411C] transition-colors">
                <div className="flex items-center gap-3">
                  {features.emailNotifications ? (
                    <FiToggleRight className="w-6 h-6 text-[#01411C]" />
                  ) : (
                    <FiToggleLeft className="w-6 h-6 text-gray-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-black">Email Notifications</p>
                    <p className="text-xs text-black">Receive updates via email</p>
                  </div>
                </div>
                <button
                  onClick={() => updateFeatures({ emailNotifications: !features.emailNotifications })}
                  className={`px-4 py-2 border-2 text-sm font-medium transition-colors ${
                    features.emailNotifications
                      ? 'border-[#01411C] text-[#01411C]'
                      : 'border-gray-300 text-black'
                  }`}
                >
                  {features.emailNotifications ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 hover:border-[#01411C] transition-colors">
                <div className="flex items-center gap-3">
                  {features.systemNotifications ? (
                    <FiToggleRight className="w-6 h-6 text-[#01411C]" />
                  ) : (
                    <FiToggleLeft className="w-6 h-6 text-gray-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-black">System Notifications</p>
                    <p className="text-xs text-black">In-app notification alerts</p>
                  </div>
                </div>
                <button
                  onClick={() => updateFeatures({ systemNotifications: !features.systemNotifications })}
                  className={`px-4 py-2 border-2 text-sm font-medium transition-colors ${
                    features.systemNotifications
                      ? 'border-[#01411C] text-[#01411C]'
                      : 'border-gray-300 text-black'
                  }`}
                >
                  {features.systemNotifications ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-black mb-4">Module Features</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 border border-gray-200 hover:border-[#01411C] transition-colors">
                <div className="flex items-center gap-3">
                  {features.showDashboard ? (
                    <FiToggleRight className="w-6 h-6 text-[#01411C]" />
                  ) : (
                    <FiToggleLeft className="w-6 h-6 text-gray-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-black">Dashboard Access</p>
                    <p className="text-xs text-black">Show dashboard page</p>
                  </div>
                </div>
                <button
                  onClick={() => updateFeatures({ showDashboard: !features.showDashboard })}
                  className={`px-4 py-2 border-2 text-sm font-medium transition-colors ${
                    features.showDashboard
                      ? 'border-[#01411C] text-[#01411C]'
                      : 'border-gray-300 text-black'
                  }`}
                >
                  {features.showDashboard ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 hover:border-[#01411C] transition-colors">
                <div className="flex items-center gap-3">
                  {features.enableExports ? (
                    <FiToggleRight className="w-6 h-6 text-[#01411C]" />
                  ) : (
                    <FiToggleLeft className="w-6 h-6 text-gray-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-black">Data Export</p>
                    <p className="text-xs text-black">Allow exporting data to CSV/PDF</p>
                  </div>
                </div>
                <button
                  onClick={() => updateFeatures({ enableExports: !features.enableExports })}
                  className={`px-4 py-2 border-2 text-sm font-medium transition-colors ${
                    features.enableExports
                      ? 'border-[#01411C] text-[#01411C]'
                      : 'border-gray-300 text-black'
                  }`}
                >
                  {features.enableExports ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={() => onMessage({ type: 'success', text: 'Feature settings saved successfully!' })}>
              Save Feature Settings
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
