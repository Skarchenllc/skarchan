"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/accounting/api-client";
import {
  Plus,
  Lock,
  Unlock,
  CheckCircle,
  Calendar,
  AlertCircle,
  FileText,
} from "lucide-react";
import { useToast } from "@/context/accounting/toast-context";

interface Period {
  id: string;
  period_name: string;
  period_code: string;
  period_type: string;
  fiscal_year: number;
  fiscal_year_name?: string;
  start_date: string;
  end_date: string;
  status: string;
  allow_adjustments: boolean;
  adjustment_count: number;
  closed_by?: string;
  closed_at?: string;
  locked_by?: string;
  locked_at?: string;
  created_at: string;
}

export default function PeriodsPage() {
  const { success, error } = useToast();
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [filterYear, setFilterYear] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");

  const [bulkFormData, setbulkFormData] = useState({
    fiscal_year: new Date().getFullYear(),
    fiscal_year_name: `FY ${new Date().getFullYear()}`,
    start_date: `${new Date().getFullYear()}-01-01`,
    end_date: `${new Date().getFullYear()}-12-31`,
    period_type: "month",
    create_year_period: true,
  });

  useEffect(() => {
    loadPeriods();
  }, [filterYear, filterStatus]);

  const loadPeriods = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterYear) params.append("fiscal_year", filterYear);
      if (filterStatus) params.append("status", filterStatus);

      const response = await apiClient.get(
        `/periods/periods?${params.toString()}`
      );
      setPeriods(response.data);
    } catch (err) {
      console.error("Error loading periods:", err);
      error("Failed to load periods");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post("/periods/periods/bulk-create", bulkFormData);
      success("Periods created successfully");
      setShowBulkForm(false);
      loadPeriods();
    } catch (err: any) {
      console.error("Error creating periods:", err);
      error(err.response?.data?.detail || "Failed to create periods");
    }
  };

  const handleClosePeriod = async (periodId: string) => {
    if (!confirm("Are you sure you want to close this period?")) return;

    try {
      await apiClient.post(`/periods/periods/${periodId}/close`, {
        closed_by: "Current User",
        closing_notes: "Period closed",
      });
      success("Period closed successfully");
      loadPeriods();
    } catch (err: any) {
      console.error("Error closing period:", err);
      error(err.response?.data?.detail || "Failed to close period");
    }
  };

  const handleReopenPeriod = async (periodId: string) => {
    const reason = prompt("Please provide a reason for reopening this period:");
    if (!reason) return;

    try {
      await apiClient.post(`/periods/periods/${periodId}/reopen`, {
        reopened_by: "Current User",
        reason: reason,
      });
      success("Period reopened successfully");
      loadPeriods();
    } catch (err: any) {
      console.error("Error reopening period:", err);
      error(err.response?.data?.detail || "Failed to reopen period");
    }
  };

  const handleLockPeriod = async (periodId: string) => {
    if (
      !confirm(
        "Are you sure you want to lock this period? This action cannot be undone!"
      )
    )
      return;

    try {
      await apiClient.post(`/periods/periods/${periodId}/lock`, {
        locked_by: "Current User",
        locked_notes: "Period locked permanently",
      });
      success("Period locked successfully");
      loadPeriods();
    } catch (err: any) {
      console.error("Error locking period:", err);
      error(err.response?.data?.detail || "Failed to lock period");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      open: "bg-green-100 text-green-800",
      closed: "bg-blue-100 text-blue-800",
      locked: "bg-red-100 text-red-800",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get unique fiscal years for filter
  const fiscalYears = Array.from(
    new Set(periods.map((p) => p.fiscal_year))
  ).sort((a, b) => b - a);

  const openPeriods = periods.filter((p) => p.status === "open").length;
  const closedPeriods = periods.filter((p) => p.status === "closed").length;
  const lockedPeriods = periods.filter((p) => p.status === "locked").length;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Period Management
        </h1>
      </div>

      {/* Compact Statistics Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-8">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Total Periods</span>
            <span className="text-xl font-bold text-gray-900">{periods.length}</span>
          </div>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Open Periods</span>
            <span className="text-xl font-bold text-gray-900">{openPeriods}</span>
          </div>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Closed Periods</span>
            <span className="text-xl font-bold text-gray-900">{closedPeriods}</span>
          </div>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Locked Periods</span>
            <span className="text-xl font-bold text-gray-900">{lockedPeriods}</span>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fiscal Year
            </label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Years</option>
              {fiscalYears.map((year) => (
                <option key={year} value={year}>
                  FY {year}
                </option>
              ))}
            </select>
          </div>

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
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="locked">Locked</option>
            </select>
          </div>

          <button
            onClick={() => setShowBulkForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Setup Fiscal Year
          </button>
        </div>
      </div>

      {/* Bulk Create Form */}
      {showBulkForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
            <h2 className="text-2xl font-bold mb-6">Setup Fiscal Year</h2>
            <form onSubmit={handleBulkCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fiscal Year *
                  </label>
                  <input
                    type="number"
                    value={bulkFormData.fiscal_year}
                    onChange={(e) =>
                      setbulkFormData({
                        ...bulkFormData,
                        fiscal_year: parseInt(e.target.value),
                        fiscal_year_name: `FY ${e.target.value}`,
                      })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fiscal Year Name *
                  </label>
                  <input
                    type="text"
                    value={bulkFormData.fiscal_year_name}
                    onChange={(e) =>
                      setbulkFormData({
                        ...bulkFormData,
                        fiscal_year_name: e.target.value,
                      })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={bulkFormData.start_date}
                    onChange={(e) =>
                      setbulkFormData({
                        ...bulkFormData,
                        start_date: e.target.value,
                      })
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
                    value={bulkFormData.end_date}
                    onChange={(e) =>
                      setbulkFormData({
                        ...bulkFormData,
                        end_date: e.target.value,
                      })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Period Type *
                </label>
                <select
                  value={bulkFormData.period_type}
                  onChange={(e) =>
                    setbulkFormData({
                      ...bulkFormData,
                      period_type: e.target.value,
                    })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="month">Monthly (12 periods)</option>
                  <option value="quarter">Quarterly (4 periods)</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="createYear"
                  checked={bulkFormData.create_year_period}
                  onChange={(e) =>
                    setbulkFormData({
                      ...bulkFormData,
                      create_year_period: e.target.checked,
                    })
                  }
                  className="mr-2"
                />
                <label htmlFor="createYear" className="text-sm text-gray-700">
                  Also create year-level period
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBulkForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Periods
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Periods Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Period Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Period Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date Range
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Adjustments
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  Loading periods...
                </td>
              </tr>
            ) : periods.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No periods found. Click "Setup Fiscal Year" to get started.
                </td>
              </tr>
            ) : (
              periods.map((period) => (
                <tr key={period.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {period.period_code}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {period.period_name}
                    </div>
                    {period.fiscal_year_name && (
                      <div className="text-xs text-gray-500">
                        {period.fiscal_year_name}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 capitalize">
                      {period.period_type}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(period.start_date)}
                    </div>
                    <div className="text-xs text-gray-500">
                      to {formatDate(period.end_date)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
                        period.status
                      )}`}
                    >
                      {period.status}
                    </span>
                    {period.allow_adjustments && period.status === "closed" && (
                      <div className="text-xs text-gray-500 mt-1">
                        Adjustments allowed
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {period.adjustment_count}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      {period.status === "open" && (
                        <button
                          onClick={() => handleClosePeriod(period.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Close Period"
                        >
                          <Lock className="w-4 h-4" />
                        </button>
                      )}
                      {period.status === "closed" && (
                        <>
                          <button
                            onClick={() => handleReopenPeriod(period.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Reopen Period"
                          >
                            <Unlock className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleLockPeriod(period.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Lock Period (Permanent)"
                          >
                            <AlertCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {period.status === "locked" && (
                        <span className="text-gray-400">No actions</span>
                      )}
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
