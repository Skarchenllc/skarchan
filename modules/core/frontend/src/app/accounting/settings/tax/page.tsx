'use client';

import { useState } from 'react';
import { Receipt, Plus, Edit2, Trash2, Percent } from 'lucide-react';

interface TaxRate {
  id: string;
  name: string;
  rate: number;
  type: 'Sales' | 'Purchase' | 'Both';
  description: string;
  isDefault: boolean;
  isActive: boolean;
}

export default function TaxSettingsPage() {
  const [taxRates, setTaxRates] = useState<TaxRate[]>([
    {
      id: '1',
      name: 'Standard VAT',
      rate: 20,
      type: 'Both',
      description: 'Standard Value Added Tax rate',
      isDefault: true,
      isActive: true,
    },
    {
      id: '2',
      name: 'Reduced VAT',
      rate: 5,
      type: 'Both',
      description: 'Reduced VAT for essential goods',
      isDefault: false,
      isActive: true,
    },
    {
      id: '3',
      name: 'Zero-Rated',
      rate: 0,
      type: 'Both',
      description: 'Zero-rated for exports and exempt items',
      isDefault: false,
      isActive: true,
    },
    {
      id: '4',
      name: 'Import Duty',
      rate: 10,
      type: 'Purchase',
      description: 'Import duty on purchased goods',
      isDefault: false,
      isActive: true,
    },
  ]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Sales':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Purchase':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Both':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Receipt className="w-8 h-8 text-blue-600" />
            Tax Settings
          </h1>
        </div>
        <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4 mr-2" />
          New Tax Rate
        </button>
      </div>

      {/* Compact Statistics Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Percent className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Active Tax Rates</span>
            <span className="text-xl font-bold text-gray-900">{taxRates.filter(t => t.isActive).length}</span>
          </div>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Default Tax Rate</span>
            <span className="text-xl font-bold text-gray-900">{taxRates.find(t => t.isDefault)?.rate}%</span>
          </div>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <Edit2 className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Tax Types</span>
            <span className="text-xl font-bold text-gray-900">{new Set(taxRates.map(t => t.type)).size}</span>
          </div>
        </div>
      </div>

      {/* Tax Rates Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Tax Rates</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tax Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {taxRates.map((tax) => (
                <tr key={tax.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">{tax.name}</div>
                      {tax.isDefault && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          Default
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm font-semibold text-gray-900">
                      <Percent className="w-4 h-4 mr-1 text-gray-400" />
                      {tax.rate}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTypeColor(tax.type)}`}>
                      {tax.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">{tax.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      tax.isActive
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                      {tax.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tax Settings Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">General Tax Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tax Number / VAT Registration
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="GB123456789"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tax Period
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option>Monthly</option>
              <option>Quarterly</option>
              <option>Annually</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="ml-2 text-sm text-gray-700">Enable tax-inclusive pricing</span>
            </label>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Save Settings
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Receipt className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">About Tax Settings</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Configure your tax rates and settings to ensure accurate tax calculations on all transactions.
                Set up different rates for sales and purchases, and mark your default tax rate for automatic application.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
