'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, DollarSign } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { api } from '@/lib/api';

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    try {
      const data = await api.pm_budgets.list();
      const budgetsArray = Array.isArray(data) ? data : (data.budgets || data.data || []);
      setBudgets(budgetsArray);
    } catch (error) {
      console.error('Failed to load budgets:', error);
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredBudgets = budgets.filter((budget) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (budget.budget_name && budget.budget_name.toLowerCase().includes(search)) ||
      (budget.fiscal_year && budget.fiscal_year.toLowerCase().includes(search)) ||
      (budget.category && budget.category.toLowerCase().includes(search))
    );
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold text-black">Budgets</h1>
        </div>
        <Link href="/budgets/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Budget
        </Link>
      </div>

      {/* Search Filter */}
      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search budgets by name, fiscal year, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Budgets Table */}
      <div className="card">
        {filteredBudgets.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No budgets found</p>
            <Link href="/budgets/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Budget
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-black">Budget Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Fiscal Year</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Category</th>
                  <th className="text-right py-3 px-4 font-semibold text-black">Allocated</th>
                  <th className="text-right py-3 px-4 font-semibold text-black">Spent</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Status</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBudgets.map((budget) => (
                  <tr key={budget.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-black font-medium">{budget.budget_name}</td>
                    <td className="py-3 px-4 text-gray-600">{budget.fiscal_year}</td>
                    <td className="py-3 px-4 text-gray-600 capitalize">{budget.category || '-'}</td>
                    <td className="py-3 px-4 text-right text-gray-600">${budget.allocated_amount?.toLocaleString() || 0}</td>
                    <td className="py-3 px-4 text-right text-gray-600">${budget.spent_amount?.toLocaleString() || 0}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                        {budget.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/budgets/${budget.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
