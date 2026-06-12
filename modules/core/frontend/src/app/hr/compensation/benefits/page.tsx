"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navigation from "@/components/hr/Navigation";
import { Plus, Edit2, Trash2, X, Shield, Heart, Eye, Briefcase, ArrowRight, DollarSign, Award } from "lucide-react";

interface BenefitsPlan {
  id: string;
  plan_code: string;
  plan_name: string;
  plan_type: string;
  provider_name: string;
  coverage_level: string;
  employee_cost_monthly: number;
  employer_cost_monthly: number;
  total_cost_monthly: number;
  deductible: number;
  out_of_pocket_max: number;
  is_active: boolean;
  effective_date: string;
}

export default function BenefitsManagementPage() {
  const [benefitsPlans, setBenefitsPlans] = useState<BenefitsPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<BenefitsPlan | null>(null);

  // Form state
  const [form, setForm] = useState({
    plan_code: "",
    plan_name: "",
    plan_type: "health",
    provider_name: "",
    coverage_level: "individual",
    employee_cost_monthly: 0,
    employer_cost_monthly: 0,
    total_cost_monthly: 0,
    deductible: 0,
    out_of_pocket_max: 0,
    is_active: true,
    effective_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hr/compensation/benefits-plans");
      if (res.ok) {
        setBenefitsPlans(await res.json());
      }
    } catch (error) {
      console.error("Failed to load benefits plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (plan?: BenefitsPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setForm({
        plan_code: plan.plan_code,
        plan_name: plan.plan_name,
        plan_type: plan.plan_type,
        provider_name: plan.provider_name || "",
        coverage_level: plan.coverage_level || "individual",
        employee_cost_monthly: plan.employee_cost_monthly || 0,
        employer_cost_monthly: plan.employer_cost_monthly || 0,
        total_cost_monthly: plan.total_cost_monthly || 0,
        deductible: plan.deductible || 0,
        out_of_pocket_max: plan.out_of_pocket_max || 0,
        is_active: plan.is_active,
        effective_date: plan.effective_date || new Date().toISOString().split('T')[0]
      });
    } else {
      setEditingPlan(null);
      setForm({
        plan_code: "",
        plan_name: "",
        plan_type: "health",
        provider_name: "",
        coverage_level: "individual",
        employee_cost_monthly: 0,
        employer_cost_monthly: 0,
        total_cost_monthly: 0,
        deductible: 0,
        out_of_pocket_max: 0,
        is_active: true,
        effective_date: new Date().toISOString().split('T')[0]
      });
    }
    setShowModal(true);
  };

  const savePlan = async () => {
    try {
      const url = editingPlan
        ? `/api/hr/compensation/benefits-plans/${editingPlan.id}`
        : "/api/hr/compensation/benefits-plans";

      const method = editingPlan ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      if (response.ok) {
        setShowModal(false);
        loadData();
      } else {
        console.error("Failed to save benefits plan");
      }
    } catch (error) {
      console.error("Error saving benefits plan:", error);
    }
  };

  const deletePlan = async (id: string) => {
    if (!confirm("Are you sure you want to delete this benefits plan?")) return;

    try {
      const response = await fetch(`/api/hr/compensation/benefits-plans/${id}`, {
        method: "DELETE"
      });

      if (response.ok) {
        loadData();
      } else {
        console.error("Failed to delete benefits plan");
      }
    } catch (error) {
      console.error("Error deleting benefits plan:", error);
    }
  };

  const getPlanTypeIcon = (type: string) => {
    switch (type) {
      case "health": return <Heart className="w-5 h-5 text-red-500" />;
      case "dental": return <Shield className="w-5 h-5 text-blue-500" />;
      case "vision": return <Eye className="w-5 h-5 text-green-500" />;
      case "life": return <Briefcase className="w-5 h-5 text-purple-500" />;
      case "401k": return <Briefcase className="w-5 h-5 text-yellow-600" />;
      default: return <Shield className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPlanTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      health: "bg-red-100 text-red-800",
      dental: "bg-blue-100 text-blue-800",
      vision: "bg-green-100 text-green-800",
      life: "bg-purple-100 text-purple-800",
      "401k": "bg-yellow-100 text-yellow-800",
      disability: "bg-orange-100 text-orange-800"
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const filteredPlans = filterType === "all"
    ? benefitsPlans
    : benefitsPlans.filter(p => p.plan_type === filterType);

  const planTypes = Array.from(new Set(benefitsPlans.map(p => p.plan_type)));

  return (
    <div className="min-h-screen bg-gray-200">
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-t-lg shadow">
          {/* Page Header */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Benefits Plans Management</h1>
          </div>

          {/* Quick Links Section */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase">Other Compensation Modules</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Salary Structure Link */}
              <Link
                href="/hr/compensation/salary"
                className="group border border-gray-200 bg-white rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 rounded-lg p-2 group-hover:bg-blue-200 transition">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Salary Structure</h3>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition" />
                </div>
              </Link>

              {/* Bonuses Link */}
              <Link
                href="/hr/compensation/bonuses"
                className="group border border-gray-200 bg-white rounded-lg p-4 hover:border-purple-500 hover:bg-purple-50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-100 rounded-lg p-2 group-hover:bg-purple-200 transition">
                      <Award className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Bonuses & Incentives</h3>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition" />
                </div>
              </Link>
            </div>
          </div>

          {/* Filters & Actions */}
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Filter by Type:</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">All Types ({benefitsPlans.length})</option>
                {planTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)} ({benefitsPlans.filter(p => p.plan_type === type).length})
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => openModal()}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Benefits Plan
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading benefits plans...</p>
              </div>
            ) : filteredPlans.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-2">No benefits plans found</p>
                <p className="text-sm text-gray-400">Add your first benefits plan to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Plan</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Provider</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Coverage</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Employee Cost</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Employer Cost</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Total Cost</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Deductible</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {filteredPlans.map((plan) => (
                      <tr key={plan.id} className="hover:bg-blue-50 transition">
                        <td className="px-4 py-3 border border-gray-300">
                          <div className="flex items-center">
                            {getPlanTypeIcon(plan.plan_type)}
                            <div className="ml-2">
                              <div className="text-sm font-medium text-gray-900">{plan.plan_name}</div>
                              <div className="text-xs text-gray-500">{plan.plan_code}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 border border-gray-300">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPlanTypeBadge(plan.plan_type)}`}>
                            {plan.plan_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 border border-gray-300">{plan.provider_name || "-"}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 border border-gray-300">{plan.coverage_level || "-"}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700 border border-gray-300">
                          ${plan.employee_cost_monthly ? plan.employee_cost_monthly.toLocaleString() : "0"}/mo
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 border border-gray-300">
                          ${plan.employer_cost_monthly ? plan.employer_cost_monthly.toLocaleString() : "0"}/mo
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700 border border-gray-300">
                          ${plan.total_cost_monthly ? plan.total_cost_monthly.toLocaleString() : "0"}/mo
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600 border border-gray-300">
                          ${plan.deductible ? plan.deductible.toLocaleString() : "0"}
                        </td>
                        <td className="px-4 py-3 text-center border border-gray-300">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            plan.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}>
                            {plan.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center border border-gray-300">
                          <div className="flex justify-center space-x-2">
                            <button
                              onClick={() => openModal(plan)}
                              className="text-blue-600 hover:text-blue-800 transition"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deletePlan(plan.id)}
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

      {/* Benefits Plan Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {editingPlan ? "Edit Benefits Plan" : "Add New Benefits Plan"}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan Code *</label>
                  <input
                    type="text"
                    value={form.plan_code}
                    onChange={(e) => setForm({ ...form, plan_code: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="e.g., HEALTH-BASIC"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name *</label>
                  <input
                    type="text"
                    value={form.plan_name}
                    onChange={(e) => setForm({ ...form, plan_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="e.g., Basic Health Plan"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan Type *</label>
                  <select
                    value={form.plan_type}
                    onChange={(e) => setForm({ ...form, plan_type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="health">Health</option>
                    <option value="dental">Dental</option>
                    <option value="vision">Vision</option>
                    <option value="life">Life Insurance</option>
                    <option value="401k">401(k)</option>
                    <option value="disability">Disability</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Provider Name</label>
                  <input
                    type="text"
                    value={form.provider_name}
                    onChange={(e) => setForm({ ...form, provider_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="e.g., Blue Cross Blue Shield"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coverage Level</label>
                  <select
                    value={form.coverage_level}
                    onChange={(e) => setForm({ ...form, coverage_level: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="individual">Individual</option>
                    <option value="family">Family</option>
                    <option value="employee_spouse">Employee + Spouse</option>
                    <option value="employee_children">Employee + Children</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Effective Date</label>
                  <input
                    type="date"
                    value={form.effective_date}
                    onChange={(e) => setForm({ ...form, effective_date: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee Cost (Monthly)</label>
                  <input
                    type="number"
                    value={form.employee_cost_monthly}
                    onChange={(e) => setForm({ ...form, employee_cost_monthly: parseFloat(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employer Cost (Monthly)</label>
                  <input
                    type="number"
                    value={form.employer_cost_monthly}
                    onChange={(e) => setForm({ ...form, employer_cost_monthly: parseFloat(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Cost (Monthly)</label>
                  <input
                    type="number"
                    value={form.total_cost_monthly}
                    onChange={(e) => setForm({ ...form, total_cost_monthly: parseFloat(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deductible</label>
                  <input
                    type="number"
                    value={form.deductible}
                    onChange={(e) => setForm({ ...form, deductible: parseFloat(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    min="0"
                    step="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Out-of-Pocket Maximum</label>
                  <input
                    type="number"
                    value={form.out_of_pocket_max}
                    onChange={(e) => setForm({ ...form, out_of_pocket_max: parseFloat(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    min="0"
                    step="100"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">Active</label>
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
                onClick={savePlan}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                {editingPlan ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
