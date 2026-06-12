"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import { Plus, Edit2, Trash2, X, Award, TrendingUp, ArrowRight, DollarSign, Shield } from "lucide-react";

interface Employee {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
}

interface Bonus {
  id: string;
  employee_id: string;
  bonus_type: string;
  bonus_name: string;
  amount: number;
  currency: string;
  performance_period_start: string;
  performance_period_end: string;
  payout_date: string;
  status: string;
  approved_by: string;
  approved_at: string;
  notes: string;
}

export default function BonusesManagementPage() {
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingBonus, setEditingBonus] = useState<Bonus | null>(null);

  // Form state
  const [form, setForm] = useState({
    employee_id: "",
    bonus_type: "annual",
    bonus_name: "",
    amount: 0,
    currency: "USD",
    performance_period_start: "",
    performance_period_end: "",
    payout_date: "",
    status: "pending",
    notes: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bonusesRes, employeesRes] = await Promise.all([
        fetch("/api/hr/compensation/bonuses"),
        fetch("/api/hr/employees")
      ]);

      if (bonusesRes.ok) setBonuses(await bonusesRes.json());
      if (employeesRes.ok) setEmployees(await employeesRes.json());
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeName = (employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    return emp ? `${emp.first_name} ${emp.last_name}` : "Unknown";
  };

  const openModal = (bonus?: Bonus) => {
    if (bonus) {
      setEditingBonus(bonus);
      setForm({
        employee_id: bonus.employee_id,
        bonus_type: bonus.bonus_type,
        bonus_name: bonus.bonus_name || "",
        amount: bonus.amount || 0,
        currency: bonus.currency || "USD",
        performance_period_start: bonus.performance_period_start || "",
        performance_period_end: bonus.performance_period_end || "",
        payout_date: bonus.payout_date || "",
        status: bonus.status || "pending",
        notes: bonus.notes || ""
      });
    } else {
      setEditingBonus(null);
      setForm({
        employee_id: "",
        bonus_type: "annual",
        bonus_name: "",
        amount: 0,
        currency: "USD",
        performance_period_start: "",
        performance_period_end: "",
        payout_date: "",
        status: "pending",
        notes: ""
      });
    }
    setShowModal(true);
  };

  const saveBonus = async () => {
    try {
      const url = editingBonus
        ? `/api/hr/compensation/bonuses/${editingBonus.id}`
        : "/api/hr/compensation/bonuses";

      const method = editingBonus ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      if (response.ok) {
        setShowModal(false);
        loadData();
      } else {
        console.error("Failed to save bonus");
      }
    } catch (error) {
      console.error("Error saving bonus:", error);
    }
  };

  const deleteBonus = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bonus?")) return;

    try {
      const response = await fetch(`/api/hr/compensation/bonuses/${id}`, {
        method: "DELETE"
      });

      if (response.ok) {
        loadData();
      } else {
        console.error("Failed to delete bonus");
      }
    } catch (error) {
      console.error("Error deleting bonus:", error);
    }
  };

  const getBonusTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      annual: "bg-blue-100 text-blue-800",
      quarterly: "bg-green-100 text-green-800",
      spot: "bg-yellow-100 text-yellow-800",
      sign_on: "bg-purple-100 text-purple-800",
      retention: "bg-pink-100 text-pink-800",
      performance: "bg-indigo-100 text-indigo-800"
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-blue-100 text-blue-800",
      paid: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const filteredBonuses = filterStatus === "all"
    ? bonuses
    : bonuses.filter(b => b.status === filterStatus);

  const totalPending = bonuses.filter(b => b.status === "pending").reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalPaid = bonuses.filter(b => b.status === "paid").reduce((sum, b) => sum + (b.amount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-200">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-t-lg shadow">
          {/* Page Header */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Bonuses & Incentives Management</h1>
            <p className="text-sm text-gray-600 mt-1">Manage employee bonuses and performance incentives</p>
          </div>

          {/* Quick Links Section */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase">Other Compensation Modules</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Salary Structure Link */}
              <Link
                href="/compensation/salary"
                className="group border border-gray-200 bg-white rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 rounded-lg p-2 group-hover:bg-blue-200 transition">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Salary Structure</h3>
                      <p className="text-xs text-gray-600">Manage pay grades and salary bands</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition" />
                </div>
              </Link>

              {/* Benefits Link */}
              <Link
                href="/compensation/benefits"
                className="group border border-gray-200 bg-white rounded-lg p-4 hover:border-green-500 hover:bg-green-50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Benefits Plans</h3>
                      <p className="text-xs text-gray-600">Manage health, dental, and other benefits</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-green-600 transition" />
                </div>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center">

                <div>
                  <div className="text-xs text-gray-500">Total Bonuses</div>
                  <div className="text-lg font-bold text-gray-900">{bonuses.length}</div>
                </div>
              </div>
              <div className="flex items-center">
                <TrendingUp className="w-10 h-10 text-yellow-500 mr-3" />
                <div>
                  <div className="text-xs text-gray-500">Pending Amount</div>
                  <div className="text-lg font-bold text-yellow-600">${totalPending.toLocaleString()}</div>
                </div>
              </div>
              <div className="flex items-center">
                <TrendingUp className="w-10 h-10 text-green-500 mr-3" />
                <div>
                  <div className="text-xs text-gray-500">Paid YTD</div>
                  <div className="text-lg font-bold text-green-600">${totalPaid.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters & Actions */}
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">All Statuses ({bonuses.length})</option>
                <option value="pending">Pending ({bonuses.filter(b => b.status === "pending").length})</option>
                <option value="approved">Approved ({bonuses.filter(b => b.status === "approved").length})</option>
                <option value="paid">Paid ({bonuses.filter(b => b.status === "paid").length})</option>
                <option value="cancelled">Cancelled ({bonuses.filter(b => b.status === "cancelled").length})</option>
              </select>
            </div>
            <button
              onClick={() => openModal()}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Bonus
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading bonuses...</p>
              </div>
            ) : filteredBonuses.length === 0 ? (
              <div className="text-center py-12">
                <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No bonuses found</p>
                <p className="text-sm text-gray-400">Add your first bonus to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Employee</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Bonus Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Type</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Performance Period</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Payout Date</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {filteredBonuses.map((bonus) => (
                      <tr key={bonus.id} className="hover:bg-blue-50 transition">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 border border-gray-300">
                          {getEmployeeName(bonus.employee_id)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 border border-gray-300">{bonus.bonus_name || "-"}</td>
                        <td className="px-4 py-3 border border-gray-300">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getBonusTypeBadge(bonus.bonus_type)}`}>
                            {bonus.bonus_type.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 border border-gray-300">
                          ${bonus.amount ? bonus.amount.toLocaleString() : "0"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 border border-gray-300">
                          {bonus.performance_period_start && bonus.performance_period_end
                            ? `${new Date(bonus.performance_period_start).toLocaleDateString()} - ${new Date(bonus.performance_period_end).toLocaleDateString()}`
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 border border-gray-300">
                          {bonus.payout_date ? new Date(bonus.payout_date).toLocaleDateString() : "-"}
                        </td>
                        <td className="px-4 py-3 text-center border border-gray-300">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(bonus.status)}`}>
                            {bonus.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center border border-gray-300">
                          <div className="flex justify-center space-x-2">
                            <button
                              onClick={() => openModal(bonus)}
                              className="text-blue-600 hover:text-blue-800 transition"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteBonus(bonus.id)}
                              className="text-red-600 hover:text-red-800 transition"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Bonus Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {editingBonus ? "Edit Bonus" : "Add New Bonus"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
                  <select
                    value={form.employee_id}
                    onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name} ({emp.employee_code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bonus Type *</label>
                  <select
                    value={form.bonus_type}
                    onChange={(e) => setForm({ ...form, bonus_type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="annual">Annual</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="spot">Spot Bonus</option>
                    <option value="sign_on">Sign-On</option>
                    <option value="retention">Retention</option>
                    <option value="performance">Performance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bonus Name</label>
                <input
                  type="text"
                  value={form.bonus_name}
                  onChange={(e) => setForm({ ...form, bonus_name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="e.g., 2026 Q1 Performance Bonus"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    min="0"
                    step="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="paid">Paid</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Performance Period Start</label>
                  <input
                    type="date"
                    value={form.performance_period_start}
                    onChange={(e) => setForm({ ...form, performance_period_start: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Performance Period End</label>
                  <input
                    type="date"
                    value={form.performance_period_end}
                    onChange={(e) => setForm({ ...form, performance_period_end: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payout Date</label>
                <input
                  type="date"
                  value={form.payout_date}
                  onChange={(e) => setForm({ ...form, payout_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                  placeholder="Additional notes or comments"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={saveBonus}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                {editingBonus ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
