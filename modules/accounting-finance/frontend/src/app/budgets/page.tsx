"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/context/toast-context";

interface Budget {
  id: string;
  budget_code: string;
  name: string;
  description?: string;
  budget_type: string;
  period_type: string;
  start_date: string;
  end_date: string;
  status: string;
  total_budget_amount: number;
  total_actual_amount: number;
  total_variance: number;
  variance_percentage: number;
  department?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
}

export default function BudgetsPage() {
  const { success, error } = useToast();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");
  const [filterDepartment, setFilterDepartment] = useState<string>("");

  const [formData, setFormData] = useState({
    budget_code: "",
    name: "",
    description: "",
    budget_type: "operational",
    period_type: "annually",
    start_date: "",
    end_date: "",
    department: "",
  });

  useEffect(() => {
    loadBudgets();
  }, [filterStatus, filterType, filterDepartment]);

  const loadBudgets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus) params.append("status", filterStatus);
      if (filterType) params.append("budget_type", filterType);
      if (filterDepartment) params.append("department", filterDepartment);

      const response = await apiClient.get(
        `/budgets/budgets?${params.toString()}`
      );
      setBudgets(response.data);
    } catch (err) {
      console.error("Error loading budgets:", err);
      error("Failed to load budgets");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBudget) {
        await apiClient.put(`/budgets/budgets/${editingBudget.id}`, formData);
        success("Budget updated successfully");
      } else {
        await apiClient.post("/budgets/budgets", formData);
        success("Budget created successfully");
      }
      resetForm();
      loadBudgets();
    } catch (err: any) {
      console.error("Error saving budget:", err);
      error(err.response?.data?.detail || "Failed to save budget");
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({
      budget_code: budget.budget_code,
      name: budget.name,
      description: budget.description || "",
      budget_type: budget.budget_type,
      period_type: budget.period_type,
      start_date: budget.start_date,
      end_date: budget.end_date,
      department: budget.department || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (budgetId: string) => {
    if (!confirm("Are you sure you want to archive this budget?")) return;

    try {
      await apiClient.delete(`/budgets/budgets/${budgetId}`);
      success("Budget archived successfully");
      loadBudgets();
    } catch (err) {
      console.error("Error deleting budget:", err);
      error("Failed to archive budget");
    }
  };

  const handleApprove = async (budgetId: string) => {
    try {
      await apiClient.post(`/budgets/budgets/${budgetId}/approve`, {
        approved_by: "Current User", // TODO: Get from auth context
        notes: "Approved",
      });
      success("Budget approved successfully");
      loadBudgets();
    } catch (err: any) {
      console.error("Error approving budget:", err);
      error(err.response?.data?.detail || "Failed to approve budget");
    }
  };

  const resetForm = () => {
    setFormData({
      budget_code: "",
      name: "",
      description: "",
      budget_type: "operational",
      period_type: "annually",
      start_date: "",
      end_date: "",
      department: "",
    });
    setEditingBudget(null);
    setShowForm(false);
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800",
      active: "bg-green-100 text-green-800",
      closed: "bg-blue-100 text-blue-800",
      archived: "bg-red-100 text-red-800",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Calculate summary stats
  const totalBudgeted = budgets.reduce(
    (sum, b) => sum + (b.total_budget_amount || 0),
    0
  );
  const totalActual = budgets.reduce(
    (sum, b) => sum + (b.total_actual_amount || 0),
    0
  );
  const totalVariance = totalBudgeted - totalActual;
  const activeBudgets = budgets.filter((b) => b.status === "active").length;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Budget Management
        </h1>
        <p className="text-gray-600">Plan and control your financial budgets</p>
      </div>

      {/* Compact Statistics Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-8">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Total Budgets</span>
            <span className="text-xl font-bold text-gray-900">{budgets.length}</span>
          </div>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Active Budgets</span>
            <span className="text-xl font-bold text-gray-900">{activeBudgets}</span>
          </div>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Total Budgeted</span>
            <span className="text-xl font-bold text-gray-900">{formatCurrency(totalBudgeted)}</span>
          </div>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            {totalVariance >= 0 ? (
              <TrendingUp className="w-5 h-5 text-gray-900" />
            ) : (
              <TrendingDown className="w-5 h-5 text-gray-900" />
            )}
            <span className="text-sm text-gray-600">Total Variance</span>
            <span className="text-xl font-bold text-gray-900">{formatCurrency(totalVariance)}</span>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Budget Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="operational">Operational</option>
              <option value="capital">Capital</option>
              <option value="project">Project</option>
              <option value="departmental">Departmental</option>
              <option value="master">Master</option>
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
            <input
              type="text"
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              placeholder="Filter by department"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Budget
          </button>
        </div>
      </div>

      {/* Budget Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">
              {editingBudget ? "Edit Budget" : "New Budget"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget Code *
                  </label>
                  <input
                    type="text"
                    value={formData.budget_code}
                    onChange={(e) =>
                      setFormData({ ...formData, budget_code: e.target.value })
                    }
                    disabled={!!editingBudget}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget Type *
                  </label>
                  <select
                    value={formData.budget_type}
                    onChange={(e) =>
                      setFormData({ ...formData, budget_type: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="operational">Operational</option>
                    <option value="capital">Capital</option>
                    <option value="project">Project</option>
                    <option value="departmental">Departmental</option>
                    <option value="master">Master</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Period Type *
                  </label>
                  <select
                    value={formData.period_type}
                    onChange={(e) =>
                      setFormData({ ...formData, period_type: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annually">Annually</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingBudget ? "Update" : "Create"} Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Budgets List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Budget Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Period
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Budgeted
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actual
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Variance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                  Loading budgets...
                </td>
              </tr>
            ) : budgets.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                  No budgets found
                </td>
              </tr>
            ) : (
              budgets.map((budget) => (
                <tr key={budget.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {budget.budget_code}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{budget.name}</div>
                    {budget.department && (
                      <div className="text-xs text-gray-500">
                        {budget.department}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 capitalize">
                      {budget.budget_type}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 capitalize flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {budget.period_type}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(budget.start_date).toLocaleDateString()} -{" "}
                      {new Date(budget.end_date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatCurrency(budget.total_budget_amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatCurrency(budget.total_actual_amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className={`text-sm font-medium ${
                        budget.total_variance >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {formatCurrency(budget.total_variance)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {budget.variance_percentage.toFixed(1)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
                        budget.status
                      )}`}
                    >
                      {budget.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      {budget.status === "draft" && (
                        <button
                          onClick={() => handleApprove(budget.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Approve"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(budget)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(budget.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Archive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
